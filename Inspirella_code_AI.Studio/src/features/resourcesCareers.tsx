import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Search,
  ExternalLink,
  Briefcase,
  Coins,
  ShieldCheck,
  Check,
  ChevronRight,
  Sparkles,
  Landmark,
  Scale,
  X
} from "lucide-react";
import { DataRepository } from "../data/Repository";
import { Institution, LanguageCode, Profession, ProfessionInstitutionLink } from "../types";
import { useEducationEngine } from "../engine/useEducationEngine";
import { localizedList, localizedText } from "../lib/localized";
import { isProvisional, isTrusted } from "../lib/quality";
import InstitutionCompareModal from "../components/InstitutionCompareModal";
import InstitutionDetailCard from "../components/InstitutionDetailCard";
import SectionGlow from "../components/SectionGlow";
import { categoryLabel } from "../lib/categoryLabels";

const MAX_COMPARE = 3;

/**
 * Unified hub for the three ways a user discovers opportunities in
 * Switzerland: curated web resources, professions, and institutions.
 * Previously these lived in three disconnected places (professions buried
 * at the bottom of the dashboard, resources in their own tab, institutions
 * only reachable by clicking pins on the map) - merged per Sofiia's IA
 * review 2026-09-13 (see Decisions.md).
 */
export function ResourcesCareersView({
  t,
  isDark,
  currentLanguage,
  theme,
  resourceSearch,
  setResourceSearch,
  resourceCategoryFilter,
  setResourceCategoryFilter,
  filteredResources,
  resourcesList,
  userProfile
}: any) {
  const [activeSection, setActiveSection] = useState<"web" | "professions" | "institutions">("web");

  const sections = [
    { id: "web", label: t.resourcesTabWeb },
    { id: "professions", label: t.resourcesTabProfessions },
    { id: "institutions", label: t.resourcesTabInstitutions }
  ] as const;

  return (
    <motion.div
      key="view-resources-careers"
      initial={{ opacity: 0, x: 15 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -15 }}
      className="space-y-6"
    >
      <div className="relative flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 py-1">
        <SectionGlow isDark={isDark} corner="top-left" />
        <div className="relative">
          <h1 className={`text-xl font-bold tracking-tight ${isDark ? "text-white" : "text-black font-black"}`}>{t.resourcesCareersHeader}</h1>
          <p className={`text-xs mt-0.5 max-w-xl ${isDark ? "text-zinc-300" : "text-black font-bold"}`}>{t.resourcesCareersSub}</p>
        </div>

        <div className={`flex gap-1 rounded-xl p-1 border shrink-0 ${
          isDark ? "bg-zinc-900/60 border-violet-950" : "bg-purple-100 border-2 border-purple-300 shadow-sm"
        }`}>
          {sections.map(section => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={`px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-wider rounded-lg transition cursor-pointer ${
                activeSection === section.id
                  ? isDark ? "bg-violet-900/50 text-violet-200" : "bg-violet-600 text-white shadow-sm"
                  : isDark ? "text-zinc-300 hover:text-white" : "text-black hover:text-violet-950"
              }`}
            >
              {section.label}
            </button>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeSection === "web" && (
          <ResourcesPanel
            key="panel-web"
            t={t}
            isDark={isDark}
            currentLanguage={currentLanguage}
            resourceSearch={resourceSearch}
            setResourceSearch={setResourceSearch}
            resourceCategoryFilter={resourceCategoryFilter}
            setResourceCategoryFilter={setResourceCategoryFilter}
            filteredResources={filteredResources}
            resourcesList={resourcesList}
            userProfile={userProfile}
          />
        )}
        {activeSection === "professions" && (
          <motion.div key="panel-professions" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <ProfessionsExplorer isDark={isDark} currentLanguage={currentLanguage} t={t} />
          </motion.div>
        )}
        {activeSection === "institutions" && (
          <motion.div key="panel-institutions" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <InstitutionsExplorer isDark={isDark} currentLanguage={currentLanguage} theme={theme} t={t} />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/** Web resources sub-panel - unchanged content/logic, moved here from dashboard.tsx. */
function ResourcesPanel({
  t,
  isDark,
  currentLanguage,
  resourceSearch,
  setResourceSearch,
  resourceCategoryFilter,
  setResourceCategoryFilter,
  filteredResources,
  resourcesList = [],
  userProfile
}: any) {
  const { recommendation } = useEducationEngine(userProfile || null);
  const recommendedIds = recommendation?.resources.map(r => r.resource.id) || [];

  const activeCategories = Array.from(
    new Set(resourcesList.map((res: any) => res.category).filter(Boolean))
  ) as string[];
  const categoriesToRender = ["all", ...activeCategories];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
      {/* Title on its own row: squeezed beside the filter row it used to wrap
          into a narrow column ("Official Swiss / Resources"). */}
      <div className="flex flex-col gap-4">
        <div>
          <h2 className={`text-lg font-extrabold tracking-tight ${isDark ? "text-white" : "text-violet-950 font-black"}`}>{t.resourcesHeader}</h2>
          <p className={`text-xs mt-0.5 ${isDark ? "text-zinc-300" : "text-black font-bold"}`}>{t.resourcesSub}</p>
          {userProfile && (
            <p className={`text-xs mt-1 font-medium ${isDark ? "text-violet-300" : "text-emerald-800 font-bold"}`}>
              <Sparkles className="inline-block h-3 w-3 mr-1" />
              {userProfile.isGuest ? t.resourcesAdaptedGuest : t.resourcesAdaptedUser}
            </p>
          )}
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-start gap-2.5 w-full">
          <div className={`relative flex items-center rounded-xl p-1.5 pr-2 w-full sm:w-60 border ${
            isDark ? "bg-zinc-900/60 border-violet-950 text-white" : "bg-white border-purple-300 shadow-sm text-black"
          }`}>
            <Search className={`h-4 w-4 ml-1.5 mr-2 ${isDark ? "text-zinc-400" : "text-violet-600"}`} />
            <input
              type="text"
              value={resourceSearch}
              onChange={(e) => setResourceSearch(e.target.value)}
              placeholder={t.resourcesSearchPlaceholder}
              aria-label={t.resourcesSearchPlaceholder}
              className={`w-full bg-transparent text-xs focus:outline-none ${isDark ? "text-white placeholder-zinc-500" : "text-black placeholder-violet-950/40 font-bold"}`}
            />
          </div>

          <div className={`flex flex-wrap gap-1 rounded-xl p-1 border ${
            isDark ? "bg-zinc-900/60 border-violet-950" : "bg-purple-100 border-2 border-purple-300 shadow-sm"
          }`}>
            {categoriesToRender.map((cat) => (
              <button
                key={cat}
                onClick={() => setResourceCategoryFilter(cat)}
                className={`px-2.5 py-1 text-xs font-semibold first-letter:uppercase rounded-lg transition shrink-0 cursor-pointer ${
                  resourceCategoryFilter === cat
                    ? isDark ? "bg-violet-900/40 text-violet-300 font-bold" : "bg-violet-600 text-white font-black shadow-sm"
                    : isDark ? "text-zinc-300 hover:text-white" : "text-black hover:text-violet-950 font-bold"
                }`}
              >
                {cat === "all" ? t.filterAll : categoryLabel(cat, currentLanguage)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {filteredResources.length === 0 && (
        <div className={`rounded-2xl border border-dashed p-10 text-center ${
          isDark ? "border-white/10 text-zinc-400" : "border-purple-300 text-violet-950/70"
        }`}>
          <p className="text-xs font-semibold">{t.resourcesEmptyTitle}</p>
          <p className="text-[11px] mt-1 opacity-80">{t.resourcesEmptyHint}</p>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {filteredResources.map((res: any) => {
          const isRecommended = recommendedIds.includes(res.id);

          return (
          <div
            key={res.id}
            className={`rounded-2xl border p-5 transition backdrop-blur-md flex flex-col justify-between ${
              isRecommended && isDark ? "border-emerald-500/50 bg-emerald-950/10 shadow-[0_0_15px_rgba(16,185,129,0.05)]" :
              isRecommended && !isDark ? "border-emerald-400 bg-emerald-50 shadow-md" :
              isDark ? "border-violet-950/45 bg-zinc-950/35 hover:border-violet-800 text-white" : "border-2 border-purple-300 bg-white hover:border-violet-600 shadow-lg text-black hover:shadow-violet-900/5 duration-200"
            }`}
          >
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-1.5">
                {res.category && (
                  <span className={`inline-block text-[11px] font-mono font-bold tracking-wide px-2 py-0.5 rounded border ${
                    isDark ? "text-violet-400 bg-violet-950/30 border-violet-800/20" : "text-violet-950 bg-violet-100 border-violet-950/20 font-black shadow-sm"
                  }`}>
                    {categoryLabel(res.category, currentLanguage)}
                  </span>
                )}

                {isRecommended && (
                  <span className={`inline-flex items-center gap-1 text-[11px] font-mono font-bold uppercase tracking-widest px-2 py-0.5 rounded border ${
                    isDark ? "text-emerald-400 bg-emerald-950/30 border-emerald-800/20" : "text-emerald-700 bg-emerald-100 border-emerald-300 shadow-sm"
                  }`}>
                    <Sparkles className="h-3 w-3" /> {t.recommendedBadge}
                  </span>
                )}

                {isTrusted(res) && (
                  <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-bold font-mono tracking-wide text-emerald-400 border border-emerald-500/20">
                    {t.qualityVerified}
                  </span>
                )}

                {isProvisional(res) && (
                  <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-500/10 px-2 py-0.5 text-[11px] font-bold font-mono tracking-wide text-amber-500 border border-amber-500/20">
                    {t.qualityProvisional}
                  </span>
                )}

                {typeof res.rating === "number" && (
                  <span className="inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[11px] font-mono font-bold bg-amber-500/15 text-amber-500 border border-amber-500/25">
                    ★ {res.rating.toFixed(1)}
                  </span>
                )}

                {res.accessCost && (
                  <span className={`inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[11px] font-bold font-mono border ${
                    res.accessCost === "free"
                      ? "bg-sky-500/10 text-sky-400 border-sky-500/20"
                      : "bg-amber-500/10 text-amber-500 border-amber-500/20"
                  }`}>
                    {String(res.accessCost).toUpperCase()}
                  </span>
                )}

                {res.dataOrigin === "static" && (
                  <span
                    className={`inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[11px] font-bold font-mono border ${
                      isDark ? "bg-zinc-800/60 text-zinc-400 border-zinc-700" : "bg-zinc-100 text-zinc-600 border-zinc-300"
                    }`}
                    title={t.originCuratedHint}
                  >
                    {t.originCurated}
                  </span>
                )}
              </div>

              <h4 className={`text-sm font-bold tracking-tight leading-snug ${isDark ? "text-white" : "text-black font-black"}`}>
                {localizedText(res.title, currentLanguage)}
              </h4>
              {localizedText(res.description, currentLanguage) && (
                <p className={`text-[11px] leading-normal font-sans ${isDark ? "text-zinc-200" : "text-black font-semibold leading-relaxed"}`}>
                  {localizedText(res.description, currentLanguage)}
                </p>
              )}

              {res.tags && res.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 pt-1">
                  {res.tags.map((tag: string, idx: number) => (
                    <span
                      key={idx}
                      className={`text-[11px] font-mono font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded border ${
                        isDark ? "bg-zinc-900 text-zinc-400 border-violet-900/30" : "bg-purple-100/60 text-violet-950 border-purple-200/50"
                      }`}
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className={`pt-4 mt-4 border-t flex items-center justify-between ${isRecommended ? (isDark ? "border-emerald-900/30" : "border-emerald-200") : (isDark ? "border-violet-950/40" : "border-purple-200")}`}>
              <span className={`text-xs uppercase font-mono ${isDark ? "text-zinc-400" : "text-black font-black"}`}>
                {res.isFederal ? t.resourceFederal : t.resourceSwiss}
              </span>

              <a
                href={res.url}
                target="_blank"
                rel="noopener noreferrer"
                className={`inline-flex items-center gap-1.5 text-xs transition font-semibold ${
                  isDark ? "text-violet-300 hover:text-white" : "text-violet-700 hover:text-violet-950 font-black underline"
                }`}
              >
                <span>{t.visitWebsite}</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>
        )})}
      </div>
    </motion.div>
  );
}

/** Professions sub-panel - unchanged content/logic, moved here from dashboard.tsx. */
/** Placeholder rows while a catalog loads; the text stays available to screen readers. */
function ListSkeleton({ label, isDark }: { label: string; isDark: boolean }) {
  const bar = isDark ? "bg-white/[0.06]" : "bg-violet-200/60";
  return (
    <div role="status" aria-live="polite" className="space-y-2">
      <span className="sr-only">{label}</span>
      {[0, 1, 2, 3, 4].map(i => (
        <div key={i} aria-hidden="true" className={`w-full p-3.5 rounded-xl border animate-pulse ${isDark ? "border-white/5" : "border-purple-200"}`}>
          <div className={`h-3 rounded ${bar}`} style={{ width: `${70 - i * 7}%` }} />
          <div className={`h-2.5 rounded mt-2 ${bar}`} style={{ width: "35%" }} />
        </div>
      ))}
    </div>
  );
}

export function ProfessionsExplorer({ isDark, currentLanguage, t }: any) {
  const [professionsList, setProfessionsList] = useState<Profession[]>([]);
  const [profLoading, setProfLoading] = useState(true);
  const [profLoadError, setProfLoadError] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [catFilter, setCatFilter] = useState("all");
  const [selectedProf, setSelectedProf] = useState<Profession | null>(null);
  const [institutionLinks, setInstitutionLinks] = useState<ProfessionInstitutionLink[]>([]);

  // Curated profession -> institution pathways (see profession_institutions).
  // Fetched once, catalog-wide, same reasoning as learning_paths in
  // AdvisorReport: this is small reference data, not worth re-fetching per
  // selection.
  useEffect(() => {
    let active = true;
    DataRepository.getProfessionInstitutionLinks().then(links => {
      if (active) setInstitutionLinks(links);
    });
    return () => { active = false; };
  }, []);

  // HARD RULE (02_Product/Requirements/Trust and Data Requirements.md): never
  // invent data. A previous version of this component swapped in a mock
  // dataset with fabricated salaries whenever the real fetch was empty or
  // failed, with no indication to the user that the numbers weren't real.
  // The catalog is still small and growing (see Changelog.md) - an honest
  // "still growing" message is the right fallback, not fabricated content.
  useEffect(() => {
    let active = true;
    const fetchProfs = async () => {
      setProfLoading(true);
      setProfLoadError(false);
      try {
        const data = await DataRepository.getProfessions();
        if (active) setProfessionsList(data);
      } catch (err) {
        if (active) setProfLoadError(true);
      } finally {
        if (active) setProfLoading(false);
      }
    };
    fetchProfs();
    return () => { active = false; };
  }, []);

  const presentCategories: string[] = [];
  for (const profession of professionsList) {
    if (profession.category && !presentCategories.includes(profession.category)) {
      presentCategories.push(profession.category);
    }
  }
  const uniqueCategories: string[] = ["all", ...presentCategories];

  const selectedProfInstitutions = selectedProf
    ? institutionLinks.filter(link => link.professionId === selectedProf.id)
    : [];

  const needle = searchText.trim().toLowerCase();
  const filtered = professionsList.filter(p => {
    const titleText = localizedText(p.title, currentLanguage).toLowerCase();
    const descText = localizedText(p.description, currentLanguage).toLowerCase();
    const skills = localizedList(p.skillsRequired, currentLanguage).join(" ").toLowerCase();

    const matchesSearch =
      !needle ||
      titleText.includes(needle) ||
      descText.includes(needle) ||
      skills.includes(needle);

    const matchesCat = catFilter === "all" || p.category === catFilter;
    return matchesSearch && matchesCat;
  });

  return (
    <div className={`rounded-3xl border p-6 backdrop-blur-xl ${
      isDark ? "border-white/10 bg-[#06040a]/40" : "border-purple-250 bg-white shadow-xl"
    }`}>
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 border-b pb-4 mb-6 border-purple-200/10 text-left">
        <div>
          <span className={`block font-mono text-[11px] uppercase tracking-widest ${isDark ? "text-violet-400" : "text-violet-600 font-extrabold"}`}>
            {t.professionsEyebrow}
          </span>
          <h2 className={`text-base font-extrabold tracking-tight flex items-center gap-1.5 ${isDark ? "text-white" : "text-violet-950 font-black"}`}>
            <Briefcase className="h-4.5 w-4.5 text-violet-500 shrink-0" />
            {t.professionsTitle}
          </h2>
          <p className={`text-xs mt-0.5 leading-relaxed ${isDark ? "text-zinc-400" : "text-violet-950 font-semibold"}`}>
            {t.professionsSub}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full lg:w-auto text-left">
          <div className={`relative flex items-center rounded-xl p-1.5 pr-2 w-full sm:w-56 border ${
            isDark ? "bg-zinc-900/60 border-violet-950 text-white" : "bg-purple-50/50 border-purple-200 text-black"
          }`}>
            <Search className={`h-3.5 w-3.5 ml-1.5 mr-1.5 ${isDark ? "text-zinc-400" : "text-violet-650"}`} />
            <input
              type="text"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder={t.professionsSearchPlaceholder}
              aria-label={t.professionsSearchPlaceholder}
              className={`w-full bg-transparent text-[11px] focus:outline-none ${isDark ? "text-white placeholder-zinc-500" : "text-black placeholder-violet-950/40 font-bold"}`}
            />
          </div>

          <div className="flex flex-wrap gap-1">
            {uniqueCategories.map(cat => (
              <button
                key={cat}
                onClick={() => setCatFilter(cat)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition cursor-pointer ${
                  catFilter === cat
                    ? isDark ? "bg-violet-900/40 text-violet-300 border border-violet-800 font-extrabold" : "bg-violet-600 text-white font-black"
                    : isDark ? "text-zinc-400 hover:text-white border border-transparent" : "text-violet-950 hover:text-violet-600 font-extrabold"
                }`}
              >
                {cat === "all" ? t.filterAll : categoryLabel(cat, currentLanguage)}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-12 items-start">
        {/* Professions list selection column */}
        <div className="md:col-span-5 space-y-2 max-h-[380px] overflow-y-auto pr-1">
          {profLoading ? (
            <ListSkeleton label={t.professionsLoading} isDark={isDark} />
          ) : profLoadError ? (
            <div className={`text-center py-10 rounded-2xl border border-dashed ${isDark ? "border-amber-500/20 text-amber-500" : "border-amber-300 text-amber-700"}`}>
              <p className="text-xs">{t.professionsLoadError}</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className={`text-center py-10 rounded-2xl border border-dashed ${isDark ? "border-white/10 text-zinc-400" : "border-purple-200 text-violet-950/70"}`}>
              {/* Distinguish "search/filter narrowed to zero" from "catalog has
                  nothing yet" - conflating the two would either hide a real
                  empty-catalog state or wrongly blame the user's search. */}
              <p className="text-xs">{professionsList.length === 0 ? t.professionsCatalogGrowing : t.professionsEmpty}</p>
            </div>
          ) : (
            filtered.map(p => {
              const isSelected = selectedProf?.id === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => setSelectedProf(p)}
                  className={`w-full p-3.5 rounded-xl text-left transition border flex items-center justify-between gap-3 cursor-pointer ${
                    isSelected
                      ? isDark ? "border-violet-500 bg-violet-950/20 text-white shadow" : "border-2 border-violet-950 bg-violet-100 text-violet-950 font-black shadow-sm"
                      : isDark ? "border-white/5 bg-white/[0.02] hover:bg-white/[0.06] text-zinc-300" : "border-purple-200 bg-purple-50/40 hover:bg-violet-50 text-black font-semibold"
                  }`}
                >
                  <div className="space-y-1 truncate pr-1">
                    <span className="block font-bold text-xs truncate">
                      {localizedText(p.title, currentLanguage)}
                    </span>
                    <div className="flex items-center gap-1.5 text-[11px] font-mono text-zinc-400">
                      {p.category && (
                        <span className={`px-1.5 py-0.5 rounded border ${isDark ? "border-white/10 bg-black" : "border-purple-200 bg-white"}`}>{categoryLabel(p.category, currentLanguage)}</span>
                      )}

                      {isProvisional(p.status) && (
                        <span className="px-1.5 py-0.5 rounded border bg-amber-500/10 text-amber-500 border-amber-500/20">{t.qualityProvisional}</span>
                      )}
                      {isTrusted(p) && (
                        <span className="px-1.5 py-0.5 rounded border bg-emerald-500/10 text-emerald-400 border-emerald-500/20">{t.qualityVerified}</span>
                      )}

                      {typeof p.salaryCHF === "number" && (
                        <>
                          <span>•</span>
                          <span className={`${isDark ? "text-violet-300" : "text-violet-950 font-bold"}`}>CHF {(p.salaryCHF / 1000).toFixed(0)}k/yr</span>
                        </>
                      )}
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-violet-400 shrink-0" />
                </button>
              );
            })
          )}
        </div>

        {/* Selected Profession detail panel */}
        <div className="md:col-span-7 h-full text-left">
          {selectedProf ? (
            <AnimatePresence mode="wait">
              <motion.div
                key={selectedProf.id}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className={`rounded-2xl p-5 border flex flex-col justify-between space-y-4 h-full ${
                  isDark ? "bg-white/[0.01] border-white/5" : "bg-purple-100/30 border-purple-200 shadow-inner"
                }`}
              >
                <div className="space-y-4 text-left">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-3 border-purple-200/10">
                    <div>
                      <h3 className={`text-base font-extrabold flex items-center gap-1.5 leading-tight ${isDark ? "text-white" : "text-violet-950 font-black"}`}>
                        {localizedText(selectedProf.title, currentLanguage)}
                        {isTrusted(selectedProf) && (
                          <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0" />
                        )}
                        {isProvisional(selectedProf) && (
                          <span className="ml-2 inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[11px] font-mono font-bold bg-amber-500/15 text-amber-500 border border-amber-500/25">
                            {t.qualityProvisional}
                          </span>
                        )}
                      </h3>
                      {selectedProf.category && (
                        <span className={`inline-block text-[11px] font-mono px-1.5 py-0.5 mt-1 rounded ${
                          isDark ? "bg-violet-950/40 text-violet-300" : "bg-purple-100 text-violet-950 font-bold"
                        }`}>
                          {categoryLabel(selectedProf.category, currentLanguage)}
                        </span>
                      )}
                    </div>

                    {typeof selectedProf.salaryCHF === "number" ? (
                      <div className="text-right">
                        <div className="flex items-center gap-1 text-[11px] font-mono leading-none">
                          <Coins className="h-3.5 w-3.5 text-violet-400 shrink-0" />
                          <span className={`font-extrabold ${isDark ? "text-white" : "text-black"}`}>CHF {selectedProf.salaryCHF.toLocaleString()}</span>
                        </div>
                        <span className="text-[11px] uppercase tracking-wider font-mono text-zinc-400">{t.professionSalaryLabel}</span>
                      </div>
                    ) : null}
                  </div>

                  {localizedText(selectedProf.description, currentLanguage) && (
                    <p className={`text-[11.5px] leading-relaxed ${isDark ? "text-zinc-300" : "text-violet-950 font-semibold"}`}>
                      {localizedText(selectedProf.description, currentLanguage)}
                    </p>
                  )}

                  {currentLanguage !== "de" && selectedProf.targetGroup?.[currentLanguage] && (
                    <p className="text-[11px] italic text-zinc-400">{t.autoTranslatedNote}</p>
                  )}
                  {localizedText(selectedProf.targetGroup, currentLanguage) && (
                    <div className="card-premium p-3.5">
                      <span className="block text-[11px] font-mono uppercase tracking-wider text-violet-400 mb-1">{t.professionTargetGroupLabel}</span>
                      <p className={`text-xs leading-relaxed ${isDark ? "text-zinc-200" : "text-violet-950 font-semibold"}`}>
                        {localizedText(selectedProf.targetGroup, currentLanguage)}
                      </p>
                    </div>
                  )}

                  {(localizedText(selectedProf.educationRequired, currentLanguage) || typeof selectedProf.isApprenticeshipPath === "boolean") && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
                      {localizedText(selectedProf.educationRequired, currentLanguage) && (
                        <div className="card-premium p-3">
                          <span className="block text-[11px] font-mono uppercase tracking-wider text-violet-400 mb-1">
                            {t.professionEducationRequired}
                          </span>
                          <p className={`text-xs leading-relaxed font-semibold ${isDark ? "text-zinc-200" : "text-violet-950"}`}>
                            {localizedText(selectedProf.educationRequired, currentLanguage)}
                          </p>
                        </div>
                      )}

                      {typeof selectedProf.isApprenticeshipPath === "boolean" && (
                        <div className="card-premium p-3 text-left">
                          <span className="block text-[11px] font-mono uppercase tracking-wider text-violet-400 mb-1">
                            {t.professionVetLabel}
                          </span>
                          <span className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] font-bold font-mono ${
                            selectedProf.isApprenticeshipPath
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                              : "bg-violet-500/10 text-violet-400 border border-violet-500/20"
                          }`}>
                            {selectedProf.isApprenticeshipPath ? t.professionVetCompatible : t.professionVetTertiary}
                          </span>
                          {(selectedProf.demandLevel || selectedProf.outlook) && (
                            <div className="pt-2 border-t border-white/5 mt-2 flex items-center justify-between text-[11px] font-mono text-zinc-400">
                              {selectedProf.demandLevel && <span>{t.professionDemand}: {selectedProf.demandLevel}</span>}
                              {selectedProf.outlook && <span>{t.professionOutlook}: {selectedProf.outlook}</span>}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {(localizedText(selectedProf.dailyWorkContext, currentLanguage) || localizedText(selectedProf.typicalWorkplace, currentLanguage)) && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {localizedText(selectedProf.dailyWorkContext, currentLanguage) && (
                        <div className="card-premium p-3">
                          <span className="block text-[11px] font-mono uppercase tracking-wider text-violet-400 mb-1">{t.professionDailyWorkLabel}</span>
                          <p className={`text-xs leading-relaxed font-semibold ${isDark ? "text-zinc-200" : "text-violet-950"}`}>
                            {localizedText(selectedProf.dailyWorkContext, currentLanguage)}
                          </p>
                        </div>
                      )}
                      {localizedText(selectedProf.typicalWorkplace, currentLanguage) && (
                        <div className="card-premium p-3">
                          <span className="block text-[11px] font-mono uppercase tracking-wider text-violet-400 mb-1">{t.professionWorkplaceLabel}</span>
                          <p className={`text-xs leading-relaxed font-semibold ${isDark ? "text-zinc-200" : "text-violet-950"}`}>
                            {localizedText(selectedProf.typicalWorkplace, currentLanguage)}
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {localizedText(selectedProf.admissionReality, currentLanguage) && (
                    <div className="card-premium-accent p-3.5">
                      <span className="block text-[11px] font-mono uppercase tracking-wider text-violet-400 mb-1">{t.professionAdmissionRealityLabel}</span>
                      <p className={`text-xs leading-relaxed ${isDark ? "text-zinc-200" : "text-violet-950 font-semibold"}`}>
                        {localizedText(selectedProf.admissionReality, currentLanguage)}
                      </p>
                    </div>
                  )}

                  {localizedText(selectedProf.progressionNotes, currentLanguage) && (
                    <div className="card-premium p-3.5">
                      <span className="block text-[11px] font-mono uppercase tracking-wider text-violet-400 mb-1">{t.professionProgressionLabel}</span>
                      <p className={`text-xs leading-relaxed ${isDark ? "text-zinc-200" : "text-violet-950 font-semibold"}`}>
                        {localizedText(selectedProf.progressionNotes, currentLanguage)}
                      </p>
                    </div>
                  )}

                  {/* Skills Section */}
                  {localizedList(selectedProf.skillsRequired, currentLanguage).length > 0 && (
                    <div className="space-y-1.5 text-left">
                      <span className="block text-[11px] font-mono uppercase tracking-wider text-violet-400">
                        {t.professionSkillsLabel}
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {localizedList(selectedProf.skillsRequired, currentLanguage).map((skill: string, idx: number) => (
                          <span
                            key={idx}
                            className={`inline-flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded-lg ${
                              isDark ? "bg-white/5 border border-white/5 text-zinc-300" : "bg-purple-100 text-violet-950 font-bold border border-purple-200/40"
                            }`}
                          >
                            <Check className="h-2.5 w-2.5 text-violet-400 shrink-0" />
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Targeted Industries */}
                  {selectedProf.industries && selectedProf.industries.length > 0 && (
                    <div className="space-y-1.5 text-left">
                      <span className="block text-[11px] font-mono uppercase tracking-wider text-violet-400">
                        {t.professionClustersLabel}
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {selectedProf.industries.map((ind: string, idx: number) => (
                          <span
                            key={idx}
                            className={`text-[11px] font-mono uppercase tracking-widest px-2 py-0.5 rounded ${
                              isDark ? "bg-zinc-950 text-zinc-400 border border-violet-950/20" : "bg-white text-violet-950 font-extrabold border border-purple-200 shadow-sm"
                            }`}
                          >
                            {ind}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Where to study this - curated profession_institutions links.
                      Honest empty: most professions don't have one yet, so this
                      simply doesn't render rather than claiming full coverage. */}
                  {selectedProfInstitutions.length > 0 && (
                    <div className="space-y-1.5 text-left">
                      <span className="block text-[11px] font-mono uppercase tracking-wider text-violet-400">
                        {t.whereToStudyLabel}
                      </span>
                      <div className="space-y-1">
                        {selectedProfInstitutions.map(link => (
                          <div
                            key={link.id}
                            className={`flex items-center gap-2 text-xs px-2.5 py-1.5 rounded-lg ${
                              isDark ? "bg-white/5 border border-white/5 text-zinc-200" : "bg-purple-50 text-violet-950 font-semibold border border-purple-200/40"
                            }`}
                          >
                            <Landmark className="h-3 w-3 text-violet-400 shrink-0" />
                            <span className="flex-1 min-w-0 truncate">
                              {link.institutionTitle}
                              {link.institutionCity ? ` · ${link.institutionCity}` : ""}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            </AnimatePresence>
          ) : (
            <div className={`p-10 text-center rounded-2xl border border-dashed flex flex-col items-center justify-center h-full min-h-[280px] ${
              isDark ? "border-white/10 text-zinc-400 bg-white/[0.005]" : "border-purple-200 text-violet-950/70 bg-purple-50/10"
            }`}>
              <Briefcase className="h-6 w-6 text-violet-500 mb-2.5" />
              <p className="text-xs font-semibold">{t.professionSelectHint}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Institutions sub-panel - new, mirrors ProfessionsExplorer's list+detail
 * layout for a consistent feel. Previously institutions had no standalone
 * search UI at all - only reachable one at a time by clicking pins on the
 * map. Reuses InstitutionCompareModal (same component the map uses) so
 * comparison works identically from either surface.
 */
function InstitutionsExplorer({ isDark, currentLanguage, theme, t }: any) {
  const [institutionsList, setInstitutionsList] = useState<Institution[]>([]);
  const [instLoading, setInstLoading] = useState(true);
  const [instLoadError, setInstLoadError] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [catFilter, setCatFilter] = useState("all");
  const [selectedInst, setSelectedInst] = useState<Institution | null>(null);
  const [compareList, setCompareList] = useState<Institution[]>([]);
  const [showCompareModal, setShowCompareModal] = useState(false);

  useEffect(() => {
    let active = true;
    const fetchInstitutions = async () => {
      setInstLoading(true);
      setInstLoadError(false);
      try {
        const data = await DataRepository.getInstitutions();
        if (active) setInstitutionsList(data);
      } catch (err) {
        if (active) setInstLoadError(true);
      } finally {
        if (active) setInstLoading(false);
      }
    };
    fetchInstitutions();

    let subscription: any = null;
    (async () => {
      subscription = await DataRepository.subscribeToInstitutions(fetchInstitutions);
    })();

    return () => {
      active = false;
      if (subscription && typeof subscription.unsubscribe === "function") subscription.unsubscribe();
    };
  }, []);

  const presentCategories: string[] = [];
  for (const inst of institutionsList) {
    if (inst.category && !presentCategories.includes(inst.category)) presentCategories.push(inst.category);
  }
  const uniqueCategories: string[] = ["all", ...presentCategories];

  const needle = searchText.trim().toLowerCase();
  const filtered = institutionsList.filter(inst => {
    const titleText = (inst.title || "").toLowerCase();
    const descText = localizedText(inst.description, currentLanguage).toLowerCase();
    const matchesSearch = !needle || titleText.includes(needle) || descText.includes(needle) || (inst.canton || "").toLowerCase().includes(needle);
    const matchesCat = catFilter === "all" || inst.category === catFilter;
    return matchesSearch && matchesCat;
  });

  const isInCompare = (id: string) => compareList.some(i => i.id === id);
  const toggleCompare = (inst: Institution) => {
    setCompareList(prev => {
      if (prev.some(i => i.id === inst.id)) return prev.filter(i => i.id !== inst.id);
      if (prev.length >= MAX_COMPARE) return prev;
      return [...prev, inst];
    });
  };

  return (
    <div className={`rounded-3xl border p-6 backdrop-blur-xl relative ${
      isDark ? "border-white/10 bg-[#06040a]/40" : "border-purple-250 bg-white shadow-xl"
    }`}>
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 border-b pb-4 mb-6 border-purple-200/10 text-left">
        <div>
          <span className={`block font-mono text-[11px] uppercase tracking-widest ${isDark ? "text-violet-400" : "text-violet-600 font-extrabold"}`}>
            {t.institutionsEyebrow}
          </span>
          <h2 className={`text-base font-extrabold tracking-tight flex items-center gap-1.5 ${isDark ? "text-white" : "text-violet-950 font-black"}`}>
            <Landmark className="h-4.5 w-4.5 text-violet-500 shrink-0" />
            {t.institutionsTitle}
          </h2>
          <p className={`text-xs mt-0.5 leading-relaxed ${isDark ? "text-zinc-400" : "text-violet-950 font-semibold"}`}>
            {t.institutionsSub}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full lg:w-auto text-left">
          <div className={`relative flex items-center rounded-xl p-1.5 pr-2 w-full sm:w-56 border ${
            isDark ? "bg-zinc-900/60 border-violet-950 text-white" : "bg-purple-50/50 border-purple-200 text-black"
          }`}>
            <Search className={`h-3.5 w-3.5 ml-1.5 mr-1.5 ${isDark ? "text-zinc-400" : "text-violet-650"}`} />
            <input
              type="text"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder={t.institutionsSearchPlaceholder}
              aria-label={t.institutionsSearchPlaceholder}
              className={`w-full bg-transparent text-[11px] focus:outline-none ${isDark ? "text-white placeholder-zinc-500" : "text-black placeholder-violet-950/40 font-bold"}`}
            />
          </div>

          <div className="flex flex-wrap gap-1">
            {uniqueCategories.map(cat => (
              <button
                key={cat}
                onClick={() => setCatFilter(cat)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition cursor-pointer ${
                  catFilter === cat
                    ? isDark ? "bg-violet-900/40 text-violet-300 border border-violet-800 font-extrabold" : "bg-violet-600 text-white font-black"
                    : isDark ? "text-zinc-400 hover:text-white border border-transparent" : "text-violet-950 hover:text-violet-600 font-extrabold"
                }`}
              >
                {cat === "all" ? t.filterAll : categoryLabel(cat, currentLanguage)}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-12 items-start">
        {/* Institutions list selection column */}
        <div className="md:col-span-5 space-y-2 max-h-[420px] overflow-y-auto pr-1">
          {instLoading ? (
            <ListSkeleton label={t.institutionsLoading} isDark={isDark} />
          ) : instLoadError ? (
            <div className={`text-center py-10 rounded-2xl border border-dashed ${isDark ? "border-amber-500/20 text-amber-500" : "border-amber-300 text-amber-700"}`}>
              <p className="text-xs">{t.institutionsLoadError}</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className={`text-center py-10 rounded-2xl border border-dashed ${isDark ? "border-white/10 text-zinc-400" : "border-purple-200 text-violet-950/70"}`}>
              <p className="text-xs">{institutionsList.length === 0 ? t.institutionsCatalogGrowing : t.institutionsEmpty}</p>
            </div>
          ) : (
            filtered.map(inst => {
              const isSelected = selectedInst?.id === inst.id;
              return (
                <button
                  key={inst.id}
                  onClick={() => setSelectedInst(inst)}
                  className={`w-full p-3.5 rounded-xl text-left transition border flex items-center justify-between gap-3 cursor-pointer ${
                    isSelected
                      ? isDark ? "border-violet-500 bg-violet-950/20 text-white shadow" : "border-2 border-violet-950 bg-violet-100 text-violet-950 font-black shadow-sm"
                      : isDark ? "border-white/5 bg-white/[0.02] hover:bg-white/[0.06] text-zinc-300" : "border-purple-200 bg-purple-50/40 hover:bg-violet-50 text-black font-semibold"
                  }`}
                >
                  <div className="space-y-1 truncate pr-1">
                    <span className="block font-bold text-xs truncate">{inst.title}</span>
                    <div className="flex items-center gap-1.5 text-[11px] font-mono text-zinc-400">
                      {inst.category && (
                        <span className={`px-1.5 py-0.5 rounded border ${isDark ? "border-white/10 bg-black" : "border-purple-200 bg-white"}`}>{categoryLabel(inst.category, currentLanguage)}</span>
                      )}
                      {inst.canton && <span>{inst.canton}</span>}
                      {isProvisional(inst.status) && (
                        <span className="px-1.5 py-0.5 rounded border bg-amber-500/10 text-amber-500 border-amber-500/20">{t.qualityProvisional}</span>
                      )}
                      {isTrusted(inst) && (
                        <span className="px-1.5 py-0.5 rounded border bg-emerald-500/10 text-emerald-400 border-emerald-500/20">{t.qualityVerified}</span>
                      )}
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-violet-400 shrink-0" />
                </button>
              );
            })
          )}
        </div>

        {/* Selected Institution detail panel */}
        <div className="md:col-span-7 h-full text-left">
          {selectedInst ? (
            <AnimatePresence mode="wait">
              <motion.div
                key={selectedInst.id}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className={`rounded-2xl p-5 border h-full ${
                  isDark ? "bg-white/[0.01] border-white/5" : "bg-purple-100/30 border-purple-200 shadow-inner"
                }`}
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
            </AnimatePresence>
          ) : (
            <div className={`p-10 text-center rounded-2xl border border-dashed flex flex-col items-center justify-center h-full min-h-[280px] ${
              isDark ? "border-white/10 text-zinc-400 bg-white/[0.005]" : "border-purple-200 text-violet-950/70 bg-purple-50/10"
            }`}>
              <Landmark className="h-6 w-6 text-violet-500 mb-2.5" />
              <p className="text-xs font-semibold">{t.institutionSelectHint}</p>
            </div>
          )}
        </div>
      </div>

      {/* Floating compare tray - same pattern and same InstitutionCompareModal as the map */}
      {compareList.length > 0 && (
        <div className={`sticky bottom-4 z-20 mt-4 flex flex-wrap items-center gap-2 rounded-2xl border px-3.5 py-2.5 backdrop-blur-md shadow-xl ${
          isDark ? "bg-zinc-950/90 border-white/15" : "bg-white/95 border-purple-200"
        }`}>
          <div className="flex items-center gap-1.5">
            <Scale className="h-3.5 w-3.5 text-violet-500 shrink-0" />
            <span className={`text-xs font-mono uppercase tracking-wider ${isDark ? "text-zinc-400" : "text-violet-950/70 font-black"}`}>
              {t.compareBarLabel} ({compareList.length}/{MAX_COMPARE})
            </span>
          </div>
          {compareList.map(inst => (
            <span key={inst.id} className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold max-w-[140px] ${
              isDark ? "bg-white/10 text-zinc-200" : "bg-purple-100 text-violet-950"
            }`}>
              <span className="truncate">{inst.title}</span>
              <button onClick={() => toggleCompare(inst)} aria-label={t.compareRemove}><X className="h-3 w-3 shrink-0" /></button>
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
            className="btn-primary flex items-center gap-1.5 px-3 py-1.5 text-xs tracking-wide disabled:opacity-40 disabled:cursor-not-allowed ml-auto"
          >
            {t.compareViewButton}
          </button>
        </div>
      )}

      {showCompareModal && compareList.length >= 2 && (
        <InstitutionCompareModal
          institutions={compareList}
          currentLanguage={currentLanguage as LanguageCode}
          theme={theme}
          onClose={() => setShowCompareModal(false)}
          onRemove={id => setCompareList(prev => prev.filter(i => i.id !== id))}
        />
      )}
    </div>
  );
}
