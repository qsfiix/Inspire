import { motion } from "motion/react";
import { Globe, LogOut, GraduationCap, Map, CheckSquare, FileText, User, Compass, Sun, Moon } from "lucide-react";
import { LanguageCode } from "../types";
import { TRANSLATIONS } from "../data";
import PhoenixLogo from "./PhoenixLogo";

interface NavbarProps {
  currentLanguage: LanguageCode;
  onLanguageChange: (lang: LanguageCode) => void;
  activeTab: string;
  onTabChange: (tab: string) => void;
  isLoggedIn: boolean;
  onLogout: () => void;
  userName?: string;
  theme: "dark" | "light";
  onThemeToggle: () => void;
}

export default function Navbar({
  currentLanguage,
  onLanguageChange,
  activeTab,
  onTabChange,
  isLoggedIn,
  onLogout,
  userName,
  theme,
  onThemeToggle
}: NavbarProps) {
  const t = TRANSLATIONS[currentLanguage];
  const isDark = theme === "dark";

  const publicTabs = [
    { id: "home", label: t.navHome, icon: Compass },
    { id: "about", label: t.navAbout, icon: FileText },
    { id: "contact", label: t.navContact, icon: Globe }
  ];

  const privateTabs = [
    { id: "dashboard", label: t.navDashboard, icon: GraduationCap },
    { id: "map", label: t.navMap, icon: Map },
    { id: "resources", label: t.navResources, icon: FileText },
    { id: "tracker", label: t.navTracker, icon: CheckSquare },
    { id: "profile", label: t.navProfile, icon: User }
  ];

  const tabsToRender = isLoggedIn ? privateTabs : publicTabs;

  return (
    <header 
      className={`sticky top-0 z-50 w-full border-b transition-all duration-300 backdrop-blur-xl shadow-lg ${
        isDark 
          ? "border-white/10 bg-black/40 text-white" 
          : "border-purple-200 bg-white/70 text-indigo-950"
      }`}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        
        {/* BRAND IDENTITY LOGO */}
        <div 
          className="flex items-center gap-2 cursor-pointer group" 
          onClick={() => onTabChange(isLoggedIn ? "dashboard" : "home")}
        >
          <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 via-indigo-700 to-purple-800 shadow-[0_0_15px_rgba(109,40,217,0.4)] transition-transform duration-300 group-hover:scale-105 active:scale-95">
            <PhoenixLogo size={28} className="text-white drop-shadow-[0_2px_5px_rgba(255,255,255,0.4)]" />
            <div className="absolute -inset-1 rounded-xl bg-gradient-to-r from-violet-600 to-purple-800 opacity-20 blur-sm"></div>
          </div>
          <div>
            <span className={`text-xl font-bold tracking-wider transition-colors ${isDark ? "text-white" : "text-indigo-950"}`}>
              INSPIRELLA
            </span>
            <span className={`block text-[9px] font-mono tracking-widest uppercase transition-colors ${isDark ? "text-violet-400" : "text-violet-600 font-semibold"}`}>
              Swiss Education Explorer
            </span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="hidden md:flex space-x-1">
          {tabsToRender.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`relative flex items-center gap-1.5 px-3 py-2 text-sm font-medium transition-all duration-300 rounded-lg cursor-pointer ${
                  isActive 
                    ? isDark ? "text-violet-200 bg-white/5" : "text-violet-950 bg-violet-100 font-bold"
                    : isDark ? "text-white/80 hover:text-white hover:bg-white/5" : "text-black hover:text-black hover:bg-purple-100"
                }`}
              >
                <Icon className={`h-4 w-4 ${isActive ? "text-violet-500" : ""}`} />
                {tab.label}
                {isActive && (
                  <motion.div
                    layoutId="activeNavBarIndicator"
                    className="absolute bottom-0 left-2 right-2 h-0.5 bg-gradient-to-r from-violet-500 to-indigo-500"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
              </button>
            );
          })}
        </nav>

        {/* Language, Theme & Actions */}
        <div className="flex items-center gap-2">
          
          {/* THEME TOGGLE BUTTON */}
          <button
            onClick={onThemeToggle}
            aria-label="Toggle Theme"
            className={`p-2 rounded-lg border transition-all cursor-pointer ${
              isDark 
                ? "border-white/10 bg-white/5 text-amber-300 hover:bg-white/10" 
                : "border-purple-200 bg-purple-50/50 text-violet-700 hover:bg-purple-100/50"
            }`}
          >
            {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>

          {/* Language Selector */}
          <div className={`flex items-center gap-1.5 rounded-lg border p-1 ${
            isDark ? "border-white/10 bg-white/5" : "border-purple-200 bg-purple-50/30"
          }`}>
            <Globe className="h-3.5 w-3.5 text-violet-500" />
            <select
              value={currentLanguage}
              onChange={(e) => onLanguageChange(e.target.value as LanguageCode)}
              className={`bg-transparent text-xs font-medium focus:outline-none cursor-pointer pr-1 ${
                isDark ? "text-white" : "text-indigo-950"
              }`}
            >
              <option className={isDark ? "bg-zinc-950 text-white" : "bg-white text-indigo-950"} value="en">EN</option>
              <option className={isDark ? "bg-zinc-950 text-white" : "bg-white text-indigo-950"} value="de">DE</option>
              <option className={isDark ? "bg-zinc-950 text-white" : "bg-white text-indigo-950"} value="fr">FR</option>
              <option className={isDark ? "bg-zinc-950 text-white" : "bg-white text-indigo-950"} value="it">IT</option>
            </select>
          </div>

          {isLoggedIn ? (
            <div className="flex items-center gap-2">
              <span className={`hidden lg:inline text-xs font-mono border-l pl-3 ${
                isDark ? "text-violet-200 border-white/10" : "text-black font-extrabold border-purple-200"
              }`}>
                {userName || "Explorer"}
              </span>
              <button
                onClick={onLogout}
                className={`flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all cursor-pointer ${
                  isDark 
                    ? "text-white/80 hover:text-red-400 border border-transparent hover:border-red-900/30 hover:bg-red-950/20" 
                    : "text-black hover:text-red-600 border border-transparent hover:border-red-200 hover:bg-red-50 font-bold"
                }`}
              >
                <LogOut className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{t.logout}</span>
              </button>
            </div>
          ) : (
            <button
              onClick={() => onTabChange("login")}
              className="relative overflow-hidden inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-1.5 text-xs font-semibold text-white shadow-xl transition-all hover:scale-[1.03] active:scale-[0.98] cursor-pointer"
            >
              {t.navLogin}
            </button>
          )}
        </div>
      </div>

      {/* Mobile Nav Rail */}
      <div className={`md:hidden flex overflow-x-auto border-t py-2 px-3 space-x-3 scrollbar-none ${
        isDark ? "border-white/10 bg-[#06040a]/90 backdrop-blur-xl" : "border-purple-200 bg-white/90 backdrop-blur-md shadow-sm"
      }`}>
        {tabsToRender.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs whitespace-nowrap rounded-lg transition-all duration-200 cursor-pointer ${
                isActive 
                  ? isDark 
                    ? "bg-violet-500/20 text-violet-300 font-bold border border-violet-500/40 shadow-[0_0_12px_rgba(109,40,217,0.25)]" 
                    : "bg-violet-600 text-white font-black shadow-sm"
                  : isDark 
                    ? "text-white/70 hover:text-white border border-transparent" 
                    : "text-black hover:text-violet-950 font-bold border border-transparent"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>
    </header>
  );
}
