import React, { useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  ArrowRight, 
  Sparkles, 
  Globe, 
  Compass, 
  Navigation, 
  TrendingUp, 
  Briefcase, 
  GraduationCap,
  Layers,
  CheckCircle,
  Mail,
  ShieldCheck,
  ChevronRight
} from "lucide-react";
import HeroBackground from "../components/HeroBackground";
import PlatformStats from "../components/PlatformStats";
import SplineHero, { SplineHeroStatus } from "../components/SplineHero";

export function HomeView({ 
  t, 
  isDark, 
  tTextTitle, 
  tTextSub, 
  tTextBody, 
  tTextMuted, 
  tCard, 
  tCardAccent, 
  handleTabTransition, 
  handleBypassAuth
}: any) {
  const heroRef = useRef<HTMLElement>(null);
  const [splineStatus, setSplineStatus] = useState<SplineHeroStatus>("loading");

  // Cursor-reactive spotlight: written straight to the DOM (not React state)
  // so a 60fps mousemove never triggers a re-render - HeroBackground's
  // spotlight layer just reads the live --mx/--my custom properties.
  const handleHeroMouseMove = (e: React.MouseEvent<HTMLElement>) => {
    const rect = heroRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    heroRef.current?.style.setProperty("--mx", `${x}%`);
    heroRef.current?.style.setProperty("--my", `${y}%`);
  };

  return (
    <motion.div
      key="view-home"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.5 }}
      className="space-y-20 py-4 max-w-6xl mx-auto"
    >
      {/* Premium Cinematic Hero Block. No overflow-hidden/rounded-3xl here
          on purpose - that was the last frame still clipping the Spline
          model and its glow with a rounded edge. HeroBackground keeps its
          own separate overflow-hidden wrapper, so the decorative blobs stay
          contained regardless.
          Breaks out of the page's max-w-6xl cap (left-1/2 + negative
          margin + w-screen is the standard full-bleed trick) so the hero
          - and the model's own column - get real extra width instead of
          being squeezed into the same 1152px every other section uses. */}
      <section
        ref={heroRef}
        onMouseMove={handleHeroMouseMove}
        className="py-14 md:py-24 relative left-1/2 -ml-[50vw] w-screen px-4 sm:px-8 lg:px-16"
      >
        <HeroBackground isDark={isDark} showPhoenixWatermark={splineStatus !== "ready"} />

        <div className="relative grid gap-6 lg:grid-cols-[0.85fr_1.15fr] items-center">
          {/* Text column */}
          <div className="space-y-8 text-center lg:text-left">
            {/* Live Active Badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
              className={`inline-flex items-center gap-2 rounded-full px-4 py-1.5 font-mono text-[10px] tracking-wider uppercase transition-all duration-300 ${
                isDark
                  ? "bg-white/5 border border-white/10 text-violet-300 shadow-lg shadow-violet-950/20"
                  : "bg-violet-950/10 border border-violet-950/20 text-violet-950 font-bold shadow-sm"
              }`}
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span>{t.swissSpecialGroup}</span>
            </motion.div>

            {/* Main Hero Hook */}
            <h1 className={`text-4xl md:text-6xl font-extrabold tracking-tight leading-[1.1] max-w-4xl mx-auto lg:mx-0 ${
              isDark
                ? "bg-gradient-to-b from-white via-slate-100 to-zinc-400 bg-clip-text text-transparent"
                : "text-violet-950 filter drop-shadow-[0_2px_10px_rgba(46,16,101,0.06)]"
            }`}>
              {t.heroTitle}
            </h1>

            {/* Hero Description Subtitle */}
            <p className={`text-base md:text-xl font-sans max-w-2xl mx-auto lg:mx-0 leading-relaxed font-normal ${
              isDark ? "text-zinc-400" : "text-violet-950/80 font-medium"
            }`}>
              {t.heroSubtitle}
            </p>

            {/* Primary and secondary Call To Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-4 max-w-md mx-auto lg:mx-0">
              <div className="relative w-full sm:w-auto">
                <div
                  className="hero-blob absolute inset-0 -z-10 rounded-xl blur-xl opacity-60"
                  style={{
                    background: "radial-gradient(circle, rgba(139,92,246,0.55) 0%, rgba(139,92,246,0) 75%)",
                    animationName: "hero-node-pulse",
                    animationDuration: "3.5s",
                    "--node-opacity-min": 0.5,
                    "--node-opacity-max": 0.9
                  }}
                />
                <button
                  onClick={() => handleTabTransition("login")}
                  className="btn-primary relative w-full sm:w-auto px-7 py-3.5 text-sm gap-2"
                >
                  <span>{t.heroCTA}</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>

              <button
                onClick={handleBypassAuth}
                className="btn-secondary w-full sm:w-auto px-7 py-3.5 text-sm"
              >
                <span>{t.exploreCTA}</span>
              </button>
            </div>

            {/* Real, live platform scale - not decorative, hidden entirely if unreachable */}
            <PlatformStats
              isDark={isDark}
              align="left"
              labels={{
                institutions: t.statInstitutions,
                professions: t.statProfessions,
                learningPaths: t.statLearningPaths,
                languages: t.statLanguages
              }}
            />
          </div>

          {/* 3D phoenix column - Sofiia's own Spline model of the logo.
              Stays a tasteful glass panel with a soft pulse while loading/if
              unavailable, so the layout never shows an empty box.
              No overflow-hidden here - a canvas can't show content beyond
              its own pixel bounds anyway, so a DOM clip mask was never the
              real lever. Width was the fix for the left/right crop (the
              hero breakout above) - height was still the same fixed cap as
              before, so anything tall in her composition still hit the
              bottom/top of the box. Given real extra room here too. */}
          <div className="relative h-[520px] sm:h-[640px] lg:h-[900px]">
            <div
              className={`absolute inset-0 rounded-3xl border transition-opacity duration-500 flex items-center justify-center ${
                isDark ? "border-white/10 bg-white/[0.02]" : "border-violet-950/10 bg-violet-950/[0.02]"
              } ${splineStatus === "ready" ? "opacity-0 pointer-events-none" : "opacity-100"}`}
            >
              <span
                className={`h-3 w-3 rounded-full ${isDark ? "bg-violet-400" : "bg-violet-600"}`}
                style={{
                  animationName: "hero-node-pulse",
                  animationDuration: "2.2s",
                  animationIterationCount: "infinite",
                  animationTimingFunction: "ease-in-out",
                  "--node-opacity-min": 0.25,
                  "--node-opacity-max": 0.7
                }}
              />
            </div>
            {/* No CSS scale here on purpose - Sofiia is re-framing/scaling
                the phoenix natively inside Spline itself instead, so it
                renders crisp at its own resolution rather than being
                stretched by a CSS transform (which was softening it). */}
            <SplineHero className="absolute inset-0" onStatusChange={setSplineStatus} />
          </div>
        </div>
      </section>

      {/* Switzerland Core Focus Segment (Interactive Visual Comparison) */}
      <section className="card-premium grid gap-12 lg:grid-cols-12 items-center p-8 md:p-12 relative overflow-hidden">
        {/* Subtle branding background watermark */}
        <div className="absolute right-0 bottom-0 text-[180px] font-mono text-violet-500/[0.01] select-none pointer-events-none font-bold">CH</div>

        <div className="space-y-6 lg:col-span-5">
          <div className="inline-flex items-center gap-1.5">
            <Globe className="h-4 w-4 text-violet-500" />
            <span className={`text-xs uppercase tracking-widest font-mono font-bold ${
              isDark ? "text-violet-300" : "text-violet-900"
            }`}>
              Swiss Education Structure
            </span>
          </div>

          <h2 className={`text-3xl md:text-4xl font-extrabold tracking-tight ${tTextTitle}`}>
            {t.whyTitle}
          </h2>

          <p className={`text-sm leading-relaxed ${isDark ? "text-zinc-400" : "text-violet-950/80 font-medium"}`}>
            {t.whyText}
          </p>

          <p className={`text-sm leading-relaxed ${isDark ? "text-zinc-400" : "text-violet-950/80 font-medium"}`}>
            {t.swissSpecialDesc}
          </p>
        </div>

        {/* Styled Interactive Swiss Education Track Diagram Board */}
        <div className="lg:col-span-7 space-y-4">
          <div className="card-premium-accent p-6 space-y-4">
            <span className={`block text-[10px] font-mono uppercase tracking-widest ${tTextMuted} border-b border-violet-900/10 pb-2`}>
              Swiss Dual Track Permeability Structure
            </span>
            
            {/* VET Vocational Track */}
            <div className={`p-4 rounded-xl transition duration-300 group ${
              isDark 
                ? "bg-white/5 border border-white/10 hover:border-violet-500/40" 
                : "bg-white border-2 border-violet-950/20 hover:border-violet-600/40 shadow-sm"
            }`}>
              <div className="flex items-center gap-3 mb-1.5">
                <div className="p-2 rounded-lg bg-orange-500/10 text-orange-400">
                  <Briefcase className="h-4.5 w-4.5" />
                </div>
                <span className={`font-extrabold text-sm ${isDark ? "text-violet-300" : "text-violet-950"}`}>
                  Vocational System (VET Apprenticeship)
                </span>
                <span className="ml-auto text-[9px] uppercase font-mono px-2 py-0.5 rounded bg-orange-500/10 text-orange-400 font-bold">
                  70% of Swiss Youth
                </span>
              </div>
              <p className={`text-xs ml-9.5 ${isDark ? "text-zinc-300" : "text-violet-950 font-medium leading-relaxed"}`}>
                Blend of real paid enterprise workspace training + school room credentials. Providing robust real-world industrial expertise.
              </p>
            </div>

            {/* Permeability Bridge Indicator */}
            <div className="relative py-2 flex items-center justify-center">
              <div className="absolute left-0 right-0 border-t border-dashed border-violet-900/20"></div>
              <div className={`relative px-4 py-1 rounded-full text-[10px] font-mono font-bold flex items-center gap-1.5 ${
                isDark ? "bg-zinc-950 text-violet-400 border border-violet-900/30" : "bg-violet-100 text-violet-950 border border-violet-950/20"
              }`}>
                <span>⇅ Bridge (Durchlässigkeit)</span>
              </div>
            </div>

            {/* Academic Track */}
            <div className={`p-4 rounded-xl transition duration-300 group ${
              isDark 
                ? "bg-white/5 border border-white/10 hover:border-violet-500/40" 
                : "bg-white border-2 border-violet-950/20 hover:border-violet-600/40 shadow-sm"
            }`}>
              <div className="flex items-center gap-3 mb-1.5">
                <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
                  <GraduationCap className="h-4.5 w-4.5" />
                </div>
                <span className={`font-extrabold text-sm ${isDark ? "text-violet-300" : "text-violet-950"}`}>
                  Federal Academic Sector (ETH / EPFL)
                </span>
                <span className="ml-auto text-[9px] uppercase font-mono px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 font-bold">
                  Research Institutions
                </span>
              </div>
              <p className={`text-xs ml-9.5 ${isDark ? "text-zinc-300" : "text-violet-950 font-medium leading-relaxed"}`}>
                Highly specialized research institutes. Direct entrance via Gymnasiale Maturität or transitional Passerelle bridges.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works Module Grid */}
      <section className="space-y-12">
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-500/10 text-violet-400 text-xs font-mono font-bold uppercase tracking-wider">
            How it Works
          </div>
          <h2 className={`text-3xl md:text-4xl font-extrabold ${tTextTitle}`}>{t.howItWorks}</h2>
          <p className={`text-sm max-w-md mx-auto ${isDark ? "text-zinc-400" : "text-violet-950/80 font-medium"}`}>
            A clear system to help you make informed educational decisions.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              title: t.howStepOnboarding,
              desc: t.howStepOnboardingDesc,
              num: "01",
              icon: Compass,
              color: "text-amber-400 bg-amber-500/10",
              targetTab: "login"
            },
            {
              title: t.howStepMap,
              desc: t.howStepMapDesc,
              num: "02",
              icon: Navigation,
              color: "text-emerald-400 bg-emerald-500/10",
              targetTab: "map"
            },
            {
              title: t.howStepTracker,
              desc: t.howStepTrackerDesc,
              num: "03",
              icon: TrendingUp,
              color: "text-violet-400 bg-violet-500/10",
              targetTab: "tracker"
            },
            {
              title: t.howStepResources,
              desc: t.howStepResourcesDesc,
              num: "04",
              icon: Globe,
              color: "text-indigo-400 bg-indigo-500/10",
              targetTab: "resources"
            }
          ].map((step, idx) => {
            const StepIcon = step.icon;
            return (
              <div
                key={idx}
                onClick={() => handleTabTransition(step.targetTab)}
                role="button"
                tabIndex={0}
                onKeyDown={e => {
                  if (e.key === "Enter" || e.key === " ") handleTabTransition(step.targetTab);
                }}
                className="card-premium p-6 group transition duration-300 relative overflow-hidden flex flex-col justify-between cursor-pointer"
              >
                {/* Large elegant subtle background index */}
                <span className="absolute -top-4 -right-2 text-7xl font-mono font-black opacity-[0.03] select-none group-hover:opacity-[0.06] transition duration-300">
                  {step.num}
                </span>

                <div className="space-y-4">
                  <div className={`p-2.5 rounded-xl w-fit ${step.color}`}>
                    <StepIcon className="h-5 w-5" />
                  </div>
                  
                  <div className="space-y-1.5">
                    <h3 className={`font-extrabold text-sm tracking-tight ${tTextTitle} group-hover:text-violet-400 transition duration-300`}>
                      {step.title.substring(3)}
                    </h3>
                    <p className={`text-xs leading-relaxed ${isDark ? "text-zinc-400" : "text-violet-950/85 font-semibold"}`}>
                      {step.desc}
                    </p>
                  </div>
                </div>

                <div className="pt-4 mt-4 border-t border-violet-900/10 flex items-center text-[10px] uppercase font-mono font-bold tracking-wider text-violet-500 group-hover:text-violet-400 transition">
                  <span>View Details</span>
                  <ChevronRight className="h-3 w-3 ml-1 group-hover:translate-x-1 transition duration-200" />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Global Scaling Roadmap Panel */}
      <section className={`rounded-3xl p-8 md:p-10 max-w-4xl mx-auto border-2 border-dashed relative overflow-hidden ${
        isDark ? "border-white/10 bg-white/[0.01]" : "border-violet-950/20 bg-violet-950/5 shadow-inner"
      }`}>
        <div className="absolute top-0 right-0 w-40 h-40 bg-purple-500/5 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex flex-col md:flex-row gap-8 items-center justify-between">
          <div className="space-y-4 text-center md:text-left max-w-md">
            <div className="inline-flex items-center gap-1.5 text-amber-400">
              <Sparkles className="h-5 w-5 animate-pulse" />
              <span className="text-xs uppercase font-mono tracking-widest font-bold">Future Scale</span>
            </div>
            <h3 className={`text-xl font-bold tracking-tight ${tTextTitle}`}>{t.futureVisionTitle}</h3>
            <p className={`text-xs leading-relaxed ${isDark ? "text-zinc-400" : "text-violet-950/80 font-bold"}`}>
              {t.futureVisionDesc}
            </p>
          </div>

          {/* Planned Country Badge Grid */}
          <div className="grid grid-cols-3 gap-3 w-full md:w-auto">
            {[
              { country: "Denmark", code: "DK", status: "Calibration Q4" },
              { country: "Singapore", code: "SG", status: "Planned H1" },
              { country: "Japan", code: "JP", status: "Research" }
            ].map((node, i) => (
              <div 
                key={i} 
                className={`p-3 rounded-xl border flex flex-col items-center justify-center text-center transition duration-300 min-w-[100px] ${
                  isDark ? "bg-white/5 border-white/10 hover:bg-white/10" : "bg-white border-violet-950/20 hover:border-violet-950/30 shadow-sm"
                }`}
              >
                <span className="text-lg font-black tracking-wider text-violet-500">{node.code}</span>
                <span className={`text-[10px] font-bold mt-1 ${isDark ? "text-white" : "text-violet-950"}`}>{node.country}</span>
                <span className="text-[8px] font-mono uppercase bg-violet-500/10 text-violet-400 px-1.5 py-0.5 rounded-full mt-1.5 font-bold">{node.status}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </motion.div>
  );
}

export function AboutView({ t, isDark, tTextTitle, tTextBody, tCard }: any) {
  return (
    <motion.div
      key="view-about"
      initial={{ opacity: 0, x: 15 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -15 }}
      className="max-w-4xl mx-auto space-y-12 py-6"
    >
      {/* Intro Editorial Heading */}
      <section className="text-center max-w-2xl mx-auto space-y-4">
        <div className="inline-flex items-center gap-1 text-xs font-mono font-bold uppercase tracking-widest text-violet-500">
          <Layers className="h-4 w-4" />
          <span>Our Vision</span>
        </div>
        <h1 className={`text-4xl font-extrabold tracking-tight ${tTextTitle}`}>{t.aboutTitle}</h1>
        <div className="w-12 h-1 bg-violet-600 mx-auto rounded-full"></div>
      </section>

      {/* Main Mission Paragraphs */}
      <section className="grid gap-8 md:grid-cols-2">
        <div className="card-premium p-8 leading-relaxed">
          <span className="text-xs uppercase font-mono font-bold tracking-widest text-violet-500 block mb-3">Addressing System Complexity</span>
          <p className={`text-sm ${isDark ? "text-zinc-300" : "text-violet-950/90 font-bold"}`}>{t.aboutPara1}</p>
        </div>

        <div className="card-premium p-8 leading-relaxed">
          <span className="text-xs uppercase font-mono font-bold tracking-widest text-violet-500 block mb-3">Interactive Mapping</span>
          <p className={`text-sm ${isDark ? "text-zinc-300" : "text-violet-950/90 font-bold"}`}>{t.aboutPara2}</p>
        </div>
      </section>

      {/* Mission - condensed from 00_Brain/Mission.md */}
      <section className="card-premium-glow p-8 space-y-3 text-center max-w-3xl mx-auto">
        <span className="text-xs uppercase font-mono font-bold tracking-widest text-violet-500 block">{t.aboutMissionEyebrow}</span>
        <p className={`text-base leading-relaxed ${isDark ? "text-zinc-200" : "text-violet-950/95 font-bold"}`}>{t.aboutMissionBody}</p>
      </section>

      {/* Why it matters - condensed from the "gap" section of Mission.md */}
      <section className="max-w-3xl mx-auto text-center space-y-2">
        <span className="text-xs uppercase font-mono font-bold tracking-widest text-violet-500 block">{t.aboutWhyEyebrow}</span>
        <p className={`text-sm leading-relaxed ${isDark ? "text-zinc-400" : "text-violet-950/80 font-semibold"}`}>{t.aboutWhyBody}</p>
      </section>

      {/* Core values */}
      <section className="space-y-6">
        <h3 className={`text-center font-bold text-lg tracking-wider font-mono uppercase ${isDark ? "text-violet-300" : "text-violet-950"}`}>
          {t.aboutValuesTitle}
        </h3>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { title: t.aboutValue1Title, icon: ShieldCheck, desc: t.aboutValue1Desc },
            { title: t.aboutValue2Title, icon: Compass, desc: t.aboutValue2Desc },
            { title: t.aboutValue3Title, icon: Layers, desc: t.aboutValue3Desc },
            { title: t.aboutValue4Title, icon: CheckCircle, desc: t.aboutValue4Desc }
          ].map((pillar, idx) => {
            const PillarIcon = pillar.icon;
            return (
              <div key={idx} className={`p-5 rounded-2xl border flex flex-col justify-between ${
                isDark ? "bg-white/[0.02] border-white/5" : "bg-white border-2 border-violet-950/15 shadow-sm"
              }`}>
                <div className="space-y-3">
                  <div className="p-2 rounded-lg bg-violet-500/10 text-violet-500 w-fit">
                    <PillarIcon className="h-5 w-5" />
                  </div>
                  <h4 className={`text-sm font-extrabold ${isDark ? "text-white" : "text-black"}`}>{pillar.title}</h4>
                  <p className={`text-xs ${isDark ? "text-zinc-400" : "text-violet-950/80 font-semibold"}`}>{pillar.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Swiss Cantonal Educational Authority Board */}
      <section className="card-premium p-8 space-y-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 h-full w-2 bg-gradient-to-b from-orange-500 via-violet-500 to-indigo-500"></div>
        <span className={`block text-xs font-mono uppercase tracking-widest font-bold ${
          isDark ? "text-violet-300" : "text-violet-900"
        }`}>
          Cantonal Educational Autonomy
        </span>
        <p className={`text-sm leading-relaxed font-sans ${isDark ? "text-zinc-300" : "text-violet-950/95 font-bold"}`}>
          Switzerland's secondary pathways rely on cantonal boards (EDK / CDIP), which means local regions have different schedules and entrance requirements. Inspirella helps make sense of this system.
        </p>
      </section>

      {/* Honest, current-stage transparency note */}
      <section className={`p-6 rounded-2xl border ${isDark ? "bg-amber-500/5 border-amber-500/20" : "bg-amber-50 border-amber-300"}`}>
        <span className={`block text-xs font-mono uppercase tracking-widest font-bold mb-2 ${isDark ? "text-amber-300" : "text-amber-800"}`}>
          {t.aboutStageEyebrow}
        </span>
        <p className={`text-sm leading-relaxed ${isDark ? "text-amber-100/90" : "text-amber-900/90 font-semibold"}`}>{t.aboutStageBody}</p>
      </section>

      {/* Vision - condensed from 00_Brain/Vision.md */}
      <section className="max-w-3xl mx-auto text-center space-y-2 pb-2">
        <span className="text-xs uppercase font-mono font-bold tracking-widest text-violet-500 block">{t.aboutVisionEyebrow}</span>
        <p className={`text-sm leading-relaxed ${isDark ? "text-zinc-400" : "text-violet-950/80 font-semibold"}`}>{t.aboutVisionBody}</p>
      </section>
    </motion.div>
  );
}

export function PrivacyView({ isDark, tTextTitle, handleTabTransition }: any) {
  const tBody = isDark ? "text-zinc-300" : "text-violet-950/90 font-semibold";
  const tHeading = isDark ? "text-violet-200" : "text-violet-950";

  return (
    <motion.div
      key="view-privacy"
      initial={{ opacity: 0, x: 15 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -15 }}
      className="max-w-3xl mx-auto py-6 space-y-8 text-left"
    >
      <div className="space-y-2">
        <div className="inline-flex items-center gap-1 text-xs font-mono font-bold uppercase tracking-widest text-violet-500">
          <ShieldCheck className="h-4 w-4" />
          <span>Privacy</span>
        </div>
        <h1 className={`text-3xl font-extrabold tracking-tight ${tTextTitle}`}>Privacy Notice</h1>
        <p className={`text-xs ${isDark ? "text-zinc-500" : "text-violet-950/60 font-medium"}`}>
          Last updated: 12 September 2026 · Plain-language summary, not a substitute for legal advice.
        </p>
      </div>

      <div className="card-premium p-6 space-y-3">
        <h2 className={`text-sm font-extrabold uppercase tracking-wide ${tHeading}`}>Who is responsible</h2>
        <p className={`text-sm leading-relaxed ${tBody}`}>
          Inspirella is currently an individual project, not yet a registered legal entity. For any privacy
          question, correction, or deletion request, contact{" "}
          <a href="mailto:iinspirella@gmail.com" className="text-violet-400 underline">
            iinspirella@gmail.com
          </a>
          .
        </p>
      </div>

      <div className="card-premium p-6 space-y-3">
        <h2 className={`text-sm font-extrabold uppercase tracking-wide ${tHeading}`}>Guest mode: nothing leaves your browser</h2>
        <p className={`text-sm leading-relaxed ${tBody}`}>
          If you use "Explore as Guest," your profile and trackers are stored only in your browser's local
          storage. Nothing is sent to our servers, and clearing your browser data removes it completely.
        </p>
      </div>

      <div className="card-premium p-6 space-y-3">
        <h2 className={`text-sm font-extrabold uppercase tracking-wide ${tHeading}`}>What we collect with an account</h2>
        <ul className={`text-sm leading-relaxed space-y-2 list-disc pl-5 ${tBody}`}>
          <li><strong>Account data:</strong> your email address and a securely hashed password (handled by our authentication provider, Supabase - we never see your plain-text password).</li>
          <li><strong>Profile data you provide:</strong> name, interface language, current education/career stage, and optional canton/city if you enter one.</li>
          <li><strong>Personalization signals:</strong> the interests, goals, and target canton/language you select during onboarding, used to compute your recommendations.</li>
          <li><strong>Trackers:</strong> the habit/goal trackers you create, so they follow you across devices.</li>
          <li><strong>Basic technical data:</strong> standard server access logs (e.g. IP address, timestamp) generated automatically by our hosting infrastructure.</li>
        </ul>
      </div>

      <div className="card-premium p-6 space-y-3">
        <h2 className={`text-sm font-extrabold uppercase tracking-wide ${tHeading}`}>Why we collect it</h2>
        <p className={`text-sm leading-relaxed ${tBody}`}>
          Solely to run the product: signing you in, remembering your profile and progress across devices,
          and computing the institution/profession/resource recommendations you see on your dashboard. We do
          not sell your data, and we do not use it for advertising.
        </p>
      </div>

      <div className="card-premium p-6 space-y-3">
        <h2 className={`text-sm font-extrabold uppercase tracking-wide ${tHeading}`}>Where it's stored</h2>
        <p className={`text-sm leading-relaxed ${tBody}`}>
          Account and profile data is stored with <strong>Supabase</strong>, our database and authentication
          provider. The interactive map loads <strong>Mapbox</strong>, which may process standard technical
          request data (like your IP address) when map tiles load, under Mapbox's own privacy terms. We do
          not run advertising trackers or sell data to third parties.
        </p>
      </div>

      <div className="card-premium p-6 space-y-3">
        <h2 className={`text-sm font-extrabold uppercase tracking-wide ${tHeading}`}>Your rights</h2>
        <p className={`text-sm leading-relaxed ${tBody}`}>
          You can ask us to show you what we have, correct it, or delete your account and all associated
          data, by writing to{" "}
          <a href="mailto:iinspirella@gmail.com" className="text-violet-400 underline">
            iinspirella@gmail.com
          </a>
          . You can also delete individual trackers or edit your profile directly from within the app at any
          time.
        </p>
      </div>

      <div className="card-premium p-6 space-y-3">
        <h2 className={`text-sm font-extrabold uppercase tracking-wide ${tHeading}`}>Cookies &amp; local storage</h2>
        <p className={`text-sm leading-relaxed ${tBody}`}>
          We use your browser's local storage to remember your theme (dark/light) and, in guest mode, your
          profile and trackers. We do not use third-party advertising or tracking cookies.
        </p>
      </div>

      <p className={`text-xs leading-relaxed ${isDark ? "text-zinc-500" : "text-violet-950/60 font-medium"}`}>
        This is an honest first version of our privacy notice, written in plain language rather than formal
        legal text. As Inspirella grows we intend to have it reviewed by a lawyer familiar with Swiss (nLPD/
        FADP) and EU (GDPR) data protection law.
      </p>

      <button
        onClick={() => handleTabTransition("home")}
        className="btn-secondary px-5 py-2.5 text-xs font-bold"
      >
        Back to Home
      </button>
    </motion.div>
  );
}

export function ContactView({ t, isDark, tTextTitle, tTextSub, tInput, tCard }: any) {
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactMsg, setContactMsg] = useState("");
  const [contactSuccess, setContactSuccess] = useState(false);

  // There is no backend mail service behind this form - opening a mailto:
  // link is the honest mechanism here: it genuinely hands the message to the
  // user's own mail client addressed to a real inbox, rather than showing a
  // "sent" confirmation for a message that actually went nowhere.
  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactName || !contactEmail || !contactMsg) return;

    const subject = encodeURIComponent(`Inspirella contact form - ${contactName}`);
    const body = encodeURIComponent(`${contactMsg}\n\n— ${contactName} (${contactEmail})`);
    window.location.href = `mailto:iinspirella@gmail.com?subject=${subject}&body=${body}`;

    setContactSuccess(true);
    setTimeout(() => {
      setContactName("");
      setContactEmail("");
      setContactMsg("");
      setContactSuccess(false);
    }, 4500);
  };

  return (
    <motion.div
      key="view-contact"
      initial={{ opacity: 0, x: 15 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -15 }}
      className="max-w-5xl mx-auto py-6 space-y-8"
    >
      <div className="text-center max-w-lg mx-auto space-y-2">
        <h1 className={`text-3xl font-extrabold tracking-tight ${tTextTitle}`}>{t.contactTitle}</h1>
        <p className={`text-xs ${isDark ? "text-zinc-400" : "text-violet-950/80 font-bold"}`}>{t.contactSubtitle}</p>
      </div>

      <div className="grid gap-8 lg:grid-cols-12 items-start">
        {/* Left Hand: Contact Info */}
        <div className="card-premium lg:col-span-5 p-6 space-y-6">
          <div className="space-y-2">
            <span className="text-[10px] font-mono uppercase tracking-widest text-violet-500 font-bold">Contact</span>
            <h3 className={`text-lg font-bold ${isDark ? "text-white" : "text-violet-950"}`}>
              An early-stage, independent project
            </h3>
            <p className={`text-xs ${isDark ? "text-zinc-400" : "text-violet-950/80 font-bold"}`}>
              Inspirella is not yet a registered company - there's no office or phone line, just a real
              person reading every message.
            </p>
          </div>

          <div className="space-y-4 pt-4 border-t border-violet-900/10 text-xs">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-violet-500/10 text-violet-500">
                <Mail className="h-4 w-4" />
              </div>
              <div>
                <span className={`block font-mono text-[9px] uppercase ${isDark ? "text-zinc-500" : "text-violet-950/70"}`}>Email</span>
                <a
                  href="mailto:iinspirella@gmail.com"
                  className={`font-bold underline underline-offset-2 ${isDark ? "text-zinc-200 hover:text-violet-300" : "text-violet-950"}`}
                >
                  iinspirella@gmail.com
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Right Hand: Contact Form */}
        <div className="card-premium lg:col-span-7 p-6 md:p-8 shadow-2xl space-y-6">
          {contactSuccess ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className={`p-6 rounded-xl text-xs font-bold leading-relaxed border flex flex-col items-center text-center space-y-3 ${
                isDark 
                  ? "bg-emerald-500/5 border-emerald-500/20 text-emerald-400" 
                  : "bg-emerald-50 border-2 border-emerald-300 text-emerald-950"
              }`}
            >
              <CheckCircle className="h-10 w-10 text-emerald-400 animate-bounce" />
              <div className="space-y-1">
                <h4 className="text-sm font-extrabold uppercase">Success</h4>
                <p className="max-w-md mx-auto text-xs">{t.contactSuccess}</p>
              </div>
            </motion.div>
          ) : (
            <form onSubmit={handleContactSubmit} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className={`block text-[10px] font-mono uppercase mb-1.5 font-bold ${tTextSub}`}>
                    {t.contactName}
                  </label>
                  <input
                    type="text"
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    required
                    className={`w-full rounded-lg p-2.5 text-xs outline-none focus:outline-none transition-all duration-200 ${tInput}`}
                    placeholder="Jean-Pierre Piaget"
                  />
                </div>

                <div>
                  <label className={`block text-[10px] font-mono uppercase mb-1.5 font-bold ${tTextSub}`}>
                    {t.contactEmail}
                  </label>
                  <input
                    type="email"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    required
                    className={`w-full rounded-lg p-2.5 text-xs outline-none focus:outline-none transition-all duration-200 ${tInput}`}
                    placeholder="jean.piaget@unige.ch"
                  />
                </div>
              </div>

              <div>
                <label className={`block text-[10px] font-mono uppercase mb-1.5 font-bold ${tTextSub}`}>
                  {t.contactMsg}
                </label>
                <textarea
                  value={contactMsg}
                  onChange={(e) => setContactMsg(e.target.value)}
                  required
                  rows={4}
                  className={`w-full rounded-lg p-2.5 text-xs outline-none focus:outline-none transition-all duration-200 ${tInput}`}
                  placeholder="Your questions about educational paths, partnerships, or our platform..."
                />
              </div>

              <button
                type="submit"
                className="btn-primary w-full py-3 text-xs tracking-wider"
              >
                {t.contactSend}
              </button>
            </form>
          )}
        </div>
      </div>
    </motion.div>
  );
}
