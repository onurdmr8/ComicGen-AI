import React, { useRef, useEffect, useState, useMemo } from "react";
import * as d3 from "d3";
import { 
  Flame, Sword, Trash2, MapPin, HeartHandshake, ShieldAlert,
  ZoomIn, ZoomOut, Maximize2, RotateCcw, Filter, Eye, Sparkles, User, Package, Heart
} from "lucide-react";
import { NarrativeFlowNode, NarrativeFlowLink, NarrativeCharacterTimeline } from "../types";
import { ExtractedNarrativeFlow } from "../lib/narrativeFlowExtractor";
import { cn } from "../lib/utils";

interface NarrativeFlowGraphProps {
  flowData: ExtractedNarrativeFlow;
  selectedNode: NarrativeFlowNode | null;
  onSelectNode: (node: NarrativeFlowNode) => void;
  selectedCharacterFilter: string | null;
  onSelectCharacterFilter: (charName: string | null) => void;
  selectedCategoryFilter: "all" | "injury" | "items" | "locations";
  onSelectCategoryFilter: (cat: "all" | "injury" | "items" | "locations") => void;
}

export const NarrativeFlowGraph: React.FC<NarrativeFlowGraphProps> = ({
  flowData,
  selectedNode,
  onSelectNode,
  selectedCharacterFilter,
  onSelectCharacterFilter,
  selectedCategoryFilter,
  onSelectCategoryFilter
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [dimensions, setDimensions] = useState<{ width: number; height: number }>({ width: 900, height: 500 });
  const [hoveredNode, setHoveredNode] = useState<{ node: NarrativeFlowNode; x: number; y: number } | null>(null);

  // Measure container dimensions with ResizeObserver
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      if (!entries || entries.length === 0) return;
      const { width, height } = entries[0].contentRect;
      if (width > 0 && height > 0) {
        setDimensions({ width, height: Math.max(height, 460) });
      }
    });

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Filtered data
  const filteredTimelines = useMemo(() => {
    if (!selectedCharacterFilter) return flowData.characterTimelines;
    return flowData.characterTimelines.filter(t => t.characterName === selectedCharacterFilter);
  }, [flowData.characterTimelines, selectedCharacterFilter]);

  const filteredNodes = useMemo(() => {
    let nodes = flowData.allNodes;
    if (selectedCharacterFilter) {
      nodes = nodes.filter(n => n.characterName === selectedCharacterFilter);
    }
    if (selectedCategoryFilter === "injury") {
      nodes = nodes.filter(n => n.conditionSeverity === "danger" || n.conditionSeverity === "warning");
    } else if (selectedCategoryFilter === "items") {
      nodes = nodes.filter(n => n.itemsGained.length > 0 || n.itemsLost.length > 0 || n.heldItems.length > 0);
    } else if (selectedCategoryFilter === "locations") {
      nodes = nodes.filter(n => n.locationChanged);
    }
    return nodes;
  }, [flowData.allNodes, selectedCharacterFilter, selectedCategoryFilter]);

  // Zoom reference
  const zoomBehaviorRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);

  // Render D3 Graph
  useEffect(() => {
    if (!svgRef.current || dimensions.width <= 0 || dimensions.height <= 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove(); // Clear previous rendering

    const { width, height } = dimensions;
    const margin = { top: 70, right: 60, bottom: 40, left: 160 };

    // Group for zoom & pan
    const mainGroup = svg.append("g").attr("class", "main-graph-group");

    // Setup zoom
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.4, 3])
      .on("zoom", (event) => {
        mainGroup.attr("transform", event.transform);
      });

    svg.call(zoom);
    zoomBehaviorRef.current = zoom;

    // Define gradients and filters
    const defs = svg.append("defs");

    // Glow filter
    const filter = defs.append("filter")
      .attr("id", "comic-glow")
      .attr("x", "-20%")
      .attr("y", "-20%")
      .attr("width", "140%")
      .attr("height", "140%");
    filter.append("feGaussianBlur").attr("stdDeviation", "3").attr("result", "blur");
    filter.append("feComposite").attr("in", "SourceGraphic").attr("in2", "blur").attr("operator", "over");

    // Arrow markers
    flowData.characterTimelines.forEach((tl, idx) => {
      defs.append("marker")
        .attr("id", `arrow-${idx}`)
        .attr("viewBox", "0 -5 10 10")
        .attr("refX", 18)
        .attr("refY", 0)
        .attr("markerWidth", 6)
        .attr("markerHeight", 6)
        .attr("orient", "auto")
        .append("path")
        .attr("d", "M0,-5L10,0L0,5")
        .attr("fill", tl.color);
    });

    // Compute layout coordinates
    const totalPages = Math.max(flowData.stats.totalPages, 1);
    const totalPanelsPerPage = 4;
    const totalSlots = totalPages * totalPanelsPerPage;
    
    // X Scale: spans from Page 1 Panel 1 to Page N Panel 4
    const availableWidth = Math.max(width - margin.left - margin.right, totalSlots * 70);
    const innerHeight = Math.max(height - margin.top - margin.bottom, filteredTimelines.length * 90);

    // Slot position function
    const getXPosition = (pageNum: number, panelNum: number) => {
      const globalIndex = (pageNum - 1) * totalPanelsPerPage + (panelNum - 1);
      const step = availableWidth / Math.max(totalSlots, 1);
      return margin.left + globalIndex * step + step / 2;
    };

    // Y Scale: One swimlane per character
    const charYMap = new Map<string, number>();
    const rowHeight = innerHeight / Math.max(filteredTimelines.length, 1);
    filteredTimelines.forEach((tl, idx) => {
      charYMap.set(tl.characterName, margin.top + idx * rowHeight + rowHeight / 2);
    });

    // 1. Draw Page Column Guidelines and Background Bands
    for (let p = 1; p <= totalPages; p++) {
      const startX = getXPosition(p, 1) - (availableWidth / totalSlots) / 2;
      const endX = getXPosition(p, totalPanelsPerPage) + (availableWidth / totalSlots) / 2;
      const pageWidth = endX - startX;

      // Subtle alternating page background
      mainGroup.append("rect")
        .attr("x", startX)
        .attr("y", margin.top - 30)
        .attr("width", pageWidth)
        .attr("height", innerHeight + 50)
        .attr("fill", p % 2 === 0 ? "rgba(30, 41, 59, 0.4)" : "rgba(15, 23, 42, 0.2)")
        .attr("stroke", "#334155")
        .attr("stroke-width", 1)
        .attr("stroke-dasharray", "4,4")
        .attr("rx", 6);

      // Page Header Pill
      const headerGroup = mainGroup.append("g")
        .attr("transform", `translate(${startX + pageWidth / 2}, ${margin.top - 45})`);

      headerGroup.append("rect")
        .attr("x", -45)
        .attr("y", 0)
        .attr("width", 90)
        .attr("height", 24)
        .attr("fill", "#0f172a")
        .attr("stroke", "#eab308")
        .attr("stroke-width", 2)
        .attr("rx", 4);

      headerGroup.append("text")
        .attr("x", 0)
        .attr("y", 16)
        .attr("text-anchor", "middle")
        .attr("fill", "#fef08a")
        .attr("font-family", "'Bangers', cursive, sans-serif")
        .attr("font-size", "12px")
        .attr("letter-spacing", "1px")
        .text(`SAYFA ${p}`);

      // Panel Sub-column markers
      for (let pan = 1; pan <= totalPanelsPerPage; pan++) {
        const px = getXPosition(p, pan);
        mainGroup.append("text")
          .attr("x", px)
          .attr("y", margin.top - 12)
          .attr("text-anchor", "middle")
          .attr("fill", "#64748b")
          .attr("font-family", "monospace")
          .attr("font-size", "10px")
          .text(`P${pan}`);
      }
    }

    // 2. Draw Character Swimlane Rails (Horizontal guidelines)
    filteredTimelines.forEach((tl) => {
      const y = charYMap.get(tl.characterName) || margin.top;

      // Swimlane line
      mainGroup.append("line")
        .attr("x1", margin.left - 20)
        .attr("y1", y)
        .attr("x2", margin.left + availableWidth + 20)
        .attr("y2", y)
        .attr("stroke", "#1e293b")
        .attr("stroke-width", 2)
        .attr("stroke-dasharray", "3,3");

      // Character Label badge on left
      const labelG = mainGroup.append("g")
        .attr("transform", `translate(${margin.left - 24}, ${y})`)
        .style("cursor", "pointer")
        .on("click", () => {
          onSelectCharacterFilter(
            selectedCharacterFilter === tl.characterName ? null : tl.characterName
          );
        });

      labelG.append("rect")
        .attr("x", -120)
        .attr("y", -18)
        .attr("width", 114)
        .attr("height", 36)
        .attr("fill", selectedCharacterFilter === tl.characterName ? "#1e293b" : "#090d16")
        .attr("stroke", tl.color)
        .attr("stroke-width", 2)
        .attr("rx", 6);

      // Character Name text
      labelG.append("text")
        .attr("x", -62)
        .attr("y", -1)
        .attr("text-anchor", "middle")
        .attr("fill", "#ffffff")
        .attr("font-family", "'Bangers', cursive, sans-serif")
        .attr("font-size", "12px")
        .text(tl.characterName.length > 12 ? tl.characterName.slice(0, 11) + "…" : tl.characterName);

      // Status subtext
      labelG.append("text")
        .attr("x", -62)
        .attr("y", 12)
        .attr("text-anchor", "middle")
        .attr("fill", tl.nodes.some(n => n.conditionSeverity === "danger") ? "#ef4444" : "#94a3b8")
        .attr("font-family", "sans-serif")
        .attr("font-size", "9px")
        .text(tl.currentPhysicalState.slice(0, 15));
    });

    // 3. Draw Connecting Links (Bezier paths between nodes of same character)
    filteredTimelines.forEach((tl, tlIdx) => {
      const charNodes = tl.nodes;
      for (let i = 0; i < charNodes.length - 1; i++) {
        const source = charNodes[i];
        const target = charNodes[i + 1];

        const x1 = getXPosition(source.pageNumber, source.panelNumber);
        const y1 = charYMap.get(source.characterName) || margin.top;
        const x2 = getXPosition(target.pageNumber, target.panelNumber);
        const y2 = charYMap.get(target.characterName) || margin.top;

        // Curved link path
        const midX = (x1 + x2) / 2;
        const pathData = `M ${x1} ${y1} C ${midX} ${y1}, ${midX} ${y2}, ${x2} ${y2}`;

        // Link base
        const linkPath = mainGroup.append("path")
          .attr("d", pathData)
          .attr("fill", "none")
          .attr("stroke", tl.color)
          .attr("stroke-width", target.conditionSeverity === "danger" ? 4 : 2.5)
          .attr("stroke-opacity", 0.7)
          .attr("stroke-dasharray", target.locationChanged ? "6,4" : "none");

        // If injury, give red accent stroke
        if (target.conditionSeverity === "danger") {
          linkPath.attr("stroke", "#ef4444").attr("filter", "url(#comic-glow)");
        }
      }
    });

    // 4. Draw Event Nodes
    filteredNodes.forEach((node) => {
      const x = getXPosition(node.pageNumber, node.panelNumber);
      const y = charYMap.get(node.characterName) || margin.top;
      const isSelected = selectedNode?.id === node.id;
      const timeline = flowData.characterTimelines.find(t => t.characterName === node.characterName);
      const charColor = timeline?.color || "#eab308";

      const nodeGroup = mainGroup.append("g")
        .attr("transform", `translate(${x}, ${y})`)
        .attr("class", "narrative-node")
        .style("cursor", "pointer");

      // Node styling based on severity & event type
      let nodeFill = "#0f172a";
      let nodeStroke = charColor;
      let nodeRadius = 14;

      if (node.conditionSeverity === "danger") {
        nodeFill = "#7f1d1d";
        nodeStroke = "#ef4444";
        nodeRadius = 17;
      } else if (node.conditionSeverity === "warning") {
        nodeFill = "#78350f";
        nodeStroke = "#f59e0b";
        nodeRadius = 15;
      } else if (node.itemsGained.length > 0) {
        nodeFill = "#064e3b";
        nodeStroke = "#10b981";
        nodeRadius = 16;
      } else if (node.locationChanged) {
        nodeFill = "#1e3a8a";
        nodeStroke = "#38bdf8";
        nodeRadius = 15;
      }

      // Outer ripple ring if selected or memory alert
      if (isSelected || node.hasMemoryAlert) {
        nodeGroup.append("circle")
          .attr("r", nodeRadius + 6)
          .attr("fill", "none")
          .attr("stroke", isSelected ? "#facc15" : "#ef4444")
          .attr("stroke-width", 2)
          .attr("stroke-dasharray", "4,2");
      }

      // Base Node Circle
      nodeGroup.append("circle")
        .attr("r", nodeRadius)
        .attr("fill", nodeFill)
        .attr("stroke", isSelected ? "#ffffff" : nodeStroke)
        .attr("stroke-width", isSelected ? 3 : 2)
        .attr("filter", (isSelected || node.conditionSeverity === "danger") ? "url(#comic-glow)" : "none");

      // Inner Symbol/Icon text
      let symbol = "●";
      let symbolColor = nodeStroke;
      if (node.conditionSeverity === "danger") {
        symbol = "⚡";
        symbolColor = "#fee2e2";
      } else if (node.itemsGained.length > 0) {
        symbol = "✦";
        symbolColor = "#a7f3d0";
      } else if (node.itemsLost.length > 0) {
        symbol = "✕";
        symbolColor = "#fde68a";
      } else if (node.locationChanged) {
        symbol = "▲";
        symbolColor = "#bae6fd";
      }

      nodeGroup.append("text")
        .attr("y", 4)
        .attr("text-anchor", "middle")
        .attr("fill", symbolColor)
        .attr("font-size", nodeRadius > 14 ? "12px" : "10px")
        .attr("font-weight", "bold")
        .text(symbol);

      // Small Badge above node if location changed
      if (node.locationChanged) {
        const locBadge = nodeGroup.append("g").attr("transform", "translate(0, -22)");
        locBadge.append("rect")
          .attr("x", -24)
          .attr("y", -8)
          .attr("width", 48)
          .attr("height", 14)
          .attr("fill", "#0284c7")
          .attr("stroke", "#000")
          .attr("stroke-width", 1)
          .attr("rx", 3);
        locBadge.append("text")
          .attr("y", 2)
          .attr("text-anchor", "middle")
          .attr("fill", "#ffffff")
          .attr("font-size", "7.5px")
          .attr("font-family", "monospace")
          .text("MEKAN");
      }

      // Mouse events
      nodeGroup
        .on("mouseenter", (event) => {
          const [mx, my] = d3.pointer(event, containerRef.current);
          setHoveredNode({ node, x: mx, y: my });
        })
        .on("mouseleave", () => {
          setHoveredNode(null);
        })
        .on("click", () => {
          onSelectNode(node);
        });
    });

  }, [dimensions, flowData, filteredTimelines, filteredNodes, selectedNode, selectedCharacterFilter, onSelectCharacterFilter, onSelectNode]);

  // Zoom controls
  const handleZoomIn = () => {
    if (svgRef.current && zoomBehaviorRef.current) {
      d3.select(svgRef.current).transition().duration(250).call(zoomBehaviorRef.current.scaleBy, 1.3);
    }
  };

  const handleZoomOut = () => {
    if (svgRef.current && zoomBehaviorRef.current) {
      d3.select(svgRef.current).transition().duration(250).call(zoomBehaviorRef.current.scaleBy, 0.75);
    }
  };

  const handleResetZoom = () => {
    if (svgRef.current && zoomBehaviorRef.current) {
      d3.select(svgRef.current).transition().duration(350).call(zoomBehaviorRef.current.transform, d3.zoomIdentity);
    }
  };

  return (
    <div className="relative w-full h-full flex flex-col bg-[#0b1120] border-2 border-black overflow-hidden select-none">
      {/* Top Floating Legend & Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 bg-slate-900/90 backdrop-blur-md border-b-2 border-black z-10">
        {/* Character Selector Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
          <span className="text-[10px] font-display uppercase text-slate-400 flex items-center gap-1 flex-shrink-0">
            <User size={12} className="text-yellow-400" /> Karakter:
          </span>
          <button
            type="button"
            onClick={() => onSelectCharacterFilter(null)}
            className={cn(
              "px-2 py-0.5 text-[10px] font-display uppercase border transition-all flex-shrink-0",
              selectedCharacterFilter === null
                ? "bg-yellow-400 text-black border-black font-bold shadow-xs"
                : "bg-slate-800 text-slate-300 border-slate-700 hover:border-slate-500"
            )}
          >
            Tümü ({flowData.characterTimelines.length})
          </button>
          {flowData.characterTimelines.map((t, tIdx) => {
            const isSelected = selectedCharacterFilter === t.characterName;
            return (
              <button
                key={`graph-tl-${t.characterName}-${tIdx}`}
                type="button"
                onClick={() => onSelectCharacterFilter(isSelected ? null : t.characterName)}
                className={cn(
                  "px-2 py-0.5 text-[10px] font-display uppercase border transition-all flex items-center gap-1 flex-shrink-0",
                  isSelected
                    ? "bg-slate-700 text-white border-yellow-400 font-bold"
                    : "bg-slate-800 text-slate-300 border-slate-700 hover:border-slate-500"
                )}
              >
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: t.color }} />
                <span>{t.characterName}</span>
              </button>
            );
          })}
        </div>

        {/* Category Filters */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onSelectCategoryFilter("all")}
            className={cn(
              "px-2 py-0.5 text-[10px] font-display uppercase border transition-all",
              selectedCategoryFilter === "all"
                ? "bg-yellow-400 text-black border-black font-bold"
                : "bg-slate-800 text-slate-300 border-slate-700"
            )}
          >
            Tüm Olaylar
          </button>
          <button
            type="button"
            onClick={() => onSelectCategoryFilter("injury")}
            className={cn(
              "px-2 py-0.5 text-[10px] font-display uppercase border flex items-center gap-1 transition-all",
              selectedCategoryFilter === "injury"
                ? "bg-red-600 text-white border-black font-bold"
                : "bg-slate-800 text-red-400 border-slate-700 hover:border-red-500"
            )}
            title="Yaralanma ve fiziksel durum değişimleri"
          >
            <Flame size={11} /> Fiziksel
          </button>
          <button
            type="button"
            onClick={() => onSelectCategoryFilter("items")}
            className={cn(
              "px-2 py-0.5 text-[10px] font-display uppercase border flex items-center gap-1 transition-all",
              selectedCategoryFilter === "items"
                ? "bg-emerald-600 text-white border-black font-bold"
                : "bg-slate-800 text-emerald-400 border-slate-700 hover:border-emerald-500"
            )}
            title="Eşyalar ve Envanter değişimi"
          >
            <Package size={11} /> Eşyalar
          </button>
          <button
            type="button"
            onClick={() => onSelectCategoryFilter("locations")}
            className={cn(
              "px-2 py-0.5 text-[10px] font-display uppercase border flex items-center gap-1 transition-all",
              selectedCategoryFilter === "locations"
                ? "bg-blue-600 text-white border-black font-bold"
                : "bg-slate-800 text-blue-400 border-slate-700 hover:border-blue-500"
            )}
            title="Mekan Değişimleri"
          >
            <MapPin size={11} /> Mekanlar
          </button>
        </div>
      </div>

      {/* SVG Canvas Area */}
      <div ref={containerRef} className="relative flex-1 w-full h-full cursor-grab active:cursor-grabbing overflow-hidden">
        <svg 
          ref={svgRef} 
          width={dimensions.width} 
          height={dimensions.height}
          className="w-full h-full block"
        />

        {/* Floating Zoom & View Controls */}
        <div className="absolute bottom-4 right-4 z-20 flex items-center gap-1.5 bg-slate-900/90 backdrop-blur-md p-1.5 border-2 border-black shadow-comic">
          <button
            type="button"
            onClick={handleZoomIn}
            className="p-1.5 bg-slate-800 text-white hover:bg-slate-700 border border-slate-600 active:scale-95"
            title="Yakınlaştır"
          >
            <ZoomIn size={14} />
          </button>
          <button
            type="button"
            onClick={handleZoomOut}
            className="p-1.5 bg-slate-800 text-white hover:bg-slate-700 border border-slate-600 active:scale-95"
            title="Uzaklaştır"
          >
            <ZoomOut size={14} />
          </button>
          <button
            type="button"
            onClick={handleResetZoom}
            className="p-1.5 bg-slate-800 text-yellow-400 hover:bg-slate-700 border border-slate-600 active:scale-95 flex items-center gap-1 font-display text-[10px] uppercase"
            title="Görünümü Sıfırla (Ortala)"
          >
            <RotateCcw size={12} /> Sıfırla
          </button>
        </div>

        {/* Floating Hover Tooltip */}
        {hoveredNode && (
          <div
            className="absolute z-30 pointer-events-none transform -translate-x-1/2 -translate-y-full mb-3 w-64 bg-slate-900 border-2 border-yellow-400 shadow-comic p-2.5 text-xs text-white space-y-1.5 transition-all"
            style={{
              left: Math.max(130, Math.min(dimensions.width - 130, hoveredNode.x)),
              top: Math.max(10, hoveredNode.y - 12)
            }}
          >
            <div className="flex items-center justify-between border-b border-slate-700 pb-1">
              <span className="font-display uppercase text-yellow-400 font-bold">
                {hoveredNode.node.characterName}
              </span>
              <span className="text-[10px] font-mono px-1 py-0.2 bg-black text-slate-300 border border-slate-700">
                Sayfa {hoveredNode.node.pageNumber}, Panel {hoveredNode.node.panelNumber}
              </span>
            </div>

            {/* Physical Status */}
            <div className="flex items-start gap-1.5 text-[11px]">
              <Flame size={12} className={hoveredNode.node.conditionSeverity === "danger" ? "text-red-400 flex-shrink-0 mt-0.5" : "text-slate-400 flex-shrink-0 mt-0.5"} />
              <div>
                <span className="text-slate-400 text-[10px]">Durum: </span>
                <span className={hoveredNode.node.conditionSeverity === "danger" ? "text-red-300 font-bold" : "text-white"}>
                  {hoveredNode.node.physicalCondition}
                </span>
              </div>
            </div>

            {/* Held Items / Inventory */}
            {hoveredNode.node.heldItems.length > 0 && (
              <div className="flex items-start gap-1.5 text-[11px]">
                <Package size={12} className="text-emerald-400 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="text-slate-400 text-[10px]">Envanter: </span>
                  <span className="text-emerald-300 font-mono text-[10px]">
                    {hoveredNode.node.heldItems.join(", ")}
                  </span>
                </div>
              </div>
            )}

            {/* Location */}
            <div className="flex items-start gap-1.5 text-[11px]">
              <MapPin size={12} className="text-blue-400 flex-shrink-0 mt-0.5" />
              <div>
                <span className="text-slate-400 text-[10px]">Mekan: </span>
                <span className="text-blue-200">{hoveredNode.node.locationName}</span>
              </div>
            </div>

            {/* Dialogue */}
            {hoveredNode.node.dialogueSnippet && (
              <div className="text-[10px] italic text-slate-300 bg-slate-950 p-1 border-l-2 border-yellow-400">
                "{hoveredNode.node.dialogueSnippet}"
              </div>
            )}

            <div className="text-[9px] text-yellow-400/80 font-mono text-center pt-0.5">
              Detaylı incelemek için tıklayın
            </div>
          </div>
        )}
      </div>

      {/* Bottom Mini Status Bar */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-slate-950 border-t-2 border-black text-[10px] font-mono text-slate-400">
        <div className="flex items-center gap-3">
          <span>● Sayfa: <strong className="text-white">{flowData.stats.totalPages}</strong></span>
          <span>● Panel: <strong className="text-white">{flowData.stats.totalPanels}</strong></span>
          <span>● Yaralanma / Hasar: <strong className="text-red-400">{flowData.stats.totalInjuries}</strong></span>
          <span>● İzlenen Eşya: <strong className="text-emerald-400">{flowData.stats.totalItemsTracked}</strong></span>
        </div>
        <div className="hidden sm:block text-slate-500">
          Kaydırarak veya tekerlekle Yakınlaştırın • Düğümlere tıklayarak detaylı kartı açın
        </div>
      </div>
    </div>
  );
};
