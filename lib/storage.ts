import { ComicConfig, ComicPage, Character, LocationItem, SavedStory } from "../types";
import { SAMPLE_CHARACTERS } from "./sampleCharacters";
import { SAMPLE_LOCATIONS } from "./sampleLocations";
import { generateId } from "./utils";

export interface SavedProject {
  config: ComicConfig;
  pages: ComicPage[];
  savedAt: number;
}

const DB_NAME = "ComicGenDB";
const STORE_NAME = "project_store";
const STORIES_STORE = "stories_store";
const LIBRARY_STORE = "character_library_store";
const LOCATION_STORE = "location_library_store";
const DB_VERSION = 4;
const STORAGE_KEY = "current_comic_project";
const ACTIVE_STORY_KEY = "comicgen_active_story_id";
const STORIES_BACKUP_KEY = "comicgen_stories_backup";
const LIBRARY_STORAGE_KEY = "comicgen_character_library";
const LOCATION_STORAGE_KEY = "comicgen_location_library";

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !window.indexedDB) {
      return reject(new Error("IndexedDB is not supported"));
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
      if (!db.objectStoreNames.contains(STORIES_STORE)) {
        db.createObjectStore(STORIES_STORE, { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains(LIBRARY_STORE)) {
        db.createObjectStore(LIBRARY_STORE, { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains(LOCATION_STORE)) {
        db.createObjectStore(LOCATION_STORE, { keyPath: "id" });
      }
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(request.error);
    };
  });
}

/**
 * STORIES LIBRARY MANAGEMENT
 */

/**
 * Saves or updates a complete story in the stories library.
 */
export async function saveStoryToLibrary(story: SavedStory): Promise<void> {
  // Ensure cover image is captured if not already set
  let cover = story.coverImageUrl;
  if (!cover) {
    if (story.pages.length > 0) {
      cover = story.pages[0].pageImageUrl || story.pages[0].panels?.find(p => p.imageUrl)?.imageUrl;
    }
  }

  const cleanStory: SavedStory = {
    ...story,
    coverImageUrl: cover,
    pageCount: story.pages.length,
    updatedAt: Date.now(),
    title: (story.title || story.config?.topic || "İsimsiz Hikaye").trim()
  };

  try {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORIES_STORE, "readwrite");
      const store = tx.objectStore(STORIES_STORE);
      const req = store.put(cleanStory);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn("IndexedDB story save failed, trying fallback:", err);
  }

  // Backup to localStorage
  try {
    const fallbackList = getLocalStoriesFallback();
    const idx = fallbackList.findIndex(s => s.id === cleanStory.id);
    if (idx >= 0) {
      fallbackList[idx] = cleanStory;
    } else {
      fallbackList.unshift(cleanStory);
    }
    setLocalStoriesFallback(fallbackList);
  } catch (e) {
    console.warn("LocalStorage stories backup error:", e);
  }
}

/**
 * Fetches all saved stories sorted by most recently updated.
 */
export async function getAllSavedStories(): Promise<SavedStory[]> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORIES_STORE, "readonly");
      const store = tx.objectStore(STORIES_STORE);
      const req = store.getAll();

      req.onsuccess = () => {
        const results = req.result as SavedStory[];
        if (results && results.length > 0) {
          const sorted = [...results].sort((a, b) => (b.updatedAt || b.createdAt || 0) - (a.updatedAt || a.createdAt || 0));
          resolve(sorted);
        } else {
          const fallback = getLocalStoriesFallback();
          resolve(fallback);
        }
      };
      req.onerror = () => {
        const fallback = getLocalStoriesFallback();
        resolve(fallback);
      };
    });
  } catch (err) {
    console.warn("IndexedDB getAllSavedStories failed:", err);
    return getLocalStoriesFallback();
  }
}

/**
 * Retrieves a single story by ID.
 */
export async function getStoryById(id: string): Promise<SavedStory | null> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORIES_STORE, "readonly");
      const store = tx.objectStore(STORIES_STORE);
      const req = store.get(id);

      req.onsuccess = () => {
        if (req.result) {
          resolve(req.result as SavedStory);
        } else {
          const fallback = getLocalStoriesFallback().find(s => s.id === id) || null;
          resolve(fallback);
        }
      };
      req.onerror = () => {
        const fallback = getLocalStoriesFallback().find(s => s.id === id) || null;
        resolve(fallback);
      };
    });
  } catch (err) {
    return getLocalStoriesFallback().find(s => s.id === id) || null;
  }
}

