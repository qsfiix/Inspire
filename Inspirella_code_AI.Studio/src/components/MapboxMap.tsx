import React, { useState, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Map as MapIcon, Layers, Compass, Maximize2, Minimize2, X, Info, Scale } from "lucide-react";
import { Coordinates, Institution, LanguageCode } from "../types";
import { SWISS_INSTITUTIONS, TRANSLATIONS } from "../data";
import { DataRepository } from "../data/Repository";
import { hasCoordinates, isWithinSwitzerland, SWISS_BOUNDS } from "../lib/validation";
import InstitutionCompareModal from "./InstitutionCompareModal";
import InstitutionDetailCard from "./InstitutionDetailCard";

const MAX_COMPARE = 3;

// Locks panning/zooming to Switzerland (plus a little breathing room past the
// border, so it doesn't feel like hitting a hard wall right at the edge of
// the country). Sofiia's request 2026-09-14: the map is Swiss-only right
// now, so letting people scroll off to the rest of the globe just invites
// wasted work with no payoff yet. Padded from the app's rough validation
// bounding box (`SWISS_BOUNDS`), not a new source of truth for "is this
// point in Switzerland" - that check stays in lib/validation.ts.
const SWITZERLAND_MAX_BOUNDS: [[number, number], [number, number]] = [
  [SWISS_BOUNDS.minLng - 1.2, SWISS_BOUNDS.minLat - 0.7], // southwest
  [SWISS_BOUNDS.maxLng + 1.2, SWISS_BOUNDS.maxLat + 0.7] // northeast
];

interface MapProps {
  currentLanguage: LanguageCode;
  accessToken?: string;
  styleUrl?: string;
  theme?: "dark" | "light";
}

type GeoInstitution = Institution & { coordinates: Coordinates };

