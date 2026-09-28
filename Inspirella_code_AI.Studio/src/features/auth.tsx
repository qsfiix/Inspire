import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  GraduationCap,
  Briefcase,
  Sparkles,
  Activity,
  User,
  Mail,
  Lock,
  AlertCircle,
  ChevronRight,
  ChevronLeft,
  Check,
  Compass,
  BookOpen
} from "lucide-react";

// Localized custom copy definitions for Login phase
const AUTH_TRANSLATIONS: Record<string, Record<string, string>> = {
  en: {
    welcomeTitle: "Welcome to Inspirella",
    welcomeSubtitle: "Create your account to explore Switzerland's dual-track education systems and track your growth.",
    signInSubtitle: "Sign in to pick up where you left off.",
    nameLabel: "Your Name",
    emailLabel: "Email Address",
    passwordLabel: "Password",
    submitBtn: "Create Account & Continue",
    signInSubmitBtn: "Sign In & Continue",
    instantOverride: "Quick Exploration",
    bypassBtn: "Explore as Guest (No Account)",
    namePlaceholder: "e.g., Marie-Louise",
    emailPlaceholder: "e.g., marie@domain.ch",
    passwordPlaceholder: "At least 8 characters",
    backHome: "Back to Home",
    disclaimer: "Your account is created and stored securely with Supabase, so your profile follows you across devices.",
    stepLabel: "Step",
    signUpTabLabel: "Create Account",
    signInTabLabel: "Sign In",
    switchToSignIn: "Already have an account? Sign in",
    switchToSignUp: "New here? Create an account",
    confirmEmailTitle: "Check your inbox",
    confirmEmailMessage: "We sent a confirmation link to {email}. Confirm it, then sign in below.",
    genericAuthError: "Something went wrong. Please try again."
  },
  de: {
    welcomeTitle: "Willkommen bei Inspirella",
    welcomeSubtitle: "Erstellen Sie Ihr Konto, um die Schweizer Bildungslandschaft zu erkunden und Ihre Ziele zu verfolgen.",
    signInSubtitle: "Melden Sie sich an, um dort weiterzumachen, wo Sie aufgehört haben.",
    nameLabel: "Ihr Name",
    emailLabel: "E-Mail-Adresse",
    passwordLabel: "Passwort",
    submitBtn: "Konto erstellen & fortfahren",
    signInSubmitBtn: "Anmelden & fortfahren",
    instantOverride: "Schnelles Hineinschnuppern",
    bypassBtn: "Als Gast erkunden (kein Konto)",
    namePlaceholder: "z.B. Marie-Louise",
    emailPlaceholder: "z.B. marie@domain.ch",
    passwordPlaceholder: "Mindestens 8 Zeichen",
    backHome: "Zurück zur Startseite",
    disclaimer: "Ihr Konto wird sicher über Supabase gespeichert, damit Ihr Profil auf allen Geräten verfügbar ist.",
    stepLabel: "Schritt",
    signUpTabLabel: "Konto erstellen",
    signInTabLabel: "Anmelden",
    switchToSignIn: "Bereits ein Konto? Jetzt anmelden",
    switchToSignUp: "Neu hier? Konto erstellen",
    confirmEmailTitle: "Bitte E-Mail bestätigen",
    confirmEmailMessage: "Wir haben einen Bestätigungslink an {email} gesendet. Bestätigen Sie ihn und melden Sie sich anschliessend unten an.",
    genericAuthError: "Etwas ist schiefgelaufen. Bitte versuchen Sie es erneut."
  },
  fr: {
    welcomeTitle: "Bienvenue chez Inspirella",
    welcomeSubtitle: "Créez votre compte pour explorer le système éducatif dual suisse et suivre votre progression.",
    signInSubtitle: "Connectez-vous pour reprendre là où vous en étiez.",
    nameLabel: "Votre Nom",
    emailLabel: "Adresse E-mail",
    passwordLabel: "Mot de passe",
    submitBtn: "Créer un compte & continuer",
    signInSubmitBtn: "Se connecter & continuer",
    instantOverride: "Exploration Rapide",
    bypassBtn: "Explorer en tant qu'invité (sans compte)",
    namePlaceholder: "ex. Marie-Louise",
    emailPlaceholder: "ex. marie@domain.ch",
    passwordPlaceholder: "Au moins 8 caractères",
    backHome: "Retour à l'accueil",
    disclaimer: "Votre compte est créé et stocké en toute sécurité via Supabase, afin que votre profil vous suive sur tous vos appareils.",
    stepLabel: "Étape",
    signUpTabLabel: "Créer un compte",
    signInTabLabel: "Se connecter",
    switchToSignIn: "Déjà un compte ? Se connecter",
    switchToSignUp: "Nouveau ici ? Créer un compte",
    confirmEmailTitle: "Vérifiez votre boîte mail",
    confirmEmailMessage: "Nous avons envoyé un lien de confirmation à {email}. Confirmez-le, puis connectez-vous ci-dessous.",
    genericAuthError: "Une erreur est survenue. Veuillez réessayer."
  },
  it: {
    welcomeTitle: "Benvenuto in Inspirella",
    welcomeSubtitle: "Crea il tuo account per esplorare il sistema scolastico duale svizzero e tracciare la tua crescita.",
    signInSubtitle: "Accedi per riprendere da dove avevi lasciato.",
    nameLabel: "Il Tuo Nome",
    emailLabel: "Indirizzo E-mail",
    passwordLabel: "Password",
    submitBtn: "Crea account e continua",
    signInSubmitBtn: "Accedi e continua",
    instantOverride: "Esplorazione Rapida",
    bypassBtn: "Esplora come ospite (senza account)",
    namePlaceholder: "es. Marie-Louise",
    emailPlaceholder: "es. marie@domain.ch",
    passwordPlaceholder: "Almeno 8 caratteri",
    backHome: "Torna alla Home",
    disclaimer: "Il tuo account viene creato e salvato in modo sicuro con Supabase, così il tuo profilo ti segue su tutti i dispositivi.",
    stepLabel: "Passo",
    signUpTabLabel: "Crea account",
    signInTabLabel: "Accedi",
    switchToSignIn: "Hai già un account? Accedi",
    switchToSignUp: "Nuovo qui? Crea un account",
    confirmEmailTitle: "Controlla la tua posta",
    confirmEmailMessage: "Abbiamo inviato un link di conferma a {email}. Confermalo, poi accedi qui sotto.",
    genericAuthError: "Qualcosa è andato storto. Riprova."
  }
};