/**
 * Deletes a story from the library.
 */
export async function deleteStoryFromLibrary(id: string): Promise<void> {
  try {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORIES_STORE, "readwrite");
      const store = tx.objectStore(STORIES_STORE);
      const req = store.delete(id);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn("IndexedDB deleteStory error:", err);
  }

  try {
    const list = getLocalStoriesFallback().filter(s => s.id !== id);
    setLocalStoriesFallback(list);
  } catch (e) { /* ignore */ }

  if (getActiveStoryId() === id) {
    setActiveStoryId(null);
  }
}

/**
 * Duplicates a story to allow branching experiments.
 */
export async function duplicateStory(id: string): Promise<SavedStory | null> {
  const original = await getStoryById(id);
  if (!original) return null;

  const newId = `story-${Date.now()}-${generateId()}`;
  const duplicated: SavedStory = {
    ...original,
    id: newId,
    title: `${original.title} (Kopya)`,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    pages: original.pages.map((p, pIdx) => ({
      ...p,
      id: `page-${newId}-${pIdx}`,
      panels: p.panels.map((pan, panIdx) => ({
        ...pan,
        id: `pan-${newId}-${pIdx}-${panIdx}`
      }))
    }))
  };

  await saveStoryToLibrary(duplicated);
  return duplicated;
}

/**
 * Renames a saved story.
 */
export async function renameStory(id: string, newTitle: string): Promise<SavedStory | null> {
  const story = await getStoryById(id);
  if (!story) return null;

  const updated: SavedStory = {
    ...story,
    title: newTitle.trim() || story.title,
    updatedAt: Date.now()
  };

  await saveStoryToLibrary(updated);
  return updated;
}

/**
 * Active story tracking
 */
export function getActiveStoryId(): string | null {
  try {
    return localStorage.getItem(ACTIVE_STORY_KEY);
  } catch {
    return null;
  }
}

export function setActiveStoryId(id: string | null): void {
  try {
    if (id) {
      localStorage.setItem(ACTIVE_STORY_KEY, id);
    } else {
      localStorage.removeItem(ACTIVE_STORY_KEY);
    }
  } catch { /* ignore */ }
}

/**
 * Export story as a JSON string for backup/sharing.
 */
export function exportStoryAsJson(story: SavedStory): string {
  return JSON.stringify(story, null, 2);
}

/**
 * Import a story from JSON string.
 */
export async function importStoryFromJson(jsonString: string): Promise<SavedStory> {
  const parsed = JSON.parse(jsonString) as SavedStory;
  if (!parsed.config || !Array.isArray(parsed.pages)) {
    throw new Error("Geçersiz çizgi roman dosyası formatı!");
  }

  const newId = `story-${Date.now()}-${generateId()}`;
  const importedStory: SavedStory = {
    ...parsed,
    id: newId,
    title: (parsed.title || parsed.config.topic || "İçe Aktarılan Hikaye") + " (İçe Aktarıldı)",
    createdAt: Date.now(),
    updatedAt: Date.now(),
    pageCount: parsed.pages.length
  };

  await saveStoryToLibrary(importedStory);
  return importedStory;
}

function getLocalStoriesFallback(): SavedStory[] {
  try {
    const raw = localStorage.getItem(STORIES_BACKUP_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) { /* ignore */ }
  return [];
}

function setLocalStoriesFallback(list: SavedStory[]): void {
  try {
    // Keep metadata without giant base64 payloads to stay safely within localStorage quota (5MB domain limit)
    const safeList = list.slice(0, 20).map(s => ({
      ...s,
      coverImageUrl: s.coverImageUrl && s.coverImageUrl.length < 50000 ? s.coverImageUrl : undefined,
      pages: s.pages.map(p => ({
        ...p,
        pageImageUrl: undefined,
        panels: p.panels.map(pan => ({
          ...pan,
          imageUrl: undefined, // Never store raw base64 images in localStorage
          originalImageUrl: undefined,
          editHistory: []
        }))
      }))
    }));
    localStorage.setItem(STORIES_BACKUP_KEY, JSON.stringify(safeList));
  } catch (e) { /* ignore */ }
}

/**
 * Saves current comic project (config and full page image/panel data) to IndexedDB.
 */
export async function saveProject(project: SavedProject): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(project, STORAGE_KEY);

      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn("IndexedDB save failed, attempting localStorage fallback for metadata:", err);
    try {
      // Fallback without large base64 to prevent QuotaExceededError
      const simplified = {
        config: project.config,
        savedAt: project.savedAt,
        pages: project.pages.map(p => ({
          ...p,
          pageImageUrl: undefined,
          panels: p.panels.map(pan => ({
            ...pan,
            imageUrl: undefined,
            originalImageUrl: undefined,
            editHistory: []
          }))
        }))
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(simplified));
    } catch (e) {
      console.error("Local storage fallback also failed:", e);
    }
  }
}

