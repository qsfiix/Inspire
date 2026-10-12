import React, { useState, useEffect, Suspense, lazy } from "react";
import { motion, AnimatePresence, MotionConfig } from "motion/react";
import {
  Sparkles,
  ArrowRight,
  Compass,
  Trophy,
  CheckCircle,
  HelpCircle,
  ShieldCheck,
  Languages,
  BookOpen,
  MapPin,
  Activity,
  User,
  ExternalLink,
  GraduationCap,
  Briefcase,
  Search,
  Filter,
  Milestone
} from "lucide-react";

import { LanguageCode, UserProfile, TrackerGoal, ResourceItem, RouteBackground } from "./types";
import { TRANSLATIONS, OFF_RESOURCES } from "./data";
import Navbar from "./components/Navbar";
import MapboxMap from "./components/MapboxMap";
import SectionGlow from "./components/SectionGlow";
import TrackerSystem from "./components/TrackerSystem";
import { fetchSupabaseConfig, getMapboxConfig } from "./supabaseClient";
import { DataRepository } from "./data/Repository";
import { EXAMPLE_TRACKERS } from "./data/seedData";
import { localizedMatches } from "./lib/localized";

import { LEGAL_LINKS } from "./features/legalText";
import { HomeView, AboutView, ContactView, PrivacyView, ImpressumView } from "./features/marketing";
import { LoginView, OnboardingView } from "./features/auth";
import { DashboardView, ProfileView } from "./features/dashboard";
import { ResourcesCareersView } from "./features/resourcesCareers";
import type { PhoenixSceneStatus } from "./components/phoenix/PhoenixScene";

// three.js is split into its own chunk and loaded after the first paint.
const PhoenixScene = lazy(() => import("./components/phoenix/PhoenixScene"));