/**
 * Login/sign-up layout: the particle phoenix (PhoenixScene, mounted in
 * App.tsx) settles on the empty anchor on the left, the glass form sits on
 * the right; on phones the phoenix sits above the form. Fills one screen
 * below the header on desktop so everything is centred on arrival.
 */
const AUTH_STAGE_CLASS =
  "max-w-6xl mx-auto px-4 py-6 lg:py-4 lg:min-h-[calc(100svh-8rem)] grid gap-4 lg:gap-10 lg:grid-cols-[1.1fr_0.9fr] items-center";
const AUTH_CARD_COLUMN_CLASS = "w-full max-w-md mx-auto lg:mx-0 lg:justify-self-end";

function AuthPhoenixAnchor() {
  return (
    <div
      data-scene-anchor="0"
      aria-hidden="true"
      className="mx-auto h-44 w-44 sm:h-56 sm:w-56 lg:h-[min(560px,calc(100svh-11rem))] lg:w-full"
    />
  );
}

export function LoginView({
  t,
  currentLanguage = "en",
  isDark,
  tInput,
  handleSignUp,
  handleSignIn,
  handleBypassAuth,
  authError,
  pendingConfirmationEmail,
  onDismissConfirmation
}: any) {
  const [mode, setMode] = useState<"signUp" | "signIn">("signUp");
  const [authName, setAuthName] = useState("");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const activeLang = AUTH_TRANSLATIONS[currentLanguage] || AUTH_TRANSLATIONS.en;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    if (!authEmail.trim() || !authPassword) return;
    if (mode === "signUp" && !authName.trim()) return;

    setSubmitting(true);
    try {
      if (mode === "signUp") {
        await handleSignUp(authName.trim(), authEmail.trim(), authPassword);
      } else {
        await handleSignIn(authEmail.trim(), authPassword);
      }
    } finally {
      setSubmitting(false);
    }
  };

  // A confirmation email was just sent - show that instead of the form so
  // the user isn't left wondering why nothing happened after signing up.
  if (pendingConfirmationEmail) {
    return (
      <motion.div
        key="view-login-confirm"
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -15 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className={AUTH_STAGE_CLASS}
      >
        <AuthPhoenixAnchor />
        <div className={AUTH_CARD_COLUMN_CLASS}>
        <div className="card-premium p-8 relative overflow-hidden text-center shadow-2xl rounded-3xl border border-violet-500/20 space-y-4">
          <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-violet-600 via-indigo-600 to-purple-600"></div>
          <div className="mx-auto h-12 w-12 rounded-2xl bg-violet-600/10 flex items-center justify-center border border-violet-500/20 text-violet-500">
            <Mail className="h-6 w-6" />
          </div>
          <h1 className={`text-xl font-black ${isDark ? "text-white" : "text-violet-950"} tracking-tight`}>
            {activeLang.confirmEmailTitle}
          </h1>
          <p className={`text-xs ${isDark ? "text-zinc-400 font-medium" : "text-violet-900/60 font-bold"} leading-relaxed`}>
            {activeLang.confirmEmailMessage.replace("{email}", pendingConfirmationEmail)}
          </p>
          <button
            type="button"
            onClick={() => {
              setMode("signIn");
              onDismissConfirmation?.();
            }}
            className="btn-secondary w-full py-3 text-xs font-bold transition-all"
          >
            {activeLang.signInTabLabel}
          </button>
        </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      key="view-login"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className={AUTH_STAGE_CLASS}
    >
      <AuthPhoenixAnchor />
      <div className={AUTH_CARD_COLUMN_CLASS}>
      <div className="card-premium p-8 relative overflow-hidden text-left shadow-2xl rounded-3xl border border-violet-500/20">
        {/* Dynamic visual top indicator flare */}
        <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-violet-600 via-indigo-600 to-purple-600"></div>

        {/* Welcome Header */}
        <div className="text-center space-y-2 mb-6">
          <div className="mx-auto h-12 w-12 rounded-2xl bg-violet-600/10 flex items-center justify-center border border-violet-500/20 text-violet-500 mb-2">
            <Compass className="h-6 w-6 animate-spin-slow" />
          </div>
          <h1 className={`text-xl md:text-2xl font-black ${isDark ? "text-white" : "text-violet-950"} tracking-tight`}>
            {activeLang.welcomeTitle}
          </h1>
          <p className={`text-xs ${isDark ? "text-zinc-400 font-medium" : "text-violet-900/60 font-bold"} leading-relaxed max-w-sm mx-auto`}>
            {mode === "signUp" ? activeLang.welcomeSubtitle : activeLang.signInSubtitle}
          </p>
        </div>

        {/* Sign up / sign in mode toggle */}
        <div className={`grid grid-cols-2 gap-1.5 p-1 rounded-xl mb-6 ${isDark ? "bg-white/5" : "bg-violet-100/60"}`}>
          {(["signUp", "signIn"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={`py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                mode === m
                  ? "bg-violet-600 text-white shadow"
                  : isDark
                    ? "text-zinc-400 hover:text-white"
                    : "text-violet-950/60 hover:text-violet-950"
              }`}
            >
              {m === "signUp" ? activeLang.signUpTabLabel : activeLang.signInTabLabel}
            </button>
          ))}
        </div>

        {/* Interactive Form */}
        <form onSubmit={onSubmit} className="space-y-5">
          {mode === "signUp" && (
            <div className="space-y-1.5">
              <label className={`block text-xs font-mono uppercase tracking-wider mb-1.5 ${isDark ? "text-zinc-400" : "text-violet-950 font-black"}`}>
                {activeLang.nameLabel}
              </label>
              <div className="relative">
                <span className={`absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none ${isDark ? "text-zinc-500" : "text-violet-950/40"}`}>
                  <User className="h-4 w-4" />
                </span>
                <input
                  type="text"
                  value={authName}
                  onChange={(e) => setAuthName(e.target.value)}
                  placeholder={activeLang.namePlaceholder}
                  required
                  className={`w-full rounded-xl pl-10 pr-4 py-3 text-xs focus:outline-none transition-all ${tInput}`}
                />
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <label className={`block text-xs font-mono uppercase tracking-wider mb-1.5 ${isDark ? "text-zinc-400" : "text-violet-950 font-black"}`}>
              {activeLang.emailLabel}
            </label>
            <div className="relative">
              <span className={`absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none ${isDark ? "text-zinc-500" : "text-violet-950/40"}`}>
                <Mail className="h-4 w-4" />
              </span>
              <input
                type="email"
                value={authEmail}
                onChange={(e) => setAuthEmail(e.target.value)}
                placeholder={activeLang.emailPlaceholder}
                required
                autoComplete="email"
                className={`w-full rounded-xl pl-10 pr-4 py-3 text-xs focus:outline-none transition-all ${tInput}`}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className={`block text-xs font-mono uppercase tracking-wider mb-1.5 ${isDark ? "text-zinc-400" : "text-violet-950 font-black"}`}>
              {activeLang.passwordLabel}
            </label>
            <div className="relative">
              <span className={`absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none ${isDark ? "text-zinc-500" : "text-violet-950/40"}`}>
                <Lock className="h-4 w-4" />
              </span>
              <input
                type="password"
                value={authPassword}
                onChange={(e) => setAuthPassword(e.target.value)}
                placeholder={activeLang.passwordPlaceholder}
                required
                minLength={8}
                autoComplete={mode === "signUp" ? "new-password" : "current-password"}
                className={`w-full rounded-xl pl-10 pr-4 py-3 text-xs focus:outline-none transition-all ${tInput}`}
              />
            </div>
          </div>

          {/* Error banner sits right above the submit button - it must be visible
              without scrolling back up, since that's where the user's eyes/scroll
              position already are right after submitting. */}
          {authError && (
            <div className="flex items-start gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-3.5 py-2.5 text-[11px] leading-relaxed text-red-400">
              <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
              <span>{authError}</span>
            </div>
          )}

          {/* Core Submit Button */}
          <button
            type="submit"
            disabled={submitting}
            className="btn-primary w-full py-3.5 text-xs tracking-wider font-extrabold flex items-center justify-center gap-2 mt-2 transition-transform hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <span>{mode === "signUp" ? activeLang.submitBtn : activeLang.signInSubmitBtn}</span>
            <ChevronRight className="h-4 w-4" />
          </button>

          {/* Switch between sign up / sign in */}
          <button
            type="button"
            onClick={() => setMode(mode === "signUp" ? "signIn" : "signUp")}
            className={`block w-full text-center text-xs font-bold underline-offset-2 hover:underline ${isDark ? "text-violet-400" : "text-violet-700"}`}
          >
            {mode === "signUp" ? activeLang.switchToSignIn : activeLang.switchToSignUp}
          </button>

          {/* Info Disclaimer */}
          <p className={`text-xs text-center leading-relaxed font-sans px-2 ${isDark ? "text-zinc-500" : "text-violet-950/50 font-medium"}`}>
            {activeLang.disclaimer}
          </p>

          {/* Beautiful Custom Bypass option */}
          <div className={`relative flex py-3 items-center text-[11px] font-mono tracking-widest ${isDark ? "text-zinc-500" : "text-violet-900/40 font-bold"}`}>
            <div className={`flex-grow border-t ${isDark ? "border-white/5" : "border-violet-950/10"}`}></div>
            <span className="mx-3 uppercase">{activeLang.instantOverride}</span>
            <div className={`flex-grow border-t ${isDark ? "border-white/5" : "border-violet-950/10"}`}></div>
          </div>

          <button
            type="button"
            onClick={handleBypassAuth}
            className="btn-secondary w-full py-3 text-xs font-bold transition-all flex items-center justify-center gap-2"
          >
            <Sparkles className="h-4 w-4 text-violet-500 shrink-0" />
            <span>{activeLang.bypassBtn}</span>
          </button>
        </form>
      </div>
      </div>
    </motion.div>
  );
}

export function OnboardingView({ t, currentLanguage = "en", isDark, submitOnboarding }: any) {
  // Navigation stepper active index:
  // Step 0: Interests
  // Step 1: Goals
  // Step 2: System Stage / Student Status
  const [step, setStep] = useState(0);

  const [onboardInterests, setOnboardInterests] = useState<string[]>([]);
  const [onboardGoals, setOnboardGoals] = useState<string[]>([]);
  const [onboardStage, setOnboardStage] = useState<string>("");

  const handleStepNext = () => {
    if (step < 2) {
      setStep((prev) => prev + 1);
    } else {
      submitOnboarding(onboardInterests, onboardGoals, onboardStage);
    }
  };

  const handleStepBack = () => {
    if (step > 0) {
      setStep((prev) => prev - 1);
    }
  };

  // Define steps configurations
  const stepsMeta = [
    {
      title: t.chooseInterests || "Select Spheres of Interest",
      subtitle: currentLanguage === "de" ? "Wählen Sie ein oder mehrere Interessengebiete aus." : currentLanguage === "fr" ? "Sélectionnez un ou plusieurs domaines d'intérêt." : currentLanguage === "it" ? "Seleziona una o più aree di interesse principale." : "Select one or more spheres you would like to investigate.",
      isValid: onboardInterests.length > 0,
    },
    {
      title: t.chooseGoals || "Define Desired Outcomes",
      subtitle: currentLanguage === "de" ? "Definieren Sie ein oder mehrere gewünschte Ziele." : currentLanguage === "fr" ? "Définissez un ou plusieurs objectifs d'orientation." : currentLanguage === "it" ? "Definisci uno o più obiettivi formativi o professionali." : "Select your primary intentions for utilizing Inspirella guidance.",
      isValid: onboardGoals.length > 0,
    },
    {
      title: t.chooseStage || "Declare Your Current Stage",
      subtitle: currentLanguage === "de" ? "Wählen Sie Ihre aktuelle Ausbildungs- oder Berufsphase (Einzelauswahl)." : currentLanguage === "fr" ? "Sélectionnez votre profil d'activité d'une seule option." : currentLanguage === "it" ? "Seleziona la tua attuale fase accademica o lavorativa." : "Select your current secondary or vocational standing.",
      isValid: !!onboardStage,
    }
  ];

  const currentStepInfo = stepsMeta[step];
  const stepLabelText = AUTH_TRANSLATIONS[currentLanguage]?.stepLabel || AUTH_TRANSLATIONS.en.stepLabel;

  return (
    <motion.div
      key="view-onboarding"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="max-w-2xl mx-auto py-8 px-4 text-left"
    >
      <div className="card-premium p-6 sm:p-8 space-y-8 shadow-2xl relative overflow-hidden rounded-3xl border border-violet-500/20">
        
        {/* Stepper Wizard Progress Bar & Stage Indicator */}
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className={`text-xs uppercase tracking-wider ${isDark ? "text-violet-400 font-bold" : "text-violet-950 font-black animate-pulse"}`}>
              {t.onboardTitle || "Educational Calibration"}
            </span>
            <span className={`text-xs uppercase font-bold tracking-wider ${isDark ? "text-zinc-400" : "text-violet-900/60"}`}>
              {stepLabelText} {step + 1} / 3
            </span>
          </div>

          {/* High-end visual dynamic progress dots and bar */}
          <div className="relative flex items-center justify-between">
            {/* Background absolute line */}
            <div className={`absolute left-0 right-0 top-1/2 h-1 -translate-y-1/2 rounded-full ${isDark ? "bg-white/5" : "bg-violet-950/10"}`}></div>
            
            {/* Active filled line part */}
            <div 
              className="absolute left-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-gradient-to-r from-violet-600 via-indigo-600 to-purple-600 transition-all duration-300"
              style={{ width: `${(step / 2) * 100}%` }}
            ></div>

            {/* Step trigger nodes */}
            {[0, 1, 2].map((idx) => {
              const isActive = step === idx;
              const isCompleted = step > idx;
              
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    // Allow navigating backwards or forwards only to steps that are validated
                    if (idx < step) {
                      setStep(idx);
                    } else if (idx === 1 && stepsMeta[0].isValid) {
                      setStep(1);
                    } else if (idx === 2 && stepsMeta[0].isValid && stepsMeta[1].isValid) {
                      setStep(2);
                    }
                  }}
                  className={`relative z-10 flex h-7 w-7 items-center justify-center rounded-full border text-xs font-bold transition-all duration-200 cursor-pointer ${
                    isActive 
                      ? "bg-violet-600 text-white border-violet-500 ring-4 ring-violet-500/20 scale-110 shadow-lg shadow-violet-500/10" 
                      : isCompleted
                        ? "bg-emerald-500 text-white border-emerald-500 shadow-sm"
                        : isDark
                          ? "bg-zinc-950 border-white/10 text-zinc-500 hover:border-violet-500 hover:text-white"
                          : "bg-white border-purple-250 text-violet-950/40 hover:border-violet-950 hover:text-violet-950"
                  }`}
                >
                  {isCompleted ? <Check className="h-3.5 w-3.5 stroke-[3]" /> : idx + 1}
                </button>
              );
            })}
          </div>
        </div>

        {/* Dynamic header copy with clean, high-contrast layouts */}
        <div className="space-y-1 pt-2 border-t border-violet-500/10">
          <h2 className={`text-lg font-black tracking-tight ${isDark ? "text-white" : "text-violet-950"}`}>
            {currentStepInfo.title}
          </h2>
          <p className={`text-xs ${isDark ? "text-zinc-400" : "text-violet-950/70 font-semibold"}`}>
            {currentStepInfo.subtitle}
          </p>
        </div>

        {/* Wizard Form Panels */}
        <div className="min-h-[220px]">
          <AnimatePresence mode="wait">
            {step === 0 && (
              <motion.div
                key="step-interests"
                initial={{ opacity: 0, x: 15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -15 }}
                transition={{ duration: 0.25 }}
                className="grid gap-3 sm:grid-cols-2"
              >
                {[
                  { id: "academic", label: t.interests_academic || "Academic & Sciences", icon: GraduationCap },
                  { id: "vocational", label: t.interests_vocational || "Vocational & Artisanal", icon: Briefcase },
                  { id: "arts", label: t.interests_arts || "Creative Arts & Design", icon: Sparkles },
                  { id: "tech", label: t.interests_tech || "Software & Technology", icon: Activity },
                  { id: "business", label: t.interests_business || "Entrepreneurship & Finance", icon: Sparkles }
                ].map((item) => {
                  const isSelected = onboardInterests.includes(item.id);
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        if (isSelected) {
                          setOnboardInterests(onboardInterests.filter(i => i !== item.id));
                        } else {
                          setOnboardInterests([...onboardInterests, item.id]);
                        }
                      }}
                      className={`flex items-center gap-3 rounded-2xl border p-4 text-left text-xs font-bold transition cursor-pointer ${
                        isSelected
                          ? isDark 
                            ? "border-violet-500 bg-violet-650/15 text-white shadow-[0_0_15px_rgba(109,40,217,0.15)]" 
                            : "border-violet-650 bg-violet-600 text-white shadow-xl shadow-violet-100"
                          : isDark 
                            ? "border-white/5 bg-white/[0.01] text-zinc-300 hover:border-violet-900 hover:bg-white/[0.03]" 
                            : "border-purple-200 bg-violet-50/50 text-violet-950 hover:border-violet-950 hover:bg-violet-50"
                      }`}
                    >
                      <div className={`flex h-8 w-8 items-center justify-center rounded-xl transition-all shrink-0 ${
                        isSelected
                          ? "bg-white/20 text-white"
                          : isDark ? "bg-white/5 text-violet-400" : "bg-white border border-purple-200 text-violet-600 shadow-sm"
                      }`}>
                        <item.icon className="h-4.5 w-4.5" />
                      </div>
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </motion.div>
            )}

            {step === 1 && (
              <motion.div
                key="step-goals"
                initial={{ opacity: 0, x: 15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -15 }}
                transition={{ duration: 0.25 }}
                className="grid gap-3 sm:grid-cols-2"
              >
                {[
                  { id: "study_active", label: t.goals_study || "Study in Switzerland", icon: BookOpen },
                  { id: "career_pivot", label: t.goals_career || "Execute active pivot", icon: Briefcase },
                  { id: "global_compare", label: t.goals_explore || "Global System Comparisons", icon: Compass },
                  { id: "parent_routing", label: t.goals_child || "Parental advice", icon: GraduationCap }
                ].map((item) => {
                  const isSelected = onboardGoals.includes(item.id);
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        if (isSelected) {
                          setOnboardGoals(onboardGoals.filter(g => g !== item.id));
                        } else {
                          setOnboardGoals([...onboardGoals, item.id]);
                        }
                      }}
                      className={`flex items-center gap-3 rounded-2xl border p-4 text-left text-xs font-bold transition cursor-pointer ${
                        isSelected
                          ? isDark 
                            ? "border-violet-500 bg-violet-650/15 text-white shadow-[0_0_15px_rgba(109,40,217,0.15)]" 
                            : "border-violet-650 bg-violet-600 text-white shadow-xl shadow-violet-100"
                          : isDark 
                            ? "border-white/5 bg-white/[0.01] text-zinc-300 hover:border-violet-900 hover:bg-white/[0.03]" 
                            : "border-purple-200 bg-violet-50/50 text-violet-950 hover:border-violet-950 hover:bg-violet-50"
                      }`}
                    >
                      <div className={`flex h-8 w-8 items-center justify-center rounded-xl transition-all shrink-0 ${
                        isSelected
                          ? "bg-white/20 text-white"
                          : isDark ? "bg-white/5 text-violet-400" : "bg-white border border-purple-200 text-violet-600 shadow-sm"
                      }`}>
                        <item.icon className="h-4.5 w-4.5" />
                      </div>
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step-stage"
                initial={{ opacity: 0, x: 15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -15 }}
                transition={{ duration: 0.25 }}
                className="grid gap-3 sm:grid-cols-2"
              >
                {[
                  { id: "stage_secondary", label: t.stage_schoolType || "Gymnasium / Secondary student", icon: GraduationCap },
                  { id: "stage_university", label: t.stage_university || "University student", icon: BookOpen },
                  { id: "stage_professional", label: t.stage_professional || "Active professional", icon: Briefcase },
                  { id: "stage_other", label: t.stage_other || "Curious citizen", icon: Compass }
                ].map((item) => {
                  const isSelected = onboardStage === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setOnboardStage(item.id)}
                      className={`flex items-center gap-3 rounded-2xl border p-4 text-left text-xs font-bold transition cursor-pointer ${
                        isSelected
                          ? isDark 
                            ? "border-violet-500 bg-violet-650/15 text-white shadow-[0_0_15px_rgba(109,40,217,0.15)]" 
                            : "border-violet-650 bg-violet-600 text-white shadow-xl shadow-violet-100"
                          : isDark 
                            ? "border-white/5 bg-white/[0.01] text-zinc-300 hover:border-violet-900 hover:bg-white/[0.03]" 
                            : "border-purple-200 bg-violet-50/50 text-violet-950 hover:border-violet-950 hover:bg-violet-50"
                      }`}
                    >
                      <div className={`flex h-8 w-8 items-center justify-center rounded-xl transition-all shrink-0 ${
                        isSelected
                          ? "bg-white/20 text-white"
                          : isDark ? "bg-white/5 text-violet-400" : "bg-white border border-purple-200 text-violet-605 shadow-sm"
                      }`}>
                        <item.icon className="h-4.5 w-4.5" />
                      </div>
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Stepper Wizard Progress Action Footer Controls */}
        <div className="flex items-center justify-between pt-5 border-t border-violet-500/10">
          {step > 0 ? (
            <button
              type="button"
              onClick={handleStepBack}
              className="btn-secondary py-2.5 px-4 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <ChevronLeft className="h-4 w-4" />
              <span>Back</span>
            </button>
          ) : (
            <div className="w-1"></div>
          )}

          <button
            type="button"
            onClick={handleStepNext}
            disabled={!currentStepInfo.isValid}
            className={`btn-primary py-2.5 px-6 text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer ${
              !currentStepInfo.isValid ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            {step < 2 ? (
              <>
                <span>Continue</span>
                <ChevronRight className="h-4 w-4" />
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 animate-pulse text-amber-300" />
                <span>{t.completeOnboard || "Complete Setup"}</span>
              </>
            )}
          </button>
        </div>

      </div>
    </motion.div>
  );
}