/**
 * Loads the saved comic project from IndexedDB (or fallback).
 */
export async function loadProject(): Promise<SavedProject | null> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(STORAGE_KEY);

      req.onsuccess = () => {
        if (req.result) {
          resolve(req.result as SavedProject);
        } else {
          // Check local storage fallback
          try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (raw) {
              resolve(JSON.parse(raw) as SavedProject);
              return;
            }
          } catch (e) { /* ignore */ }
          resolve(null);
        }
      };
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn("IndexedDB load failed, trying localStorage:", err);
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        return JSON.parse(raw) as SavedProject;
      }
    } catch (e) { /* ignore */ }
    return null;
  }
}

/**
 * Clears the saved project to start a new comic.
 */
export async function clearProject(): Promise<void> {
  try {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(STORAGE_KEY);

      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn("IndexedDB delete failed:", err);
  }

  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (e) { /* ignore */ }
}

/**
 * CHARACTER LIBRARY STORAGE
 */

/**
 * Saves a character to the persistent Character Library.
 */
export async function saveCharacterToLibrary(character: Character): Promise<void> {
  const item: Character = {
    ...character,
    createdAt: character.createdAt || Date.now()
  };

  try {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(LIBRARY_STORE, "readwrite");
      const store = tx.objectStore(LIBRARY_STORE);
      const req = store.put(item);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn("IndexedDB character save failed, fallback to localStorage:", err);
  }

  // Backup to localStorage
  try {
    const list = getLocalLibraryFallback();
    const index = list.findIndex(c => c.id === item.id || (c.name.toLowerCase() === item.name.toLowerCase() && !c.id));
    if (index >= 0) {
      list[index] = item;
    } else {
      list.unshift(item);
    }
    setLocalLibraryFallback(list);
  } catch (e) {
    console.warn("LocalStorage library fallback error:", e);
  }
}

/**
 * Fetches all saved characters from the Character Library.
 */
export async function getLibraryCharacters(): Promise<Character[]> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(LIBRARY_STORE, "readonly");
      const store = tx.objectStore(LIBRARY_STORE);
      const req = store.getAll();

      req.onsuccess = () => {
        const results = req.result as Character[];
        if (results && results.length > 0) {
          // Sort newest first
          const sorted = [...results].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
          resolve(sorted);
        } else {
          // Check local storage fallback or seed samples
          const fallback = getLocalLibraryFallback();
          if (fallback && fallback.length > 0) {
            resolve(fallback);
          } else {
            // Seed sample characters on first load
            saveSampleCharacters();
            resolve(SAMPLE_CHARACTERS);
          }
        }
      };
      req.onerror = () => {
        const fallback = getLocalLibraryFallback();
        if (fallback && fallback.length > 0) {
          resolve(fallback);
        } else {
          resolve(SAMPLE_CHARACTERS);
        }
      };
    });
  } catch (err) {
    console.warn("IndexedDB getLibraryCharacters failed:", err);
    const fallback = getLocalLibraryFallback();
    if (fallback && fallback.length > 0) {
      return fallback;
    }
    return SAMPLE_CHARACTERS;
  }
}

/**
 * Seeds sample characters into the library.
 */
export async function seedSampleCharacters(): Promise<Character[]> {
  for (const char of SAMPLE_CHARACTERS) {
    await saveCharacterToLibrary(char);
  }
  return await getLibraryCharacters();
}

function saveSampleCharacters(): void {
  try {
    setLocalLibraryFallback(SAMPLE_CHARACTERS);
  } catch (e) { /* ignore */ }
}

/**
 * Removes a character from the persistent Character Library.
 */
export async function deleteCharacterFromLibrary(id: string): Promise<void> {
  try {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(LIBRARY_STORE, "readwrite");
      const store = tx.objectStore(LIBRARY_STORE);
      const req = store.delete(id);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn("IndexedDB deleteCharacterFromLibrary error:", err);
  }

  try {
    const list = getLocalLibraryFallback().filter(c => c.id !== id);
    setLocalLibraryFallback(list);
  } catch (e) {
    console.warn("LocalStorage delete fallback error:", e);
  }
}

