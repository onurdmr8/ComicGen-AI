import { ComicPage, ComicConfig, NarrativeFlowNode, NarrativeFlowLink, NarrativeCharacterTimeline, NarrativeNodeSeverity } from "../types";

const CHARACTER_COLORS = [
  "#FBBF24", // Amber / Gold
  "#38BDF8", // Sky / Electric Cyan
  "#34D399", // Emerald Green
  "#F472B6", // Bright Pink
  "#A78BFA", // Purple / Violet
  "#FB7185", // Rose / Coral
  "#2DD4BF", // Teal
  "#F97316", // Bright Orange
  "#818CF8", // Indigo
  "#E879F9", // Fuchsia
];

export interface ExtractedNarrativeFlow {
  characterTimelines: NarrativeCharacterTimeline[];
  allNodes: NarrativeFlowNode[];
  allLinks: NarrativeFlowLink[];
  locationsList: string[];
  pageSummaries: {
    pageNumber: number;
    location: string;
    eventsCount: number;
    characterNames: string[];
    injuries: string[];
    itemsChanged: string[];
  }[];
  stats: {
    totalPages: number;
    totalPanels: number;
    activeCharacters: number;
    totalInjuries: number;
    totalItemsTracked: number;
    locationTransitions: number;
  };
}

export function extractNarrativeFlow(pages: ComicPage[], config: ComicConfig): ExtractedNarrativeFlow {
  const cast = config.cast || [];
  const memories = (config.storyMemory?.memories || []).filter(m => m.isActive !== false);

  // Determine active character list
  const characterNamesSet = new Set<string>();
  cast.forEach(c => characterNamesSet.add(c.name));
  pages.forEach(p => {
    p.panels?.forEach(pan => {
      pan.characterNames?.forEach(cn => characterNamesSet.add(cn));
    });
  });

  // If still empty, add default protagonist
  if (characterNamesSet.size === 0) {
    characterNamesSet.add("Kahraman");
  }

  const characterList = Array.from(characterNamesSet);
  const colorMap = new Map<string, string>();
  characterList.forEach((charName, index) => {
    colorMap.set(charName, CHARACTER_COLORS[index % CHARACTER_COLORS.length]);
  });

  // Cumulative state tracking per character
  const charPhysicalState = new Map<string, { desc: string; severity: NarrativeNodeSeverity }>();
  const charInventory = new Map<string, Set<string>>();
  const charLastLocation = new Map<string, string>();

  // Initialize
  characterList.forEach(charName => {
    const castMember = cast.find(c => c.name.toLowerCase() === charName.toLowerCase());
    charPhysicalState.set(charName, { desc: "Zinde & Hazır", severity: "normal" });
    
    // Initial inventory from character description if available
    const initialItems = new Set<string>();
    if (castMember?.styleSheet?.accessories) {
      extractItemKeywords(castMember.styleSheet.accessories).forEach(it => initialItems.add(it));
    }
    if (castMember?.description) {
      extractItemKeywords(castMember.description).forEach(it => initialItems.add(it));
    }
    charInventory.set(charName, initialItems);
    charLastLocation.set(charName, config.locations?.[0]?.name || "Başlangıç Noktası");
  });

  const allNodes: NarrativeFlowNode[] = [];
  const allLinks: NarrativeFlowLink[] = [];
  const characterNodesMap = new Map<string, NarrativeFlowNode[]>();
  characterList.forEach(c => characterNodesMap.set(c, []));

  const uniqueLocations = new Set<string>();
  if (config.locations) {
    config.locations.forEach(l => uniqueLocations.add(l.name));
  }

  let totalInjuries = 0;
  let totalItemsTracked = 0;
  let locationTransitions = 0;

  // Process pages and panels chronologically
  pages.forEach((page, pIdx) => {
    const pageNum = pIdx + 1;
    const panels = page.panels || [];

    panels.forEach((panel, panIdx) => {
      const panelNum = panIdx + 1;
      const charactersInPanel = panel.characterNames && panel.characterNames.length > 0
        ? panel.characterNames
        : characterList.slice(0, 1);

      // Determine panel location
      let panelLocation = panel.locationName || panel.directorConfig?.locationName;
      if (!panelLocation) {
        // Find in prompt or dialogue
        const matchedLoc = (config.locations || []).find(l => 
          panel.imagePrompt?.toLowerCase().includes(l.name.toLowerCase())
        );
        panelLocation = matchedLoc?.name || config.locations?.[0]?.name || "Sahne Bölgesi";
      }
      uniqueLocations.add(panelLocation);

      // Check memories specifically mapped to this page
      const pageMemories = memories.filter(m => m.createdInPage === pageNum);

      charactersInPanel.forEach(charName => {
        const castMember = cast.find(c => c.name.toLowerCase() === charName.toLowerCase());
        const currentItems = new Set(charInventory.get(charName) || []);
        let currentState = charPhysicalState.get(charName) || { desc: "Zinde", severity: "normal" };
        const lastLoc = charLastLocation.get(charName) || panelLocation;
        const locChanged = lastLoc.toLowerCase() !== panelLocation.toLowerCase();
        if (locChanged) locationTransitions++;

        const itemsGained: string[] = [];
        const itemsLost: string[] = [];
        let memoryAlert = false;
        let memoryCategory: any = undefined;
        let memoryDesc = "";

        // 1. Process explicit memories for this page
        pageMemories.forEach(mem => {
          if (!mem.characterName || mem.characterName.toLowerCase() === charName.toLowerCase()) {
            memoryAlert = true;
            memoryCategory = mem.category;
            memoryDesc = mem.description;

            if (mem.category === "injury") {
              currentState = {
                desc: mem.visualImpact || mem.description,
                severity: "danger"
              };
              totalInjuries++;
            } else if (mem.category === "item_gained") {
              const gained = extractItemKeywords(mem.description);
              gained.forEach(g => {
                itemsGained.push(g);
                currentItems.add(g);
              });
              if (gained.length === 0) {
                itemsGained.push(mem.description.slice(0, 24));
                currentItems.add(mem.description.slice(0, 24));
              }
              totalItemsTracked++;
            } else if (mem.category === "item_lost") {
              const lost = extractItemKeywords(mem.description);
              lost.forEach(l => {
                itemsLost.push(l);
                currentItems.delete(l);
              });
              if (lost.length === 0) {
                itemsLost.push(mem.description.slice(0, 24));
              }
            } else if (mem.category === "relationship_shift" || mem.category === "environment_damage") {
              if (currentState.severity === "normal") {
                currentState = { desc: mem.description.slice(0, 32), severity: "warning" };
              }
            }
          }
        });

        // 2. Keyword heuristic analysis from panel prompt and dialogue
        const textToAnalyze = `${panel.imagePrompt || ""} ${panel.dialogue || ""}`.toLowerCase();
        
        // Physical state keywords
        if (!memoryAlert) {
          if (textToAnalyze.includes("yaralan") || textToAnalyze.includes("kan") || textToAnalyze.includes("wound") || textToAnalyze.includes("sargı") || textToAnalyze.includes("hasar")) {
            currentState = { desc: "Hafif Yaralı / Darbe Aldı", severity: "warning" };
            totalInjuries++;
          } else if (textToAnalyze.includes("bitkin") || textToAnalyze.includes("yoruldu") || textToAnalyze.includes("tükenmiş") || textToAnalyze.includes("exhaust")) {
            currentState = { desc: "Bitkin / Yorgun", severity: "warning" };
          } else if (textToAnalyze.includes("güçlendi") || textToAnalyze.includes("öfkeli") || textToAnalyze.includes("hazır") || textToAnalyze.includes("savunma")) {
            currentState = { desc: "Savaş Duruşu / Odaklanmış", severity: "normal" };
          }
        }

        // Item keywords from panel
        const promptItems = extractItemKeywords(textToAnalyze);
        promptItems.forEach(item => {
          if (!currentItems.has(item) && !itemsLost.includes(item)) {
            itemsGained.push(item);
            currentItems.add(item);
            totalItemsTracked++;
          }
        });

        // Update stored states
        charPhysicalState.set(charName, currentState);
        charInventory.set(charName, currentItems);
        charLastLocation.set(charName, panelLocation);

        const nodeId = `node-p${pageNum}-pan${panelNum}-${charName.replace(/\s+/g, "_")}`;
        
        // Create Node
        const node: NarrativeFlowNode = {
          id: nodeId,
          pageNumber: pageNum,
          panelNumber: panelNum,
          characterName: charName,
          characterAvatar: castMember?.avatarUrl,
          physicalCondition: currentState.desc,
          conditionSeverity: currentState.severity,
          heldItems: Array.from(currentItems),
          itemsGained: itemsGained,
          itemsLost: itemsLost,
          locationName: panelLocation,
          locationChanged: locChanged,
          dialogueSnippet: panel.dialogue ? (panel.dialogue.length > 55 ? panel.dialogue.slice(0, 52) + "..." : panel.dialogue) : "Sessiz Sahne",
          actionSummary: panel.imagePrompt ? panel.imagePrompt.slice(0, 90) + "..." : "Karakter panelde eylemde.",
          visualImpact: memoryDesc || (currentState.severity !== "normal" ? currentState.desc : undefined),
          panelImageUrl: panel.imageUrl,
          hasMemoryAlert: memoryAlert,
          memoryCategory: memoryCategory,
          memoryDescription: memoryDesc
        };

        allNodes.push(node);
        const charNodes = characterNodesMap.get(charName) || [];
        
        // Link with previous node of same character
        if (charNodes.length > 0) {
          const prevNode = charNodes[charNodes.length - 1];
          allLinks.push({
            id: `link-${prevNode.id}-${node.id}`,
            sourceId: prevNode.id,
            targetId: node.id,
            characterName: charName,
            hasInjuryTransition: node.conditionSeverity === "danger" && prevNode.conditionSeverity !== "danger",
            hasItemTransition: node.itemsGained.length > 0 || node.itemsLost.length > 0,
            hasLocationTransition: node.locationChanged
          });
        }

        charNodes.push(node);
        characterNodesMap.set(charName, charNodes);
      });
    });
  });

  // Prepare Character Timelines
  const characterTimelines: NarrativeCharacterTimeline[] = characterList.map(name => {
    const castMember = cast.find(c => c.name.toLowerCase() === name.toLowerCase());
    const nodes = characterNodesMap.get(name) || [];
    const lastNode = nodes[nodes.length - 1];

    return {
      characterName: name,
      characterAvatar: castMember?.avatarUrl,
      color: colorMap.get(name) || "#FBBF24",
      nodes,
      currentPhysicalState: lastNode?.physicalCondition || "Zinde & Hazır",
      currentInventory: lastNode?.heldItems || Array.from(charInventory.get(name) || []),
      currentLocation: lastNode?.locationName || config.locations?.[0]?.name || "Bilinmiyor"
    };
  });

  // Prepare Page Summaries
  const pageSummaries = pages.map((p, idx) => {
    const pageNum = idx + 1;
    const pageNodes = allNodes.filter(n => n.pageNumber === pageNum);
    const chars = Array.from(new Set(pageNodes.map(n => n.characterName)));
    const injuries = pageNodes.filter(n => n.conditionSeverity === "danger").map(n => `${n.characterName}: ${n.physicalCondition}`);
    const itemsChanged = pageNodes.flatMap(n => [
      ...n.itemsGained.map(i => `+${i} (${n.characterName})`),
      ...n.itemsLost.map(i => `-${i} (${n.characterName})`)
    ]);

    return {
      pageNumber: pageNum,
      location: pageNodes[0]?.locationName || "Sahne Bölgesi",
      eventsCount: pageNodes.length,
      characterNames: chars,
      injuries: Array.from(new Set(injuries)),
      itemsChanged: Array.from(new Set(itemsChanged))
    };
  });

  return {
    characterTimelines,
    allNodes,
    allLinks,
    locationsList: Array.from(uniqueLocations),
    pageSummaries,
    stats: {
      totalPages: pages.length,
      totalPanels: pages.reduce((acc, p) => acc + (p.panels?.length || 0), 0),
      activeCharacters: characterList.length,
      totalInjuries,
      totalItemsTracked,
      locationTransitions
    }
  };
}

function extractItemKeywords(text: string): string[] {
  if (!text) return [];
  const lower = text.toLowerCase();
  const knownKeywords = [
    "kılıç", "hançer", "kristal", "tılsım", "tabanca", "asa", "kalkan", "mızrak",
    "harita", "anahtar", "iksir", "kolye", "yüzük", "pusula", "kitap", "parşömen",
    "fener", "cihaz", "kask", "zırh", "eldiven", "pelerin", "kemer", "madalyon",
    "sword", "dagger", "crystal", "amulet", "gun", "staff", "shield", "relic", "orb"
  ];

  const found = new Set<string>();
  knownKeywords.forEach(kw => {
    if (lower.includes(kw)) {
      // Capitalize first letter
      found.add(kw.charAt(0).toUpperCase() + kw.slice(1));
    }
  });

  return Array.from(found);
}