export default function MapboxMap({ currentLanguage, accessToken, styleUrl, theme = "dark" }: MapProps) {
  const [institutions, setInstitutions] = useState<Institution[]>(SWISS_INSTITUTIONS);
  const [selectedInst, setSelectedInst] = useState<Institution | null>(SWISS_INSTITUTIONS[0] ?? null);
  const [is3DMode, setIs3DMode] = useState<boolean>(true);
  const [mapEngineLoaded, setMapEngineLoaded] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [compareList, setCompareList] = useState<Institution[]>([]);
  const [showCompareModal, setShowCompareModal] = useState<boolean>(false);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const t = TRANSLATIONS[currentLanguage];
  const isDark = theme === "dark";

  /**
   * Institutions that carry a validated position.
   *
   * DATA RULE (02_Product/Requirements/Map Discovery Requirements.md):
   * "Map does not invent coordinates. Invalid or missing location records are
   * excluded from geographic rendering and may appear in non-map lists only."
   * The sidebar list therefore keeps every record, the map layers keep only these.
   */
  const geoInstitutions = useMemo(
    () => institutions.filter((inst): inst is GeoInstitution => hasCoordinates(inst)),
    [institutions]
  );

  /** Records the user can still browse, but which cannot be placed on a map. */
  const unlocatedCount = institutions.length - geoInstitutions.length;

  /**
   * The fallback illustration can only draw Switzerland, so it renders the subset
   * of points that actually fall inside the Swiss bounding box.
   */
  const projectableInstitutions = useMemo(
    () => geoInstitutions.filter(inst => isWithinSwitzerland(inst.coordinates)),
    [geoInstitutions]
  );

  // Projection from real coordinates (Lng, Lat) to the 1000 x 500 SVG viewBox.
  const getProjectedCoords = (lngLat: Coordinates) => {
    const [lng, lat] = lngLat;

    const xPct = (lng - SWISS_BOUNDS.minLng) / (SWISS_BOUNDS.maxLng - SWISS_BOUNDS.minLng);
    const yPct = (lat - SWISS_BOUNDS.minLat) / (SWISS_BOUNDS.maxLat - SWISS_BOUNDS.minLat);

    // Map into the drawn Switzerland silhouette with a comfortable margin.
    const x = xPct * 760 + 120;
    const y = 500 - (yPct * 300 + 100); // Invert Y for screen indexing

    return { x, y };
  };

  // Step 1: Query Supabase database via DataRepository to fetch additional/updated institutions list
  useEffect(() => {
    let active = true;
    let subscription: any = null;

    const loadInstitutions = async () => {
      const parsed = await DataRepository.getInstitutions();
      if (!active) return;
      setInstitutions(parsed);
      if (parsed.length > 0) {
        setSelectedInst(prev => 
          prev && parsed.find(i => i.id === prev.id) 
            ? parsed.find(i => i.id === prev.id) || parsed[0] 
            : parsed[0]
        );
      }
    };

    const init = async () => {
      await loadInstitutions();
      subscription = await DataRepository.subscribeToInstitutions(() => {
        console.log("Realtime Database Sync: institutions table altered. Syncing views...");
        loadInstitutions();
      });
    };

    init();

    return () => {
      active = false;
      if (subscription && typeof subscription.unsubscribe === 'function') {
        subscription.unsubscribe();
      }
    };
  }, []);

  // Step 2: Initialize / Reinitialize Mapbox with retrieved institutions
  useEffect(() => {
    let token = accessToken;
    if (!token) {
      token = "";
    }

    const loadMapbox = async () => {
      try {
        const mapboxgl = (window as any).mapboxgl || await import("mapbox-gl").then(m => m.default || m);
        if (!mapboxgl) throw new Error("Mapbox GL not loaded yet");

        mapboxgl.accessToken = token;

        if (mapContainerRef.current) {
          // Initialize map centered in Switzerland
          mapInstance.current = new mapboxgl.Map({
            container: mapContainerRef.current,
            style: styleUrl || (isDark ? "mapbox://styles/mapbox/dark-v11" : "mapbox://styles/mapbox/light-v11"),
            center: [8.2275, 46.8182],
            zoom: 7.2,
            minZoom: 6,
            maxBounds: SWITZERLAND_MAX_BOUNDS,
            pitch: is3DMode ? 45 : 0,
            bearing: -5,
            interactive: true,
            attributionControl: false
          });

          mapInstance.current.on("load", () => {
            setMapEngineLoaded(true);

            // Real volumetric 3D buildings (not just a tilted camera on a flat map):
            // the standard Mapbox styles (dark-v11/light-v11) ship building height data
            // in their `composite` source's "building" source-layer, so this is a normal
            // fill-extrusion layer, not a different tool. A custom Studio style's
            // `composite` source may or may not have been composed from a tileset that
            // includes "building" data (Mapbox errors loudly if a style layer references
            // a source-layer the source doesn't actually have), so this only runs once
            // that's confirmed - safe no-op otherwise. Only visible once zoomed in close
            // (city-block level); that's how building extrusion works, not a bug.
            // Wrapped defensively: a style/source surprise here must never stop the
            // marker-adding code right below it from running.
            try {
              const source = mapInstance.current.getSource("composite") as { vectorLayerIds?: string[] } | undefined;
              const hasBuildingData = !!source?.vectorLayerIds?.includes("building");
              if (hasBuildingData && !mapInstance.current.getLayer("inspirella-3d-buildings")) {
                const layers = mapInstance.current.getStyle()?.layers || [];
                const firstSymbolLayerId = layers.find((layer: any) => layer.type === "symbol")?.id;
                mapInstance.current.addLayer(
                  {
                    id: "inspirella-3d-buildings",
                    source: "composite",
                    "source-layer": "building",
                    filter: ["==", "extrude", "true"],
                    type: "fill-extrusion",
                    minzoom: 14,
                    paint: {
                      "fill-extrusion-color": isDark ? "#7c3aed" : "#a78bfa",
                      "fill-extrusion-height": ["interpolate", ["linear"], ["zoom"], 14, 0, 14.5, ["get", "height"]],
                      "fill-extrusion-base": ["interpolate", ["linear"], ["zoom"], 14, 0, 14.5, ["get", "min_height"]],
                      "fill-extrusion-opacity": 0.75
                    }
                  },
                  firstSymbolLayerId
                );
              } else if (!hasBuildingData) {
                console.info(
                  "Inspirella: the active Mapbox style has no building height data (composite source lacks a 'building' layer), so 3D building extrusion is skipped. This is a style configuration matter, not a code error - see Mapbox Studio's style sources."
                );
              }
            } catch (buildingLayerErr) {
              console.warn("Inspirella: skipped 3D building extrusion.", buildingLayerErr);
            }

            // Only records with validated coordinates are placed on the map.
            geoInstitutions.forEach((inst) => {
              // No per-marker animate-ping: with the real dataset (91+ institutions and
              // growing) a permanent pulse on every pin at once reads as visual noise
              // rather than a signal. Hover/selection feedback (scale, ring) is enough.
              // "Pillar of light" marker (index.css .inspirella-pin): a glowing
              // core on the exact location with a beam rising from it - reads
              // as 3D over the tilted map and matches the site's glow language.
              const el = document.createElement("button");
              el.type = "button";
              el.className = "inspirella-pin";
              el.setAttribute("aria-label", inst.title);
              el.innerHTML = `<span class="pin-beam"></span><span class="pin-core"></span>`;

              el.addEventListener("click", () => {
                setSelectedInst(inst);
                // Zoom in close to the building (not just "somewhere in the
                // canton") - 9.5 used to be LOWER than whatever zoom the user
                // was already at, so clicking a pin could visibly zoom out.
                // 16 is well past the 14.5 threshold where 3D buildings kick
                // in, so clicking a pin reliably zooms in to street level.
                mapInstance.current?.flyTo({
                  center: inst.coordinates,
                  zoom: 16,
                  essential: true
                });
              });

              new mapboxgl.Marker({ element: el, anchor: "bottom" })
                .setLngLat(inst.coordinates)
                .addTo(mapInstance.current);
            });
          });
        }
      } catch (err) {
        console.warn("Mapbox setup failed (Sandbox/Iframe WebGL constraints block standard rendering). Using direct Dynamic Vector Switzerland projection map instead.");
        setMapEngineLoaded(false);
      }
    };

    const timer = setTimeout(() => {
      loadMapbox();
    }, 700);

    return () => {
      clearTimeout(timer);
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
    // isFullscreen is deliberately NOT a dependency: toggling it used to destroy and
    // recreate the entire map (losing `mapEngineLoaded` sync along the way, which
    // showed as a blank grey screen in fullscreen). The ResizeObserver below handles
    // the actual container-size change instead - cheaper and doesn't reset anything.
  }, [accessToken, styleUrl, geoInstitutions, isDark]);

  // Keep the Mapbox canvas in sync with its container's real size. Mapbox GL only
  // measures the container once at creation - it does not notice later size changes
  // on its own (entering/exiting fullscreen, the sidebar image finishing its load and
  // reflowing the layout, a window resize), and without an explicit resize() call the
  // canvas keeps its old dimensions - the "map renders in a small square" / "fullscreen
  // is just a blank box" bugs both trace back to this.
  useEffect(() => {
    if (!mapContainerRef.current) return;
    const observer = new ResizeObserver(() => {
      mapInstance.current?.resize();
    });
    observer.observe(mapContainerRef.current);
    return () => observer.disconnect();
  }, [mapEngineLoaded]);

  // Adjust pitch dynamically when interactive 3D is toggled
  useEffect(() => {
    if (mapInstance.current && mapEngineLoaded) {
      mapInstance.current.setPitch(is3DMode ? 45 : 0);
    }
  }, [is3DMode, mapEngineLoaded]);

  const handleSVGPinClick = (inst: Institution) => {
    setSelectedInst(inst);
  };

  const isInCompare = (id: string) => compareList.some(i => i.id === id);

  const toggleCompare = (inst: Institution) => {
    setCompareList(prev => {
      if (prev.some(i => i.id === inst.id)) return prev.filter(i => i.id !== inst.id);
      if (prev.length >= MAX_COMPARE) return prev;
      return [...prev, inst];
    });
  };

  return (
    <div 
      className={`transition-all duration-500 overflow-hidden relative flex ${
        isFullscreen 
          ? "fixed inset-0 z-[100] h-screen w-screen bg-zinc-950 p-6 flex-col lg:flex-row gap-5" 
          : "card-premium w-full flex flex-col lg:flex-row gap-5 h-[650px] lg:h-[720px] transition-all"
      }`}
    >
      
      {/* Map Control Hub Header Overlay (Floating top-left) */}
      <div className="absolute top-4 left-4 z-10 flex flex-wrap gap-2 pointer-events-auto">
        <div className={`inline-flex items-center gap-2 rounded-xl border px-3.5 py-1.5 backdrop-blur-md ${
          isDark ? "bg-zinc-950/85 border-violet-400/25 text-white shadow-[0_8px_24px_-12px_rgba(0,0,0,0.8)]" : "bg-white border-purple-200 text-indigo-950 shadow-sm"
        }`}>
          <Compass className="h-4 w-4 text-violet-400" />
          <span className="text-xs font-semibold">
            {mapEngineLoaded ? "Live map" : "Map"}
          </span>
          <span className={`text-xs px-2 py-0.5 rounded-lg font-mono font-bold shrink-0 ${
            isDark ? "bg-violet-500/20 text-violet-200" : "bg-violet-100 text-violet-800"
          }`}>
            {geoInstitutions.length}/{institutions.length} {t.mapMappedLabel}
          </span>
        </div>

        {/* Honest note when some records cannot be placed geographically. */}
        {unlocatedCount > 0 && (
          <div
            className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-medium backdrop-blur-md ${
              isDark
                ? "bg-zinc-950/85 border-amber-400/40 text-amber-200"
                : "bg-amber-50 border-amber-300 text-amber-800"
            }`}
            title={t.mapUnlocatedHint}
          >
            <Info className="h-3.5 w-3.5 shrink-0" />
            <span>{unlocatedCount} {t.mapUnlocatedLabel}</span>
          </div>
        )}

        <button
          onClick={() => setIs3DMode(!is3DMode)}
          className={`inline-flex items-center gap-1.5 rounded-xl border px-3.5 py-1.5 text-xs font-medium backdrop-blur-md transition-all cursor-pointer ${
            isDark
              ? "bg-zinc-950/85 border-violet-400/25 text-zinc-100 hover:bg-zinc-900 hover:border-violet-400/50"
              : "bg-white border-purple-200 text-indigo-950 hover:bg-purple-50 hover:shadow-sm"
          }`}
        >
          <Layers className="h-3.5 w-3.5 text-violet-500" />
          <span>{t.mapToggle3D} ({is3DMode ? "ON" : "OFF"})</span>
        </button>

        {/* FULLSCREEN MULTI-SELECTOR BUTTON */}
        <button
          onClick={() => setIsFullscreen(!isFullscreen)}
          className={`inline-flex items-center gap-1.5 rounded-xl border px-3.5 py-1.5 text-xs font-medium backdrop-blur-md transition-all cursor-pointer ${
            isDark
              ? "bg-zinc-950/85 border-violet-400/25 text-zinc-100 hover:bg-zinc-900 hover:border-violet-400/50"
              : "bg-white border-purple-200 text-indigo-950 hover:bg-purple-50 hover:shadow-sm"
          }`}
          title="Toggle Fullscreen Mode"
        >
          {isFullscreen ? <Minimize2 className="h-3.5 w-3.5 text-violet-500" /> : <Maximize2 className="h-3.5 w-3.5 text-violet-500" />}
          <span>{isFullscreen ? "Exit full screen" : "Full screen"}</span>
        </button>
      </div>

      {isFullscreen && (
        <button 
          onClick={() => setIsFullscreen(false)}
          className="absolute top-4 right-4 z-50 p-2.5 rounded-full bg-red-600 hover:bg-red-700 text-white shadow-xl flex items-center justify-center cursor-pointer hover:scale-105 active:scale-95 transition"
        >
          <X className="h-5 w-5" />
        </button>
      )}

      {/* Main Map Portal */}
      <div className={`flex-grow h-full relative overflow-hidden flex items-center justify-center rounded-2xl ${
        isDark ? "bg-zinc-950/40" : "bg-purple-50/25"
      }`}>
        
        {/* Canvas for Mapbox */}
        <div 
          ref={mapContainerRef} 
          className={`absolute inset-0 transition-opacity duration-1000 ${
            mapEngineLoaded ? "opacity-100 z-0" : "opacity-0 -z-10"
          }`}
        />

        {/* Fallback Dynamic VECTOR SWITZERLAND MAP */}
        {!mapEngineLoaded && (
          <div className="absolute inset-0 z-0 flex items-center justify-center p-6 bg-transparent select-none relative overflow-scene">
            
            {/* Switzerland Topo Grid Layer */}
            <div className={`absolute inset-0 bg-[linear-gradient(to_right,var(--grid-color)_1px,transparent_1px),linear-gradient(to_bottom,var(--grid-color)_1px,transparent_1px)] bg-[size:3rem_3rem]`}
              style={{
                "--grid-color": isDark ? "rgba(255,255,255,0.03)" : "rgba(139,92,246,0.04)"
              } as React.CSSProperties}
            />
            
            {/* Custom stylized vector illustration of Switzerland */}
            <svg 
              viewBox="0 0 1000 500" 
              className={`w-full h-full max-h-[480px] filter transition-all duration-300 ${
                isDark ? "text-violet-950/20 drop-shadow-[0_0_35px_rgba(255,255,255,0.03)]" : "text-violet-100/50 drop-shadow-[0_0_30px_rgba(139,92,246,0.08)]"
              }`}
            >
              {/* Stylized polygon boundary representing Switzerland */}
              <polygon 
                points="100,300 170,220 280,180 350,150 480,100 650,110 850,80 920,130 950,230 840,320 750,420 580,450 420,400 320,420 180,380" 
                fill={isDark ? "rgba(139, 92, 246, 0.02)" : "rgba(139, 92, 246, 0.05)"} 
                stroke={isDark ? "rgba(255, 255, 255, 0.12)" : "rgba(139, 92, 246, 0.22)"} 
                strokeWidth="2"
                opacity="0.9"
              />
              
              <path 
                d="M 190,350 Q 320,380 420,400 T 580,450" 
                fill="none" 
                stroke={isDark ? "rgba(255,255,255,0.08)" : "rgba(139, 92, 246, 0.1)"} 
                strokeWidth="1.5" 
                strokeDasharray="4,6" 
                opacity="0.4"
              />

              {/* Mountains stylized vector shapes for nice dimension */}
              <polygon points="500,100 580,260 420,260" fill="rgba(139, 92, 246, 0.015)" opacity="0.1" />
              <polygon points="680,110 750,280 610,280" fill="rgba(139, 92, 246, 0.02)" opacity="0.12" />
              <polygon points="320,150 380,270 260,270" fill="rgba(139, 92, 246, 0.01)" opacity="0.08" />

              {/* Projected positions for every institution with a validated Swiss location */}
              {projectableInstitutions.map((inst) => {
                const isPinSelected = selectedInst?.id === inst.id;
                const { x, y } = getProjectedCoords(inst.coordinates);
                
                return (
                  <g 
                    key={inst.id} 
                    transform={`translate(${x}, ${y})`}
                    className="cursor-pointer group"
                    onClick={() => handleSVGPinClick(inst)}
                  >
                    <circle 
                      r={isPinSelected ? "18" : "11"} 
                      fill="rgba(139, 92, 246, 0.15)" 
                      stroke={isPinSelected ? "#a855f7" : "rgba(139, 92, 246, 0.45)"} 
                      strokeWidth={isPinSelected ? "2" : "1"}
                      className={isPinSelected ? "animate-pulse" : ""}
                    />
                    <circle 
                      r="6" 
                      fill={isPinSelected ? "#d946ef" : "#8b5cf6"} 
                      className="transition duration-300 group-hover:scale-130"
                    />
                    {isPinSelected && (
                      <circle 
                        r="12" 
                        fill="none" 
                        stroke="#c084fc" 
                        strokeWidth="1.5" 
                        className="animate-ping"
                      />
                    )}
                    
                    {/* Hover text label */}
                    <g className="opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none duration-300">
                      <rect 
                        x="-70" 
                        y="-40" 
                        width="140" 
                        height="24" 
                        rx="6" 
                        fill={isDark ? "rgba(9, 9, 11, 0.95)" : "rgba(255, 255, 255, 0.95)"} 
                        stroke="rgba(139, 92, 246, 0.3)" 
                        strokeWidth="1"
                      />
                      <text 
                        y="-24" 
                        textAnchor="middle" 
                        className={`text-[11px] font-mono tracking-wide font-bold ${
                          isDark ? "fill-zinc-100" : "fill-indigo-950"
                        }`}
                      >
                        {inst.title.length > 20 ? inst.title.substring(0, 18) + ".." : inst.title}
                      </text>
                    </g>
                  </g>
                );
              })}
            </svg>
            
            {/* Guide Map Overlay */}
            <div className={`absolute bottom-4 left-4 border backdrop-blur-md rounded-xl p-3.5 max-w-[220px] pointer-events-none shadow-md ${
              isDark ? "bg-white/5 border-white/10" : "bg-white border-purple-200 shadow-md"
            }`}>
              <span className="block text-xs font-bold font-mono text-violet-500 uppercase">Interactive Directory</span>
              <span className={`block text-[11px] mt-1 leading-relaxed ${isDark ? "text-zinc-200" : "text-violet-950 font-extrabold"}`}>
                All academies, high vocational systems, and cantonal research institutes are projected above.
              </span>
            </div>
          </div>
        )}

      </div>

      {/* Institution side panel. `inst-panel` gives its info blocks the soft
          violet glow (index.css) - they used to sit flat on near-black. */}
      <div className={`inst-panel relative w-full lg:w-[360px] h-2/5 lg:h-full shrink-0 border-t lg:border-t-0 lg:border-l backdrop-blur-xl flex flex-col justify-between overflow-y-auto ${
        compareList.length > 0 ? "pb-24" : ""
      } ${
        isDark
          ? "border-violet-400/15 bg-gradient-to-b from-violet-950/50 via-black/40 to-black/30 text-white"
          : "border-purple-250 bg-white text-black"
      }`}>
        <AnimatePresence mode="wait">
          {selectedInst ? (
            <motion.div
              key={selectedInst.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="p-6 flex-1 text-left"
            >
              <InstitutionDetailCard
                institution={selectedInst}
                currentLanguage={currentLanguage}
                theme={theme}
                isInCompare={isInCompare(selectedInst.id)}
                compareDisabled={compareList.length >= MAX_COMPARE}
                onToggleCompare={() => toggleCompare(selectedInst)}
              />
            </motion.div>
          ) : (
            <div className={`p-6 text-center flex flex-col items-center justify-center h-full ${isDark ? "text-zinc-300" : "text-violet-950 font-bold"}`}>
              <MapIcon className="h-7 w-7 text-violet-500 mb-2" />
              <p className="text-xs">{t.selectPinAlert}</p>
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* Floating compare tray: institutions the user picked while browsing pins */}
      {compareList.length > 0 && (
        <div className={`absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex flex-wrap items-center justify-center gap-2 max-w-[92%] rounded-2xl border px-3.5 py-2.5 backdrop-blur-md shadow-xl ${
          isDark ? "bg-zinc-950/90 border-white/15" : "bg-white/95 border-purple-200"
        }`}>
          <div className="flex items-center gap-1.5">
            <Scale className="h-3.5 w-3.5 text-violet-500 shrink-0" />
            <span className={`text-xs font-mono uppercase tracking-wider ${isDark ? "text-zinc-400" : "text-violet-950/70 font-black"}`}>
              {t.compareBarLabel} ({compareList.length}/{MAX_COMPARE})
            </span>
          </div>
          {compareList.map(inst => (
            <span
              key={inst.id}
              className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold max-w-[140px] ${
                isDark ? "bg-white/10 text-zinc-200" : "bg-purple-100 text-violet-950"
              }`}
            >
              <span className="truncate">{inst.title}</span>
              <button onClick={() => toggleCompare(inst)} aria-label={t.compareRemove}>
                <X className="h-3 w-3 shrink-0" />
              </button>
            </span>
          ))}
          <button
            onClick={() => setCompareList([])}
            className={`text-xs font-mono underline ${isDark ? "text-zinc-400 hover:text-zinc-200" : "text-violet-950/70 hover:text-violet-950"}`}
          >
            {t.compareClear}
          </button>
          <button
            onClick={() => setShowCompareModal(true)}
            disabled={compareList.length < 2}
            className="btn-primary flex items-center gap-1.5 px-3 py-1.5 text-xs tracking-wide disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {t.compareViewButton}
          </button>
        </div>
      )}

      {showCompareModal && compareList.length >= 2 && (
        <InstitutionCompareModal
          institutions={compareList}
          currentLanguage={currentLanguage}
          theme={theme}
          onClose={() => setShowCompareModal(false)}
          onRemove={id => setCompareList(prev => prev.filter(i => i.id !== id))}
        />
      )}

    </div>
  );
}