function getLocalLibraryFallback(): Character[] {
  try {
    const raw = localStorage.getItem(LIBRARY_STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) { /* ignore */ }
  return [];
}

function setLocalLibraryFallback(list: Character[]): void {
  try {
    // Avoid saving oversized data in localStorage if avatarUrl is too huge
    const safeList = list.slice(0, 50).map(c => ({
      ...c,
      avatarUrl: c.avatarUrl && c.avatarUrl.length > 400000 ? "" : c.avatarUrl
    }));
    localStorage.setItem(LIBRARY_STORAGE_KEY, JSON.stringify(safeList));
  } catch (e) { /* ignore */ }
}

/**
 * LOCATION / ENVIRONMENT LIBRARY STORAGE
 */

/**
 * Saves a location/prop to the persistent Location Library.
 */
export async function saveLocationToLibrary(location: LocationItem): Promise<void> {
  const item: LocationItem = {
    ...location,
    createdAt: location.createdAt || Date.now()
  };

  try {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(LOCATION_STORE, "readwrite");
      const store = tx.objectStore(LOCATION_STORE);
      const req = store.put(item);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn("IndexedDB location save failed, fallback to localStorage:", err);
  }

  // Backup to localStorage
  try {
    const list = getLocalLocationFallback();
    const index = list.findIndex(l => l.id === item.id || (l.name.toLowerCase() === item.name.toLowerCase() && !l.id));
    if (index >= 0) {
      list[index] = item;
    } else {
      list.unshift(item);
    }
    setLocalLocationFallback(list);
  } catch (e) {
    console.warn("LocalStorage location fallback error:", e);
  }
}

/**
 * Fetches all saved locations from the Location Library.
 */
export async function getLibraryLocations(): Promise<LocationItem[]> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(LOCATION_STORE, "readonly");
      const store = tx.objectStore(LOCATION_STORE);
      const req = store.getAll();

      req.onsuccess = () => {
        const results = req.result as LocationItem[];
        if (results && results.length > 0) {
          const sorted = [...results].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
          resolve(sorted);
        } else {
          const fallback = getLocalLocationFallback();
          if (fallback && fallback.length > 0) {
            resolve(fallback);
          } else {
            saveSampleLocations();
            resolve(SAMPLE_LOCATIONS);
          }
        }
      };
      req.onerror = () => {
        const fallback = getLocalLocationFallback();
        if (fallback && fallback.length > 0) {
          resolve(fallback);
        } else {
          resolve(SAMPLE_LOCATIONS);
        }
      };
    });
  } catch (err) {
    console.warn("IndexedDB getLibraryLocations failed:", err);
    const fallback = getLocalLocationFallback();
    if (fallback && fallback.length > 0) {
      return fallback;
    }
    return SAMPLE_LOCATIONS;
  }
}

/**
 * Seeds sample locations into the library.
 */
export async function seedSampleLocations(): Promise<LocationItem[]> {
  for (const loc of SAMPLE_LOCATIONS) {
    await saveLocationToLibrary(loc);
  }
  return await getLibraryLocations();
}

function saveSampleLocations(): void {
  try {
    setLocalLocationFallback(SAMPLE_LOCATIONS);
  } catch (e) { /* ignore */ }
}

/**
 * Removes a location from the persistent Location Library.
 */
export async function deleteLocationFromLibrary(id: string): Promise<void> {
  try {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(LOCATION_STORE, "readwrite");
      const store = tx.objectStore(LOCATION_STORE);
      const req = store.delete(id);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn("IndexedDB deleteLocationFromLibrary error:", err);
  }

  try {
    const list = getLocalLocationFallback().filter(l => l.id !== id);
    setLocalLocationFallback(list);
  } catch (e) {
    console.warn("LocalStorage delete location fallback error:", e);
  }
}

function getLocalLocationFallback(): LocationItem[] {
  try {
    const raw = localStorage.getItem(LOCATION_STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) { /* ignore */ }
  return [];
}

function setLocalLocationFallback(list: LocationItem[]): void {
  try {
    const safeList = list.slice(0, 50).map(l => ({
      ...l,
      imageUrl: l.imageUrl && l.imageUrl.length > 400000 ? l.imageUrl.substring(0, 200) : l.imageUrl
    }));
    localStorage.setItem(LOCATION_STORAGE_KEY, JSON.stringify(safeList));
  } catch (e) { /* ignore */ }
}

