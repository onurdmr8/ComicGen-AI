import React, { useState, useRef, useEffect } from "react";
import { Sidebar } from "./components/Sidebar";
import { ComicPageDisplay } from "./components/ComicPageDisplay";
import { NarrativeMemoryModal } from "./components/NarrativeMemoryModal";
import { NarrativeFlowModal } from "./components/NarrativeFlowModal";
import { FullPdfExportModal } from "./components/FullPdfExportModal";
import { SavedStoriesModal } from "./components/SavedStoriesModal";
import { ApiKeyModal } from "./components/ApiKeyModal";
import { motion, AnimatePresence } from "motion/react";
import {
  ComicConfig,
  ComicPage,
  GeneratorStatus,
  ComicPanelData,
  Character,
  CharacterOutfit,
  LocationItem,
  PanelDirectorConfig,
  NarrativeContinuityMemory,
  SavedStory,
} from "./types";
import { 
  generateComicScript, 
  generateFullPageImage, 
  generateSinglePanelImage, 
  generateRandomComicConfig, 
  generateCharacterAvatar, 
  generateVisualManifest, 
  parseGeminiError,
  extractNarrativeMemoryUpdates,
  getUserApiKey,
  getTogetherApiKey,
  getFalApiKey,
  getPollinationsApiKey,
  getPollinationsModel
} from "./services/geminiService";
import { PlusCircle, Info, Ghost, X, Send, Menu, Sparkles, Loader2, Zap, Download, ChevronRight, Book, Monitor, RotateCcw, Check, AlertTriangle, Copy, Clock, CreditCard, Brain, GitBranch, FileText, Trash2, RefreshCw, BookOpen, BookmarkCheck, BookmarkPlus, Users, KeyRound, Flame, MapPin } from "lucide-react";
import html2canvas from "html2canvas";
import { generateId, cn, isNameMatch } from "./lib/utils";
import { pickOutfitIcon } from "./lib/outfitPresets";
import { applyCameraAngleToPrompt } from "./lib/cameraAnglePresets";
import { 
  detectLocationsClientRegex, 
  getThematicDefaultLocation, 
  POPULAR_LOCATION_CHIPS 
} from "./lib/locationDetector";
import { 
  loadProject, 
  saveProject, 
  clearProject, 
  saveCharacterToLibrary,
  saveLocationToLibrary,
  getAllSavedStories,
  getStoryById,
  saveStoryToLibrary,
  getActiveStoryId,
  setActiveStoryId
} from "./lib/storage";

const QUICK_TEMPLATES = [
  {
    title: "⚔️ Siberpunk Gece Avı",
    desc: "Neon ışıklı yağmurlu distopyada gizemli bir kovalama ve siber dedektif macerası.",
    topic: "Siberpunk Şehirde Gece Baskını",
    intro: "Neon tabelaların vurduğu ıslak asfalt... Dedektif Kael, kaçak yapay zekanın izini ara sokakta sıkıştırır.",
    tone: "Sci-Fi & Action",
    style: "Marvel Çizgi Roman & Realizm (Önerilen)",
    palette: "cyber_neon"
  },
  {
    title: "💌 Yağmurlu Günde İlk İtiraf",
    desc: "Küçük bir kafenin saçakları altında beklenmedik bir aşk itirafı ve tatlı bir heyecan.",
    topic: "Yağmurlu Bir Günde İlk Aşk İtirafı",
    intro: "Aniden bastıran sağanak altında ikisi de aynı şemsiyenin altına sığınır. Kalpleri hızla çarpmaktadır...",
    tone: "Romance",
    style: "Marvel Çizgi Roman & Realizm (Önerilen)",
    palette: "romance_shojo"
  },
  {
    title: "🕵️‍♂️ Sisli Sokak Gizemi",
    desc: "1940'lar tarzı siyah-beyaz loş gölgeler, tren garı ve çözülemeyen kayıp mücevher.",
    topic: "Gece Yarısı Ekspresinde Kayıp Çanta",
    intro: "Buharlı tren düdüğü çalarken kompartımanda beklenmedik bir çığlık kopar. Komiser masadaki ipucunu inceler.",
    tone: "Noir & Gizem",
    style: "Marvel Çizgi Roman & Realizm (Önerilen)",
    palette: "monochrome_noir"
  },
  {
    title: "🐉 Kadim Tapınak Keşfi",
    desc: "Sarmaşıklarla kaplı antik harabeler, parıldayan sihirli kristal ve gizli tuzaklar.",
    topic: "Gök Tapınağının Saklı Muhafızı",
    intro: "Maceracılar kapıyı araladığında tapınağın ortasındaki kristal mavi bir parıltıyla uyanır.",
    tone: "Fantastik Macera",
    style: "Marvel Çizgi Roman & Realizm (Önerilen)",
    palette: "warm_vintage"
  }
];

