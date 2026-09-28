import React, { useEffect, useRef, useState } from "react";
import Lenis from "lenis";
import "lenis/dist/lenis.css";
import SceneChapters from "../components/phoenix/SceneChapters";
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
  ChevronRight,
  ArrowUpDown
} from "lucide-react";
import HeroBackground from "../components/HeroBackground";
import PlatformStats from "../components/PlatformStats";
import SectionGlow from "../components/SectionGlow";
import Reveal from "../components/Reveal";

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
  handleBypassAuth,
  sceneStatus = "loading"
}: any) {
  const heroRef = useRef<HTMLElement>(null);

  // Inertial smooth scrolling on the home page only - makes the scroll
  // story (particle morphs, reveals) glide instead of stepping with each
  // wheel notch. Off under prefers-reduced-motion; destroyed on leaving home.
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const lenis = new Lenis({ lerp: 0.085, smoothWheel: true });
    let raf = requestAnimationFrame(function loop(time) {
      lenis.raf(time);
      raf = requestAnimationFrame(loop);
    });
    return () => {
      cancelAnimationFrame(raf);
      lenis.destroy();
    };
  }, []);

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
      className="relative space-y-20 py-4 max-w-6xl mx-auto"
    >
      {/* The living backdrop itself (PhoenixScene) is mounted once in App.tsx
          and follows this page's data-scene-anchor elements. */}
      <SceneChapters isDark={isDark} labels={String(t.sceneChapters || "").split("|")} />

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
        className="pt-6 pb-14 md:pt-10 md:pb-24 lg:py-10 lg:-mt-12 lg:min-h-[calc(100svh-4rem)] lg:flex lg:items-center relative left-1/2 -ml-[50vw] w-screen px-4 sm:px-8 lg:px-16"
      >
        {/* CSS fallback only when WebGL isn't available */}
        {sceneStatus === "error" && <HeroBackground isDark={isDark} showPhoenixWatermark />}

        {/* Desktop: the hero fills exactly one screen below the header
            (-mt-12 cancels main/page top padding) and both columns are
            vertically centred, so text and phoenix sit square in the
            viewport at any window proportion. */}
        <div className="relative w-full grid gap-6 lg:grid-cols-[0.85fr_1.15fr] items-start lg:items-center">
          {/* Text column */}
          <div className="space-y-8 text-center lg:text-left">
            {/* Mobile/tablet: the particle phoenix gets its own space above
                the headline (the desktop column is hidden below lg). */}
            <div data-scene-anchor="0" className="lg:hidden mx-auto h-56 w-56 sm:h-72 sm:w-72" aria-hidden="true" />

            {/* Live Active Badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
              className={`inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-medium transition-all duration-300 ${
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

            {/* Hero headline = the brand slogan (00_Brain/Positioning.md).
                heroTitle carries "first clause|second clause": the first
                reads in solid white, the second carries the flowing violet
                accent. Words rise out of a blur one after another. */}
            {(() => {
              const [lead, accent = ""] = String(t.heroTitle).split("|");
              let wordIndex = 0;
              const renderWords = (text: string, isAccent: boolean) =>
                text.trim().split(" ").filter(Boolean).map(word => {
                  const i = wordIndex++;
                  return (
                    <React.Fragment key={`${word}-${i}`}>
                      <motion.span
                        aria-hidden="true"
                        className="inline-block pb-[0.08em]"
                        initial={{ opacity: 0, y: "0.45em", filter: "blur(14px)" }}
                        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                        transition={{ delay: 0.25 + i * 0.09, duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
                      >
                        <span className={isAccent ? "text-shimmer" : isDark ? "text-zinc-50" : "text-violet-950"}>{word}</span>
                      </motion.span>{" "}
                    </React.Fragment>
                  );
                });
              return (
                <h1
                  aria-label={`${lead} ${accent}`.trim()}
                  className="text-4xl md:text-6xl font-extrabold tracking-tight leading-[1.08] max-w-4xl mx-auto lg:mx-0 text-balance"
                >
                  <span className="block">{renderWords(lead, false)}</span>
                  {accent && <span className="block">{renderWords(accent, true)}</span>}
                </h1>
              );
            })()}

            {/* Hero Description Subtitle */}
            <p className={`text-base md:text-xl font-sans max-w-2xl mx-auto lg:mx-0 leading-relaxed font-normal ${
              isDark ? "text-zinc-400" : "text-violet-950/80 font-medium"
            }`}>
              {t.heroSubtitle}
            </p>

            {/* Primary and secondary Call To Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-4 max-w-xl mx-auto lg:mx-0">
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
                  className="btn-primary btn-shine w-full sm:w-auto px-7 py-3.5 text-sm gap-2 whitespace-nowrap"
                >
                  <span>{t.heroCTA}</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>

              <button
                onClick={handleBypassAuth}
                className="btn-secondary w-full sm:w-auto px-7 py-3.5 text-sm whitespace-nowrap"
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

          {/* Phoenix column: an empty anchor the WebGL particle phoenix
              (PhoenixScene) positions itself on. Without WebGL it shows the
              flat logo instead, so the column is never an empty box. */}
          <div data-scene-anchor="0" className="hidden lg:flex relative lg:h-[min(640px,calc(100svh-9rem))] items-center justify-center">
            {sceneStatus === "error" && (
              <img src="/logo-mark.png" alt="" className="w-3/4 opacity-90 drop-shadow-[0_0_40px_rgba(139,92,246,0.5)]" />
            )}
          </div>
        </div>

        {/* Scroll cue: a light drop running down a thin line */}
        <div className="hidden md:flex absolute bottom-2 left-1/2 -translate-x-1/2 flex-col items-center gap-2 pointer-events-none" aria-hidden="true">
          <span className={`text-[11px] font-mono uppercase tracking-[0.3em] ${isDark ? "text-violet-300/60" : "text-violet-900/50"}`}>Scroll</span>
          <span className={`scroll-cue relative block h-10 w-px overflow-hidden ${isDark ? "bg-white/10" : "bg-violet-900/15"}`} />
        </div>
      </section>

      {/* Chapter 02 - Switzerland. The text and a compact two-track diagram
          sit on the left; the particle Switzerland stands open on the right
          (it used to hide behind this section's glass card), with the
          vocational and academic streams flowing across it and crossing at
          the permeability "bridge". The legend names what the colours mean. */}
      <section className="relative grid gap-10 lg:gap-14 lg:grid-cols-2 items-center">
        <Reveal className="order-2 lg:order-1 space-y-6">
          <h2 className={`text-3xl md:text-5xl font-extrabold tracking-tight text-balance ${tTextTitle}`}>
            {t.whyTitle}
          </h2>
          <p className={`text-base leading-relaxed max-w-xl ${isDark ? "text-zinc-300" : "text-violet-950/80 font-medium"}`}>
            {t.whyText}
          </p>
          <p className={`text-base leading-relaxed max-w-xl ${isDark ? "text-zinc-400" : "text-violet-950/75 font-medium"}`}>
            {t.swissSpecialDesc}
          </p>

          {/* The two tracks, with the bridge between them */}
          <div className="card-premium-accent border-beam p-5 space-y-2">
            <div className={`p-4 rounded-xl ${isDark ? "bg-white/5 border border-white/10" : "bg-white border border-violet-950/15 shadow-sm"}`}>
              <div className="flex items-center gap-3 mb-1.5">
                <div className="p-2 rounded-lg bg-amber-400/15 text-amber-400">
                  <Briefcase className="h-4.5 w-4.5" />
                </div>
                <span className={`font-bold text-sm ${isDark ? "text-amber-100" : "text-violet-950"}`}>{t.hmVetTitle}</span>
                <span className={`ml-auto text-xs font-semibold px-2 py-0.5 rounded-full ${isDark ? "bg-amber-400/10 text-amber-300" : "bg-amber-100 text-amber-800"}`}>~70%</span>
              </div>
              <p className={`text-sm ml-11 ${isDark ? "text-zinc-300" : "text-violet-950/80"}`}>
                {t.hmVetText}
              </p>
            </div>

            {/* Permeability bridge: light travels both ways between the tracks */}
            <div className="relative h-12 flex items-center justify-center">
              <span className="bridge-track left-[22%]" aria-hidden="true" />
              <span className="bridge-track up right-[22%]" aria-hidden="true" />
              <div className={`relative px-4 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 shadow-[0_4px_20px_-6px_rgba(139,92,246,0.5)] ${
                isDark ? "bg-zinc-950 text-violet-200 border border-violet-500/40" : "bg-violet-100 text-violet-950 border border-violet-950/20"
              }`}>
                <ArrowUpDown className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Durchlässigkeit</span>
              </div>
            </div>

            <div className={`p-4 rounded-xl ${isDark ? "bg-white/5 border border-white/10" : "bg-white border border-violet-950/15 shadow-sm"}`}>
              <div className="flex items-center gap-3 mb-1.5">
                <div className="p-2 rounded-lg bg-violet-400/15 text-violet-300">
                  <GraduationCap className="h-4.5 w-4.5" />
                </div>
                <span className={`font-bold text-sm ${isDark ? "text-violet-100" : "text-violet-950"}`}>{t.hmAcadTitle}</span>
                <span className={`ml-auto text-xs font-semibold px-2 py-0.5 rounded-full ${isDark ? "bg-violet-400/10 text-violet-200" : "bg-violet-100 text-violet-800"}`}>~30%</span>
              </div>
              <p className={`text-sm ml-11 ${isDark ? "text-zinc-300" : "text-violet-950/80"}`}>
                {t.hmAcadText}
              </p>
            </div>
          </div>
        </Reveal>

        <div className="order-1 lg:order-2 space-y-4">
          <div data-scene-anchor="1" aria-hidden="true" className="w-full aspect-[16/10]" />
          <ul className={`space-y-2 text-sm ${isDark ? "text-zinc-300" : "text-violet-950/80 font-medium"}`}>
            <li className="flex items-center gap-2.5">
              <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-amber-300 shadow-[0_0_10px_rgba(252,211,77,0.8)]" aria-hidden="true" />
              {t.streamVet}
            </li>
            <li className="flex items-center gap-2.5">
              <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-violet-300 shadow-[0_0_10px_rgba(196,181,253,0.8)]" aria-hidden="true" />
              {t.streamAcademic}
            </li>
            <li className="flex items-center gap-2.5">
              <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${isDark ? "bg-white shadow-[0_0_10px_rgba(255,255,255,0.8)]" : "bg-fuchsia-600 shadow-[0_0_8px_rgba(192,38,211,0.5)]"}`} aria-hidden="true" />
              {t.streamBridge}
            </li>
          </ul>
        </div>
      </section>

      {/* Chapter 03 - the path. The particles assemble into the My Path
          staircase (light climbs it step by step) beside the four steps of
          how Inspirella works - the same staircase the user later climbs on
          their dashboard. */}
      <section className="relative grid gap-10 lg:gap-14 lg:grid-cols-2 items-center">
        <div data-scene-anchor="2" aria-hidden="true" className="w-full aspect-[4/3]" />

        <div className="space-y-6">
          <Reveal className="space-y-4">
            <h2 className={`text-3xl md:text-5xl font-extrabold tracking-tight text-balance ${tTextTitle}`}>{t.howItWorks}</h2>
            <p className={`text-base leading-relaxed max-w-xl ${isDark ? "text-zinc-300" : "text-violet-950/80 font-medium"}`}>
              {t.howItWorksIntro}
            </p>
          </Reveal>

          <ol className="space-y-3">
            {[
              { title: t.howStepOnboarding, desc: t.howStepOnboardingDesc, icon: Compass, targetTab: "login" },
              { title: t.howStepMap, desc: t.howStepMapDesc, icon: Navigation, targetTab: "map" },
              { title: t.howStepTracker, desc: t.howStepTrackerDesc, icon: TrendingUp, targetTab: "tracker" },
              { title: t.howStepResources, desc: t.howStepResourcesDesc, icon: Globe, targetTab: "resources" }
            ].map((step, idx) => {
              const StepIcon = step.icon;
              return (
                <Reveal as="li" key={idx} delay={idx * 0.08}>
                  <button
                    onClick={() => handleTabTransition(step.targetTab)}
                    className="card-premium tilt-3d group w-full flex items-start gap-4 p-4 text-left cursor-pointer hover:-translate-y-0.5"
                  >
                    <span
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border text-sm font-bold ${
                        isDark ? "border-violet-400/30 bg-violet-500/10 text-violet-200" : "border-violet-300 bg-violet-50 text-violet-800"
                      }`}
                    >
                      {idx + 1}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className={`flex items-center gap-2 font-bold text-base ${tTextTitle}`}>
                        <StepIcon className={`h-4 w-4 shrink-0 ${isDark ? "text-violet-300" : "text-violet-700"}`} aria-hidden="true" />
                        {String(step.title).replace(/^[0-9]+\.\s*/, "")}
                      </span>
                      <span className={`mt-1 block text-sm leading-relaxed ${isDark ? "text-zinc-400" : "text-violet-950/75 font-medium"}`}>
                        {step.desc}
                      </span>
                    </span>
                    <ChevronRight
                      className={`h-4 w-4 mt-3 shrink-0 transition group-hover:translate-x-1 ${isDark ? "text-violet-300" : "text-violet-700"}`}
                      aria-hidden="true"
                    />
                  </button>
                </Reveal>
              );
            })}
          </ol>
        </div>
      </section>

      {/* Global scaling note. Deliberately names no future countries or
          dates - there's no committed roadmap for any, and showing one would
          present a plan that doesn't exist (the project's "never invent
          data" rule). Only claims what's true: Switzerland is live, the data
          model isn't Switzerland-specific.
          Chapter 04 - beyond: the particles become a slowly turning globe with
          an orbit ring beside it (brought back 2026-09-28 at Sofiia's request). */}
      <section className="relative grid gap-10 lg:gap-14 lg:grid-cols-2 items-center">
      <Reveal className="order-2 lg:order-1">
      <div className={`rounded-3xl p-8 md:p-10 border-2 border-dashed relative overflow-hidden ${
        isDark ? "border-white/10 bg-white/[0.02] backdrop-blur-[2px]" : "border-violet-950/20 bg-violet-950/5 shadow-inner"
      }`}>
        <div className="flex flex-col gap-8">
          <div className="space-y-3 text-center md:text-left">
            <h3 className={`text-xl font-bold tracking-tight ${tTextTitle}`}>{t.futureVisionTitle}</h3>
            <p className={`text-sm leading-relaxed ${isDark ? "text-zinc-400" : "text-violet-950/80 font-medium"}`}>
              {t.futureVisionDesc}
            </p>
          </div>

          {/* Live now vs. open slot - no invented countries or dates */}
          <div className="grid grid-cols-2 gap-3 w-full md:w-auto">
            <div className={`p-3 rounded-xl border flex flex-col items-center justify-center text-center min-w-[130px] ${
              isDark ? "bg-violet-500/10 border-violet-500/40 shadow-[0_8px_24px_-10px_rgba(139,92,246,0.6)]" : "bg-white border-violet-600/40 shadow-sm"
            }`}>
              <span className="text-lg font-black tracking-wider text-violet-400">CH</span>
              <span className={`text-xs font-bold mt-1 ${isDark ? "text-white" : "text-violet-950"}`}>{t.futureVisionLive}</span>
              <span className={`mt-1.5 inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${isDark ? "bg-emerald-500/10 text-emerald-300" : "bg-emerald-50 text-emerald-800"}`}>
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                {t.hmLive}
              </span>
            </div>
            <div className={`p-3 rounded-xl border-2 border-dashed flex flex-col items-center justify-center text-center min-w-[130px] ${
              isDark ? "border-white/15 text-zinc-400" : "border-violet-950/20 text-violet-950/70"
            }`}>
              <span className="text-lg font-black tracking-wider">+</span>
              <span className="text-xs font-semibold mt-1">{t.futureVisionNext}</span>
            </div>
          </div>
        </div>
      </div>
      </Reveal>
        <div data-scene-anchor="3" aria-hidden="true" className="order-1 lg:order-2 w-full max-w-[520px] mx-auto aspect-square" />
      </section>

      {/* Chapter 05 - the finale. The phoenix re-forms beside the one clear
          action the whole page leads to (peak-end: the last thing a visitor
          sees is the brand rising and the first step to take). */}
      <section className="relative grid gap-8 lg:grid-cols-2 items-center pb-10">
        <Reveal className="space-y-6 text-center lg:text-left order-2">
          <h2 className={`text-3xl md:text-5xl font-extrabold tracking-tight text-balance ${tTextTitle}`}>
            {t.finalCtaTitle}
          </h2>
          <p className={`text-base md:text-lg leading-relaxed max-w-xl mx-auto lg:mx-0 ${isDark ? "text-zinc-300" : "text-violet-950/80 font-medium"}`}>
            {t.finalCtaText}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
            <button
              onClick={() => handleTabTransition("login")}
              className="btn-primary btn-shine w-full sm:w-auto px-7 py-3.5 text-sm gap-2 whitespace-nowrap"
            >
              <span>{t.heroCTA}</span>
              <ArrowRight className="h-4 w-4" />
            </button>
            <button onClick={handleBypassAuth} className="btn-secondary w-full sm:w-auto px-7 py-3.5 text-sm whitespace-nowrap">
              {t.exploreCTA}
            </button>
          </div>
        </Reveal>
        <div data-scene-anchor="4" aria-hidden="true" className="order-1 w-full max-w-[560px] mx-auto aspect-square" />
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
      <section className="relative text-center max-w-2xl mx-auto space-y-4 py-4">
        <SectionGlow isDark={isDark} corner="center" showNodes />
        <div className="relative inline-flex items-center gap-1 text-xs font-mono font-bold uppercase tracking-widest text-violet-500">
          <Layers className="h-4 w-4" />
          <span>Our Vision</span>
        </div>
        <h1 className={`relative text-4xl font-extrabold tracking-tight ${tTextTitle}`}>{t.aboutTitle}</h1>
        <div className="relative w-12 h-1 bg-violet-600 mx-auto rounded-full"></div>
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
      <div className="relative text-center max-w-lg mx-auto space-y-2 py-2">
        <SectionGlow isDark={isDark} corner="center" />
        <h1 className={`relative text-3xl font-extrabold tracking-tight ${tTextTitle}`}>{t.contactTitle}</h1>
        <p className={`relative text-xs ${isDark ? "text-zinc-400" : "text-violet-950/80 font-bold"}`}>{t.contactSubtitle}</p>
      </div>

      <div className="grid gap-8 lg:grid-cols-12 items-start">
        {/* Left Hand: Contact Info */}
        <div className="card-premium lg:col-span-5 p-6 space-y-6">
          <div className="space-y-2">
            <span className="text-xs font-mono uppercase tracking-widest text-violet-500 font-bold">Contact</span>
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
                <span className={`block font-mono text-[11px] uppercase ${isDark ? "text-zinc-500" : "text-violet-950/70"}`}>Email</span>
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
              <CheckCircle className="h-10 w-10 text-emerald-400" />
              <div className="space-y-1">
                <h4 className="text-sm font-extrabold uppercase">Success</h4>
                <p className="max-w-md mx-auto text-xs">{t.contactSuccess}</p>
              </div>
            </motion.div>
          ) : (
            <form onSubmit={handleContactSubmit} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className={`block text-xs font-mono uppercase mb-1.5 font-bold ${tTextSub}`}>
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
                  <label className={`block text-xs font-mono uppercase mb-1.5 font-bold ${tTextSub}`}>
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
                <label className={`block text-xs font-mono uppercase mb-1.5 font-bold ${tTextSub}`}>
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
