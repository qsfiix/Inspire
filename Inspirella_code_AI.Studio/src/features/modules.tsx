import React, { useState } from "react";
import { motion } from "motion/react";
import { Search, ExternalLink, User, ShieldCheck, Sparkles } from "lucide-react";
import { LanguageCode } from "../types";
import { useEducationEngine } from "../engine/useEducationEngine";

export function ResourcesView({ t, isDark, currentLanguage, resourcesList, userProfile }: any) {
  const [resourceSearch, setResourceSearch] = useState("");
  const [resourceCategoryFilter, setResourceCategoryFilter] = useState("all");

  const { recommendation, loading } = useEducationEngine(userProfile || null);
  const recommendedIds = recommendation?.resources.map(r => r.resource.id) || [];

  const filteredResources = resourcesList.filter((res: any) => {
    const matchesSearch =
      res.title[currentLanguage].toLowerCase().includes(resourceSearch.toLowerCase()) ||
      res.description[currentLanguage].toLowerCase().includes(resourceSearch.toLowerCase());
    const matchesCat = resourceCategoryFilter === "all" || res.category === resourceCategoryFilter;
    return matchesSearch && matchesCat;
  });

  return (
    <motion.div
      key="view-resources"
      initial={{ opacity: 0, x: 15 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -15 }}
      className="space-y-6"
    >
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className={`text-xl font-bold tracking-tight ${isDark ? "text-white" : "text-black font-black"}`}>Swiss Authorities</h1>
          <p className={`text-xs mt-0.5 ${isDark ? "text-zinc-300" : "text-black font-bold"}`}>Official Swiss educational resources and administration.</p>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <div className={`relative flex items-center rounded-xl p-1.5 pr-2 w-full sm:w-60 border ${
            isDark ? "bg-zinc-900/60 border-violet-950 text-white" : "bg-white border-purple-300 shadow-sm text-black"
          }`}>
            <Search className={`h-4 w-4 ml-1.5 mr-2 ${isDark ? "text-zinc-400" : "text-violet-600"}`} />
            <input
              type="text"
              value={resourceSearch}
              onChange={(e) => setResourceSearch(e.target.value)}
              placeholder="Search credentials..."
              className={`w-full bg-transparent text-xs focus:outline-none ${isDark ? "text-white placeholder-zinc-500" : "text-black placeholder-violet-950/40 font-bold"}`}
            />
          </div>

          <div className={`flex rounded-xl p-1 border ${
            isDark ? "bg-zinc-900/60 border-violet-950" : "bg-purple-100 border-2 border-purple-300 shadow-sm"
          }`}>
            {["all", "official_portal", "apprenticeship", "scholarship", "visa_guide"].map((cat) => (
              <button
                key={cat}
                onClick={() => setResourceCategoryFilter(cat)}
                className={`px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider rounded-lg transition shrink-0 cursor-pointer ${
                  resourceCategoryFilter === cat
                    ? isDark ? "bg-violet-900/40 text-violet-300 font-bold" : "bg-violet-600 text-white font-black shadow-sm"
                    : isDark ? "text-zinc-300 hover:text-white" : "text-black hover:text-violet-950 font-bold"
                }`}
              >
                {cat.replace("_", " ")}
              </button>
            ))}
          </div>
        </div>
      </div>

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
                <div className="flex items-center justify-between">
                  <span className={`inline-block text-[9px] font-mono font-bold uppercase tracking-widest px-2 py-0.5 rounded border ${
                    isDark ? "text-violet-400 bg-violet-950/30 border-violet-800/20" : "text-violet-950 bg-violet-100 border-violet-950/20 font-black shadow-sm"
                  }`}>
                    {res.category.replace("_", " ")}
                  </span>
                  
                  {isRecommended && (
                    <span className={`inline-flex items-center gap-1 text-[9px] font-mono font-bold uppercase tracking-widest px-2 py-0.5 rounded border ${
                      isDark ? "text-emerald-400 bg-emerald-950/30 border-emerald-800/20" : "text-emerald-700 bg-emerald-100 border-emerald-300 shadow-sm"
                    }`}>
                      <Sparkles className="h-3 w-3" /> Recommended
                    </span>
                  )}
                </div>
                
                <h4 className={`text-sm font-bold tracking-tight leading-snug mt-2 ${isDark ? "text-white" : "text-black font-black"}`}>
                  {res.title[currentLanguage]}
                </h4>
                <p className={`text-[11px] leading-normal font-sans ${isDark ? "text-zinc-200" : "text-black font-semibold leading-relaxed"}`}>
                  {res.description[currentLanguage]}
                </p>
              </div>

              <div className={`pt-4 mt-4 border-t flex items-center justify-between ${isRecommended ? (isDark ? "border-emerald-900/30" : "border-emerald-200") : (isDark ? "border-violet-950/40" : "border-purple-200")}`}>
                <span className={`text-[10px] uppercase font-mono ${isDark ? "text-zinc-400" : "text-black font-black"}`}>
                  {res.isFederal ? "FEDERAL RESOURCE" : "SWISS RESOURCE"}
                </span>
                <a
                  href={res.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`inline-flex items-center gap-1.5 text-xs transition font-semibold ${
                    isDark ? "text-violet-300 hover:text-white" : "text-violet-700 hover:text-violet-950 font-black underline"
                  }`}
                >
                  <span>Visit Website</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}

export function ProfileView({ t, isDark, userProfile, currentLanguage, handleLanguageChange, handleLogout }: any) {
  return (
    <motion.div
      key="view-profile"
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0 }}
      className="max-w-2xl mx-auto space-y-6 py-4"
    >
      <div className={`rounded-2xl border p-6 space-y-6 backdrop-blur-md ${isDark ? "border-violet-950 bg-zinc-950/40 text-white" : "border-2 border-purple-300 bg-white text-black shadow-lg"}`}>
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 shadow-xl">
            <User className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className={`text-base font-bold uppercase tracking-wide ${isDark ? "text-white" : "text-black font-black"}`}>
              {userProfile?.name || "Guest"}
            </h2>
            <p className={`text-xs font-mono ${isDark ? "text-violet-400" : "text-violet-700 font-black"}`}>ID: CH-{Math.floor(Math.random() * 900000 + 100000)}</p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 text-xs">
          <div className={`p-3 rounded-xl border ${isDark ? "bg-zinc-900/30 border-violet-950" : "bg-purple-100 border-2 border-purple-300 shadow-sm"}`}>
            <span className={`block text-[9px] font-mono uppercase mb-1 ${isDark ? "text-zinc-400" : "text-black font-black"}`}>{t.profileUserAddress}</span>
            <span className={`truncate block font-semibold ${isDark ? "text-zinc-200" : "text-black"}`}>{userProfile?.email || "anonymous@inspirella.ch"}</span>
          </div>

          <div className={`p-3 rounded-xl border ${isDark ? "bg-zinc-900/30 border-violet-950" : "bg-purple-100 border-2 border-purple-300 shadow-sm"}`}>
            <span className={`block text-[9px] font-mono uppercase mb-1 ${isDark ? "text-zinc-400" : "text-black font-black"}`}>Active Stage</span>
            <span className={`block uppercase font-black ${isDark ? "text-zinc-200" : "text-black"}`}>
              {userProfile?.currentStage ? t[userProfile.currentStage as keyof typeof t] || userProfile.currentStage : "Bypassed Onboarding"}
            </span>
          </div>
        </div>

        <div className="space-y-2">
          <span className={`block text-xs font-mono uppercase ${isDark ? "text-zinc-300" : "text-black font-black"}`}>Change Active Language</span>
          <div className="flex flex-wrap gap-2">
            {[
              { code: "en", label: "English" },
              { code: "de", label: "Deutsch" },
              { code: "fr", label: "Français" },
              { code: "it", label: "Italiano" }
            ].map((l) => (
              <button
                key={l.code}
                onClick={() => handleLanguageChange(l.code as LanguageCode)}
                className={`px-4 py-2 text-xs font-semibold rounded-lg border transition cursor-pointer ${
                  currentLanguage === l.code
                    ? isDark ? "border-violet-500 bg-violet-950/30 text-white animate-pulse" : "bg-violet-600 text-white border-transparent font-black shadow-md"
                    : isDark ? "border-violet-950/50 bg-zinc-900/20 text-zinc-300 hover:border-violet-800" : "border-purple-300 bg-purple-50 hover:bg-violet-100 text-black font-bold shadow-sm"
                }`}
              >
                {l.label}
              </button>
            ))}
          </div>
        </div>

        <div className={`pt-4 border-t text-[10px] font-mono space-y-1 ${isDark ? "border-violet-950/40 text-zinc-400" : "border-purple-200 text-black font-extrabold"}`}>
          <div>{t.profileTheme}</div>
          <div>{t.profileRegion}: Geneva, Switzerland (CH)</div>
          <div>{t.registeredAt}: {userProfile?.createdAt ? new Date(userProfile.createdAt).toLocaleString() : "Active Session"}</div>
        </div>

        <button
          onClick={handleLogout}
          className="w-full h-10 flex items-center justify-center rounded-lg bg-zinc-900 border border-red-950 hover:bg-red-950/10 text-xs font-bold tracking-wider text-red-400 hover:text-red-300 transition cursor-pointer"
        >
          Clear Cached Session & Reset Demo
        </button>
      </div>
    </motion.div>
  );
}
