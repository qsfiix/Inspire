import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { BookOpen, Milestone, Sparkles, Search, ExternalLink, User, Briefcase, TrendingUp, Coins, Clock, ShieldCheck, Check, ChevronRight } from "lucide-react";
import { SWISS_EDUCATION_LEVELS } from "../data";
import { DataRepository } from "../data/Repository";
import AdvisorReport from "../components/AdvisorReport";
import { EducationLevel, LanguageCode, Profession } from "../types";
import { useEducationEngine } from "../engine/useEducationEngine";

export function DashboardView({
  t,
  isDark,
  currentLanguage,
  userProfile,
  theme,
  handleTabTransition
}: any) {
  const [selectedSystemLevel, setSelectedSystemLevel] = useState<EducationLevel | null>(SWISS_EDUCATION_LEVELS[2]);

  return (
    <motion.div
      key="view-dashboard"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      className="space-y-8"
    >
      <section className="card-premium flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-6 relative overflow-hidden text-left">
        <div className="space-y-1">
          <span className={`block font-mono text-[9px] uppercase tracking-widest ${isDark ? "text-violet-300" : "text-violet-600 font-black"}`}>
            {userProfile?.isGuest ? "Guest Workspace Active" : "Personal Workspace Active"}
          </span>
          <h1 className={`text-xl md:text-2xl font-bold tracking-tight ${isDark ? "text-white" : "text-black font-extrabold"}`}>
            {t.welcomeBack} {userProfile?.name}!
            {userProfile?.isGuest && (
              <span className={`ml-2 inline-flex items-center gap-1 text-[10px] font-mono tracking-widest px-2 py-0.5 rounded border align-middle ${
                isDark ? "text-amber-400 bg-amber-500/10 border-amber-500/30" : "text-amber-700 bg-amber-100 border-amber-400"
              }`}>
                TEMPORARY GUEST
              </span>
            )}
          </h1>
          <p className={`text-xs ${isDark ? "text-zinc-400" : "text-black font-bold"}`}>{t.allSystemsGo}</p>
        </div>

        <div className="flex flex-wrap gap-2 font-mono text-[10px]">
          <div className={`rounded-lg p-2.5 border backdrop-blur-md ${isDark ? "bg-white/5 border-white/10" : "bg-purple-100 border border-purple-300"}`}>
            <span className={`block uppercase text-[8px] mb-1 ${isDark ? "text-zinc-400" : "text-black font-extrabold"}`}>LANGUAGE CORE</span>
            <span className={`font-bold ${isDark ? "text-white" : "text-black font-black"}`}>{currentLanguage.toUpperCase()}</span>
          </div>
          <div className={`rounded-lg p-2.5 border backdrop-blur-md ${isDark ? "bg-white/5 border-white/10" : "bg-purple-100 border border-purple-300"}`}>
            <span className={`block uppercase text-[8px] mb-1 ${isDark ? "text-zinc-400" : "text-black font-extrabold"}`}>DATA SYNC</span>
            <span className={`font-bold flex items-center gap-1 ${isDark ? "text-white" : "text-black font-black"}`}>
              {userProfile?.syncState === "cloud" ? (
                 <><span className="h-1.5 w-1.5 rounded-full bg-sky-400 animate-pulse"></span> CLOUD </>
              ) : (
                 <><span className="h-1.5 w-1.5 rounded-full bg-amber-400"></span> LOCAL </>
              )}
            </span>
          </div>
          <div className={`rounded-lg p-2.5 border backdrop-blur-md ${isDark ? "bg-white/5 border-white/10" : "bg-purple-100 border border-purple-300"}`}>
            <span className={`block uppercase text-[8px] mb-1 ${isDark ? "text-zinc-400" : "text-black font-extrabold"}`}>GEOGRAPHIC SEGMENT</span>
            <span className={`font-bold ${isDark ? "text-white" : "text-black font-black"}`}>CH</span>
          </div>
        </div>
      </section>

      <section>
        <AdvisorReport
          userProfile={userProfile}
          interests={userProfile?.interests || ["academic"]}
          goals={userProfile?.goals || ["study_active"]}
          currentStage={userProfile?.currentStage || "stage_university"}
          language={currentLanguage}
          theme={theme}
        />
      </section>

      <section className="space-y-4">
        <div className={`flex items-center justify-between border-b pb-2 ${isDark ? "border-white/10" : "border-purple-300"}`}>
          <div className="flex items-center gap-1.5">
            <BookOpen className={`h-4.5 w-4.5 ${isDark ? "text-violet-300" : "text-violet-950"}`} />
            <h3 className={`text-sm font-semibold tracking-tight ${isDark ? "text-white" : "text-black font-black"}`}>{t.personalizedGoalTitle}</h3>
          </div>
          <span className={`text-[10px] font-mono uppercase ${isDark ? "text-zinc-400" : "text-black font-black"}`}>Select stage variable to drill down</span>
        </div>

        <div className="grid gap-2 grid-cols-2 md:grid-cols-4">
          {SWISS_EDUCATION_LEVELS.map((level) => (
            <button
              key={level.id}
              onClick={() => setSelectedSystemLevel(level)}
              className={`p-3.5 text-left rounded-xl border text-xs font-semibold transition cursor-pointer ${
                selectedSystemLevel?.id === level.id
                  ? isDark ? "border-violet-500 bg-violet-950/20 text-white" : "border-2 border-violet-950 bg-violet-100 text-violet-950 font-black shadow-sm"
                  : isDark ? "border-white/10 bg-white/5 text-zinc-300 hover:border-white/20 hover:text-white" : "border-2 border-purple-300 bg-purple-50/50 text-black font-bold h-full hover:bg-violet-100"
              }`}
            >
              <span className="block truncate">{level.title[currentLanguage]}</span>
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {selectedSystemLevel && (
            <motion.div
              key={selectedSystemLevel.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="card-premium p-6 space-y-6 text-left"
            >
              <div className="space-y-2">
                <h4 className={`text-base font-extrabold ${isDark ? "text-white" : "text-black font-black"}`}>{selectedSystemLevel.title[currentLanguage]}</h4>
                <span className={`inline-block text-[10px] font-mono tracking-wider px-2.5 py-0.5 rounded border ${
                  isDark ? "text-violet-300 bg-white/10 border-white/10" : "text-violet-950 bg-violet-100 border-violet-950/30 font-black shadow-sm"
                }`}>
                  {selectedSystemLevel.sub[currentLanguage]}
                </span>
                <p className={`text-xs leading-relaxed font-sans ${isDark ? "text-zinc-200" : "text-black font-semibold"}`}>{selectedSystemLevel.description[currentLanguage]}</p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {selectedSystemLevel.keyFacts[currentLanguage].map((fact, index) => (
                  <div key={index} className="card-premium-accent p-3.5 text-left">
                    <span className={`block font-mono text-[9px] uppercase mb-1 ${isDark ? "text-zinc-400" : "text-black font-black"}`}>Criterium {index + 1}</span>
                    <p className={`text-[11px] leading-relaxed font-sans ${isDark ? "text-zinc-200" : "text-black font-bold"}`}>{fact}</p>
                  </div>
                ))}
              </div>

              <div className="space-y-4">
                <span className={`block text-[11px] font-mono uppercase tracking-widest flex items-center gap-1 ${
                  isDark ? "text-zinc-300" : "text-black font-black"
                }`}>
                  <Milestone className={`h-3.5 w-3.5 ${isDark ? "text-violet-300" : "text-violet-950"}`} />
                  Swiss Progression Sequence
                </span>

                <div className="grid gap-4 md:grid-cols-2">
                  {selectedSystemLevel.pathSteps.map((step) => (
                    <div key={step.id} className="card-premium-accent p-4 text-left">
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className={`font-black text-xs ${isDark ? "text-violet-300" : "text-black bg-purple-100 px-1.5 py-0.5 rounded border border-purple-900/10 inline-block"}`}>{step.title[currentLanguage]}</span>
                        {step.timeframe && (
                          <span className={`rounded px-2 py-0.5 font-mono text-[9px] border ${
                            isDark ? "bg-white/10 text-violet-300 border-white/5" : "bg-violet-950 text-white border-transparent shadow-sm font-black"
                          }`}>
                            {step.timeframe[currentLanguage]}
                          </span>
                        )}
                      </div>
                      <p className={`text-[10.5px] mt-1 leading-relaxed ${isDark ? "text-zinc-300" : "text-black font-semibold"}`}>{step.description[currentLanguage]}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className={`p-4 rounded-xl border text-xs leading-relaxed backdrop-blur-sm ${
                isDark ? "border-white/10 bg-white/[0.02] text-zinc-200" : "border-2 border-purple-300 bg-emerald-500/15 text-black"
              }`}>
                <span className={`block text-[9px] font-mono uppercase tracking-widest font-semibold mb-1 ${
                  isDark ? "text-emerald-400" : "text-emerald-950 font-black animate-pulse"
                }`}>
                  Swiss High Permeability Principle (Durchlässigkeit)
                </span>
                <p className={`text-[11px] ${isDark ? "text-zinc-300" : "text-black font-bold"}`}>{selectedSystemLevel.permeabilityText[currentLanguage]}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      <section className="space-y-4">
        <div className={`flex items-center gap-1.5 border-b pb-2 ${isDark ? "border-white/10" : "border-purple-300"}`}>
          <Sparkles className="h-4.5 w-4.5 text-violet-500 animate-pulse" />
          <h3 className={`text-sm font-semibold uppercase tracking-wider ${isDark ? "text-white" : "text-violet-950 font-black"}`}>{t.quickAccess}</h3>
        </div>

        <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
          {[
            { id: "map", label: t.navMap, desc: "Explore university locations.", color: "hover:border-violet-500/20" },
            { id: "resources", label: t.navResources, desc: "Browse visas & scholarships.", color: "hover:border-indigo-500/20" },
            { id: "tracker", label: t.navTracker, desc: "Set educational actions & daily habits.", color: "hover:border-purple-500/20" },
            { id: "profile", label: t.navProfile, desc: "Setup region and language preferences.", color: "hover:border-white/20" }
          ].map((portal) => (
            <button
              key={portal.id}
              onClick={() => handleTabTransition(portal.id)}
              className={`p-4 text-left rounded-xl border transition backdrop-blur-md cursor-pointer ${
                isDark 
                  ? "border-white/10 bg-white/5 text-zinc-300 hover:bg-white/10" 
                  : "border-purple-200 bg-white text-violet-950 hover:bg-violet-50 hover:shadow-md"
              } ${portal.color}`}
            >
              <span className={`block font-bold text-xs ${isDark ? "text-white" : "text-indigo-950 font-black"}`}>{portal.label}</span>
              <span className={`block text-[10px] mt-1 leading-normal ${isDark ? "text-zinc-400" : "text-violet-900/60 font-bold"}`}>{portal.desc}</span>
            </button>
          ))}
        </div>
      </section>

      {/* SECTION: Interactive Swiss Vocation & Career Directory */}
      <section className="space-y-4 pt-4">
        <ProfessionsExplorer isDark={isDark} currentLanguage={currentLanguage} t={t} />
      </section>
    </motion.div>
  );
}

const MOCK_PROFESSIONS_FALLBACK: Profession[] = [
  {
    id: "soft_eng",
    title: { en: "Software Engineer", de: "Software-Entwickler", fr: "Ingénieur Logiciel", it: "Ingegnere del Software" },
    description: {
      en: "Architects and develops distributed backend systems and responsive web platforms. Crucial for Switzerland's expanding banking-tech/crypto clusters.",
      de: "Konzipiert und entwickelt verteilte Backend-Systeme. Entscheidend für die Schweizer Banken- und Krypto-Cluster.",
      fr: "Conçoit et développe des architectures logicielles. Essentiel pour les pôles fintech et cryptographiques suisses.",
      it: "Progetta e sviluppa sistemi software complessi, fondamentali per i cluster fintech e cripto svizzeri."
    },
    category: "tech",
    salaryCHF: 115000,
    outlook: "high",
    educationRequired: {
      en: "BSc/MSc in Computer Science or Higher Professional College (HF) diploma.",
      de: "Bachelor/Master in Informatik oder Diplom einer Höheren Fachschule (HF).",
      fr: "Bachelor/Master en Informatique ou diplôme d'une École supérieure (ES).",
      it: "Corso di Laurea in Informatica o diploma di Scuola Specializzata Superiore (SSS)."
    },
    verified: true,
    demandLevel: "Very High",
    growthRatePct: 14.5,
    avgWorkHoursWeekly: 42,
    flexibilityScore: 9,
    skillsRequired: {
      en: ["TypeScript", "Docker", "Database Design", "Kubernetes", "Swiss Security Standards"],
      de: ["TypeScript", "Docker", "Datenbank-Design", "Systemarchitektur"],
      fr: ["TypeScript", "Docker", "Sûreté des données", "Génie logiciel"],
      it: ["TypeScript", "Docker", "Progettazione database", "Sicurezza svizzera"]
    },
    industries: ["Fintech", "Medtech", "Watchmaking Analytics", "Crypto Valley"],
    isApprenticeshipPath: true
  },
  {
    id: "health_asst",
    title: { en: "Healthcare Assistant (FaGe)", de: "Fachmann Gesundheit (FaGe)", fr: "Assistant en Soins (ASSC)", it: "Operatore Sociosanitario (OSS)" },
    description: {
      en: "Provides dedicated nursing care, support, and administrative assistance in Swiss cantonal hospitals, care circles, and specialized care facilities.",
      de: "Bietet pflegerische Betreuung und Unterstützung in Schweizer Spitälern, Pflegeheimen und Spitex-Diensten.",
      fr: "Assure des prestations de soins et d'assistance dans les hôpitaux cantonaux, EMS et organisations de soins à domicile (Aide et soins à domicile).",
      it: "Fornisce assistenza sociosanitaria e infermieristica negli ospedali cantonali e nelle case di riposo."
    },
    category: "health",
    salaryCHF: 72000,
    outlook: "high",
    educationRequired: {
      en: "3-year Vocational Education and Training (VET/EFZ) apprenticeship.",
      de: "3-jährige Berufslehre mit eidgenössischem Fähigkeitszeugnis (EFZ).",
      fr: "Apprentissage de 3 ans avec Certificat fédéral de capacité (CFC).",
      it: "Apprendistato triennale con Attestato federale di capacità (AFC)."
    },
    verified: true,
    demandLevel: "Very High",
    growthRatePct: 18.2,
    avgWorkHoursWeekly: 40,
    flexibilityScore: 5,
    skillsRequired: {
      en: ["Patient Care", "Clinical Diagnostics", "Medical Compliance", "First Aid"],
      de: ["Patientenpflege", "Klinische Diagnostik", "Hygiene", "Erste Hilfe"],
      fr: ["Soins", "Suivi clinique", "Règles d'hygiène", "Urgences"],
      it: ["Cura dei pazienti", "Diagnostica clinica", "Soccorso iniziale", "Igiene"]
    },
    industries: ["Cantonal Hospitals", "Spitex In-Home Care", "Medical Wellness"],
    isApprenticeshipPath: true
  },
  {
    id: "mech_eng",
    title: { en: "Precision Micro-Engineer", de: "Mikrotechnologe", fr: "Microtechnicien de précision", it: "Microtecnico di precisione" },
    description: {
      en: "Designs ultra-precise micromechanical gears, sensors, and aerospace instruments. Deeply connected to the Swiss watchmaking heritage.",
      de: "Konstruiert hochpräzise mikromechanische Bauteile. Eng verbunden mit die Schweizer Uhrentradition.",
      fr: "Conçoit des pièces micromécaniques d'extrême précision. Lié à la haute horlogerie et aux technologies médicales.",
      it: "Progetta ingranaggi micromecanici di alta precisione. Legato all'orologeria di lusso e alla microelettronica."
    },
    category: "engineering",
    salaryCHF: 95000,
    outlook: "medium",
    educationRequired: {
      en: "Apprenticeship with EFZ plus Higher College HF course, or University of Applied Sciences degree.",
      de: "Berufslehre EFZ mit Weiterbildung HF, oder Fachhochschulstudium.",
      fr: "CFC de micromécanicien élargi par un diplôme ES ou HES.",
      it: "Apprendistato AFC integrato da diploma SSS o SUP."
    },
    verified: true,
    demandLevel: "High",
    growthRatePct: 8.5,
    avgWorkHoursWeekly: 41,
    flexibilityScore: 6,
    skillsRequired: {
      en: ["CAD Modeling", "CNC Precision Machining", "Sensor Design", "Microfluidics"],
      de: ["CAD-Modellierung", "CNC-Präzisionsfertigung", "Feinwerktechnik"],
      fr: ["Modélisation CAD", "Usinage CNC", "Haute horlogerie", "Microfluidique"],
      it: ["Modellazione CAD", "Lavorazione CNC", "Orologeria", "Microfluidica"]
    },
    industries: ["Watchmaking conglomerates", "Aerospace components", "Biotech implants"],
    isApprenticeshipPath: true
  },
  {
    id: "fin_adviser",
    title: { en: "Financial Specialist", de: "Finanzfachmann", fr: "Expert en Finance d'Investissement", it: "Specialista in Finanza" },
    description: {
      en: "Optimizes capital structures, handles investment risk analytics, and structures private wealth configurations in Zurich & Geneva markets.",
      de: "Optimiert Kapitalstrukturen und verwaltet Anlagerisiken in den Marken Zürich und Genf.",
      fr: "Optimise les structures de capital et évalue les risques d'investissement à Genève et Zurich.",
      it: "Ottimizza strutture di capitale e analizza i rischi d'investimento nelle piazze di Zurigo e Ginevra."
    },
    category: "business",
    salaryCHF: 125000,
    outlook: "high",
    educationRequired: {
      en: "MSc in Quantitative Finance, or certified Swiss Federal Diploma in Financial Analysis.",
      de: "Master in Quantitative Finance oder Eidg. Diplom Finanzanalytiker.",
      fr: "Master en finance quantitative ou diplôme fédéral d'expert en finance.",
      it: "Master in Finanza Quantitativa o diploma federale di analista finanziario."
    },
    verified: true,
    demandLevel: "High",
    growthRatePct: 11.2,
    avgWorkHoursWeekly: 44,
    flexibilityScore: 7,
    skillsRequired: {
      en: ["Quantitative Modeling", "Portfolio Analytics", "FINMA Regulations", "Private Banking"],
      de: ["Quantitative Modellierung", "Portfolio-Analyse", "FINMA-Regeln"],
      fr: ["Modélisation financière", "Analyse de portefeuille", "Régulation FINMA"],
      it: ["Modelli quantitativi", "Analisi di portafoglio", "Regolamentazione FINMA"]
    },
    industries: ["Private Banking Partnerships", "Family Offices", "Fintech Hedge Funds"],
    isApprenticeshipPath: false
  }
];

export function ProfessionsExplorer({ isDark, currentLanguage, t }: any) {
  const [professionsList, setProfessionsList] = useState<Profession[]>([]);
  const [searchText, setSearchText] = useState("");
  const [catFilter, setCatFilter] = useState("all");
  const [selectedProf, setSelectedProf] = useState<Profession | null>(null);

  React.useEffect(() => {
    let active = true;
    const fetchProfs = async () => {
      try {
        const data = await DataRepository.getProfessions();
        if (active) {
          if (data && data.length > 0) {
            setProfessionsList(data);
          } else {
            setProfessionsList(MOCK_PROFESSIONS_FALLBACK);
          }
        }
      } catch (err) {
        if (active) setProfessionsList(MOCK_PROFESSIONS_FALLBACK);
      }
    };
    fetchProfs();
    return () => { active = false; };
  }, []);

  const uniqueCategories = ["all", ...Array.from(new Set(professionsList.map(p => p.category).filter(Boolean)))];

  const filtered = professionsList.filter(p => {
    const titleText = (p.title[currentLanguage] || p.title["en"] || "").toLowerCase();
    const descText = (p.description[currentLanguage] || p.description["en"] || "").toLowerCase();
    const skills = (p.skillsRequired?.[currentLanguage] || p.skillsRequired?.["en"] || []).join(" ").toLowerCase();
    
    const matchesSearch = titleText.includes(searchText.toLowerCase()) || 
                          descText.includes(searchText.toLowerCase()) ||
                          skills.includes(searchText.toLowerCase());

    const matchesCat = catFilter === "all" || p.category === catFilter;
    return matchesSearch && matchesCat;
  });

  return (
    <div className={`rounded-3xl border p-6 backdrop-blur-xl ${
      isDark ? "border-white/10 bg-[#06040a]/40" : "border-purple-250 bg-white shadow-xl"
    }`}>
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 border-b pb-4 mb-6 border-purple-200/10 text-left">
        <div>
          <span className={`block font-mono text-[9px] uppercase tracking-widest ${isDark ? "text-violet-400" : "text-violet-600 font-extrabold"}`}>
            Vocations & Careers
          </span>
          <h2 className={`text-base font-extrabold tracking-tight flex items-center gap-1.5 ${isDark ? "text-white" : "text-violet-950 font-black"}`}>
            <Briefcase className="h-4.5 w-4.5 text-violet-500 shrink-0" />
            Swiss Vocation & Profession Explorer
          </h2>
          <p className={`text-[10.5px] mt-0.5 leading-relaxed ${isDark ? "text-zinc-400" : "text-violet-950 font-semibold"}`}>
            Browse premium vocations, apprenticeship integration, and average wage indicators.
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
              placeholder="Search careers/skills..."
              className={`w-full bg-transparent text-[11px] focus:outline-none ${isDark ? "text-white placeholder-zinc-500" : "text-black placeholder-violet-950/40 font-bold"}`}
            />
          </div>

          <div className="flex flex-wrap gap-1">
            {uniqueCategories.map(cat => (
              <button
                key={cat}
                onClick={() => setCatFilter(cat)}
                className={`px-2.5 py-1 rounded-lg text-[9px] uppercase font-mono tracking-wider transition cursor-pointer ${
                  catFilter === cat
                    ? isDark ? "bg-violet-900/40 text-violet-300 border border-violet-800 font-extrabold" : "bg-violet-600 text-white font-black"
                    : isDark ? "text-zinc-400 hover:text-white border border-transparent" : "text-violet-950 hover:text-violet-600 font-extrabold"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-12 items-start">
        {/* Professions list selection column */}
        <div className="md:col-span-5 space-y-2 max-h-[380px] overflow-y-auto pr-1">
          {filtered.length === 0 ? (
            <div className={`text-center py-10 rounded-2xl border border-dashed ${isDark ? "border-white/10 text-zinc-500" : "border-purple-200 text-violet-950/50"}`}>
              <p className="text-xs">No vocational matches found.</p>
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
                      {p.title[currentLanguage] || p.title["en"]}
                    </span>
                    <div className="flex items-center gap-1.5 text-[9px] font-mono text-zinc-400">
                      <span className={`px-1.5 py-0.2 rounded border ${isDark ? "border-white/10 bg-black" : "border-purple-200 bg-white"}`}>{p.category.toUpperCase()}</span>
                      
                      {p.status === "draft" && (
                        <span className="px-1.5 py-0.2 rounded border bg-amber-500/10 text-amber-500 border-amber-500/20">DRAFT</span>
                      )}
                      {(p.status === "verified" || p.status === "official" || p.status === "published" || p.verified === true) && (
                        <span className="px-1.5 py-0.2 rounded border bg-emerald-500/10 text-emerald-400 border-emerald-500/20">VERIFIED</span>
                      )}

                      <span>•</span>
                      <span className={`${isDark ? "text-violet-300" : "text-violet-950 font-bold"}`}>CHF {(p.salaryCHF/1000).toFixed(0)}k/yr</span>
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
                        {selectedProf.title[currentLanguage] || selectedProf.title["en"]}
                        {(selectedProf.status === "verified" || selectedProf.status === "official" || selectedProf.status === "published" || selectedProf.verified === true) && (
                          <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0" />
                        )}
                        {selectedProf.status === "draft" && (
                          <span className="ml-2 inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[9px] font-mono font-bold bg-amber-500/15 text-amber-500 border border-amber-500/25">
                            DRAFT / PROVISIONAL
                          </span>
                        )}
                      </h3>
                      <span className={`inline-block text-[9px] font-mono px-1.5 py-0.2 mt-1 rounded ${
                        isDark ? "bg-violet-950/40 text-violet-300" : "bg-purple-100 text-violet-950 font-bold"
                      }`}>
                        Swiss Standard Occupation Code
                      </span>
                    </div>

                    <div className="text-right">
                      <div className="flex items-center gap-1 text-[11px] font-mono leading-none">
                        <Coins className="h-3.5 w-3.5 text-violet-400 shrink-0" />
                        <span className={`font-extrabold ${isDark ? "text-white" : "text-black"}`}>CHF {selectedProf.salaryCHF.toLocaleString()}</span>
                      </div>
                      <span className="text-[8px] uppercase tracking-wider font-mono text-zinc-400">Average Base Salary</span>
                    </div>
                  </div>

                  <p className={`text-[11.5px] leading-relaxed ${isDark ? "text-zinc-300" : "text-violet-950 font-semibold"}`}>
                    {selectedProf.description[currentLanguage] || selectedProf.description["en"]}
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
                    <div className="card-premium p-3">
                      <span className="block text-[8px] font-mono uppercase tracking-wider text-violet-400 mb-1">
                        Education Required
                      </span>
                      <p className={`text-[10px] leading-relaxed font-semibold ${isDark ? "text-zinc-200" : "text-violet-950"}`}>
                        {selectedProf.educationRequired[currentLanguage] || selectedProf.educationRequired["en"]}
                      </p>
                    </div>

                    <div className="card-premium p-3 flex flex-col justify-between text-left">
                      <div>
                        <span className="block text-[8px] font-mono uppercase tracking-wider text-violet-400 mb-1">
                          Apprenticeship VET
                        </span>
                        <span className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[8.5px] font-bold font-mono ${
                          selectedProf.isApprenticeshipPath 
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
                            : "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                        }`}>
                          {selectedProf.isApprenticeshipPath ? "DIPLOMA (CFC) COMPATIBLE" : "TERTIARY ONLY"}
                        </span>
                      </div>
                      
                      <div className="pt-2 border-t border-white/5 mt-2 flex items-center justify-between text-[9px] font-mono text-zinc-400">
                        <span>Demand: {selectedProf.demandLevel || "High"}</span>
                        <span>Outlook: {(selectedProf.outlook || "").toUpperCase()}</span>
                      </div>
                    </div>
                  </div>

                  {/* Skills Section */}
                  {selectedProf.skillsRequired && (
                    <div className="space-y-1.5 text-left">
                      <span className="block text-[8px] font-mono uppercase tracking-wider text-violet-400">
                        Target Swiss VET / Professional Skills
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {(selectedProf.skillsRequired[currentLanguage] || selectedProf.skillsRequired["en"] || []).map((skill: string, idx: number) => (
                          <span 
                            key={idx} 
                            className={`inline-flex items-center gap-1 text-[9px] font-mono px-2 py-0.5 rounded-lg ${
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
                      <span className="block text-[8px] font-mono uppercase tracking-wider text-violet-400">
                        Top Regional Clusters
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {selectedProf.industries.map((ind: string, idx: number) => (
                          <span 
                            key={idx} 
                            className={`text-[8.5px] font-mono uppercase tracking-widest px-2 py-0.5 rounded ${
                              isDark ? "bg-zinc-950 text-zinc-400 border border-violet-950/20" : "bg-white text-violet-950 font-extrabold border border-purple-200 shadow-sm"
                            }`}
                          >
                            {ind}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            </AnimatePresence>
          ) : (
            <div className={`p-10 text-center rounded-2xl border border-dashed flex flex-col items-center justify-center h-full min-h-[280px] ${
              isDark ? "border-white/10 text-zinc-500 bg-white/[0.005]" : "border-purple-200 text-violet-950/50 bg-purple-50/10"
            }`}>
              <Briefcase className="h-6 w-6 text-violet-500 mb-2.5 animate-bounce" />
              <p className="text-xs font-semibold">Select a vocation path from the directory list to examine the salary, demand level, and skills requirements.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function ResourcesView({
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

  // Generate fully dynamic, data-driven categories directly from the sync data list
  const activeCategories = Array.from(
    new Set(resourcesList.map((res: any) => res.category).filter(Boolean))
  ) as string[];
  const categoriesToRender = ["all", ...activeCategories];

  return (
    <motion.div
      key="view-resources"
      initial={{ opacity: 0, x: 15 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -15 }}
      className="space-y-6"
    >
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <h1 className={`text-xl font-bold tracking-tight ${isDark ? "text-white" : "text-black font-black"}`}>Swiss Authorities</h1>
          <p className={`text-xs mt-0.5 ${isDark ? "text-zinc-300" : "text-black font-bold"}`}>Technical verification and pathways.</p>
          {userProfile && (
            <p className={`text-[10px] mt-1 font-mono uppercase ${isDark ? "text-violet-400" : "text-emerald-700 font-extrabold"}`}>
              <Sparkles className="inline-block h-3 w-3 mr-1" />
              ★ Highlights adapted to {userProfile.isGuest ? "guest session parameters" : `${userProfile.name}'s profile`}
            </p>
          )}
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full lg:w-auto">
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

          <div className={`flex flex-wrap gap-1 rounded-xl p-1 border ${
            isDark ? "bg-zinc-900/60 border-violet-950" : "bg-purple-100 border-2 border-purple-300 shadow-sm"
          }`}>
            {categoriesToRender.map((cat) => (
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
              <div className="flex flex-wrap items-center gap-1.5">
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
                
                {(res.status === "verified" || res.status === "official" || res.status === "published" || res.verified === true) && (
                  <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[8.5px] font-bold font-mono tracking-wide text-emerald-400 border border-emerald-500/20">
                    {res.status === "official" ? "OFFICIAL" : "VERIFIED"}
                  </span>
                )}
                
                {(res.status === "draft" || res.status === "needs_review") && (
                  <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-500/10 px-2 py-0.5 text-[8.5px] font-bold font-mono tracking-wide text-amber-500 border border-amber-500/20">
                    PROVISIONAL DATA
                  </span>
                )}

                {res.rating && (
                  <span className="inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[8px] font-mono font-bold bg-amber-500/15 text-amber-500 border border-amber-500/25">
                    ★ {res.rating.toFixed(1)}
                  </span>
                )}

                {res.accessCost && (
                  <span className={`inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[8px] font-bold font-mono border ${
                    res.accessCost === "free" 
                      ? "bg-sky-500/10 text-sky-400 border-sky-500/20" 
                      : "bg-amber-500/10 text-amber-500 border-amber-500/20"
                  }`}>
                    {res.accessCost.toUpperCase()}
                  </span>
                )}
              </div>

              <h4 className={`text-sm font-bold tracking-tight leading-snug ${isDark ? "text-white" : "text-black font-black"}`}>
                {res.title[currentLanguage] || res.title["en"]}
              </h4>
              <p className={`text-[11px] leading-normal font-sans ${isDark ? "text-zinc-200" : "text-black font-semibold leading-relaxed"}`}>
                {res.description[currentLanguage] || res.description["en"]}
              </p>

              {/* Dynamic tag badges */}
              {res.tags && res.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 pt-1">
                  {res.tags.map((tag: string, idx: number) => (
                    <span 
                      key={idx} 
                      className={`text-[8.5px] font-mono font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded border ${
                        isDark ? "bg-zinc-900 text-zinc-400 border-violet-955/20" : "bg-purple-100/60 text-violet-950 border-purple-200/50"
                      }`}
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
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
        )})}
      </div>
    </motion.div>
  );
}

export function ProfileView({
  t,
  isDark,
  userProfile,
  currentLanguage,
  handleLanguageChange,
  handleLogout
}: any) {
  return (
    <motion.div
      key="view-profile"
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0 }}
      className="max-w-2xl mx-auto space-y-6 py-4 text-left"
    >
      <div className="card-premium p-6 space-y-6">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 shadow-xl">
            <User className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className={`text-base font-bold uppercase tracking-wide ${isDark ? "text-white" : "text-black font-black"}`}>
              {userProfile?.name || "Guest"}
              {userProfile?.isGuest && (
                <span className={`ml-2 px-1.5 py-0.5 rounded text-[10px] bg-amber-500/10 text-amber-500 border border-amber-500/20`}>GUEST</span>
              )}
            </h2>
            <p className={`text-xs font-mono ${isDark ? "text-violet-400" : "text-violet-700 font-black"}`}>
              {userProfile?.syncState === "cloud" && userProfile?.id ? `ID: ${userProfile.id.slice(0, 8).toUpperCase()}` : (userProfile?.isGuest ? "ID: TEMPORARY" : "ID: LOCAL")}
            </p>
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

        {/* Metadata state status details */}
        <div className={`pt-4 border-t text-[10px] font-mono space-y-1 ${isDark ? "border-violet-950/40 text-zinc-400" : "border-purple-200 text-black font-extrabold"}`}>
          <div>{t.profileTheme}</div>
          <div>{t.profileRegion}: Geneva, Switzerland (CH)</div>
          <div>{t.registeredAt}: {userProfile?.createdAt ? new Date(userProfile.createdAt).toLocaleString() : "Active Session"}</div>
        </div>

        {userProfile?.isGuest ? (
          <div className="p-4 rounded-xl border border-amber-500/20 bg-amber-500/5 text-amber-500 text-xs">
            <h4 className="font-bold mb-1">Temporary Guest Session</h4>
            <p className="opacity-80">
              Your personalized pathway, resources, and tracked goals are saved to your local browser cache. 
              To persist data to the cloud permanently when Supabase goes active, you will need to create a full account.
            </p>
          </div>
        ) : (
           <div className={`p-4 rounded-xl border ${userProfile?.syncState === "cloud" ? "border-sky-500/30 bg-sky-500/5 text-sky-500" : "border-emerald-500/20 bg-emerald-500/5 text-emerald-500"} text-xs`}>
             <h4 className="font-bold mb-1 flex items-center gap-2">
               {userProfile?.syncState === "cloud" ? "Cloud Sync Active" : "Personal Profile Active"}
               {userProfile?.syncState === "cloud" && <span className="h-2 w-2 rounded-full bg-sky-400 animate-pulse"></span>}
             </h4>
             <p className="opacity-80">
               {userProfile?.syncState === "cloud" 
                 ? "Your personalized pathway, resources, and tracked goals are securely synced to your cloud account." 
                 : "Your recommendations and profile state are securely initialized. Data is currently cached locally."}
             </p>
           </div>
        )}

        <button
          onClick={handleLogout}
          className="btn-danger w-full py-3.5 text-xs text-center"
        >
          {userProfile?.isGuest ? "End Guest Session & Clear Data" : "Log out & Clear Local Cache"}
        </button>
      </div>
    </motion.div>
  );
}
