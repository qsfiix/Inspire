import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { BookOpen, Milestone, Sparkles, User, Pencil, Check, X, CalendarClock, AlertTriangle } from "lucide-react";
import { SWISS_EDUCATION_LEVELS } from "../data";
import AdvisorReport from "../components/AdvisorReport";
import MyPathLadder from "../components/MyPathLadder";
import SectionGlow from "../components/SectionGlow";
import { daysUntilDue } from "../components/TrackerSystem";
import { EducationLevel, LanguageCode, TrackerGoal } from "../types";

export function DashboardView({
  t,
  isDark,
  currentLanguage,
  userProfile,
  theme,
  handleTabTransition,
  trackers = [],
  onTrackersChange
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
            <span className={`block text-[10px] font-mono uppercase tracking-widest font-bold ${
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
            className={`text-[10px] font-mono underline shrink-0 ${isDark ? "text-zinc-300 hover:text-white" : "text-black hover:text-violet-950"}`}
          >
            {t.navTracker}
          </button>
        </section>
      )}

      <section>
        <MyPathLadder
          userProfile={userProfile}
          language={currentLanguage}
          isDark={isDark}
          trackers={trackers}
          onTrackersChange={onTrackersChange}
          onExploreAlternatives={() => handleTabTransition("resources")}
        />
      </section>

      <section>
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
            { id: "resources", label: t.navResources, desc: "Search resources, professions & institutions.", color: "hover:border-indigo-500/20" },
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

        {/* About Me: free-text personalization, the user's own words rather than
            system-derived fields. Sofiia's review 2026-09-13 asked for more room
            for personal identity in the profile - this is the first piece of it. */}
        <div className={`p-4 rounded-xl border ${isDark ? "bg-zinc-900/30 border-violet-950" : "bg-purple-100 border-2 border-purple-300 shadow-sm"}`}>
          <div className="flex items-center justify-between mb-2">
            <span className={`text-[9px] font-mono uppercase ${isDark ? "text-zinc-400" : "text-black font-black"}`}>{t.profileBioLabel}</span>
            {!isEditingBio && (
              <button
                onClick={startEditingBio}
                className={`inline-flex items-center gap-1 text-[10px] font-semibold cursor-pointer ${isDark ? "text-violet-300 hover:text-white" : "text-violet-700 hover:text-violet-950"}`}
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
                <span className={`text-[9px] font-mono ${isDark ? "text-zinc-500" : "text-violet-950/50 font-semibold"}`}>
                  {draftBio.length}/{BIO_MAX_LENGTH}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsEditingBio(false)}
                    className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2.5 py-1 rounded-lg cursor-pointer ${isDark ? "text-zinc-300 hover:text-white" : "text-black hover:text-violet-950"}`}
                  >
                    <X className="h-3 w-3" /> {t.profileBioCancel}
                  </button>
                  <button
                    onClick={saveBio}
                    className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-lg btn-primary"
                  >
                    <Check className="h-3 w-3" /> {t.profileBioSave}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <p className={`text-xs leading-relaxed ${userProfile?.bio ? (isDark ? "text-zinc-200" : "text-black font-semibold") : (isDark ? "text-zinc-500 italic" : "text-violet-950/50 italic")}`}>
              {userProfile?.bio || t.profileBioEmpty}
            </p>
          )}
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
          Found a bug or have feedback? Contact us
        </a>

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
