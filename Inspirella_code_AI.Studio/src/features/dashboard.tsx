import { stageLabelKey } from "../lib/stageLabel";
import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { BookOpen, Milestone, Sparkles, User, Pencil, Check, X, CalendarClock, AlertTriangle, Globe, Cloud, HardDrive, MapPin, Map as MapIcon, FileText, CheckSquare, ArrowUpRight } from "lucide-react";
import { SWISS_EDUCATION_LEVELS } from "../data";
import AdvisorReport from "../components/AdvisorReport";
import MyPathLadder from "../components/MyPathLadder";
import PersonalRoute from "../components/PersonalRoute";
import SectionGlow from "../components/SectionGlow";
import Reveal from "../components/Reveal";
import { daysUntilDue } from "../components/TrackerSystem";
import TrackerNextUp from "../components/TrackerNextUp";
import { EducationLevel, LanguageCode, TrackerGoal } from "../types";

export function DashboardView({
  t,
  isDark,
  currentLanguage,
  userProfile,
  theme,
  handleTabTransition,
  trackers = [],
  onTrackersChange,
  onProfileUpdate
}: any) {
  const [selectedSystemLevel, setSelectedSystemLevel] = useState<EducationLevel | null>(SWISS_EDUCATION_LEVELS[2]);

  // Passive tracker reminders: computed client-side from due dates, no push/
  // email infrastructure needed. Only counts goals that aren't already done.
  const overdueCount = (trackers as TrackerGoal[]).filter(g => {
    const days = daysUntilDue(g.dueDate);
    return days !== null && days < 0 && g.progress < 100;
  }).length;
  const dueSoonCount = (trackers as TrackerGoal[]).filter(g => {
    const days = daysUntilDue(g.dueDate);
    return days !== null && days >= 0 && days <= 7 && g.progress < 100;
  }).length;

  return (
    <motion.div
      key="view-dashboard"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      className="space-y-8"
    >
      <section className="card-premium flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-6 relative overflow-hidden text-left">
        <SectionGlow isDark={isDark} corner="top-right" />
        <div className="relative space-y-1.5">
          <h1 className={`text-xl md:text-2xl font-bold tracking-tight ${isDark ? "text-white" : "text-black font-extrabold"}`}>
            {t.welcomeBack} <span className="text-shimmer">{userProfile?.name}</span>
            {userProfile?.isGuest && (
              <span className={`ml-2 inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border align-middle ${
                isDark ? "text-amber-300 bg-amber-500/10 border-amber-500/30" : "text-amber-800 bg-amber-100 border-amber-400"
              }`}>
                {t.dbGuestMode}
              </span>
            )}
          </h1>
          <p className={`text-sm ${isDark ? "text-zinc-400" : "text-black/70 font-semibold"}`}>{t.allSystemsGo}</p>
        </div>

        {/* Plain-language status pills (was: mono "LANGUAGE CORE / DATA SYNC /
            GEOGRAPHIC SEGMENT" readouts, which read like a debug panel). */}
        <div className="relative flex flex-wrap gap-2 text-[11px] font-medium">
          <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 border ${isDark ? "bg-white/5 border-white/10 text-zinc-200" : "bg-purple-50 border-purple-200 text-violet-950"}`}>
            <MapPin className="h-3 w-3 text-rose-400" /> {t.dbSwitzerland}
          </span>
          <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 border ${isDark ? "bg-white/5 border-white/10 text-zinc-200" : "bg-purple-50 border-purple-200 text-violet-950"}`}>
            <Globe className="h-3 w-3 text-violet-400" /> {currentLanguage.toUpperCase()}
          </span>
          <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 border ${isDark ? "bg-white/5 border-white/10 text-zinc-200" : "bg-purple-50 border-purple-200 text-violet-950"}`}>
            {userProfile?.syncState === "cloud" ? (
              <><Cloud className="h-3 w-3 text-sky-400" /> {t.dbSavedAccount}</>
            ) : (
              <><HardDrive className="h-3 w-3 text-amber-400" /> {t.dbSavedDevice}</>
            )}
          </span>
        </div>
      </section>

      {(overdueCount > 0 || dueSoonCount > 0) && (
        <section className={`rounded-xl border p-4 flex items-center gap-3 ${
          overdueCount > 0
            ? (isDark ? "bg-red-500/5 border-red-500/20" : "bg-red-50 border-red-200")
            : (isDark ? "bg-amber-500/5 border-amber-500/20" : "bg-amber-50 border-amber-200")
        }`}>
          {overdueCount > 0
            ? <AlertTriangle className={`h-5 w-5 shrink-0 ${isDark ? "text-red-400" : "text-red-600"}`} />
            : <CalendarClock className={`h-5 w-5 shrink-0 ${isDark ? "text-amber-400" : "text-amber-600"}`} />
          }
          <div className="flex-1">
            <span className={`block text-xs font-mono uppercase tracking-widest font-bold ${
              overdueCount > 0 ? (isDark ? "text-red-300" : "text-red-700") : (isDark ? "text-amber-300" : "text-amber-700")
            }`}>
              {t.dashboardReminderTitle}
            </span>
            <span className={`text-xs ${isDark ? "text-zinc-200" : "text-black font-semibold"}`}>
              {[
                overdueCount > 0 ? `${overdueCount} ${t.dashboardReminderOverdueSuffix}` : null,
                dueSoonCount > 0 ? `${dueSoonCount} ${t.dashboardReminderDueSoonSuffix}` : null
              ].filter(Boolean).join(" · ")}
            </span>
          </div>
          <button
            onClick={() => handleTabTransition("tracker")}
            className={`text-xs font-mono underline shrink-0 ${isDark ? "text-zinc-300 hover:text-white" : "text-black hover:text-violet-950"}`}
          >
            {t.navTracker}
          </button>
        </section>
      )}

      <TrackerNextUp
        compact
        language={currentLanguage}
        isDark={isDark}
        trackers={trackers as TrackerGoal[]}
        onTrackersChange={onTrackersChange}
        onOpenTracker={() => handleTabTransition("tracker")}
      />

      <section id="my-path">
        <MyPathLadder
          userProfile={userProfile}
          language={currentLanguage}
          isDark={isDark}
          trackers={trackers}
          onTrackersChange={onTrackersChange}
          onExploreAlternatives={() => handleTabTransition("resources")}
          onOpenTracker={() => handleTabTransition("tracker")}
        />
      </section>

      <Reveal as="section">
        <PersonalRoute
          userProfile={userProfile}
          language={currentLanguage}
          isDark={isDark}
          onRefine={() => handleTabTransition("onboarding")}
          onProfileUpdate={onProfileUpdate}
        />
      </Reveal>

      <Reveal as="section">
        <AdvisorReport
          userProfile={userProfile}
          interests={userProfile?.interests || ["academic"]}
          goals={userProfile?.goals || ["study_active"]}
          currentStage={userProfile?.currentStage || "stage_university"}
          language={currentLanguage}
          theme={theme}
          trackers={trackers}
          onTrackersChange={onTrackersChange}
        />
      </Reveal>

      <Reveal as="section" className="space-y-4">
        <div className={`flex items-center justify-between border-b pb-2 ${isDark ? "border-white/10" : "border-purple-300"}`}>
          <div className="flex items-center gap-1.5">
            <BookOpen className={`h-4.5 w-4.5 ${isDark ? "text-violet-300" : "text-violet-950"}`} />
            <h3 className={`text-sm font-semibold tracking-tight ${isDark ? "text-white" : "text-black font-black"}`}>{t.personalizedGoalTitle}</h3>
          </div>
          <span className={`text-xs font-mono uppercase ${isDark ? "text-zinc-400" : "text-black font-black"}`}>{t.dbPickStage}</span>
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
                <span className={`inline-block text-xs font-mono tracking-wider px-2.5 py-0.5 rounded border ${
                  isDark ? "text-violet-300 bg-white/10 border-white/10" : "text-violet-950 bg-violet-100 border-violet-950/30 font-black shadow-sm"
                }`}>
                  {selectedSystemLevel.sub[currentLanguage]}
                </span>
                <p className={`text-xs leading-relaxed font-sans ${isDark ? "text-zinc-200" : "text-black font-semibold"}`}>{selectedSystemLevel.description[currentLanguage]}</p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {selectedSystemLevel.keyFacts[currentLanguage].map((fact, index) => (
                  <div key={index} className="card-premium-accent p-3.5 text-left">
                    <span className={`block font-mono text-[11px] uppercase mb-1 ${isDark ? "text-zinc-400" : "text-black font-black"}`}>{t.dbKeyFact} {index + 1}</span>
                    <p className={`text-[11px] leading-relaxed font-sans ${isDark ? "text-zinc-200" : "text-black font-bold"}`}>{fact}</p>
                  </div>
                ))}
              </div>

              <div className="space-y-4">
                <span className={`block text-[11px] font-mono uppercase tracking-widest flex items-center gap-1 ${
                  isDark ? "text-zinc-300" : "text-black font-black"
                }`}>
                  <Milestone className={`h-3.5 w-3.5 ${isDark ? "text-violet-300" : "text-violet-950"}`} />
                  {t.dbProgression}
                </span>

                <div className="grid gap-4 md:grid-cols-2">
                  {selectedSystemLevel.pathSteps.map((step) => (
                    <div key={step.id} className="card-premium-accent p-4 text-left">
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className={`font-black text-xs ${isDark ? "text-violet-300" : "text-black bg-purple-100 px-1.5 py-0.5 rounded border border-purple-900/10 inline-block"}`}>{step.title[currentLanguage]}</span>
                        {step.timeframe && (
                          <span className={`rounded px-2 py-0.5 font-mono text-[11px] border ${
                            isDark ? "bg-white/10 text-violet-300 border-white/5" : "bg-violet-950 text-white border-transparent shadow-sm font-black"
                          }`}>
                            {step.timeframe[currentLanguage]}
                          </span>
                        )}
                      </div>
                      <p className={`text-xs mt-1 leading-relaxed ${isDark ? "text-zinc-300" : "text-black font-semibold"}`}>{step.description[currentLanguage]}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className={`p-4 rounded-xl border text-xs leading-relaxed backdrop-blur-sm ${
                isDark ? "border-white/10 bg-white/[0.02] text-zinc-200" : "border-2 border-purple-300 bg-emerald-500/15 text-black"
              }`}>
                <span className={`block text-[11px] font-mono uppercase tracking-widest font-semibold mb-1 ${
                  isDark ? "text-emerald-400" : "text-emerald-950 font-black animate-pulse"
                }`}>
                  {t.dbPermeability}
                </span>
                <p className={`text-[11px] ${isDark ? "text-zinc-300" : "text-black font-bold"}`}>{selectedSystemLevel.permeabilityText[currentLanguage]}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Reveal>

      <section className="space-y-4">
        <div className={`flex items-center gap-1.5 border-b pb-2 ${isDark ? "border-white/10" : "border-purple-300"}`}>
          <Sparkles className="h-4.5 w-4.5 text-violet-500 animate-pulse" />
          <h3 className={`text-sm font-semibold uppercase tracking-wider ${isDark ? "text-white" : "text-violet-950 font-black"}`}>{t.quickAccess}</h3>
        </div>

        <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
          {[
            { id: "map", label: t.navMap, desc: t.dbQaMap, icon: MapIcon, tint: "text-emerald-400 bg-emerald-500/10" },
            { id: "resources", label: t.navResources, desc: t.dbQaResources, icon: FileText, tint: "text-indigo-400 bg-indigo-500/10" },
            { id: "tracker", label: t.navTracker, desc: t.dbQaTracker, icon: CheckSquare, tint: "text-violet-400 bg-violet-500/10" },
            { id: "profile", label: t.navProfile, desc: t.dbQaProfile, icon: User, tint: "text-amber-400 bg-amber-500/10" }
          ].map((portal, idx) => {
            const PortalIcon = portal.icon;
            return (
              <Reveal key={portal.id} delay={idx * 0.06} className="h-full">
                <button
                  onClick={() => handleTabTransition(portal.id)}
                  className="card-premium group h-full w-full p-4 text-left cursor-pointer hover:-translate-y-1"
                >
                  <div className="flex items-start justify-between">
                    <span className={`p-2 rounded-lg ${portal.tint}`}>
                      <PortalIcon className="h-4 w-4" />
                    </span>
                    <ArrowUpRight className={`h-4 w-4 transition duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 ${isDark ? "text-zinc-400 group-hover:text-violet-300" : "text-violet-950/70 group-hover:text-violet-700"}`} />
                  </div>
                  <span className={`block font-bold text-xs mt-3 ${isDark ? "text-white" : "text-indigo-950 font-black"}`}>{portal.label}</span>
                  <span className={`block text-xs mt-1 leading-normal ${isDark ? "text-zinc-400" : "text-violet-900/60 font-bold"}`}>{portal.desc}</span>
                </button>
              </Reveal>
            );
          })}
        </div>
      </section>
    </motion.div>
  );
}

export function ProfileView({
  t,
  isDark,
  userProfile,
  currentLanguage,
  handleLanguageChange,
  handleLogout,
  handleUpdateProfile
}: any) {
  const BIO_MAX_LENGTH = 500;
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [draftBio, setDraftBio] = useState(userProfile?.bio || "");

  const startEditingBio = () => {
    setDraftBio(userProfile?.bio || "");
    setIsEditingBio(true);
  };

  const saveBio = async () => {
    await handleUpdateProfile?.({ bio: draftBio.trim() });
    setIsEditingBio(false);
  };

  return (
    <motion.div
      key="view-profile"
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0 }}
      className="max-w-2xl mx-auto space-y-6 py-4 text-left"
    >
      <div className="card-premium p-6 space-y-6 relative overflow-hidden">
        <SectionGlow isDark={isDark} corner="top-right" />
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 shadow-xl">
            <User className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className={`text-lg font-bold tracking-tight ${isDark ? "text-white" : "text-black font-black"}`}>
              {userProfile?.name || "Guest"}
              {userProfile?.isGuest && (
                <span className={`ml-2 align-middle px-2 py-0.5 rounded-full text-[11px] font-medium border ${isDark ? "bg-amber-500/10 text-amber-300 border-amber-500/30" : "bg-amber-100 text-amber-800 border-amber-300"}`}>Guest</span>
              )}
            </h2>
            <p className={`text-xs ${isDark ? "text-zinc-400" : "text-violet-950/70 font-semibold"}`}>
              {userProfile?.isGuest
                ? t.pfGuestSub
                : userProfile?.syncState === "cloud"
                  ? t.pfCloudSub
                  : t.dbSavedDevice}
            </p>
          </div>
        </div>

        {/* About Me: free-text personalization, the user's own words rather than
            system-derived fields. Sofiia's review 2026-09-13 asked for more room
            for personal identity in the profile - this is the first piece of it. */}
        <div className={`p-4 rounded-xl border ${isDark ? "bg-zinc-900/30 border-violet-950" : "bg-purple-100 border-2 border-purple-300 shadow-sm"}`}>
          <div className="flex items-center justify-between mb-2">
            <span className={`text-[11px] font-mono uppercase ${isDark ? "text-zinc-400" : "text-black font-black"}`}>{t.profileBioLabel}</span>
            {!isEditingBio && (
              <button
                onClick={startEditingBio}
                className={`inline-flex items-center gap-1 text-xs font-semibold cursor-pointer ${isDark ? "text-violet-300 hover:text-white" : "text-violet-700 hover:text-violet-950"}`}
              >
                <Pencil className="h-3 w-3" /> {t.profileBioEdit}
              </button>
            )}
          </div>

          {isEditingBio ? (
            <div className="space-y-2">
              <textarea
                value={draftBio}
                onChange={e => setDraftBio(e.target.value.slice(0, BIO_MAX_LENGTH))}
                placeholder={t.profileBioPlaceholder}
                rows={4}
                autoFocus
                className={`w-full rounded-lg p-3 text-xs leading-relaxed resize-none focus:outline-none ${
                  isDark ? "bg-zinc-950/60 text-zinc-100 placeholder-zinc-500 border border-violet-950" : "bg-white text-black placeholder-violet-950/40 border border-purple-300"
                }`}
              />
              <div className="flex items-center justify-between">
                <span className={`text-[11px] font-mono ${isDark ? "text-zinc-400" : "text-violet-950/70 font-semibold"}`}>
                  {draftBio.length}/{BIO_MAX_LENGTH}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsEditingBio(false)}
                    className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg cursor-pointer ${isDark ? "text-zinc-300 hover:text-white" : "text-black hover:text-violet-950"}`}
                  >
                    <X className="h-3 w-3" /> {t.profileBioCancel}
                  </button>
                  <button
                    onClick={saveBio}
                    className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-lg btn-primary"
                  >
                    <Check className="h-3 w-3" /> {t.profileBioSave}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <p className={`text-xs leading-relaxed ${userProfile?.bio ? (isDark ? "text-zinc-200" : "text-black font-semibold") : (isDark ? "text-zinc-400 italic" : "text-violet-950/70 italic")}`}>
              {userProfile?.bio || t.profileBioEmpty}
            </p>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2 text-xs">
          <div className={`p-3 rounded-xl border ${isDark ? "bg-zinc-900/30 border-violet-950" : "bg-purple-100 border-2 border-purple-300 shadow-sm"}`}>
            {/* A guest has no account - showing the placeholder guest address
                as "authenticated credentials" claimed something untrue. */}
            <span className={`block text-[11px] font-medium mb-1 ${isDark ? "text-zinc-400" : "text-violet-950/70 font-bold"}`}>{userProfile?.isGuest ? t.pfAccount : t.profileUserAddress}</span>
            <span className={`truncate block font-semibold ${isDark ? "text-zinc-200" : "text-black"}`}>
              {userProfile?.isGuest ? t.pfNoAccount : userProfile?.email || t.pfNoEmail}
            </span>
          </div>

          <div className={`p-3 rounded-xl border ${isDark ? "bg-zinc-900/30 border-violet-950" : "bg-purple-100 border-2 border-purple-300 shadow-sm"}`}>
            <span className={`block text-[11px] font-medium mb-1 ${isDark ? "text-zinc-400" : "text-violet-950/70 font-bold"}`}>{t.pfStage}</span>
            <span className={`block font-semibold ${isDark ? "text-zinc-200" : "text-black"}`}>
              {userProfile?.currentStage ? t[stageLabelKey(userProfile.currentStage) as keyof typeof t] || userProfile.currentStage : t.pfStageUnset}
            </span>
          </div>
        </div>

        <div className="space-y-2">
          <span className={`block text-sm font-semibold ${isDark ? "text-zinc-200" : "text-black font-black"}`}>{t.pfLanguage}</span>
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
                    ? isDark ? "border-violet-500 bg-violet-950/40 text-white" : "bg-violet-600 text-white border-transparent font-black shadow-md"
                    : isDark ? "border-violet-950/50 bg-zinc-900/20 text-zinc-300 hover:border-violet-800" : "border-purple-300 bg-purple-50 hover:bg-violet-100 text-black font-bold shadow-sm"
                }`}
              >
                {l.label}
              </button>
            ))}
          </div>
        </div>

        {/* Only facts we actually know (was: a theme label, a hard-coded
            "Geneva" region and "Synchronized to Inspirella Core"). */}
        {userProfile?.createdAt && (
          <div className={`pt-4 border-t text-xs ${isDark ? "border-violet-950/40 text-zinc-400" : "border-purple-200 text-violet-950/70 font-semibold"}`}>
            {t.registeredAt}: {new Date(userProfile.createdAt).toLocaleDateString(currentLanguage)}
          </div>
        )}

        {userProfile?.isGuest ? (
          <div className={`p-4 rounded-xl border text-xs ${isDark ? "border-amber-500/25 bg-amber-500/5 text-amber-300" : "border-amber-300 bg-amber-50 text-amber-900"}`}>
            <h4 className="font-bold mb-1">{t.pfGuestTitle}</h4>
            <p className={isDark ? "text-amber-200/90" : "text-amber-900"}>
              {t.pfGuestText}
            </p>
          </div>
        ) : (
           <div className={`p-4 rounded-xl border ${userProfile?.syncState === "cloud" ? "border-sky-500/30 bg-sky-500/5 text-sky-500" : "border-emerald-500/20 bg-emerald-500/5 text-emerald-500"} text-xs`}>
             <h4 className="font-bold mb-1 flex items-center gap-2">
               {userProfile?.syncState === "cloud" ? t.dbSavedAccount : t.dbSavedDevice}
               {userProfile?.syncState === "cloud" && <span className="h-2 w-2 rounded-full bg-sky-400 animate-pulse"></span>}
             </h4>
             <p className="opacity-80">
               {userProfile?.syncState === "cloud" 
                 ? t.pfCloudText
                 : t.pfLocalText}
             </p>
           </div>
        )}

        {/* The public Contact page (and its mailto form) drops out of the nav
            entirely once logged in - see Navbar's privateTabs. Without this,
            a signed-in user who hits a bug has no visible way to report it
            short of logging out first. */}
        <a
          href="mailto:iinspirella@gmail.com?subject=Inspirella%20-%20Something%20isn't%20working"
          className={`block w-full py-3 text-xs text-center rounded-lg border transition ${
            isDark ? "border-white/10 text-zinc-300 hover:bg-white/5" : "border-purple-200 text-violet-950 font-semibold hover:bg-purple-50"
          }`}
        >
          {t.pfFeedback}
        </a>

        {/* Destructive action sits apart from the feedback link and names its consequence. */}
        <div className={`pt-4 mt-2 border-t ${isDark ? "border-white/5" : "border-purple-100"}`}>
          <button
            onClick={handleLogout}
            className="btn-danger w-full py-3.5 text-xs text-center"
          >
            {userProfile?.isGuest ? t.pfEndGuest : t.pfLogout}
          </button>
        </div>
      </div>
    </motion.div>
  );
}