export default function App() {
  const [currentLanguage, setCurrentLanguage] = useState<LanguageCode>("en");
  const [activeTab, setActiveTab] = useState<string>("home");
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [trackers, setTrackers] = useState<TrackerGoal[]>([]);
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const isDark = theme === "dark";
  const [mapboxConfig, setMapboxConfig] = useState<{ accessToken?: string; styleUrl?: string }>({});
  const [authError, setAuthError] = useState<string | null>(null);
  const [pendingConfirmationEmail, setPendingConfirmationEmail] = useState<string | null>(null);
  // The living WebGL backdrop is shared by every page (one canvas, never
  // remounted, so the particles glide between pages), the map page included;
  // "error" = no WebGL, pages fall back to solid colours.
  const [sceneStatus, setSceneStatus] = useState<PhoenixSceneStatus>("loading");
  // Also on the map page (Sofiia 2026-09-28: the black page there broke the
  // style) - the ambient galaxy freezes after a few seconds, so running
  // alongside Mapbox's own WebGL costs next to nothing.
  const sceneVisible = sceneStatus !== "error";

  const handleThemeToggle = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    localStorage.setItem("inspirella_theme", nextTheme);
  };

  // Dynamic Resources State synchronizer
  const [resourcesList, setResourcesList] = useState<ResourceItem[]>(OFF_RESOURCES);
  const [resourceSearch, setResourceSearch] = useState<string>("");
  const [resourceCategoryFilter, setResourceCategoryFilter] = useState<string>("all");

  const t = TRANSLATIONS[currentLanguage];

  // Fetch and sync resources from DataRepository
  useEffect(() => {
    let active = true;
    let subscription: any = null;

    const loadResources = async () => {
      const data = await DataRepository.getResources();
      if (active) {
        setResourcesList(data);
      }
    };

    const init = async () => {
      await loadResources();
      subscription = await DataRepository.subscribeToResources(() => {
        console.log("Realtime Database Sync: resources table changed. Syncing...");
        loadResources();
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

  // Coordinate theme classes on document body
  useEffect(() => {
    if (theme === "dark") {
      document.body.classList.add("dark-mode");
      document.body.style.backgroundColor = "#030008";
      document.body.style.color = "#e2e8f0";
    } else {
      document.body.classList.remove("dark-mode");
      document.body.style.backgroundColor = "#f5f3ff";
      document.body.style.color = "#1e1b4b";
    }
  }, [theme]);

  // Card spotlight (index.css .card-premium): one delegated listener feeds
  // the cursor position to whichever premium card is under the pointer.
  // Written straight to the DOM so mouse movement never re-renders React.
  // Cards marked .tilt-3d also lean towards the cursor in perspective.
  useEffect(() => {
    let tilted: HTMLElement | null = null;
    const onPointerMove = (e: PointerEvent) => {
      const target = e.target as Element | null;
      const tilt = target?.closest?.(".tilt-3d") as HTMLElement | null;
      if (tilted && tilted !== tilt) {
        tilted.style.setProperty("--rx", "0deg");
        tilted.style.setProperty("--ry", "0deg");
        tilted = null;
      }
      const card = target?.closest?.(".card-premium, .card-premium-glow") as HTMLElement | null;
      if (!card) return;
      const rect = card.getBoundingClientRect();
      card.style.setProperty("--sx", `${e.clientX - rect.left}px`);
      card.style.setProperty("--sy", `${e.clientY - rect.top}px`);
      if (tilt && e.pointerType === "mouse") {
        const r = tilt.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - 0.5;
        const py = (e.clientY - r.top) / r.height - 0.5;
        tilt.style.setProperty("--rx", `${(-py * 10).toFixed(2)}deg`);
        tilt.style.setProperty("--ry", `${(px * 12).toFixed(2)}deg`);
        tilted = tilt;
      }
    };
    document.addEventListener("pointermove", onPointerMove, { passive: true });
    return () => document.removeEventListener("pointermove", onPointerMove);
  }, []);

  // Bootstrap app state
  useEffect(() => {
    // Retrieve cached theme selection
    const cachedTheme = localStorage.getItem("inspirella_theme") as "dark" | "light" | null;
    if (cachedTheme) {
      setTheme(cachedTheme);
    }

    const initData = async () => {
      // Attempt connecting and retrieving Supabase/Mapbox runtime credentials
      await fetchSupabaseConfig();
      setMapboxConfig(getMapboxConfig());

      // Recover cached states from DataRepository
      const cachedProfile = await DataRepository.getProfile();
      const cachedTrackers = await DataRepository.getTrackers();

      if (cachedProfile) {
        setUserProfile(cachedProfile);
        setCurrentLanguage(cachedProfile.language);
        setIsLoggedIn(true);
        if (cachedProfile.onboardingComplete) {
          setActiveTab("dashboard");
        } else {
          setActiveTab("onboarding");
        }
      }

      // An empty tracker list means the user deleted their goals and that choice
      // must be respected. Only offer the example goal when there is no sign of
      // an existing list anywhere - neither this browser's local cache nor
      // (for a signed-in user) the cloud. Checking `hasStoredTrackers()` alone
      // would miss a signed-in user's real cloud trackers on a new device (no
      // local cache yet) and immediately overwrite them with the example goal,
      // since saveTrackers() replaces the whole cloud list on every save.
      if (DataRepository.hasStoredTrackers() || cachedTrackers.length > 0) {
        setTrackers(cachedTrackers);
      } else {
        const initialTrackers: TrackerGoal[] = EXAMPLE_TRACKERS;
        setTrackers(initialTrackers);
        DataRepository.saveTrackers(initialTrackers);
      }
    };
    
    initData();
  }, []);

  // Sync state helpers
  const handleUpdateTrackers = (updated: TrackerGoal[]) => {
    setTrackers(updated);
    DataRepository.saveTrackers(updated);
  };

  const handleLanguageChange = async (lang: LanguageCode) => {
    setCurrentLanguage(lang);
    if (userProfile) {
      const nextProfile = { ...userProfile, language: lang };
      setUserProfile(nextProfile);
      await DataRepository.saveProfile(nextProfile);
    }
  };

  // Generic profile field save (currently used for the "about me" bio field,
  // ProfileView.tsx) - mirrors handleLanguageChange's update-then-persist shape.
  const handleUpdateProfile = async (patch: Partial<UserProfile>) => {
    if (!userProfile) return;
    const nextProfile = { ...userProfile, ...patch };
    setUserProfile(nextProfile);
    await DataRepository.saveProfile(nextProfile);
  };

  // Auth operations - real Supabase accounts (see 02_Product/Backend/Prototype
  // Limitations.md: login must not merely look like an account while actually
  // being local-only storage indistinguishable from Guest mode).
  const handleSignUp = async (authName: string, authEmail: string, authPassword: string) => {
    if (!authEmail || !authName || !authPassword) return;
    setAuthError(null);
    setPendingConfirmationEmail(null);

    const { profile, needsEmailConfirmation, error } = await DataRepository.signUp(
      authName,
      authEmail,
      authPassword,
      currentLanguage
    );

    if (error || !profile) {
      setAuthError(error || "Something went wrong creating your account.");
      return;
    }

    if (needsEmailConfirmation) {
      setPendingConfirmationEmail(authEmail);
      return;
    }

    setUserProfile(profile);
    setIsLoggedIn(true);
    setActiveTab("onboarding");
  };

  const handleSignIn = async (authEmail: string, authPassword: string) => {
    if (!authEmail || !authPassword) return;
    setAuthError(null);
    setPendingConfirmationEmail(null);

    const { profile, error } = await DataRepository.signIn(authEmail, authPassword);

    if (error || !profile) {
      setAuthError(error || "Could not sign in with these details.");
      return;
    }

    setUserProfile(profile);
    setCurrentLanguage(profile.language);
    setIsLoggedIn(true);
    setActiveTab(profile.onboardingComplete ? "dashboard" : "onboarding");
  };

  const handleBypassAuth = async () => {
    // High premium UX bypass
    const bypassProfile: UserProfile = {
      name: "Guest Explorer",
      email: "explorer@inspirella.ch",
      interests: ["academic", "tech"],
      goals: ["study_active"],
      currentStage: "stage_university",
      language: currentLanguage,
      onboardingComplete: true,
      createdAt: new Date().toISOString(),
      isGuest: true,
      syncState: "local"
    };
    setUserProfile(bypassProfile);
    await DataRepository.saveProfile(bypassProfile);
    setIsLoggedIn(true);
    setActiveTab("dashboard");
  };

  const handleLogout = () => {
    // Reset local UI state immediately; end the Supabase session in the
    // background so logout feels instant regardless of network latency.
    DataRepository.clearAll();
    setIsLoggedIn(false);
    setUserProfile(null);
    setActiveTab("home");
    DataRepository.signOut().catch(() => {});
  };

  // Navigation redirect wrapper for secure zone checking
  // Small profile patches from child views (for example the canton picked in the route card).
  const handleProfileUpdate = async (patch: Partial<UserProfile>) => {
    if (!userProfile) return;
    const next = { ...userProfile, ...patch };
    setUserProfile(next);
    await DataRepository.saveProfile(next);
  };

  const handleTabTransition = (tabId: string) => {
    if (!isLoggedIn && ["dashboard", "map", "resources", "tracker", "profile"].includes(tabId)) {
      setActiveTab("login");
    } else {
      setActiveTab(tabId);
    }
  };

  // Filter resources based on current search metrics.
  // Uses `localizedMatches` so a record that is only partially translated
  // (common for real database rows) can never crash the catalogue.
  const filteredResources = resourcesList.filter((res) => {
    const matchesSearch =
      localizedMatches(res.title, currentLanguage, resourceSearch) ||
      localizedMatches(res.description, currentLanguage, resourceSearch);
    const matchesCat = resourceCategoryFilter === "all" || res.category === resourceCategoryFilter;
    return matchesSearch && matchesCat;
  });

  // Dynamic Design Tokens for Premium Custom Styling supporting Light and Dark modes
  // We use border-violet-950/20 & bg-violet-950/5 in light mode to provide elegant dark violet accents and deep elements
  const tCard = isDark 
    ? "border border-white/10 bg-[#06040a]/40 bg-white/5 backdrop-blur-xl" 
    : "border-2 border-violet-950/30 bg-white shadow-[0_4px_25px_rgba(46,16,101,0.06)] backdrop-blur-xl hover:shadow-[0_4px_30px_rgba(46,16,101,0.1)] transition duration-300";
  
  const tCardAccent = isDark 
    ? "border border-white/5 bg-white/[0.02] backdrop-blur-sm" 
    : "border-2 border-violet-950/30 bg-violet-100/70 shadow-[inset_0_1px_5px_rgba(46,16,101,0.03)]";
  
  const tCardGlow = isDark 
    ? "bg-zinc-950/60 border border-violet-900/50 shadow-[0_0_30px_rgba(109,40,217,0.15)] shadow-violet-950/30" 
    : "border-2 border-violet-950/45 bg-white shadow-[0_8px_35px_rgba(46,16,101,0.18)] glow-ambient-violet";
  
  const tTextTitle = isDark ? "text-white font-extrabold" : "text-black font-extrabold";
  const tTextSub = isDark ? "text-zinc-200 font-bold" : "text-black font-black";
  const tTextBody = isDark ? "text-zinc-300 font-sans" : "text-black font-bold leading-relaxed";
  const tTextMuted = isDark ? "text-zinc-400 font-medium" : "text-black font-black";
  
  // Dark violet accent block (темно-фиолетовый акцент с сиянием)
  const tPurpleAccentBlock = isDark
    ? "bg-violet-950/25 border border-violet-800/30 text-violet-200"
    : "dark-accent-block p-6 rounded-2xl border-l-[6px] border-l-violet-950 border-y-violet-950/15 border-r-violet-950/15 text-violet-950 shadow-[0_0_20px_rgba(109,40,217,0.06)]";

  // Form inputs
  const tInput = isDark
    ? "border border-white/15 bg-white/5 text-white placeholder-zinc-500 focus:border-white/35 focus:ring-1 focus:ring-slate-800"
    : "border-2 border-violet-950/20 bg-white text-indigo-950 placeholder-violet-950/45 focus:border-violet-950 focus:ring-2 focus:ring-violet-950/10 shadow-sm";

  const tOption = isDark ? "bg-zinc-950 text-white" : "bg-white text-indigo-950";

  return (
    // reducedMotion="user": every motion animation below honours the OS
    // "reduce motion" setting (transforms off, fades kept) automatically.
    <MotionConfig reducedMotion="user">
    {/* While the backdrop is visible the root is transparent so the fixed
        WebGL canvas (PhoenixScene, z-index -1) shows through. */}
    <div className={`min-h-screen transition-colors duration-300 flex flex-col relative select-none ${
      isDark ? "text-slate-100" : "text-indigo-950"
    } ${sceneVisible ? "bg-transparent" : isDark ? "bg-[#06040a]" : "bg-[#f5f3ff]"}`}>
      {sceneStatus !== "error" && (
        <Suspense fallback={null}>
          <PhoenixScene isDark={isDark} onStatus={setSceneStatus} />
        </Suspense>
      )}
      
      {/* Background layered atmospheric blur circles */}
      <div className={`fixed -top-40 -left-40 h-[500px] w-[500px] rounded-full blur-[120px] pointer-events-none -z-10 transition-colors duration-500 ${
        isDark ? "bg-violet-600/10" : "bg-violet-400/25"
      }`}></div>
      <div className={`fixed top-1/3 -right-20 h-[450px] w-[450px] rounded-full blur-[130px] pointer-events-none -z-10 transition-colors duration-500 ${
        isDark ? "bg-indigo-600/10" : "bg-violet-400/20"
      }`}></div>
      <div className={`fixed -bottom-20 left-1/3 h-[500px] w-[500px] rounded-full blur-[140px] pointer-events-none -z-10 transition-colors duration-500 ${
        isDark ? "bg-purple-600/10" : "bg-purple-400/15"
      }`}></div>

      {/* Global Navigation Bar */}
      <Navbar
        currentLanguage={currentLanguage}
        onLanguageChange={handleLanguageChange}
        activeTab={activeTab}
        onTabChange={handleTabTransition}
        isLoggedIn={isLoggedIn}
        onLogout={handleLogout}
        userName={userProfile?.name}
        theme={theme}
        onThemeToggle={handleThemeToggle}
      />

      {/* Main Viewport Content Card Grid */}
      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AnimatePresence mode="wait">
          
          {/* VIEW: Public Hero Landing Home */}
          {activeTab === "home" && (
            <HomeView t={t} isDark={isDark} tTextTitle={tTextTitle} tTextSub={tTextSub} tTextBody={tTextBody} tTextMuted={tTextMuted} tCard={tCard} tCardAccent={tCardAccent} handleTabTransition={handleTabTransition} handleBypassAuth={handleBypassAuth} sceneStatus={sceneStatus} />
          )}

          {/* VIEW: About */}
          {activeTab === "about" && (
            <AboutView t={t} isDark={isDark} tTextTitle={tTextTitle} tTextBody={tTextBody} tCard={tCard} handleTabTransition={handleTabTransition} language={currentLanguage} />
          )}

          {/* VIEW: Contact Form */}
          {activeTab === "contact" && (
            <ContactView t={t} isDark={isDark} tTextTitle={tTextTitle} tTextSub={tTextSub} tInput={tInput} tCard={tCard} />
          )}

          {/* VIEW: Privacy Notice */}
          {activeTab === "privacy" && (
            <PrivacyView language={currentLanguage} isDark={isDark} tTextTitle={tTextTitle} handleTabTransition={handleTabTransition} />
          )}

          {/* VIEW: Impressum */}
          {activeTab === "impressum" && (
            <ImpressumView language={currentLanguage} isDark={isDark} tTextTitle={tTextTitle} handleTabTransition={handleTabTransition} />
          )}

          {/* VIEW: Login Sign Up Frame */}
          {activeTab === "login" && (
            <LoginView
              t={t}
              currentLanguage={currentLanguage}
              isDark={isDark}
              tInput={tInput}
              handleSignUp={handleSignUp}
              handleSignIn={handleSignIn}
              handleBypassAuth={handleBypassAuth}
              authError={authError}
              pendingConfirmationEmail={pendingConfirmationEmail}
              onDismissConfirmation={() => setPendingConfirmationEmail(null)}
            />
          )}

          {/* VIEW: Onboarding Questionnaire */}
          {activeTab === "onboarding" && (
            <OnboardingView t={t} currentLanguage={currentLanguage} isDark={isDark} initialProfile={userProfile} submitOnboarding={async (interests: string[], goals: string[], stage: string, route?: RouteBackground) => {
              if (!userProfile) return;
              const completedProfile: UserProfile = {
                ...userProfile,
                interests,
                goals,
                currentStage: stage,
                onboardingComplete: true
              };
              setUserProfile(completedProfile);
              await DataRepository.saveProfile(completedProfile);
              if (route) {
                const answered = Object.entries(route).some(([k, v]) =>
                  k === "languageLevels" ? (v as unknown[]).length > 0 : v !== undefined
                );
                if (answered) await DataRepository.saveRouteBackground(route);
              }
              setActiveTab("dashboard");
            }} />
          )}

          {/* VIEW: Personalized Dashboard & Home */}
          {activeTab === "dashboard" && (
            <DashboardView
              onProfileUpdate={handleProfileUpdate}
              t={t}
              isDark={isDark}
              currentLanguage={currentLanguage}
              userProfile={userProfile}
              theme={theme}
              handleTabTransition={handleTabTransition}
              trackers={trackers}
              onTrackersChange={handleUpdateTrackers}
            />
          )}

          {/* VIEW: Interactive Mapbox WebGIS Grid */}
          {activeTab === "map" && (
            <motion.div
              key="view-map"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              <div className="relative">
                <SectionGlow isDark={isDark} corner="top-left" />
                <h1 className={`relative text-xl font-bold tracking-tight ${isDark ? "text-white" : "text-black font-black"}`}>{t.mapHeader}</h1>
                <p className={`relative text-xs mt-0.5 ${isDark ? "text-zinc-200" : "text-black font-bold"}`}>{t.mapSub}</p>
              </div>

              {/* Render Mapbox Component */}
              <MapboxMap
                currentLanguage={currentLanguage}
                theme={theme}
                accessToken={mapboxConfig.accessToken}
                styleUrl={mapboxConfig.styleUrl}
                onGoalSet={() => handleTabTransition("dashboard")}
              />
            </motion.div>
          )}

          {/* VIEW: Resources & Careers hub (web resources + professions + institutions) */}
          {activeTab === "resources" && (
            <ResourcesCareersView
              t={t}
              isDark={isDark}
              currentLanguage={currentLanguage}
              theme={theme}
              resourceSearch={resourceSearch}
              setResourceSearch={setResourceSearch}
              resourceCategoryFilter={resourceCategoryFilter}
              setResourceCategoryFilter={setResourceCategoryFilter}
              filteredResources={filteredResources}
              resourcesList={resourcesList}
              userProfile={userProfile}
              onGoalSet={() => handleTabTransition("dashboard")}
            />
          )}

          {/* VIEW: Fully Interactive Habit & Goals Tracker */}
          {activeTab === "tracker" && (
            <motion.div
              key="view-tracker"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              <div>
                <h1 className="text-xl font-bold text-white tracking-tight">{t.trackerHeader}</h1>
                <p className="text-xs text-zinc-400 mt-0.5">{t.trackerSub}</p>
              </div>

              {/* Render the full tracker mini-system */}
              <TrackerSystem
                currentLanguage={currentLanguage}
                trackers={trackers}
                onTrackersChange={handleUpdateTrackers}
                theme={theme}
              />
            </motion.div>
          )}

          {/* VIEW: Profile & Account preferences */}
          {activeTab === "profile" && (
            <ProfileView
              t={t}
              isDark={isDark}
              userProfile={userProfile}
              currentLanguage={currentLanguage}
              handleLanguageChange={handleLanguageChange}
              handleLogout={handleLogout}
              handleUpdateProfile={handleUpdateProfile}
            />
          )}

        </AnimatePresence>
      </main>

      {/* Persistent global footer */}
      <footer className={`border-t py-6 text-center text-xs ${isDark ? "border-violet-950/40 bg-zinc-950 text-zinc-400" : "border-purple-200 bg-purple-100 text-black font-bold"}`}>
        <div className="mx-auto max-w-7xl px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <span className="font-mono text-xs tracking-widest text-violet-500 uppercase font-black">
            © 2026 Inspirella
          </span>
          <div className="flex items-center gap-4">
            <span className={isDark ? "text-zinc-400" : "text-black font-extrabold"}>
              Switzerland Education Explorer
            </span>
            <button
              onClick={() => handleTabTransition("impressum")}
              className={`underline-offset-2 hover:underline cursor-pointer ${isDark ? "text-zinc-400 hover:text-zinc-300" : "text-black font-extrabold"}`}
            >
              {LEGAL_LINKS.impressum[currentLanguage]}
            </button>
            <button
              onClick={() => handleTabTransition("privacy")}
              className={`underline-offset-2 hover:underline cursor-pointer ${isDark ? "text-zinc-400 hover:text-zinc-300" : "text-black font-extrabold"}`}
            >
              {LEGAL_LINKS.privacy[currentLanguage]}
            </button>
          </div>
        </div>
      </footer>

    </div>
    </MotionConfig>
  );
}