export default function App() {
  const [config, setConfig] = useState<ComicConfig>({
    topic: "",
    intro: "",
    cast: [],
    style: "Marvel Çizgi Roman & Realizm (Önerilen)",
    tone: "Romantizm & Aşk",
    narratorVoice: "Duygusal & İçten",
    renderQuality: "High",
    imageProvider: "pollinations_flux", // Tamamen ücretsiz FLUX varsayılan
    pollinationsModel: getPollinationsModel(),
    consistencyLock: true,
    colorPalette: "romance_shojo",
    lightingMood: "romantic_dream",
    contentRating: "pg17",
    blurMatureContent: true,
    storyMemory: {
      enabled: true,
      autoExtract: true,
      memories: [],
      plotSummary: ""
    }
  });

  const [pages, setPages] = useState<ComicPage[]>([]);
  const [status, setStatus] = useState<GeneratorStatus>(GeneratorStatus.IDLE);
  const [isAutoFilling, setIsAutoFilling] = useState(false);
  
  const [showNextPageModal, setShowNextPageModal] = useState(false);
  const [userDirection, setUserDirection] = useState("");
  const [selectedPageCharacterIds, setSelectedPageCharacterIds] = useState<string[]>([]);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMemoryModalOpen, setIsMemoryModalOpen] = useState(false);
  const [isFlowModalOpen, setIsFlowModalOpen] = useState(false);
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  const [isStoriesModalOpen, setIsStoriesModalOpen] = useState(false);
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);
  const [hasUserApiKey, setHasUserApiKey] = useState<boolean>(() => !!getUserApiKey());
  const [hasTogetherKey, setHasTogetherKey] = useState<boolean>(() => !!getTogetherApiKey());
  const [hasFalKey, setHasFalKey] = useState<boolean>(() => !!getFalApiKey());
  const [hasPollinationsKey, setHasPollinationsKey] = useState<boolean>(() => !!getPollinationsApiKey());
  const [apiKeyModalTab, setApiKeyModalTab] = useState<"fal" | "together" | "gemini" | "pollinations">("pollinations");
  const [isAnalyzingContinuity, setIsAnalyzingContinuity] = useState(false);
  const [savedStoriesCount, setSavedStoriesCount] = useState(0);
  const [storyToastMessage, setStoryToastMessage] = useState<string | null>(null);

  // Story Tracking and Persistence
  const [currentStoryId, setCurrentStoryId] = useState<string>(() => getActiveStoryId() || `story-${Date.now()}`);

  // Persistence and project reset states
  const [hasRestored, setHasRestored] = useState(false);
  const [showRestoredNotice, setShowRestoredNotice] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [pageToDelete, setPageToDelete] = useState<{ id: string; pageNumber: number } | null>(null);

  // PWA / APK install states
  const [showPwaModal, setShowPwaModal] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);

  useEffect(() => {
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);
    return () => window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      try {
        deferredPrompt.prompt();
        const choice = await deferredPrompt.userChoice;
        if (choice?.outcome === "accepted") {
          setDeferredPrompt(null);
          setIsInstallable(false);
        }
      } catch {
        setShowPwaModal(true);
      }
    } else {
      setShowPwaModal(true);
    }
  };

  const showStoryToast = (msg: string) => {
    setStoryToastMessage(msg);
    setTimeout(() => setStoryToastMessage(null), 3000);
  };

  const refreshStoriesCount = async () => {
    try {
      const list = await getAllSavedStories();
      setSavedStoriesCount(list.length);
    } catch (e) {
      console.warn("Hikaye sayısı alınamadı:", e);
    }
  };

  // Quota and API error modal state
  const [apiError, setApiError] = useState<{
    isOpen: boolean;
    isQuota: boolean;
    title: string;
    message: string;
    promptToCopy?: string;
    retrySeconds?: number;
    onRetry?: () => void;
  }>({
    isOpen: false,
    isQuota: false,
    title: "",
    message: "",
    promptToCopy: "",
  });
  const [countdown, setCountdown] = useState<number | null>(null);
  const [hasCopiedPrompt, setHasCopiedPrompt] = useState(false);

  useEffect(() => {
    if (apiError.isOpen && apiError.retrySeconds && apiError.retrySeconds > 0) {
      setCountdown(apiError.retrySeconds);
      const interval = setInterval(() => {
        setCountdown((prev) => {
          if (prev === null || prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    } else {
      setCountdown(null);
    }
  }, [apiError.isOpen, apiError.retrySeconds]);

  const handleCopyPrompt = (text: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setHasCopiedPrompt(true);
    setTimeout(() => setHasCopiedPrompt(false), 2500);
  };

  const bottomRef = useRef<HTMLDivElement>(null);

  // Load saved comic project or active story from IndexedDB on startup
  useEffect(() => {
    let isMounted = true;
    const initStartup = async () => {
      try {
        await refreshStoriesCount();
        const activeId = getActiveStoryId();
        let targetProject: { config: ComicConfig; pages: ComicPage[] } | null = null;

        if (activeId) {
          const foundStory = await getStoryById(activeId);
          if (foundStory && (foundStory.pages?.length > 0 || foundStory.config?.topic)) {
            targetProject = foundStory;
            if (isMounted) setCurrentStoryId(foundStory.id);
          }
        }

        if (!targetProject) {
          const savedLegacy = await loadProject();
          if (
            savedLegacy &&
            (savedLegacy.pages?.length > 0 ||
              (savedLegacy.config?.topic && savedLegacy.config.topic.trim().length > 0) ||
              (savedLegacy.config?.cast && savedLegacy.config.cast.length > 0))
          ) {
            targetProject = savedLegacy;
            // Migrate legacy single project into story library
            const initialId = `story-${Date.now()}`;
            if (isMounted) {
              setCurrentStoryId(initialId);
              setActiveStoryId(initialId);
            }
            await saveStoryToLibrary({
              id: initialId,
              title: savedLegacy.config?.topic || "İlk Çizgi Romanım",
              topic: savedLegacy.config?.topic || "",
              intro: savedLegacy.config?.intro || "",
              pageCount: savedLegacy.pages?.length || 0,
              createdAt: Date.now(),
              updatedAt: Date.now(),
              config: savedLegacy.config,
              pages: savedLegacy.pages || []
            });
            await refreshStoriesCount();
          }
        }

        if (targetProject && isMounted) {
          if (targetProject.config) {
            const seenCharIds = new Set<string>();
            const sanitizedCast = (targetProject.config.cast || []).map((c, cIdx) => {
              let charId = c.id && !seenCharIds.has(c.id) ? c.id : `${generateId()}-${cIdx}`;
              seenCharIds.add(charId);
              return { ...c, id: charId };
            });
            const restoredProvider = targetProject.config.imageProvider || "pollinations_flux";
            setConfig({ ...targetProject.config, imageProvider: restoredProvider, cast: sanitizedCast });
          }
          if (targetProject.pages && targetProject.pages.length > 0) {
            const seenPageIds = new Set<string>();
            const cleanedPages = targetProject.pages.map((p, pageIdx) => {
              let pageId = p.id && !seenPageIds.has(p.id) ? p.id : `${generateId()}-${pageIdx}`;
              seenPageIds.add(pageId);
              const seenPanelIds = new Set<string>();
              return {
                ...p,
                id: pageId,
                panels: (p.panels || []).map((panel, panIdx) => {
                  let panId = panel.id && !seenPanelIds.has(panel.id) ? panel.id : `${pageId}-panel-${panIdx}-${generateId()}`;
                  seenPanelIds.add(panId);
                  return {
                    ...panel,
                    id: panId,
                    isLoading: false
                  };
                })
              };
            });
            setPages(cleanedPages);
            setStatus(GeneratorStatus.COMPLETE);
          }
          setShowRestoredNotice(true);
          setTimeout(() => {
            if (isMounted) setShowRestoredNotice(false);
          }, 4500);
        }
      } catch (err) {
        console.error("Proje başlatma hatası:", err);
      } finally {
        if (isMounted) setHasRestored(true);
      }
    };

    initStartup();

    return () => {
      isMounted = false;
    };
  }, []);

  // Continuous auto-save to IndexedDB & Stories Library whenever config or pages change
  useEffect(() => {
    if (!hasRestored) return;
    const hasData = pages.length > 0 || config.topic.trim().length > 0 || config.cast.length > 0;
    if (!hasData) return;

    // Do not trigger heavy auto-save while panels are actively generating
    const isAnyPanelLoading = pages.some(p => p.panels.some(pan => pan.isLoading));
    if (isAnyPanelLoading) return;

    setIsSaving(true);
    const timer = setTimeout(async () => {
      try {
        const storyTitle = config.topic || (pages[0]?.panels[0]?.dialogue?.substring(0, 30)) || "İsimsiz Hikaye";
        const cover = pages[0]?.pageImageUrl || pages[0]?.panels.find(p => p.imageUrl)?.imageUrl;
        
        await saveProject({
          config,
          pages,
          savedAt: Date.now()
        });

        await saveStoryToLibrary({
          id: currentStoryId,
          title: storyTitle,
          topic: config.topic,
          intro: config.intro,
          coverImageUrl: cover,
          pageCount: pages.length,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          config,
          pages
        });

        setActiveStoryId(currentStoryId);
        refreshStoriesCount();
      } catch (err) {
        console.error("Otomatik kaydetme hatası:", err);
      } finally {
        setIsSaving(false);
      }
    }, 1200);

    return () => clearTimeout(timer);
  }, [config, pages, hasRestored, currentStoryId]);

  // Final flush on beforeunload
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (hasRestored && (pages.length > 0 || config.topic.trim().length > 0)) {
        saveProject({ config, pages, savedAt: Date.now() }).catch(() => {});
        const cover = pages[0]?.pageImageUrl || pages[0]?.panels.find(p => p.imageUrl)?.imageUrl;
        saveStoryToLibrary({
          id: currentStoryId,
          title: config.topic || "İsimsiz Hikaye",
          topic: config.topic,
          intro: config.intro,
          coverImageUrl: cover,
          pageCount: pages.length,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          config,
          pages
        }).catch(() => {});
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [config, pages, hasRestored, currentStoryId]);

  useEffect(() => {
    if (pages.length > 0) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [pages.length, status]);

  useEffect(() => {
    if (window.innerWidth < 1024) setIsSidebarOpen(false);
  }, []);

  const handleAutoFill = async () => {
    setIsAutoFilling(true);
    try {
        const randomConfig = await generateRandomComicConfig();
        if (randomConfig.cast && randomConfig.topic && randomConfig.intro) {
             const newConfig = {
                 ...config,
                 topic: randomConfig.topic,
                 intro: randomConfig.intro,
                 style: randomConfig.style || config.style,
                 tone: randomConfig.tone || "Action",
                 narratorVoice: randomConfig.narratorVoice || "Dramatic",
                 cast: randomConfig.cast.map(c => ({ ...c, id: generateId() })) as Character[]
             };
             setConfig(newConfig);
             
             // Trigger asynch visual generation for cast
             const castWithVisuals = [...newConfig.cast];
             for (let i = 0; i < castWithVisuals.length; i++) {
                 const char = castWithVisuals[i];
                 try {
                     const visualManifest = await generateVisualManifest(char.name, char.description, newConfig.style);
                     const avatarUrl = await generateCharacterAvatar(
                       char.name, 
                       visualManifest, 
                       newConfig.style, 
                       Boolean(newConfig.usePaidApi),
                       newConfig.imageProvider || "pollinations_flux",
                       newConfig.pollinationsModel
                     );
                     const updatedChar: Character = {
                         ...char,
                         visualManifest,
                         avatarUrl,
                         style: newConfig.style,
                         createdAt: Date.now()
                     };
                     setConfig(prev => ({
                         ...prev,
                         cast: prev.cast.map(c => c.name === char.name ? updatedChar : c)
                     }));
                     await saveCharacterToLibrary(updatedChar);
                 } catch (e) { console.error(e); }
             }
        }
    } catch (e: any) {
        console.error("Kurgu oluşturma hatası:", e);
        const parsed = parseGeminiError(e);
        setApiError({
          isOpen: true,
          isQuota: parsed.isQuota,
          title: parsed.title,
          message: parsed.message,
          retrySeconds: parsed.retrySeconds,
          onRetry: () => handleAutoFill()
        });
    } finally {
        setIsAutoFilling(false);
    }
  };

  const handleApplyQuickTemplate = (tmpl: typeof QUICK_TEMPLATES[0]) => {
    setConfig(prev => ({
      ...prev,
      topic: tmpl.topic,
      intro: tmpl.intro,
      tone: tmpl.tone,
      style: tmpl.style,
      colorPalette: tmpl.palette as any,
      imageProvider: prev.imageProvider || "pollinations_flux"
    }));
    setIsSidebarOpen(true);
  };

  const handleStartGeneration = async () => {
     if (window.innerWidth < 1024) setIsSidebarOpen(false);
     await performGeneration("");
  };

  const confirmNextPageGeneration = () => {
     setShowNextPageModal(false);
     let enrichedDirection = userDirection;

     // Detect and auto-apply location from userDirection if present
     if (userDirection && userDirection.trim().length >= 3) {
       const detectedLocs = detectLocationsClientRegex(userDirection, config.locations || []);
       if (detectedLocs.length > 0) {
         const topLoc = detectedLocs[0];
         const alreadyExists = (config.locations || []).some(
           l => l.name.toLowerCase() === topLoc.name.toLowerCase()
         );
         if (!alreadyExists) {
           const newLoc: LocationItem = {
             id: `loc_${generateId()}`,
             name: topLoc.name,
             type: topLoc.type,
             description: topLoc.description,
             visualManifest: topLoc.visualManifest,
             tags: ["Sonraki Sayfa", "Hikaye Mekanı"],
             createdAt: Date.now()
           };
           const updated = [newLoc, ...(config.locations || [])];
           setConfig(prev => ({ ...prev, locations: updated }));
           saveLocationToLibrary(newLoc);
         }
       }
     }

     if (selectedPageCharacterIds.length > 0) {
       const selectedChars = config.cast.filter(c => selectedPageCharacterIds.includes(c.id)).map(c => c.name);
       const otherChars = config.cast.filter(c => !selectedPageCharacterIds.includes(c.id)).map(c => c.name);
       const charDirective = otherChars.length > 0
         ? `[SAYFA ODAK KARAKTERLERİ: Bu sayfadaki sahneler kesinlikle yalnızca ${selectedChars.join(", ")} odaklı olmalı. ${otherChars.join(", ")} bu sayfadaki sahnelerde kesinlikle görünmemeli ve onların yerine çizilmemelidir]. `
         : `[SAYFA ODAK KARAKTERLERİ: Bu sayfadaki sahneler kesinlikle yalnızca ${selectedChars.join(", ")} odaklı olmalıdır]. `;
       enrichedDirection = `${charDirective}${userDirection}`.trim();
     }
     performGeneration(enrichedDirection);
  };

  const performGeneration = async (direction: string) => {
    if (status !== GeneratorStatus.IDLE && status !== GeneratorStatus.COMPLETE && status !== GeneratorStatus.ERROR) return;

    try {
      setStatus(GeneratorStatus.GENERATING_STORY);
      const newPageId = generateId();
      const skeletonPanels: ComicPanelData[] = Array.from({ length: 4 }, (_, idx) => ({
        id: `${newPageId}-skeleton-${idx}`,
        imagePrompt: "",
        dialogue: "",
        characterNames: [],
        isLoading: true,
      }));

      const newPage: ComicPage = { id: newPageId, panels: skeletonPanels, layoutType: "grid-2x2" };
      setPages((prev) => [...prev, newPage]);

      const history = pages.flatMap((p, pIdx) => 
        p.panels.map((panel, panIdx) => 
          `[Sayfa ${pIdx + 1}, Panel ${panIdx + 1}] (${panel.characterNames?.join(", ") || "Karakterler"}): "${panel.dialogue}" | Görsel/Olay: ${panel.imagePrompt?.slice(0, 160) || "Sahne"}`
        )
      );
      // Ensure tone accurately reflects topic if user writes romance/love
      const effectiveConfig = { ...config };
      const isRomanceTopic = /\b(aşk|aşık|sevgi|sevgili|romantik|romantizm|romance|flört|öpüş|öpücük|kiss|date|buluşma|tutku|tutkulu|sensual|intimate|evlilik|ilişki|sarılma|duygusal|kafe|gündelik|shojo)\b/i.test(`${effectiveConfig.topic} ${effectiveConfig.intro} ${direction}`);
      if (isRomanceTopic && (!effectiveConfig.tone || effectiveConfig.tone.toLowerCase().includes("action"))) {
        effectiveConfig.tone = effectiveConfig.contentRating === "pg18" ? "Sensual Romance & Passion (PG-18)" : "Romance";
      }

      const scriptData = await generateComicScript(effectiveConfig, history, direction);

      // Handle detected outfit changes from story text
      if (scriptData.detectedOutfitChanges && scriptData.detectedOutfitChanges.length > 0) {
        let updatedCast = [...effectiveConfig.cast];
        const outfitNotifications: string[] = [];

        scriptData.detectedOutfitChanges.forEach(change => {
          const charIndex = updatedCast.findIndex(c => isNameMatch(c.name, change.characterName));
          if (charIndex !== -1) {
            const char = updatedCast[charIndex];
            const existingOutfits = Array.isArray(char.outfits) ? [...char.outfits] : [];
            const newOutfitId = `outfit_${generateId()}`;
            const outfitIcon = pickOutfitIcon(change.outfitName, change.outfitDescription);
            
            const newOutfit: CharacterOutfit = {
              id: newOutfitId,
              name: change.outfitName,
              description: change.outfitDescription,
              badge: "Hikaye",
              icon: outfitIcon,
              isPreset: false,
              isCustom: true,
              referencePrompt: change.outfitDescription
            };

            const updatedOutfits = [...existingOutfits, newOutfit];
            const updatedChar: Character = {
              ...char,
              outfits: updatedOutfits,
              activeOutfitId: newOutfitId,
              styleSheet: {
                ...char.styleSheet,
                outfit: change.outfitDescription
              },
              visualManifest: char.visualManifest 
                ? `${char.visualManifest} (Aktif Kıyafet: ${change.outfitDescription})`
                : change.outfitDescription
            };

            updatedCast[charIndex] = updatedChar;
            saveCharacterToLibrary(updatedChar);
            outfitNotifications.push(`${char.name} yeni kıyafeti giydi: "${change.outfitName}"`);
          }
        });

        if (outfitNotifications.length > 0) {
          effectiveConfig.cast = updatedCast;
          setConfig(prev => ({ ...prev, cast: updatedCast }));
          showStoryToast(`👗 Gardırop Güncellendi: ${outfitNotifications.join(" • ")}`);
        }
      }

      // Handle detected locations from story text
      if (scriptData.detectedLocations && scriptData.detectedLocations.length > 0) {
        let updatedLocations = [...(effectiveConfig.locations || [])];
        const locationNotifications: string[] = [];

        scriptData.detectedLocations.forEach(detected => {
          const alreadyExists = updatedLocations.some(
            l => l.name.trim().toLowerCase() === detected.name.trim().toLowerCase() ||
                 l.name.trim().toLowerCase().includes(detected.name.trim().toLowerCase()) ||
                 detected.name.trim().toLowerCase().includes(l.name.trim().toLowerCase())
          );

          if (!alreadyExists) {
            const newLoc: LocationItem = {
              id: `loc_${generateId()}`,
              name: detected.name,
              type: detected.type || "interior",
              description: detected.description,
              visualManifest: detected.visualManifest,
              tags: ["Otomatik Tespit", "Hikaye Mekanı"],
              createdAt: Date.now()
            };
            updatedLocations.push(newLoc);
            saveLocationToLibrary(newLoc);
            locationNotifications.push(`"${detected.name}"`);
          }
        });

        if (locationNotifications.length > 0) {
          effectiveConfig.locations = updatedLocations;
          setConfig(prev => ({ ...prev, locations: updatedLocations }));
          showStoryToast(`🏛️ Yeni Mekan Algılandı ve Eklendi: ${locationNotifications.join(", ")}`);
        }
      }

      setPages((prev) =>
        prev.map((p) =>
          p.id === newPageId
            ? { 
                ...p, 
                layoutType: scriptData.layoutType,
                panels: scriptData.panels.map((sp: any, spIdx: number) => {
                  const isMature = Boolean(
                    sp.isMature || 
                    (effectiveConfig.contentRating === 'pg18' && /(bedroom|intimate|kiss|embrace|sheets|bed|allure|sensual|romance|loş|tutku|yatak|öpüş|sarıl)/i.test((sp.imagePrompt || "") + " " + (sp.dialogue || "")))
                  );
                  const isBlurred = typeof sp.isBlurred === 'boolean'
                    ? sp.isBlurred
                    : (Boolean(effectiveConfig.blurMatureContent) && (isMature || effectiveConfig.contentRating === 'pg18'));
                  return {
                    ...sp,
                    id: `${newPageId}-panel-${spIdx}-${generateId()}`,
                    isLoading: true,
                    isMature,
                    isBlurred,
                    cameraAngle: sp.cameraAngle || effectiveConfig.defaultCameraAngle || undefined
                  };
                }) 
              }
            : p
        )
      );

      setStatus(GeneratorStatus.GENERATING_IMAGES);
      try {
        const effectiveQuality = effectiveConfig.usePaidApi ? "Ultra" : (effectiveConfig.renderQuality || "High");
        
        // Generate in batches of 2 (Panels 1 & 2 first, then Panels 3 & 4)
        // This cuts concurrent memory in half, prevents browser freezes, and avoids server OOM
        for (let batchStart = 0; batchStart < scriptData.panels.length; batchStart += 2) {
          const batch = scriptData.panels.slice(batchStart, batchStart + 2);
          await Promise.all(batch.map(async (panel: ComicPanelData, offset: number) => {
            const panIdx = batchStart + offset;
            try {
              const imageUrl = await generateSinglePanelImage(
                panel.imagePrompt, 
                effectiveConfig.style, 
                effectiveConfig.cast, 
                effectiveQuality,
                panel.directorConfig,
                effectiveConfig.locations,
                effectiveConfig.colorPalette,
                effectiveConfig.lightingMood,
                effectiveConfig.consistencyLock,
                panel.characterNames,
                effectiveConfig.contentRating || "pg17",
                panel.modestyConcealment || effectiveConfig.modestyConcealment,
                effectiveConfig.topic,
                effectiveConfig.tone,
                effectiveConfig.imageProvider || "pollinations_flux",
                effectiveConfig.pollinationsModel
              );

              setPages((prev) =>
                prev.map((p) => {
                  if (p.id !== newPageId) return p;
                  const newPanels = [...p.panels];
                  if (newPanels[panIdx]) {
                    newPanels[panIdx] = { ...newPanels[panIdx], imageUrl, isLoading: false };
                  }
                  return { ...p, panels: newPanels };
                })
              );
              return imageUrl;
            } catch (panErr) {
              console.error(`Panel ${panIdx + 1} çizim hatası:`, panErr);
              setPages((prev) =>
                prev.map((p) => {
                  if (p.id !== newPageId) return p;
                  const newPanels = [...p.panels];
                  if (newPanels[panIdx]) {
                    newPanels[panIdx] = { ...newPanels[panIdx], isLoading: false };
                  }
                  return { ...p, panels: newPanels };
                })
              );
              return null;
            }
          }));
        }

        setStatus(GeneratorStatus.COMPLETE);

        // Sayfa Devamlılığı & Mantık Hafızası: Extract memory updates if enabled
        if (config.storyMemory?.enabled !== false) {
          try {
            const pageNumber = pages.length + 1;
            const updates = await extractNarrativeMemoryUpdates(
              scriptData.panels,
              pageNumber,
              config.cast || [],
              config.storyMemory
            );
            if (updates.newMemories.length > 0 || updates.updatedSummary) {
              setConfig(prev => {
                const existing = prev.storyMemory?.memories || [];
                // Merge unique memories
                const existingDescSet = new Set(existing.map(m => m.description.toLowerCase()));
                const trulyNew = updates.newMemories.filter(m => !existingDescSet.has(m.description.toLowerCase()));
                return {
                  ...prev,
                  storyMemory: {
                    enabled: prev.storyMemory?.enabled ?? true,
                    autoExtract: prev.storyMemory?.autoExtract ?? true,
                    memories: [...existing, ...trulyNew],
                    plotSummary: updates.updatedSummary || prev.storyMemory?.plotSummary || ""
                  }
                };
              });
            }
          } catch (memErr) {
            console.warn("Otomatik mantık hafızası çıkarımında sorun oluştu:", memErr);
          }
        }
      } catch (imgError: any) {
        console.error("Görsel oluşturma hatası:", imgError);
        // Do NOT delete the page! The comic story script and dialogue were generated successfully.
        setPages((prev) =>
          prev.map((p) =>
            p.id === newPageId
              ? {
                  ...p,
                  panels: p.panels.map((panel) => ({ ...panel, isLoading: false })),
                }
              : p
          )
        );
        setStatus(GeneratorStatus.COMPLETE);

        // Still extract memory if story script was successful
        if (config.storyMemory?.enabled !== false) {
          try {
            const pageNumber = pages.length + 1;
            const updates = await extractNarrativeMemoryUpdates(
              scriptData.panels,
              pageNumber,
              config.cast || [],
              config.storyMemory
            );
            if (updates.newMemories.length > 0 || updates.updatedSummary) {
              setConfig(prev => {
                const existing = prev.storyMemory?.memories || [];
                const existingDescSet = new Set(existing.map(m => m.description.toLowerCase()));
                const trulyNew = updates.newMemories.filter(m => !existingDescSet.has(m.description.toLowerCase()));
                return {
                  ...prev,
                  storyMemory: {
                    enabled: prev.storyMemory?.enabled ?? true,
                    autoExtract: prev.storyMemory?.autoExtract ?? true,
                    memories: [...existing, ...trulyNew],
                    plotSummary: updates.updatedSummary || prev.storyMemory?.plotSummary || ""
                  }
                };
              });
            }
          } catch (memErr) {
            console.warn("Otomatik mantık hafızası çıkarımında sorun:", memErr);
          }
        }
        const parsed = parseGeminiError(imgError);
        setApiError({
          isOpen: true,
          isQuota: parsed.isQuota,
          title: parsed.title,
          message: parsed.message,
          retrySeconds: parsed.retrySeconds,
          promptToCopy: scriptData.panels[0]?.imagePrompt || "",
        });
      }
    } catch (error: any) {
      console.error("Hikaye oluşturma hatası:", error);
      setStatus(GeneratorStatus.ERROR);
      setPages(prev => prev.slice(0, -1));
      const parsed = parseGeminiError(error);
      setApiError({
        isOpen: true,
        isQuota: parsed.isQuota,
        title: parsed.title,
        message: parsed.message,
        retrySeconds: parsed.retrySeconds,
        onRetry: () => performGeneration(direction)
      });
    }
  };

  const handleRegeneratePanel = async (pageId: string, panelIndex: number) => {
      const page = pages.find(p => p.id === pageId);
      if (!page || page.panels[panelIndex].isLoading) return;

      const previousImageUrl = page.panels[panelIndex].imageUrl;
      const targetPrompt = page.panels[panelIndex].imagePrompt;

      setPages(prev => prev.map(p => {
          if (p.id !== pageId) return p;
          const newPanels = [...p.panels];
          newPanels[panelIndex] = { ...newPanels[panelIndex], isLoading: true };
          return { ...p, panels: newPanels };
      }));

      try {
          const panel = page.panels[panelIndex];
          const effectiveQuality = config.usePaidApi ? "Ultra" : (config.renderQuality || "High");
          const newImageUrl = await generateSinglePanelImage(
            panel.imagePrompt, 
            config.style, 
            config.cast, 
            effectiveQuality,
            panel.directorConfig,
            config.locations,
            config.colorPalette,
            config.lightingMood,
            config.consistencyLock,
            panel.characterNames,
            config.contentRating || "pg17",
            panel.modestyConcealment || config.modestyConcealment,
            config.topic,
            config.tone,
            config.imageProvider || "pollinations_flux",
            config.pollinationsModel
          );
          setPages(prev => prev.map(p => {
            if (p.id !== pageId) return p;
            const newPanels = [...p.panels];
            newPanels[panelIndex] = { ...newPanels[panelIndex], isLoading: false, imageUrl: newImageUrl };
            return { ...p, panels: newPanels };
          }));
      } catch (error: any) {
          console.error("Panel yeniden oluşturma hatası:", error);
          // Restore previous image so panel is not lost
          setPages(prev => prev.map(p => {
            if (p.id !== pageId) return p;
            const newPanels = [...p.panels];
            newPanels[panelIndex] = { ...newPanels[panelIndex], isLoading: false, imageUrl: previousImageUrl };
            return { ...p, panels: newPanels };
          }));

          const parsed = parseGeminiError(error);
          setApiError({
            isOpen: true,
            isQuota: parsed.isQuota,
            title: parsed.title,
            message: parsed.message,
            retrySeconds: parsed.retrySeconds,
            promptToCopy: targetPrompt,
            onRetry: () => handleRegeneratePanel(pageId, panelIndex)
          });
      }
  };

  const handleRegenerateFullPage = async (pageId: string) => {
    const page = pages.find((p) => p.id === pageId);
    if (!page || page.panels.some((p) => p.isLoading)) return;

    // Set loading state on all panels
    setPages((prev) =>
      prev.map((p) => {
        if (p.id !== pageId) return p;
        return {
          ...p,
          pageImageUrl: undefined,
          panels: p.panels.map((pan) => ({ ...pan, isLoading: true }))
        };
      })
    );

    try {
      const effectiveQuality = config.usePaidApi ? "Ultra" : (config.renderQuality || "High");

      const panelPromises = page.panels.map(async (panel: ComicPanelData, panIdx: number) => {
        try {
          const newImageUrl = await generateSinglePanelImage(
            panel.imagePrompt,
            config.style,
            config.cast,
            effectiveQuality,
            panel.directorConfig,
            config.locations,
            config.colorPalette,
            config.lightingMood,
            config.consistencyLock ?? true,
            panel.characterNames,
            config.contentRating || "pg17",
            panel.modestyConcealment || config.modestyConcealment,
            config.topic,
            config.tone,
            config.imageProvider || "pollinations_flux",
            config.pollinationsModel
          );

          setPages((prev) =>
            prev.map((p) => {
              if (p.id !== pageId) return p;
              const newPanels = [...p.panels];
              if (newPanels[panIdx]) {
                newPanels[panIdx] = { ...newPanels[panIdx], imageUrl: newImageUrl, isLoading: false };
              }
              return { ...p, panels: newPanels };
            })
          );
          return newImageUrl;
        } catch (err) {
          console.error(`Sayfa ${pageId} Panel ${panIdx + 1} yeniden çizim hatası:`, err);
          setPages((prev) =>
            prev.map((p) => {
              if (p.id !== pageId) return p;
              const newPanels = [...p.panels];
              if (newPanels[panIdx]) {
                newPanels[panIdx] = { ...newPanels[panIdx], isLoading: false };
              }
              return { ...p, panels: newPanels };
            })
          );
          return null;
        }
      });

      await Promise.all(panelPromises);
    } catch (error: any) {
      console.error("Tam sayfa yeniden çizim hatası:", error);
      // Restore loading state to false
      setPages((prev) =>
        prev.map((p) => {
          if (p.id !== pageId) return p;
          return {
            ...p,
            panels: p.panels.map((pan) => ({ ...pan, isLoading: false }))
          };
        })
      );

      const parsed = parseGeminiError(error);
      setApiError({
        isOpen: true,
        isQuota: parsed.isQuota,
        title: parsed.title || "Sayfa Çizilemedi",
        message: parsed.message,
        retrySeconds: parsed.retrySeconds,
        promptToCopy: page.panels[0]?.imagePrompt || "",
        onRetry: () => handleRegenerateFullPage(pageId)
      });
    }
  };

  const handleApplyDirector = async (pageId: string, panelIndex: number, directorConfig: PanelDirectorConfig) => {
    const page = pages.find(p => p.id === pageId);
    if (!page || page.panels[panelIndex].isLoading) return;

    const previousImageUrl = page.panels[panelIndex].imageUrl;
    const targetPrompt = page.panels[panelIndex].imagePrompt;

    setPages(prev => prev.map(p => {
      if (p.id !== pageId) return p;
      const newPanels = [...p.panels];
      newPanels[panelIndex] = { ...newPanels[panelIndex], isLoading: true, directorConfig };
      return { ...p, panels: newPanels };
    }));

    try {
      const panel = page.panels[panelIndex];
      const effectiveQuality = config.usePaidApi ? "Ultra" : (config.renderQuality || "High");
      const newImageUrl = await generateSinglePanelImage(
        panel.imagePrompt,
        config.style,
        config.cast,
        effectiveQuality,
        directorConfig,
        config.locations,
        config.colorPalette,
        config.lightingMood,
        config.consistencyLock,
        panel.characterNames,
        config.contentRating || "pg17",
        panel.modestyConcealment || config.modestyConcealment,
        config.topic,
        config.tone,
        config.imageProvider || "pollinations_flux",
        config.pollinationsModel
      );
      setPages(prev => prev.map(p => {
        if (p.id !== pageId) return p;
        const newPanels = [...p.panels];
        newPanels[panelIndex] = { ...newPanels[panelIndex], isLoading: false, imageUrl: newImageUrl, directorConfig };
        return { ...p, panels: newPanels };
      }));
    } catch (error: any) {
      console.error("Yönetmen modu panel oluşturma hatası:", error);
      setPages(prev => prev.map(p => {
        if (p.id !== pageId) return p;
        const newPanels = [...p.panels];
        newPanels[panelIndex] = { ...newPanels[panelIndex], isLoading: false, imageUrl: previousImageUrl };
        return { ...p, panels: newPanels };
      }));

      const parsed = parseGeminiError(error);
      setApiError({
        isOpen: true,
        isQuota: parsed.isQuota,
        title: parsed.title,
        message: parsed.message,
        retrySeconds: parsed.retrySeconds,
        promptToCopy: targetPrompt,
        onRetry: () => handleApplyDirector(pageId, panelIndex, directorConfig)
      });
    }
  };

  const handleUpdateDialogue = (pageId: string, panelIndex: number, newDialogue: string) => {
    setPages(prev => prev.map(p => {
      if (p.id !== pageId) return p;
      const newPanels = [...p.panels];
      newPanels[panelIndex] = { ...newPanels[panelIndex], dialogue: newDialogue };
      return { ...p, panels: newPanels };
    }));
  };

  // Delete page handler
  const handleDeletePage = (pageId: string) => {
    const pageIndex = pages.findIndex(p => p.id === pageId);
    if (pageIndex === -1) return;
    setPageToDelete({ id: pageId, pageNumber: pageIndex + 1 });
  };

  const handleConfirmDeletePage = () => {
    if (!pageToDelete) return;
    setPages(prev => prev.filter(p => p.id !== pageToDelete.id));
    setPageToDelete(null);
  };

  // Dedicated manual panel update handler (prompt, dialogue, staging, onomatopoeia) without full page regeneration
  const handleUpdatePanel = (pageId: string, panelIndex: number, updatedPanel: Partial<ComicPanelData>) => {
    setPages(prev => prev.map(p => {
      if (p.id !== pageId) return p;
      const newPanels = [...p.panels];
      newPanels[panelIndex] = {
        ...newPanels[panelIndex],
        ...updatedPanel
      };
      return { ...p, panels: newPanels };
    }));
  };

  // Re-generate ONLY this single panel with custom updated parameters
  const handleRegenerateSinglePanelWithData = async (
    pageId: string, 
    panelIndex: number, 
    updatedPanel: Partial<ComicPanelData>
  ) => {
    const page = pages.find(p => p.id === pageId);
    if (!page || page.panels[panelIndex]?.isLoading) return;

    const previousImageUrl = page.panels[panelIndex].imageUrl;
    const previousOriginal = page.panels[panelIndex].originalImageUrl || previousImageUrl;
    const existingHistory = page.panels[panelIndex].editHistory || [];
    const updatedHistory = previousImageUrl ? [...existingHistory, previousImageUrl] : existingHistory;

    const targetPrompt = updatedPanel.imagePrompt || page.panels[panelIndex].imagePrompt;
    const directorConfig = updatedPanel.directorConfig || page.panels[panelIndex].directorConfig;
    const targetCharacters = updatedPanel.characterNames || page.panels[panelIndex].characterNames;

    // Apply edits and trigger loading for ONLY this panel
    setPages(prev => prev.map(p => {
      if (p.id !== pageId) return p;
      const newPanels = [...p.panels];
      newPanels[panelIndex] = { 
        ...newPanels[panelIndex], 
        ...updatedPanel,
        isLoading: true 
      };
      return { ...p, panels: newPanels };
    }));

    try {
      const effectiveQuality = config.usePaidApi ? "Ultra" : (config.renderQuality || "High");
      const newImageUrl = await generateSinglePanelImage(
        targetPrompt,
        config.style,
        config.cast,
        effectiveQuality,
        directorConfig,
        config.locations,
        config.colorPalette,
        config.lightingMood,
        config.consistencyLock,
        targetCharacters,
        config.contentRating || "pg17",
        updatedPanel.modestyConcealment || page.panels[panelIndex].modestyConcealment || config.modestyConcealment,
        config.topic,
        config.tone,
        config.imageProvider || "pollinations_flux",
        config.pollinationsModel
      );

      setPages(prev => prev.map(p => {
        if (p.id !== pageId) return p;
        const newPanels = [...p.panels];
        newPanels[panelIndex] = { 
          ...newPanels[panelIndex], 
          isLoading: false, 
          imageUrl: newImageUrl,
          originalImageUrl: previousOriginal,
          editHistory: updatedHistory,
          ...updatedPanel 
        };
        return { ...p, panels: newPanels };
      }));
    } catch (error: any) {
      console.error("Panel yeniden çizim hatası:", error);
      setPages(prev => prev.map(p => {
        if (p.id !== pageId) return p;
        const newPanels = [...p.panels];
        newPanels[panelIndex] = { 
          ...newPanels[panelIndex], 
          isLoading: false, 
          imageUrl: previousImageUrl 
        };
        return { ...p, panels: newPanels };
      }));

      const parsed = parseGeminiError(error);
      setApiError({
        isOpen: true,
        isQuota: parsed.isQuota,
        title: parsed.title,
        message: parsed.message,
        retrySeconds: parsed.retrySeconds,
        promptToCopy: targetPrompt,
        onRetry: () => handleRegenerateSinglePanelWithData(pageId, panelIndex, updatedPanel)
      });
    }
  };

  // Toggle individual panel blur shield
  const handleTogglePanelBlur = (pageId: string, panelIndex: number) => {
    setPages(prev => prev.map(p => {
      if (p.id !== pageId) return p;
      const newPanels = [...p.panels];
      const cur = newPanels[panelIndex];
      newPanels[panelIndex] = {
        ...cur,
        isBlurred: !cur.isBlurred
      };
      return { ...p, panels: newPanels };
    }));
  };

  // Global toggle for all blurred panels on a page (or entire comic)
  const handleToggleGlobalBlur = (pageId?: string) => {
    setPages(prev => prev.map(p => {
      if (pageId && p.id !== pageId) return p;
      const hasAnyBlurred = p.panels.some(pan => pan.isBlurred);
      return {
        ...p,
        panels: p.panels.map(pan => ({
          ...pan,
          // If some are blurred, unblur all. If none blurred, blur mature ones (or all if in pg18 mode).
          isBlurred: !hasAnyBlurred && (pan.isMature || config.contentRating === "pg18")
        }))
      };
    }));
  };

  // Regenerate panel with an explicit camera angle preset
  const handleRegenerateWithAngle = async (pageId: string, panelIndex: number, angleId: string) => {
    const page = pages.find(p => p.id === pageId);
    if (!page) return;
    const panel = page.panels[panelIndex];
    if (!panel) return;

    const newPrompt = applyCameraAngleToPrompt(panel.imagePrompt, angleId);
    const updatedDirector: PanelDirectorConfig = {
      ...(panel.directorConfig || { characters: [] }),
      cameraAngle: angleId
    };

    const modestyMap: Record<string, "sheets" | "steam" | "silhouette" | "angles" | "macro"> = {
      modesty_sheets: "sheets",
      modesty_steam: "steam",
      modesty_over_shoulder: "angles",
      silhouette_shadow: "silhouette",
      close_up_eyes: "macro"
    };
    const mappedModesty = modestyMap[angleId];

    await handleRegenerateSinglePanelWithData(pageId, panelIndex, {
      imagePrompt: newPrompt,
      cameraAngle: angleId,
      modestyConcealment: mappedModesty || panel.modestyConcealment,
      isMature: Boolean(mappedModesty || panel.isMature),
      directorConfig: updatedDirector
    });
  };

  const handleDownloadPage = async (pageId: string, index: number) => {
    const element = document.getElementById(`comic-page-${pageId}`);
    if (!element) return;
    try {
      if (document.fonts) {
        await document.fonts.ready;
      }
      const canvas = await html2canvas(element, { 
        useCORS: true, 
        scale: 2, 
        backgroundColor: "#ffffff",
        logging: false,
        onclone: (_clonedDoc, clonedEl) => {
          // Hide buttons and controls in snapshot
          clonedEl.querySelectorAll("button").forEach(b => {
            b.style.display = "none";
          });
          // Swap textarea with clean centered print text
          clonedEl.querySelectorAll(".dialogue-input").forEach((ta: any) => {
            const printDiv = ta.parentElement?.querySelector(".dialogue-print-text");
            if (printDiv) {
              printDiv.classList.remove("hidden");
              printDiv.style.display = "block";
              ta.style.display = "none";
            }
          });
        }
      });
      const link = document.createElement("a");
      link.download = `sayfa-${index + 1}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch (error) { console.error(error); }
  };

  // Start brand new story (safely saving current one first if it has content)
  const handleStartNewStory = async () => {
    setShowResetModal(false);
    
    // 1. If current workspace has data, save it to library first
    if (pages.length > 0 || config.topic.trim().length > 0 || config.cast.length > 0) {
      try {
        const storyTitle = config.topic || (pages[0]?.panels[0]?.dialogue?.substring(0, 30)) || "İsimsiz Hikaye";
        const cover = pages[0]?.pageImageUrl || pages[0]?.panels.find(p => p.imageUrl)?.imageUrl;
        await saveStoryToLibrary({
          id: currentStoryId,
          title: storyTitle,
          topic: config.topic,
          intro: config.intro,
          coverImageUrl: cover,
          pageCount: pages.length,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          config,
          pages
        });
      } catch (err) {
        console.warn("Önceki hikaye kaydedilemedi:", err);
      }
    }

    // 2. Clear canvas & assign fresh ID
    const newId = `story-${Date.now()}`;
    setCurrentStoryId(newId);
    setActiveStoryId(newId);
    setPages([]);
    setConfig({
      topic: "",
      intro: "",
      cast: [],
      style: "Standart Çizgi Roman",
      tone: "Romantizm & Aşk",
      narratorVoice: "Duygusal & İçten",
      renderQuality: "High",
      consistencyLock: true,
      colorPalette: "romance_shojo",
      lightingMood: "romantic_dream",
      storyMemory: {
        enabled: true,
        autoExtract: true,
        memories: [],
        plotSummary: ""
      }
    });
    setStatus(GeneratorStatus.IDLE);
    await refreshStoriesCount();
    showStoryToast("Yeni hikaye başlatıldı! Önceki hikayeniz 'Hikayelerim' menüsünde güvende.");
  };

  // Load a saved story from library into workspace
  const handleLoadStory = async (story: SavedStory) => {
    // 1. Save current state first if it has content and differs
    if (currentStoryId !== story.id && (pages.length > 0 || config.topic.trim().length > 0)) {
      try {
        const cover = pages[0]?.pageImageUrl || pages[0]?.panels.find(p => p.imageUrl)?.imageUrl;
        await saveStoryToLibrary({
          id: currentStoryId,
          title: config.topic || "İsimsiz Hikaye",
          topic: config.topic,
          intro: config.intro,
          coverImageUrl: cover,
          pageCount: pages.length,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          config,
          pages
        });
      } catch (e) { /* ignore */ }
    }

    // 2. Load the target story
    setCurrentStoryId(story.id);
    setActiveStoryId(story.id);

    // Sanitize cast
    const seenCharIds = new Set<string>();
    const sanitizedCast = (story.config.cast || []).map((c, cIdx) => {
      let charId = c.id && !seenCharIds.has(c.id) ? c.id : `${generateId()}-${cIdx}`;
      seenCharIds.add(charId);
      return { ...c, id: charId };
    });
    setConfig({ ...story.config, cast: sanitizedCast });

    // Sanitize pages
    const seenPageIds = new Set<string>();
    const cleanedPages = (story.pages || []).map((p, pageIdx) => {
      let pageId = p.id && !seenPageIds.has(p.id) ? p.id : `${generateId()}-${pageIdx}`;
      seenPageIds.add(pageId);
      const seenPanelIds = new Set<string>();
      return {
        ...p,
        id: pageId,
        panels: (p.panels || []).map((panel, panIdx) => {
          let panId = panel.id && !seenPanelIds.has(panel.id) ? panel.id : `${pageId}-panel-${panIdx}-${generateId()}`;
          seenPanelIds.add(panId);
          return {
            ...panel,
            id: panId,
            isLoading: false
          };
        })
      };
    });

    setPages(cleanedPages);
    setStatus(cleanedPages.length > 0 ? GeneratorStatus.COMPLETE : GeneratorStatus.IDLE);

    try {
      await saveProject({
        config: { ...story.config, cast: sanitizedCast },
        pages: cleanedPages,
        savedAt: Date.now()
      });
    } catch (e) { /* ignore */ }

    await refreshStoriesCount();
    showStoryToast(`"${story.title || story.config.topic || 'Hikaye'}" açıldı!`);
  };

  // Explicit Save Story button handler
  const handleManualSaveStory = async () => {
    try {
      const storyTitle = config.topic || (pages[0]?.panels[0]?.dialogue?.substring(0, 30)) || "İsimsiz Hikaye";
      const cover = pages[0]?.pageImageUrl || pages[0]?.panels.find(p => p.imageUrl)?.imageUrl;
      
      await saveStoryToLibrary({
        id: currentStoryId,
        title: storyTitle,
        topic: config.topic,
        intro: config.intro,
        coverImageUrl: cover,
        pageCount: pages.length,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        config,
        pages
      });

      await refreshStoriesCount();
      showStoryToast(`"${storyTitle}" başarıyla kütüphaneye kaydedildi!`);
    } catch (err) {
      console.error("Manuel kaydetme hatası:", err);
    }
  };

  const handleConfirmReset = async () => {
    await handleStartNewStory();
  };

  const handleAnalyzeContinuity = async () => {
    if (pages.length === 0 || isAnalyzingContinuity) return;
    setIsAnalyzingContinuity(true);
    try {
      const allPanels = pages.flatMap(p => p.panels);
      const updates = await extractNarrativeMemoryUpdates(
        allPanels,
        pages.length,
        config.cast || [],
        config.storyMemory
      );

      if (updates.newMemories.length > 0 || updates.updatedSummary) {
        setConfig(prev => {
          const existing = prev.storyMemory?.memories || [];
          const existingDescSet = new Set(existing.map(m => m.description.toLowerCase()));
          const trulyNew = updates.newMemories.filter(m => !existingDescSet.has(m.description.toLowerCase()));
          return {
            ...prev,
            storyMemory: {
              enabled: prev.storyMemory?.enabled ?? true,
              autoExtract: prev.storyMemory?.autoExtract ?? true,
              memories: [...existing, ...trulyNew],
              plotSummary: updates.updatedSummary || prev.storyMemory?.plotSummary || ""
            }
          };
        });
      }
    } catch (err) {
      console.error("Manuel mantık analizi hatası:", err);
    } finally {
      setIsAnalyzingContinuity(false);
    }
  };

  const hasActiveProject = pages.length > 0 || config.topic.trim().length > 0 || config.cast.length > 0;

  return (
    <div className="flex h-screen bg-[#0f172a] text-white font-sans overflow-hidden selection:bg-yellow-400 selection:text-black">
      <Sidebar
        config={config}
        setConfig={setConfig}
        onGenerate={handleStartGeneration}
        onAutoFill={handleAutoFill}
        status={status}
        isOpen={isSidebarOpen}
        onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
        isAutoFilling={isAutoFilling}
        onReset={() => setShowResetModal(true)}
        hasActiveProject={hasActiveProject}
        pageCount={pages.length}
        onAnalyzeContinuity={handleAnalyzeContinuity}
        isAnalyzingContinuity={isAnalyzingContinuity}
        onOpenMemoryModal={() => setIsMemoryModalOpen(true)}
        onOpenFlowModal={() => setIsFlowModalOpen(true)}
        onOpenPdfModal={() => setIsPdfModalOpen(true)}
        onOpenStoriesModal={() => setIsStoriesModalOpen(true)}
        onOpenApiKeyModal={() => {
          setApiKeyModalTab(
            config.imageProvider === "fal_flux" ? "fal" :
            config.imageProvider === "together_flux" ? "together" :
            config.imageProvider === "gemini" ? "gemini" : "pollinations"
          );
          setIsApiKeyModalOpen(true);
        }}
        savedStoriesCount={savedStoriesCount}
      />

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
          {isSidebarOpen && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/60 z-30 lg:hidden backdrop-blur-sm" 
                onClick={() => setIsSidebarOpen(false)} 
              />
          )}
      </AnimatePresence>

      <main className={cn(
        "flex-1 overflow-y-auto custom-scrollbar relative px-2 sm:px-6 md:px-12 py-4 sm:py-8 bg-halftone transition-all duration-300",
        isSidebarOpen ? "lg:pl-[340px]" : "lg:pl-4"
      )}>
        {/* Top Control Bar (Glassmorphic Comic Dock) */}
        <header className="max-w-5xl mx-auto sticky top-2 sm:top-4 z-30 mb-6 sm:mb-8 pointer-events-auto">
          <div className="bg-slate-900/90 backdrop-blur-md border-2 sm:border-3 border-black shadow-comic px-2.5 sm:px-4 py-2 sm:py-2.5 flex items-center justify-between gap-2 sm:gap-3 flex-wrap">
            {/* Left: Sidebar Toggle & Project Title */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsSidebarOpen(true)}
                className={cn(
                  "px-3 py-1.5 sm:px-4 sm:py-2 bg-yellow-400 hover:bg-yellow-300 border-2 border-black shadow-comic-xs active:scale-95 transition-all flex items-center gap-2 font-display text-xs sm:text-sm text-black uppercase -skew-x-3 cursor-pointer",
                  isSidebarOpen && "lg:opacity-0 pointer-events-none"
                )}
                title="Kurgu ve Karakter Panelini Aç"
              >
                <Menu size={18} className="text-black shrink-0" />
                <span className="font-bold">Kurgu Paneli</span>
              </button>

              {config.topic && (
                <div className="hidden md:flex items-center gap-1.5 bg-black/60 border border-yellow-400/40 px-2.5 py-1 text-xs font-comic text-yellow-300 truncate max-w-[220px]" title={config.topic}>
                  <Sparkles size={12} className="text-yellow-400 shrink-0" />
                  <span className="truncate">{config.topic}</span>
                </div>
              )}
            </div>

            {/* Right: Engine Pill, Stories, API, Project Actions, Status */}
            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
              {/* Image Engine Mode Indicator and Fast Switch */}
              <button
                type="button"
                onClick={() => setConfig(prev => {
                  const current = prev.imageProvider || "pollinations_flux";
                  if (current === "pollinations_flux") {
                    if (!getFalApiKey()) {
                      setApiKeyModalTab("fal");
                      setIsApiKeyModalOpen(true);
                    }
                    return { ...prev, imageProvider: "fal_flux", usePaidApi: false };
                  } else if (current === "fal_flux") {
                    if (!getTogetherApiKey()) {
                      setApiKeyModalTab("together");
                      setIsApiKeyModalOpen(true);
                    }
                    return { ...prev, imageProvider: "together_flux", usePaidApi: false };
                  } else if (current === "together_flux") {
                    return { ...prev, imageProvider: "auto", usePaidApi: false };
                  } else if (current === "auto") {
                    if (!getUserApiKey()) {
                      setApiKeyModalTab("gemini");
                      setIsApiKeyModalOpen(true);
                    }
                    return { ...prev, imageProvider: "gemini", usePaidApi: true, renderQuality: "Ultra" };
                  } else {
                    return { ...prev, imageProvider: "pollinations_flux", usePaidApi: false, renderQuality: prev.renderQuality === "Paid_Pro" ? "High" : prev.renderQuality };
                  }
                })}
                className={cn(
                  "border-2 border-black px-2.5 sm:px-3 py-1.5 flex items-center gap-1.5 shadow-comic-xs text-[10px] sm:text-xs font-display uppercase tracking-wider transition-all active:scale-95 cursor-pointer",
                  config.imageProvider === "fal_flux"
                    ? "bg-orange-500 hover:bg-orange-400 text-black font-bold"
                    : config.imageProvider === "together_flux"
                    ? "bg-purple-600 hover:bg-purple-500 text-white font-bold"
                    : config.imageProvider === "gemini"
                    ? "bg-amber-400 hover:bg-yellow-300 text-black font-bold" 
                    : config.imageProvider === "auto"
                    ? "bg-blue-600 hover:bg-blue-500 text-white font-bold"
                    : "bg-emerald-500 hover:bg-emerald-400 text-black font-bold"
                )}
                title={
                  config.imageProvider === "fal_flux"
                    ? "Motor: fal.ai FLUX.1 [schnell/dev] (Tıklayarak Together AI moda geçin)"
                    : config.imageProvider === "together_flux"
                    ? "Motor: Together AI FLUX [dev/schnell] (Tıklayarak Hibrit moda geçin)"
                    : config.imageProvider === "gemini"
                    ? "Motor: Google Gemini Imagen Pro (Tıklayarak %100 Ücretsiz FLUX moduna geçin)"
                    : config.imageProvider === "auto"
                    ? "Motor: Otomatik Hibrit (AI+FLUX) (Tıklayarak Gemini Pro moduna geçin)"
                    : "Motor: %100 Ücretsiz FLUX (Tıklayarak fal.ai FLUX moduna geçin)"
                }
              >
                {config.imageProvider === "fal_flux" ? (
                  <Flame size={13} className="text-black fill-black" />
                ) : (
                  <Zap size={13} className={
                    config.imageProvider === "together_flux" ? "text-yellow-300 fill-yellow-300" :
                    config.imageProvider === "gemini" ? "text-black fill-black" :
                    config.imageProvider === "auto" ? "text-cyan-200 fill-cyan-200" : "text-black"
                  } />
                )}
                <span className="hidden sm:inline">
                  {config.imageProvider === "fal_flux"
                    ? "fal.ai FLUX"
                    : config.imageProvider === "together_flux"
                    ? "Together FLUX"
                    : config.imageProvider === "gemini" 
                    ? "Gemini Pro" 
                    : config.imageProvider === "auto" 
                    ? "Hibrit (AI+FLUX)" 
                    : "%100 Ücretsiz FLUX"}
                </span>
                <span className="sm:hidden font-bold">
                  {config.imageProvider === "fal_flux" ? "FAL.AI" :
                   config.imageProvider === "together_flux" ? "TOGETHER" :
                   config.imageProvider === "gemini" ? "PRO" :
                   config.imageProvider === "auto" ? "HİBRİT" : "FLUX"}
                </span>
              </button>

              {/* Stories Library Button */}
              <button
                type="button"
                onClick={() => setIsStoriesModalOpen(true)}
                className="border-2 border-black px-2 sm:px-2.5 py-1.5 flex items-center gap-1.5 shadow-comic-xs text-[10px] sm:text-xs font-display uppercase tracking-wider transition-all active:scale-95 bg-slate-800 hover:bg-slate-700 text-yellow-300 cursor-pointer"
                title="Tüm kayıtlı hikayelerinizi yönetin veya yeni hikaye başlatın"
              >
                <BookOpen size={13} className="text-yellow-400" />
                <span className="hidden sm:inline">Hikayelerim</span>
                {savedStoriesCount > 0 && (
                  <span className="bg-yellow-400 text-black px-1.5 py-0.2 text-[9px] font-mono font-black border border-black">
                    {savedStoriesCount}
                  </span>
                )}
              </button>

              {/* API Key Button */}
              {(() => {
                const activeCount = (hasUserApiKey ? 1 : 0) + (hasTogetherKey ? 1 : 0) + (hasFalKey ? 1 : 0) + (hasPollinationsKey ? 1 : 0);
                const hasAny = activeCount > 0;
                return (
                  <button
                    type="button"
                    onClick={() => {
                      setApiKeyModalTab(
                        config.imageProvider === "fal_flux" ? "fal" :
                        config.imageProvider === "together_flux" ? "together" :
                        config.imageProvider === "gemini" ? "gemini" : "pollinations"
                      );
                      setIsApiKeyModalOpen(true);
                    }}
                    className={cn(
                      "border-2 border-black px-2.5 sm:px-3 py-1.5 flex items-center gap-1.5 shadow-comic text-[11px] sm:text-xs font-display uppercase tracking-wider transition-all active:scale-95 cursor-pointer",
                      hasAny
                        ? "bg-gradient-to-r from-purple-800 to-indigo-800 hover:from-purple-700 hover:to-indigo-700 text-yellow-300 font-bold border-black shadow-comic-xs"
                        : "bg-yellow-400 hover:bg-yellow-300 text-black font-black animate-pulse"
                    )}
                    title={hasAny ? `API Anahtarlarınız tanımlı (${activeCount} aktif)` : "fal.ai, Together AI veya Google Gemini API anahtarınızı girin"}
                  >
                    <KeyRound size={14} className={hasAny ? "text-yellow-400" : "text-black fill-black"} />
                    <span className="font-bold">
                      {activeCount > 1 ? `API (${activeCount} AKTİF)` : activeCount === 1 ? "API AKTİF" : "API ANAHTARI GİR"}
                    </span>
                    {!hasAny && (
                      <span className="w-2 h-2 rounded-full bg-red-600 inline-block" />
                    )}
                  </button>
                );
              })()}

              {/* Reset Story Button if project active */}
              {hasActiveProject && (
                <button
                  onClick={() => setShowResetModal(true)}
                  className="bg-slate-800 hover:bg-red-600 text-white border-2 border-black px-2 sm:px-2.5 py-1.5 flex items-center gap-1.5 shadow-comic-xs font-display text-[10px] sm:text-xs uppercase transition-colors active:scale-95 cursor-pointer"
                  title="Mevcut hikayeyi sıfırla ve yeni çizgi romana başla"
                >
                  <RotateCcw size={13} />
                  <span className="hidden md:inline">Yeni</span>
                </button>
              )}

              {/* Status Indicator Badge */}
              <div className="bg-black/90 border-2 border-black px-2 sm:px-3 py-1 sm:py-1.5 flex items-center gap-1.5 sm:gap-2 shadow-comic-xs">
                <span 
                  className={cn(
                    "w-2 sm:w-2.5 h-2 sm:h-2.5 rounded-full flex-shrink-0",
                    status === GeneratorStatus.IDLE ? "bg-slate-500" : status === GeneratorStatus.COMPLETE ? "bg-emerald-400 ring-2 ring-emerald-400/40" : "bg-yellow-400 animate-pulse ring-2 ring-yellow-400/50"
                  )}
                />
                <span className="font-display uppercase text-[9px] sm:text-[10px] tracking-wider text-slate-200 truncate max-w-[90px] sm:max-w-none">
                  {status === GeneratorStatus.IDLE ? "HAZIR" : status === GeneratorStatus.GENERATING_STORY ? "SENARYO..." : status === GeneratorStatus.GENERATING_IMAGES ? "ÇİZİLİYOR..." : status === GeneratorStatus.COMPLETE ? "TAMAMLANDI" : status}
                </span>
              </div>
            </div>
          </div>
        </header>

        <div className="max-w-5xl mx-auto min-h-full flex flex-col">
          <AnimatePresence mode="wait">
            {pages.length === 0 ? (
              <motion.div 
                key="empty"
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, y: -40 }}
                className="flex-1 flex flex-col items-center justify-center text-center py-6 sm:py-12 px-3"
              >
                {/* Comic Studio Top Tag */}
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-yellow-400 text-black border-2 border-black shadow-comic-xs font-display text-xs sm:text-sm uppercase tracking-wider mb-6 -skew-x-3">
                  <Sparkles size={14} className="fill-black" />
                  <span>Yapay Zeka Çizgi Roman Stüdyosu</span>
                  <span className="text-[10px] font-mono px-1.5 bg-black text-yellow-300 font-bold">%100 ÜCRETSİZ FLUX</span>
                </div>

                {/* Animated Studio Logo/Badge */}
                <motion.div 
                    animate={{ rotate: [0, 3, -3, 0], y: [0, -6, 0] }}
                    transition={{ repeat: Infinity, duration: 5, ease: "easeInOut" }}
                    className="mb-4 relative"
                >
                    <div className="w-24 h-24 sm:w-32 sm:h-32 bg-yellow-400 border-4 border-black shadow-comic-lg flex items-center justify-center -rotate-3 hover:rotate-0 transition-transform">
                      <Book size={56} className="text-black" />
                      <Zap size={32} className="absolute -top-3 -right-3 text-red-600 fill-red-600 drop-shadow-[2px_2px_0px_#000]" />
                    </div>
                </motion.div>
                
                {/* Hero Title */}
                <h2 className="text-4xl sm:text-6xl md:text-7xl font-display text-white mb-3 uppercase tracking-tight text-outline-lg leading-none">
                  HİKAYENİ <br className="sm:hidden" />
                  <span className="text-yellow-400 text-outline-lg"> ÇİZGİ ROMANA</span> DÖNÜŞTÜR
                </h2>
                
                <p className="max-w-xl mb-8 font-comic text-slate-300 text-sm sm:text-lg leading-relaxed">
                  Hayalindeki sahneleri yaz; yapay zeka karakterlerini sabit tutarak <strong className="text-yellow-300 font-bold">4 karelik profesyonel çizgi roman sayfasına</strong> döksün.
                </p>
                
                {/* Primary Action Buttons */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 w-full max-w-md sm:max-w-none px-2 mb-10">
                    <button
                        onClick={() => setIsSidebarOpen(true)}
                        className="w-full sm:w-auto bg-red-600 hover:bg-red-500 border-3 sm:border-4 border-black text-white font-display text-lg sm:text-2xl px-8 sm:px-12 py-3.5 sm:py-4 shadow-comic hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0 transition-all flex items-center justify-center gap-2 group cursor-pointer"
                    >
                        <span>KURGUYU BAŞLAT</span> 
                        <ChevronRight className="inline group-hover:translate-x-1.5 transition-transform" />
                    </button>
                    <button
                        onClick={handleAutoFill}
                        disabled={isAutoFilling}
                        className="w-full sm:w-auto bg-white hover:bg-yellow-50 border-3 sm:border-4 border-black text-black font-display text-lg sm:text-2xl px-8 sm:px-10 py-3.5 sm:py-4 shadow-comic hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0 transition-all flex items-center justify-center gap-2.5 disabled:opacity-50 cursor-pointer"
                    >
                        {isAutoFilling ? <Loader2 className="animate-spin" size={20} /> : <Sparkles className="text-indigo-600 fill-indigo-600" size={20} />}
                        <span>RASTGELE KONSEPT</span>
                    </button>
                </div>

                {/* Quick-Starter Genre Templates */}
                <div className="w-full max-w-4xl text-left space-y-3 mb-10">
                  <div className="flex items-center justify-between px-1">
                    <h4 className="font-display text-xs sm:text-sm uppercase text-yellow-400 tracking-wider flex items-center gap-1.5">
                      <Zap size={14} className="text-yellow-400" /> Hızlı Başlangıç Şablonları (Tek Tıkla Yükle)
                    </h4>
                    <span className="text-[10px] font-mono text-slate-400">Tıkla & Kurguya Başla</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
                    {QUICK_TEMPLATES.map((tmpl, idx) => (
                      <div
                        key={`quick-template-${idx}`}
                        onClick={() => handleApplyQuickTemplate(tmpl)}
                        className="p-3 bg-slate-900/90 hover:bg-slate-800 border-2 border-black shadow-comic hover:-translate-y-1 transition-all cursor-pointer group flex flex-col justify-between"
                      >
                        <div>
                          <h5 className="font-display text-xs sm:text-sm text-yellow-300 group-hover:text-yellow-400 uppercase tracking-tight flex items-center justify-between">
                            <span>{tmpl.title}</span>
                            <ChevronRight size={14} className="text-slate-500 group-hover:text-yellow-400 transition-colors" />
                          </h5>
                          <p className="text-[10px] text-slate-400 font-comic mt-1 line-clamp-2 leading-snug">
                            {tmpl.desc}
                          </p>
                        </div>
                        <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[9px] font-mono text-slate-500">
                          <span className="text-emerald-400">4 Kare Hazır</span>
                          <span className="text-yellow-400 group-hover:underline">Seç →</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 3 Core Value Pillars */}
                <div className="w-full max-w-3xl grid grid-cols-1 sm:grid-cols-3 gap-3 text-left">
                  <div className="p-3 bg-slate-900/70 border-2 border-black/80 flex items-start gap-2.5">
                    <div className="w-8 h-8 rounded bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-400 shrink-0">
                      <Zap size={16} />
                    </div>
                    <div>
                      <h6 className="font-display text-xs uppercase text-purple-300">Together AI FLUX & Ücretsiz FLUX</h6>
                      <p className="text-[10px] font-comic text-slate-400 mt-0.5 leading-tight">Together AI (FLUX.1 Dev/Schnell) veya limitsiz ücretsiz Pollinations desteği.</p>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-900/70 border-2 border-black/80 flex items-start gap-2.5">
                    <div className="w-8 h-8 rounded bg-yellow-500/20 border border-yellow-500/40 flex items-center justify-center text-yellow-400 shrink-0">
                      <Users size={16} />
                    </div>
                    <div>
                      <h6 className="font-display text-xs uppercase text-yellow-300">Karakter & Kıyafet Tutarlılığı</h6>
                      <p className="text-[10px] font-comic text-slate-400 mt-0.5 leading-tight">Karakterin saç, yüz ve seçtiğin gardırobu tüm panellerde korunur.</p>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-900/70 border-2 border-black/80 flex items-start gap-2.5">
                    <div className="w-8 h-8 rounded bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 shrink-0">
                      <BookOpen size={16} />
                    </div>
                    <div>
                      <h6 className="font-display text-xs uppercase text-rose-300">Sadık 4-Panel Senaryo</h6>
                      <p className="text-[10px] font-comic text-slate-400 mt-0.5 leading-tight">Yazdığın hikaye değiştirilmeden 4 kareye detaylandırılır.</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div 
                key="pages"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-16 sm:space-y-32 pb-48 sm:pb-64"
              >
                {pages.map((page, index) => (
                  <div key={`comic-page-${page.id || index}-${index}`} className="relative group/page mb-16 sm:mb-24">
                    <ComicPageDisplay 
                      id={`comic-page-${page.id}`}
                      page={page} 
                      pageIndex={index} 
                      cast={config.cast}
                      locations={config.locations || []}
                      style={config.style}
                      renderQuality={config.renderQuality}
                      usePaidApi={config.usePaidApi || false}
                      imageProvider={config.imageProvider || "pollinations_flux"}
                      onPanelClick={(url) => setPreviewImage(url)}
                      onRegeneratePanel={(panelIndex) => handleRegeneratePanel(page.id, panelIndex)}
                      onRegenerateFullPage={(pageId) => handleRegenerateFullPage(pageId)}
                      onApplyDirector={(panelIndex, dirCfg) => handleApplyDirector(page.id, panelIndex, dirCfg)}
                      onUpdateDialogue={(panelIndex, newDialogue) => handleUpdateDialogue(page.id, panelIndex, newDialogue)}
                      onUpdatePanel={(panelIndex, updated) => handleUpdatePanel(page.id, panelIndex, updated)}
                      onRegenerateSinglePanelWithData={(panelIndex, updated) => handleRegenerateSinglePanelWithData(page.id, panelIndex, updated)}
                      onDeletePage={(pageId) => handleDeletePage(pageId)}
                      onTogglePanelBlur={(panelIndex) => handleTogglePanelBlur(page.id, panelIndex)}
                      onToggleGlobalBlur={() => handleToggleGlobalBlur(page.id)}
                    />
                    
                    {/* Action Bar per Page (Floating Studio Dock) */}
                    <div className="mt-4 p-2 bg-slate-900/90 backdrop-blur-md border-2 sm:border-3 border-black shadow-comic flex flex-wrap justify-between items-center gap-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <button
                            onClick={() => handleRegenerateFullPage(page.id)}
                            disabled={page.panels.some(p => p.isLoading)}
                            className="bg-yellow-400 hover:bg-yellow-300 text-black font-display text-xs sm:text-sm uppercase px-3.5 py-2 border-2 border-black shadow-comic-xs flex items-center gap-1.5 active:scale-95 transition-all font-bold disabled:opacity-50 cursor-pointer"
                            title="Bu Sayfanın 4 Panelini Tek Tıkla Yeniden Çiz"
                          >
                            <RefreshCw size={14} className={page.panels.some(p => p.isLoading) ? "animate-spin text-black" : "text-black"} />
                            <span className="font-display font-bold">Sayfayı Yeniden Çiz</span>
                          </button>

                          <button
                            onClick={() => handleDeletePage(page.id)}
                            className="bg-slate-800 text-red-400 hover:text-white hover:bg-red-600 font-display text-xs sm:text-sm uppercase px-3 py-2 border-2 border-black shadow-comic-xs flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer"
                            title="Bu Sayfayı Çizgi Romandan Sil"
                          >
                            <Trash2 size={14} /> <span>Sayfayı Sil</span>
                          </button>
                        </div>

                        <div className="flex items-center gap-2 flex-wrap">
                          <button
                            onClick={() => setIsPdfModalOpen(true)}
                            className="bg-indigo-600 hover:bg-indigo-500 text-white font-display text-xs sm:text-sm uppercase px-3.5 py-2 border-2 border-black shadow-comic-xs flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer"
                            title="Tüm Çizgi Romanı Tek PDF Yap"
                          >
                            <FileText size={14} className="text-yellow-300" /> <span>Full PDF İndir</span>
                          </button>
                          <button
                            onClick={() => handleDownloadPage(page.id, index)}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white font-display text-xs sm:text-sm uppercase px-3.5 py-2 border-2 border-black shadow-comic-xs flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer font-bold"
                            title="Bu Sayfayı PNG Olarak İndir"
                          >
                            <Download size={14} /> <span>Sayfayı İndir (PNG)</span>
                          </button>
                        </div>
                    </div>
                  </div>
                ))}
                <div ref={bottomRef} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Global Footer Actions */}
        <AnimatePresence>
            {pages.length > 0 && status === GeneratorStatus.COMPLETE && (
                <motion.div 
                    initial={{ y: 100 }}
                    animate={{ y: 0 }}
                    exit={{ y: 100 }}
                    className="fixed bottom-0 left-0 right-0 p-3 sm:p-8 flex justify-center z-20 pointer-events-none"
                >
                    <button 
                        onClick={() => { setUserDirection(""); setShowNextPageModal(true); }}
                        className="bg-red-600 hover:bg-yellow-400 text-white hover:text-black border-2 sm:border-4 border-black font-display text-lg sm:text-3xl py-3.5 sm:py-6 px-6 sm:px-16 shadow-comic-lg hover:-translate-y-1 transition-all pointer-events-auto group -skew-x-6 w-[92vw] max-w-md sm:max-w-none sm:w-auto flex items-center justify-center gap-2"
                    >
                        BİR SONRAKİ SAYFAYA GEÇ <ChevronRight className="inline group-hover:translate-x-1 transition-transform" />
                    </button>
                </motion.div>
            )}
        </AnimatePresence>

        {/* Next Page Narrative Modal */}
        <AnimatePresence>
            {showNextPageModal && (
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-3 sm:p-6"
                >
                    <motion.div 
                        initial={{ scale: 0.9, y: 30 }}
                        animate={{ scale: 1, y: 0 }}
                        exit={{ scale: 0.9, y: 30 }}
                        className="bg-white border-4 sm:border-[10px] border-black shadow-comic-xl w-full max-w-xl max-h-[90vh] overflow-y-auto"
                    >
                        <div className="bg-red-600 p-4 sm:p-6 border-b-4 sm:border-b-8 border-black flex justify-between items-center sticky top-0 z-10">
                            <h3 className="font-display text-xl sm:text-4xl uppercase tracking-widest text-white text-outline">SIRADAKİ BÖLÜM</h3>
                            <button onClick={() => setShowNextPageModal(false)} className="text-white hover:rotate-90 transition-all font-bold text-2xl sm:text-3xl p-1">X</button>
                        </div>
                        <div className="p-4 sm:p-8 space-y-4 sm:space-y-5">
                            {/* Character Focus Selection for this Page */}
                            {config.cast && config.cast.length > 1 && (
                                <div className="space-y-2 p-3 bg-yellow-50 border-2 sm:border-3 border-black">
                                    <div className="flex items-center justify-between">
                                        <label className="font-comic font-bold text-black uppercase tracking-wider text-xs flex items-center gap-1.5">
                                            <Users size={14} className="text-red-600" />
                                            Bu Sayfanın Odak Karakteri (Kimin Sahnesi?):
                                        </label>
                                        <span className="text-[10px] font-mono text-slate-600">
                                            {selectedPageCharacterIds.length === 0 ? "Tüm Kadro" : `${selectedPageCharacterIds.length} Kişi Seçili`}
                                        </span>
                                    </div>
                                    <div className="flex flex-wrap gap-1.5">
                                        <button
                                            type="button"
                                            onClick={() => setSelectedPageCharacterIds([])}
                                            className={cn(
                                                "px-2.5 py-1 text-xs font-display uppercase border-2 transition-all flex items-center gap-1",
                                                selectedPageCharacterIds.length === 0
                                                    ? "bg-black text-yellow-300 border-black font-bold shadow-xs"
                                                    : "bg-white text-slate-700 border-slate-300 hover:border-black"
                                            )}
                                        >
                                            👥 Tüm Karakterler
                                        </button>
                                        {config.cast.map(c => {
                                            const isSelected = selectedPageCharacterIds.includes(c.id);
                                            return (
                                                <button
                                                    key={`next-page-char-${c.id}`}
                                                    type="button"
                                                    onClick={() => {
                                                        setSelectedPageCharacterIds(prev => 
                                                            prev.includes(c.id) 
                                                                ? prev.filter(id => id !== c.id) 
                                                                : [...prev, c.id]
                                                        );
                                                    }}
                                                    className={cn(
                                                        "px-2.5 py-1 text-xs font-display uppercase border-2 transition-all flex items-center gap-1.5",
                                                        isSelected
                                                            ? "bg-red-600 text-white border-black font-bold shadow-xs"
                                                            : "bg-white text-slate-800 border-slate-300 hover:border-black"
                                                    )}
                                                >
                                                    {c.avatarUrl ? (
                                                        <img src={c.avatarUrl} alt="" className="w-4 h-4 rounded-full object-cover border border-black" />
                                                    ) : (
                                                        <span>👤</span>
                                                    )}
                                                    <span>{c.name}</span>
                                                    {isSelected && <Check size={12} className="text-yellow-300" />}
                                                </button>
                                            );
                                        })}
                                    </div>
                                    {selectedPageCharacterIds.length > 0 && (
                                        <p className="text-[11px] font-mono text-emerald-800 font-bold">
                                            ✓ Bu sayfadaki sahneler yalnızca seçili ({config.cast.filter(c => selectedPageCharacterIds.includes(c.id)).map(c => c.name).join(", ")}) odaklı çizilecek, diğer karakterler onların yerine çizilmeyecektir.
                                        </p>
                                    )}
                                    <div className="flex items-center gap-1.5 text-[11px] font-mono text-indigo-900 bg-indigo-50 px-2 py-1 border border-indigo-200 mt-1">
                                        <span className="font-bold">🔒 Kıyafet Sadakati:</span>
                                        <span>Aksi hikaye metninde özellikle belirtilmedikçe karakterler kayıtlı standart kıyafetleriyle çizilir.</span>
                                    </div>
                                </div>
                            )}

                            <div>
                                <div className="flex items-center justify-between mb-2 flex-wrap gap-1">
                                    <p className="font-comic font-bold text-slate-500 uppercase tracking-[0.15em] text-xs sm:text-sm">
                                      Olay Örgüsünü Yaz (Yapay Zeka Otomatik Çizer):
                                    </p>
                                    <span className={cn(
                                        "px-2 py-0.5 text-[10px] font-mono font-bold uppercase border border-black shadow-xs",
                                        config.contentRating === "pg18"
                                            ? "bg-red-900 text-yellow-300"
                                            : config.contentRating === "pg17"
                                            ? "bg-red-600 text-white"
                                            : "bg-blue-600 text-white"
                                    )}>
                                        {config.contentRating === "pg18" ? "🔞 PG-18 Yetişkin Tutkulu Mod" : config.contentRating === "pg17" ? "🔥 PG-17 Romantik Tensel Mod" : "🛡️ PG-13 Standart Mod"}
                                    </span>
                                </div>
                                
                                <div className="p-2 mb-2 bg-yellow-50 border border-yellow-300 text-yellow-900 text-[11px] font-comic flex items-center gap-1.5">
                                    <span className="text-base">✨</span>
                                    <span><strong>Otomatik Açı & Örtü:</strong> Açı seçmeniz gerekmez; siz sadece hikayeyi yazın! Yatak odası veya samimi sahnelerde yapay zeka en uygun sinematik açıları ve çıplaklığı estetik örten saten çarşafları otomatik çizer.</span>
                                </div>
                                
                                {/* Quick Inspiration Chips */}
                                <div className="flex flex-wrap gap-1.5 mb-3">
                                    {[
                                        { label: "🔞 Yatak Odası & Tutku (Saten Örtüyle Sansürlü)", prompt: "Loş mum ışığında yatak odasında karakterlerin tutkuyla birbirine sarıldığı, vücutların saten çarşaflarla estetik ve kurallara uygun biçimde örtüldüğü, tensel çekimin zirve yaptığı nefes kesen anlar." },
                                        { label: "🔥 Tutkulu & Tensel Yakınlaşma", prompt: "Aralarındaki romantik tansiyonun doruğa çıktığı, gözlerin kenetlendiği, nefes nefese fısıldaşıp tutkulu bir sarılmayla tensel çekimin hissedildiği büyüleyici anlar." },
                                        { label: "💌 Aşk İtirafı & Yakınlaşma", prompt: "Karakterlerin göz göze gelip uzun süredir saklanan duyguları itiraf ettiği romantik ve duygusal anlar." },
                                        { label: "☕ Sıcak Kafe Buluşması", prompt: "Sıcak bir kafede karşılıklı kahve içip gülüşerek sohbet ettikleri, neşeli ve samimi bir buluşma." },
                                        { label: "🌧️ Yağmurda Şemsiye Paylaşımı", prompt: "Aniden bastıran yağmur altında tek bir şemsiyeyi paylaşırken aralarındaki tatlı elektriklenme." },
                                        { label: "🌅 Gün Batımı Sahil Yürüyüşü", prompt: "Altın sarısı gün batımında sahilde sessizce yürürken ellerinin hafifçe birbirine değmesi." }
                                    ].map((chip, idx) => (
                                        <button
                                            key={`dir-chip-${idx}`}
                                            type="button"
                                            onClick={() => setUserDirection(chip.prompt)}
                                            className={cn(
                                                "px-2.5 py-1 text-[11px] font-mono border border-black shadow-xs transition-all text-left",
                                                chip.label.includes("PG-17")
                                                    ? "bg-red-50 hover:bg-red-200 text-red-900 border-red-800 font-bold"
                                                    : "bg-slate-100 hover:bg-yellow-300 text-black"
                                            )}
                                        >
                                            {chip.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <textarea 
                                className="w-full h-28 sm:h-36 bg-slate-100 border-2 sm:border-4 border-black p-3 sm:p-4 text-black focus:bg-white outline-none resize-none font-comic text-sm sm:text-lg placeholder:opacity-40 shadow-inner"
                                placeholder="Kahramanlarımız şimdi ne yapıyor? (Örn: Kafede otururken ani bir itiraf...)"
                                value={userDirection}
                                onChange={(e) => setUserDirection(e.target.value)}
                                autoFocus
                            />

                            {/* CANLI MEKAN ALGILAMA & HIZLI SEÇİM */}
                            {(() => {
                                const detectedNextPageLocs = userDirection.trim().length >= 3 
                                    ? detectLocationsClientRegex(userDirection, config.locations || [])
                                    : [];
                                const currentLocName = detectedNextPageLocs.length > 0 
                                    ? detectedNextPageLocs[0].name 
                                    : ((config.locations && config.locations[0]?.name) || getThematicDefaultLocation(config.topic, config.tone, config.intro).name);
                                const isFromText = detectedNextPageLocs.length > 0;

                                return (
                                    <div className="p-3 bg-amber-50 border-2 border-black space-y-2 mt-2">
                                        <div className="flex items-center justify-between text-xs font-display">
                                            <span className="flex items-center gap-1.5 text-black font-bold">
                                                <MapPin size={14} className="text-red-600 shrink-0" />
                                                SAYFA MEKANI:
                                            </span>
                                            <span className={cn(
                                                "text-[10px] font-mono px-2 py-0.5 border border-black font-bold",
                                                isFromText ? "bg-emerald-100 text-emerald-800" : "bg-white text-slate-700"
                                            )}>
                                                {isFromText ? "✨ Metinden Algılandı" : "Aktif Hikaye Mekanı"}
                                            </span>
                                        </div>

                                        <div className="text-xs font-comic font-bold text-slate-900 bg-white p-2 border border-black flex items-center justify-between">
                                            <span>🏛️ {currentLocName}</span>
                                            <span className="text-[10px] text-emerald-700 font-mono font-bold">✓ Çizime Dahil Edilecek</span>
                                        </div>

                                        <div className="space-y-1 pt-0.5">
                                            <div className="text-[10px] font-mono text-slate-600">⚡ Mekanı Değiştir:</div>
                                            <div className="flex flex-wrap gap-1">
                                                {POPULAR_LOCATION_CHIPS.map(chip => {
                                                    const isSelected = currentLocName.toLowerCase().includes(chip.name.toLowerCase()) ||
                                                                       chip.name.toLowerCase().includes(currentLocName.toLowerCase());
                                                    return (
                                                        <button
                                                            key={chip.name}
                                                            type="button"
                                                            onClick={() => {
                                                                const newLoc: LocationItem = {
                                                                    id: `loc_${generateId()}`,
                                                                    name: chip.name,
                                                                    type: chip.type,
                                                                    description: chip.description,
                                                                    visualManifest: chip.visualManifest,
                                                                    tags: ["Sonraki Sayfa", "Hikaye Mekanı"],
                                                                    createdAt: Date.now()
                                                                };
                                                                const others = (config.locations || []).filter(l => l.name.toLowerCase() !== chip.name.toLowerCase());
                                                                setConfig(prev => ({ ...prev, locations: [newLoc, ...others] }));
                                                                saveLocationToLibrary(newLoc);
                                                            }}
                                                            className={cn(
                                                                "px-2 py-0.5 text-[10px] font-mono border border-black transition-all flex items-center gap-1",
                                                                isSelected 
                                                                    ? "bg-yellow-400 font-bold text-black shadow-xs" 
                                                                    : "bg-white hover:bg-yellow-200 text-slate-800"
                                                            )}
                                                        >
                                                            <span>{chip.icon}</span>
                                                            <span>{chip.label}</span>
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })()}
                            <div className="flex justify-end gap-4 pt-2">
                                <button 
                                    onClick={confirmNextPageGeneration}
                                    className="w-full sm:w-auto px-8 sm:px-14 py-3 sm:py-4 bg-black text-white font-display text-base sm:text-2xl border-2 sm:border-4 border-black hover:bg-yellow-400 hover:text-black transition-all shadow-comic active:scale-95"
                                >
                                    HİKAYEYİ ÇİZ!
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>

        {/* Global Image Portal */}
        <AnimatePresence>
            {previewImage && (
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[200] flex items-center justify-center bg-black/95 p-2 sm:p-8 backdrop-blur-xl" 
                    onClick={() => setPreviewImage(null)}
                >
                    <motion.div 
                        initial={{ scale: 0.9 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0.9 }}
                        className="relative max-w-5xl w-full max-h-[92vh] flex flex-col items-center justify-center"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="bg-white p-2 border-4 sm:border-8 border-black shadow-2xl relative max-w-full">
                            <div className="flex justify-between items-center bg-yellow-400 p-2 border-b-2 sm:border-b-4 border-black mb-2">
                                <span className="font-display text-xs sm:text-base text-black uppercase tracking-wider">Detaylı Görünüm</span>
                                <div className="flex items-center gap-2">
                                    <a 
                                      href={previewImage} 
                                      download="cizim-detay.png" 
                                      target="_blank" 
                                      rel="noreferrer"
                                      className="bg-black text-white p-1 px-2.5 font-display text-xs flex items-center gap-1 border border-black hover:bg-slate-800"
                                    >
                                      <Download size={12} /> İndir
                                    </a>
                                    <button onClick={() => setPreviewImage(null)} className="bg-red-600 text-white p-1 px-2 border border-black hover:bg-red-700 font-bold text-xs">
                                      X
                                    </button>
                                </div>
                            </div>
                            <img src={previewImage} alt="Visual Detail" className="max-w-full max-h-[70vh] sm:max-h-[75vh] object-contain mx-auto" />
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>

        {/* Reset Confirmation Modal */}
        <AnimatePresence>
            {showResetModal && (
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[210] flex items-center justify-center bg-black/90 backdrop-blur-md p-3 sm:p-6"
                    onClick={() => setShowResetModal(false)}
                >
                    <motion.div 
                        initial={{ scale: 0.9, y: 20 }}
                        animate={{ scale: 1, y: 0 }}
                        exit={{ scale: 0.9, y: 20 }}
                        className="bg-white border-4 sm:border-[8px] border-black shadow-comic-xl w-full max-w-md overflow-hidden text-black"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="bg-red-600 p-4 border-b-4 border-black flex justify-between items-center text-white">
                            <h3 className="font-display text-lg sm:text-xl uppercase tracking-wider flex items-center gap-2">
                              <AlertTriangle size={22} className="text-yellow-400 fill-yellow-400 text-black" />
                              YENİ HİKAYE BAŞLAT
                            </h3>
                            <button onClick={() => setShowResetModal(false)} className="hover:rotate-90 transition-transform font-bold text-2xl p-1 text-white">X</button>
                        </div>
                        <div className="p-5 sm:p-6 space-y-4 font-comic">
                            <p className="text-base text-slate-800 leading-relaxed font-bold">
                              Mevcut çizgi romanınız, oluşturulan tüm sayfalar ve karakterler sıfırlanacaktır.
                            </p>
                            <p className="text-xs text-slate-500 italic">
                              İpucu: Sayfalarınızı kaybetmek istemiyorsanız önce "Sayfayı İndir (PNG)" butonunu kullanarak bilgisayarınıza kaydedebilirsiniz.
                            </p>
                            <div className="flex justify-end gap-3 pt-4">
                                <button 
                                    onClick={() => setShowResetModal(false)}
                                    className="px-4 py-2.5 bg-slate-200 text-black font-display text-xs sm:text-sm uppercase border-2 border-black hover:bg-slate-300 transition-all shadow-comic active:scale-95"
                                >
                                    Vazgeç
                                </button>
                                <button 
                                    onClick={handleConfirmReset}
                                    className="px-5 py-2.5 bg-red-600 text-white font-display text-xs sm:text-sm uppercase border-2 border-black hover:bg-red-700 transition-all shadow-comic active:scale-95 flex items-center gap-1.5"
                                >
                                    <RotateCcw size={14} /> Evet, Sıfırla
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>

        {/* Delete Single Page Confirmation Modal */}
        <AnimatePresence>
            {pageToDelete && (
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[190] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
                    onClick={() => setPageToDelete(null)}
                >
                    <motion.div 
                        initial={{ scale: 0.9, y: 20 }}
                        animate={{ scale: 1, y: 0 }}
                        exit={{ scale: 0.9, y: 20 }}
                        className="bg-white border-4 sm:border-[8px] border-black shadow-comic-xl w-full max-w-md overflow-hidden text-black"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="bg-red-600 p-4 border-b-4 border-black flex justify-between items-center text-white">
                            <h3 className="font-display text-lg sm:text-xl uppercase tracking-wider flex items-center gap-2">
                              <Trash2 size={22} className="text-yellow-300" />
                              SAYFAYI SİL ({pageToDelete.pageNumber}. SAYFA)
                            </h3>
                            <button onClick={() => setPageToDelete(null)} className="hover:rotate-90 transition-transform font-bold text-2xl p-1 text-white">X</button>
                        </div>
                        <div className="p-5 sm:p-6 space-y-4 font-comic">
                            <p className="text-base text-slate-800 leading-relaxed font-bold">
                              {pageToDelete.pageNumber}. sayfayı çizgi romanınızdan silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
                            </p>
                            <p className="text-xs text-slate-500 italic">
                              İpucu: Sayfayı arşivlemek isterseniz silmeden önce "Sayfayı İndir (PNG)" seçeneğini kullanabilirsiniz.
                            </p>
                            <div className="flex justify-end gap-3 pt-4">
                                <button 
                                    onClick={() => setPageToDelete(null)}
                                    className="px-4 py-2.5 bg-slate-200 text-black font-display text-xs sm:text-sm uppercase border-2 border-black hover:bg-slate-300 transition-all shadow-comic active:scale-95"
                                >
                                    Vazgeç
                                </button>
                                <button 
                                    onClick={handleConfirmDeletePage}
                                    className="px-5 py-2.5 bg-red-600 text-white font-display text-xs sm:text-sm uppercase border-2 border-black hover:bg-red-700 transition-all shadow-comic active:scale-95 flex items-center gap-1.5"
                                >
                                    <Trash2 size={16} /> Evet, Sayfayı Sil
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>

        {/* Restored Project Notification Toast */}
        <AnimatePresence>
            {showRestoredNotice && (
                <motion.div 
                    initial={{ opacity: 0, y: 50, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 50, scale: 0.95 }}
                    className="fixed bottom-6 left-4 sm:left-auto sm:right-6 z-[180] bg-yellow-400 text-black border-4 border-black p-3 sm:p-4 shadow-comic flex items-center gap-3 max-w-sm pointer-events-auto"
                >
                    <div className="w-8 h-8 rounded-full bg-black text-yellow-400 flex items-center justify-center flex-shrink-0 font-bold">
                      <Check size={18} />
                    </div>
                    <div className="flex-1 text-xs sm:text-sm font-comic">
                      <span className="font-display block text-sm uppercase tracking-wide">Kaldığın Yerden Devam!</span>
                      Önceki çizgi romanınız ve sayfalarınız otomatik yüklendi.
                    </div>
                    <button onClick={() => setShowRestoredNotice(false)} className="text-black font-bold p-1 hover:scale-110 active:scale-95">
                      <X size={16} />
                    </button>
                </motion.div>
            )}
        </AnimatePresence>

        {/* API Quota & Error Modal */}
        <AnimatePresence>
            {apiError.isOpen && (
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[220] flex items-center justify-center bg-black/90 backdrop-blur-md p-3 sm:p-6"
                    onClick={() => setApiError(prev => ({ ...prev, isOpen: false }))}
                >
                    <motion.div 
                        initial={{ scale: 0.9, y: 20 }}
                        animate={{ scale: 1, y: 0 }}
                        exit={{ scale: 0.9, y: 20 }}
                        className="bg-white border-4 sm:border-[8px] border-black shadow-comic-xl w-full max-w-lg overflow-hidden text-black"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className={cn(
                            "p-4 border-b-4 border-black flex justify-between items-center text-white",
                            apiError.isQuota ? "bg-amber-600" : "bg-red-600"
                        )}>
                            <h3 className="font-display text-base sm:text-lg uppercase tracking-wider flex items-center gap-2">
                              <AlertTriangle size={22} className="text-yellow-300 fill-yellow-300 text-black" />
                              {apiError.title || "İşlem Bildirimi"}
                            </h3>
                            <button 
                              onClick={() => setApiError(prev => ({ ...prev, isOpen: false }))} 
                              className="hover:rotate-90 transition-transform font-bold text-2xl p-1 text-white"
                            >
                              ✕
                            </button>
                        </div>
                        
                        <div className="p-5 sm:p-6 space-y-4 font-comic max-h-[75vh] overflow-y-auto custom-scrollbar">
                            <p className="text-sm sm:text-base text-slate-800 leading-relaxed font-bold">
                              {apiError.message}
                            </p>

                            {countdown !== null && (
                                <div className={cn(
                                    "p-3.5 border-2 sm:border-3 flex items-center justify-between gap-3 text-xs font-bold transition-colors",
                                    countdown > 0 
                                      ? "bg-amber-100 border-amber-600 text-amber-950" 
                                      : "bg-emerald-100 border-emerald-600 text-emerald-950"
                                )}>
                                    <div className="flex items-center gap-2.5">
                                        <Clock size={18} className={countdown > 0 ? "animate-spin text-amber-700" : "text-emerald-700"} />
                                        <div>
                                            {countdown > 0 ? (
                                                <>
                                                    <span className="font-display tracking-wide uppercase text-amber-900 block text-xs">Kota Yenileniyor</span>
                                                    <span>Lütfen bekleyin: <strong>{countdown} saniye</strong> kaldı</span>
                                                </>
                                            ) : (
                                                <>
                                                    <span className="font-display tracking-wide uppercase text-emerald-900 block text-xs">Kota Yenilendi!</span>
                                                    <span>Bekleme süresi doldu, şimdi tekrar deneyebilirsiniz.</span>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                    {apiError.onRetry && countdown === 0 && (
                                        <button
                                            onClick={() => {
                                                const retryFn = apiError.onRetry;
                                                setApiError(prev => ({ ...prev, isOpen: false }));
                                                retryFn?.();
                                            }}
                                            className="px-3.5 py-1.5 bg-emerald-600 text-white font-display text-[11px] uppercase border-2 border-black hover:bg-emerald-700 transition-all shadow-comic active:scale-95 whitespace-nowrap"
                                        >
                                            Şimdi Dene
                                        </button>
                                    )}
                                </div>
                            )}

                            {apiError.isQuota && (
                                <div className="bg-amber-50 border-2 border-amber-400 p-3 sm:p-4 space-y-2 text-xs text-amber-950">
                                    <div className="flex items-start gap-2">
                                        <span className="font-bold">⚡ Dakikalık Sınır (RPM):</span>
                                        <span>Ücretsiz planda dakikada yapılan istek sayısı dolmuş olabilir. Süre bitiminde panelinizi yeniden oluşturabilirsiniz.</span>
                                    </div>
                                    <div className="flex items-start gap-2">
                                        <span className="font-bold">⭐ AI Pro vs API:</span>
                                        <span>Google AI Pro aboneliğiniz web Gemini'da sınırsız kullanım sağlarken, API kotaları Google AI Studio konsoluna bağlıdır.</span>
                                    </div>
                                </div>
                            )}

                            {apiError.promptToCopy && (
                                <div className="space-y-1.5 pt-1">
                                    <span className="text-xs font-bold text-slate-600 uppercase tracking-wider block">
                                      Bu Panelin Çizim Promptu:
                                    </span>
                                    <div className="bg-slate-100 p-3 border-2 border-slate-300 text-xs font-mono text-slate-700 max-h-28 overflow-y-auto break-words select-all">
                                      {apiError.promptToCopy}
                                    </div>
                                    <button
                                      onClick={() => handleCopyPrompt(apiError.promptToCopy!)}
                                      className="w-full py-2 bg-slate-900 text-yellow-400 font-display text-xs uppercase border-2 border-black hover:bg-slate-800 transition-all flex items-center justify-center gap-1.5 shadow-comic active:scale-95"
                                    >
                                      {hasCopiedPrompt ? (
                                        <>
                                          <Check size={14} className="text-green-400" /> Kopyalandı! (Web Gemini'a yapıştırabilirsiniz)
                                        </>
                                      ) : (
                                        <>
                                          <Copy size={14} /> Promptu Panoya Kopyala
                                        </>
                                      )}
                                    </button>
                                </div>
                            )}

                            <div className="flex flex-wrap justify-end gap-2 pt-3">
                                <button 
                                    onClick={() => {
                                        setApiError(prev => ({ ...prev, isOpen: false }));
                                        setIsApiKeyModalOpen(true);
                                    }}
                                    className="px-3.5 py-2.5 bg-purple-600 text-white font-display text-xs sm:text-sm uppercase border-2 border-black hover:bg-purple-500 transition-all shadow-comic active:scale-95 flex items-center gap-1.5"
                                >
                                    <KeyRound size={14} />
                                    Kendi API Anahtarını Gir
                                </button>
                                {apiError.onRetry && (
                                    <button 
                                        onClick={() => {
                                            const retryFn = apiError.onRetry;
                                            setApiError(prev => ({ ...prev, isOpen: false }));
                                            retryFn?.();
                                        }}
                                        className="px-4 py-2.5 bg-yellow-400 text-black font-display text-xs sm:text-sm uppercase border-2 border-black hover:bg-yellow-300 transition-all shadow-comic active:scale-95 flex items-center gap-1.5"
                                    >
                                        <RotateCcw size={14} />
                                        {countdown && countdown > 0 ? `Yine de Dene (${countdown}s)` : "Yeniden Dene"}
                                    </button>
                                )}
                                <button 
                                    onClick={() => setApiError(prev => ({ ...prev, isOpen: false }))}
                                    className="px-5 py-2.5 bg-slate-900 text-white font-display text-xs sm:text-sm uppercase border-2 border-black hover:bg-slate-800 transition-all shadow-comic active:scale-95"
                                >
                                    Kapat
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>

        {/* Narrative Continuity & Scene Cohesion (Olay Hafızası) Modal */}
        <NarrativeMemoryModal
          isOpen={isMemoryModalOpen}
          onClose={() => setIsMemoryModalOpen(false)}
          memory={config.storyMemory}
          cast={config.cast}
          currentPageCount={pages.length}
          onSave={(updatedMemory) => setConfig(prev => ({ ...prev, storyMemory: updatedMemory }))}
          onAnalyzeContinuity={handleAnalyzeContinuity}
          isAnalyzing={isAnalyzingContinuity}
        />

        {/* D3 Narrative Flow Graph Modal (Olay Çizelgesi Görselleştirici) */}
        <NarrativeFlowModal
          isOpen={isFlowModalOpen}
          onClose={() => setIsFlowModalOpen(false)}
          pages={pages}
          config={config}
          onOpenMemoryModal={() => setIsMemoryModalOpen(true)}
        />

        {/* Full PDF Export Modal */}
        <FullPdfExportModal
          isOpen={isPdfModalOpen}
          onClose={() => setIsPdfModalOpen(false)}
          pages={pages}
          config={config}
        />

        {/* Kayıtlı Hikayeler Kütüphanesi Modalı */}
        <SavedStoriesModal
          isOpen={isStoriesModalOpen}
          onClose={() => setIsStoriesModalOpen(false)}
          currentStoryId={currentStoryId}
          currentConfig={config}
          currentPages={pages}
          onLoadStory={handleLoadStory}
          onNewStory={handleStartNewStory}
        />

        {/* PWA / APK Kurulum ve İndirme Rehberi Modalı */}
        <AnimatePresence>
          {showPwaModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[220] bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4"
              onClick={() => setShowPwaModal(false)}
            >
              <motion.div
                initial={{ scale: 0.95, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.95, y: 20 }}
                className="bg-white border-4 border-black shadow-comic-xl max-w-lg w-full p-4 sm:p-6 relative max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex justify-between items-center pb-3 border-b-2 border-black mb-4">
                  <div className="flex items-center gap-2">
                    <Download className="text-black" size={24} />
                    <h3 className="font-display text-xl sm:text-2xl uppercase tracking-wider text-black">
                      APK & Uygulama Yükleme
                    </h3>
                  </div>
                  <button
                    onClick={() => setShowPwaModal(false)}
                    className="p-1 hover:bg-slate-100 border-2 border-black transition-colors"
                  >
                    <X size={18} />
                  </button>
                </div>

                <div className="space-y-4 text-slate-800 text-xs sm:text-sm">
                  {/* Yöntem 1: Doğrudan Telefona Yükle */}
                  <div className="p-3.5 bg-yellow-50 border-2 border-black shadow-comic">
                    <div className="flex items-center gap-2 mb-2 font-display text-base uppercase text-black font-bold">
                      <span className="w-6 h-6 rounded-full bg-yellow-400 border border-black flex items-center justify-center text-xs">1</span>
                      <span>En Kolay Yol: Telefona Doğrudan Kur (WebAPK)</span>
                    </div>
                    <p className="text-slate-700 leading-relaxed mb-3">
                      Android cihazınızda <strong>Google Chrome</strong> ile bu sayfayı açın. Sağ üstteki <strong>üç nokta (⋮)</strong> menüsünden <strong>"Uygulamayı Yükle"</strong> butonuna basın. Android otomatik olarak cihazınıza tam ekran çalışan yerel bir APK paketi kurar.
                    </p>
                    {isInstallable && (
                      <button
                        onClick={handleInstallClick}
                        className="w-full py-2.5 px-4 bg-emerald-500 hover:bg-emerald-400 text-black font-display uppercase font-bold text-xs border-2 border-black shadow-comic active:scale-95 transition-all flex items-center justify-center gap-2"
                      >
                        <Download size={16} /> Şimdi Bu Cihaza Yükle
                      </button>
                    )}
                  </div>

                  {/* Yöntem 2: PWABuilder ile İmzalı .APK İndir */}
                  <div className="p-3.5 bg-emerald-50 border-2 border-black shadow-comic">
                    <div className="flex items-center gap-2 mb-2 font-display text-base uppercase text-emerald-950 font-bold">
                      <span className="w-6 h-6 rounded-full bg-emerald-400 border border-black flex items-center justify-center text-xs">2</span>
                      <span>PWABuilder ile Doğrudan .APK Dosyası Al</span>
                    </div>
                    <p className="text-slate-700 leading-relaxed mb-2">
                      Gerekli tüm <strong>Web App Manifest (manifest.json)</strong>, <strong>512x512 maskable ikonlar</strong> ve <strong>Service Worker</strong> sistemi yüklendi.
                    </p>
                    <p className="text-slate-700 leading-relaxed mb-3">
                      PWABuilder sayfasında <strong>F5</strong> tuşuna basarak sayfayı yenileyin veya tekrar analiz ettirin. <strong>"Package For Stores"</strong> butonu aktif hale gelecektir!
                    </p>
                    <a
                      href="https://www.pwabuilder.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-2.5 px-4 bg-yellow-400 hover:bg-yellow-300 text-black font-display uppercase font-bold text-xs border-2 border-black shadow-comic active:scale-95 transition-all flex items-center justify-center gap-2 text-center"
                    >
                      PWABuilder Sayfasını Aç <ChevronRight size={16} />
                    </a>
                  </div>
                </div>

                <div className="mt-5 flex justify-end">
                  <button
                    onClick={() => setShowPwaModal(false)}
                    className="px-5 py-2 bg-black text-white font-display uppercase font-bold text-xs border-2 border-black shadow-comic active:scale-95 transition-all"
                  >
                    Anladım, Kapat
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* API Key Management Modal (fal.ai + Together AI + Google Gemini) */}
        <ApiKeyModal
          isOpen={isApiKeyModalOpen}
          initialTab={apiKeyModalTab}
          onClose={() => {
            setIsApiKeyModalOpen(false);
            setHasUserApiKey(!!getUserApiKey());
            setHasTogetherKey(!!getTogetherApiKey());
            setHasFalKey(!!getFalApiKey());
            setHasPollinationsKey(!!getPollinationsApiKey());
          }}
          onKeyChange={(hasKey) => {
            setHasUserApiKey(!!getUserApiKey());
            setHasTogetherKey(!!getTogetherApiKey());
            setHasFalKey(!!getFalApiKey());
            setHasPollinationsKey(!!getPollinationsApiKey());
            showStoryToast(hasKey ? "API Anahtarı başarıyla güncellendi!" : "Özel API anahtarı kaldırıldı.");
          }}
          onModelChange={(modelId) => {
            setConfig(prev => ({ ...prev, pollinationsModel: modelId }));
            showStoryToast(`Pollinations Görsel Modu güncellendi: ${modelId}`);
          }}
          onSelectFreeFlux={() => {
            setConfig(prev => ({ 
              ...prev, 
              imageProvider: "pollinations_flux", 
              usePaidApi: false, 
              renderQuality: prev.renderQuality === "Paid_Pro" ? "High" : prev.renderQuality 
            }));
            showStoryToast("Motor: %100 Ücretsiz FLUX (Kart / Ücret Yok) seçildi!");
          }}
        />

        {/* Story Toast Message */}
        <AnimatePresence>
          {storyToastMessage && (
            <motion.div
              initial={{ opacity: 0, y: 40, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[250] bg-yellow-400 text-black font-display text-xs sm:text-sm font-bold uppercase px-5 py-3 border-4 border-black shadow-comic flex items-center gap-2 max-w-[90vw] text-center"
            >
              <Sparkles size={18} className="flex-shrink-0 fill-black" />
              <span>{storyToastMessage}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
