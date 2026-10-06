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
import type { CefrLevel, LanguageLevel, RouteBackground } from "../types";
import { getOnboardingCopy } from "./onboardingCopy";

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
    welcomeSubtitle: "Erstelle dein Konto, um die Schweizer Bildungslandschaft zu erkunden und deine Ziele zu verfolgen.",
    signInSubtitle: "Melde dich an, um dort weiterzumachen, wo du aufgehört hast.",
    nameLabel: "Dein Name",
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
    disclaimer: "Dein Konto wird sicher über Supabase gespeichert, damit dein Profil auf allen Geräten verfügbar ist.",
    stepLabel: "Schritt",
    signUpTabLabel: "Konto erstellen",
    signInTabLabel: "Anmelden",
    switchToSignIn: "Bereits ein Konto? Jetzt anmelden",
    switchToSignUp: "Neu hier? Konto erstellen",
    confirmEmailTitle: "Bitte E-Mail bestätigen",
    confirmEmailMessage: "Wir haben einen Bestätigungslink an {email} gesendet. Bestätige ihn und melde dich anschliessend unten an.",
    genericAuthError: "Etwas ist schiefgelaufen. Bitte versuche es erneut."
  },
  fr: {
    welcomeTitle: "Bienvenue chez Inspirella",
    welcomeSubtitle: "Crée ton compte pour explorer le système éducatif dual suisse et suivre ta progression.",
    signInSubtitle: "Connecte-toi pour reprendre là où tu en étais.",
    nameLabel: "Ton Nom",
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
    disclaimer: "Ton compte est créé et stocké en toute sécurité via Supabase, afin que ton profil te suive sur tous tes appareils.",
    stepLabel: "Étape",
    signUpTabLabel: "Créer un compte",
    signInTabLabel: "Se connecter",
    switchToSignIn: "Déjà un compte ? Se connecter",
    switchToSignUp: "Nouveau ici ? Créer un compte",
    confirmEmailTitle: "Vérifie ta boîte mail",
    confirmEmailMessage: "Nous avons envoyé un lien de confirmation à {email}. Confirme-le, puis connecte-toi ci-dessous.",
    genericAuthError: "Une erreur est survenue. Réessaie."
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

type OnboardingStepId = "goals" | "target" | "stage" | "interests" | "education" | "languages";

// Most important first: users who abandon the survey early still leave us the
// goal. Steps marked required keep the old validation; the new route steps
// are optional and skippable.
const ONBOARDING_STEPS: { id: OnboardingStepId; required: boolean }[] = [
  { id: "goals", required: true },
  { id: "target", required: false },
  { id: "stage", required: true },
  { id: "interests", required: true },
  { id: "education", required: false },
  { id: "languages", required: false }
];

const TARGET_LEVELS: NonNullable<RouteBackground["targetLevel"]>[] = [
  "apprenticeship",
  "berufsmatura",
  "higher_vocational",
  "university_of_applied_sciences",
  "university",
  "language_course",
  "undecided"
];
const STUDY_MODES: NonNullable<RouteBackground["studyModePreference"]>[] = ["full_time", "part_time", "work_study", "any"];
const EDU_LEVELS: NonNullable<RouteBackground["highestEducation"]>[] = [
  "none",
  "compulsory_school",
  "upper_secondary_vocational",
  "upper_secondary_general",
  "tertiary_professional",
  "bachelor",
  "master"
];
const RECOGNITION: NonNullable<RouteBackground["diplomaRecognitionStatus"]>[] = [
  "not_checked",
  "in_progress",
  "recognised",
  "not_needed"
];
const EDU_COUNTRIES = ["CH", "DE", "AT", "FR", "IT", "UA", "XX"];
const SWISS_LANGS = ["de", "fr", "it", "en"];
const CEFR_CHOICES: CefrLevel[] = ["none", "A1", "A2", "B1", "B2", "C1", "C2"];
const FIRST_LANGS = ["ru", "uk", "de", "fr", "it", "en"];

function OnboardingChoice({
  selected,
  onClick,
  isDark,
  icon: Icon,
  children,
  compact
}: {
  key?: React.Key;
  selected: boolean;
  onClick: () => void;
  isDark: boolean;
  icon?: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
  compact?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`flex items-center gap-3 rounded-2xl border text-left font-bold transition cursor-pointer ${
        compact ? "px-3 py-2 text-[11px]" : "p-4 text-xs"
      } ${
        selected
          ? isDark
            ? "border-violet-500 bg-violet-650/15 text-white shadow-[0_0_15px_rgba(109,40,217,0.15)]"
            : "border-violet-650 bg-violet-600 text-white shadow-xl shadow-violet-100"
          : isDark
            ? "border-white/5 bg-white/[0.01] text-zinc-300 hover:border-violet-900 hover:bg-white/[0.03]"
            : "border-purple-200 bg-violet-50/50 text-violet-950 hover:border-violet-950 hover:bg-violet-50"
      }`}
    >
      {Icon && (
        <div
          className={`flex h-8 w-8 items-center justify-center rounded-xl transition-all shrink-0 ${
            selected
              ? "bg-white/20 text-white"
              : isDark
                ? "bg-white/5 text-violet-400"
                : "bg-white border border-purple-200 text-violet-600 shadow-sm"
          }`}
        >
          <Icon className="h-4.5 w-4.5" />
        </div>
      )}
      <span>{children}</span>
    </button>
  );
}

export function OnboardingView({ t, currentLanguage = "en", isDark, submitOnboarding }: any) {
  const c = getOnboardingCopy(currentLanguage);
  const [step, setStep] = useState(0);

  // Existing answers (unchanged data model).
  const [onboardInterests, setOnboardInterests] = useState<string[]>([]);
  const [onboardGoals, setOnboardGoals] = useState<string[]>([]);
  const [onboardStage, setOnboardStage] = useState<string>("");

  // Route answers (all optional).
  const [targetLevel, setTargetLevel] = useState<RouteBackground["targetLevel"]>();
  const [startYear, setStartYear] = useState<number | undefined>();
  const [studyMode, setStudyMode] = useState<RouteBackground["studyModePreference"]>();
  const [livesInCh, setLivesInCh] = useState<boolean | undefined>();
  const [highestEdu, setHighestEdu] = useState<RouteBackground["highestEducation"]>();
  const [eduCountry, setEduCountry] = useState<string>("");
  const [recognition, setRecognition] = useState<RouteBackground["diplomaRecognitionStatus"]>();
  const [workYears, setWorkYears] = useState<string>("");
  const [birthYear, setBirthYear] = useState<string>("");
  const [levels, setLevels] = useState<Record<string, CefrLevel>>({});
  const [firstLang, setFirstLang] = useState<string>("");

  const currentYear = new Date().getFullYear();
  const lastStep = ONBOARDING_STEPS.length - 1;

  const isStepValid = (id: OnboardingStepId): boolean => {
    if (id === "goals") return onboardGoals.length > 0;
    if (id === "stage") return !!onboardStage;
    if (id === "interests") return onboardInterests.length > 0;
    return true; // optional route steps
  };
  const currentMeta = ONBOARDING_STEPS[step];
  const currentValid = isStepValid(currentMeta.id);
  // Everything before `idx` that is required must be answered to jump there.
  const canJumpTo = (idx: number) =>
    ONBOARDING_STEPS.slice(0, idx).every(s => !s.required || isStepValid(s.id));

  const buildRoute = (): RouteBackground => {
    const num = (v: string) => {
      const n = Number(v);
      return v.trim() !== "" && Number.isFinite(n) ? n : undefined;
    };
    const languageLevels: LanguageLevel[] = (Object.entries(levels) as [string, CefrLevel][])
      .filter(([, level]) => level !== "none")
      .map(([languageCode, level]) => ({ languageCode, level, isSelfAssessed: true }));
    if (firstLang && !languageLevels.some(l => l.languageCode === firstLang)) {
      languageLevels.push({ languageCode: firstLang, level: "native", isSelfAssessed: true });
    }
    return {
      targetLevel,
      targetStartYear: startYear,
      studyModePreference: studyMode,
      livesInSwitzerland: livesInCh,
      highestEducation: highestEdu,
      highestEducationCountryCode: eduCountry && eduCountry !== "XX" ? eduCountry : undefined,
      diplomaRecognitionStatus: recognition,
      workExperienceYears: num(workYears),
      birthYear: num(birthYear),
      languageLevels
    };
  };

  const finish = () => submitOnboarding(onboardInterests, onboardGoals, onboardStage, buildRoute());

  const handleNext = () => {
    if (step < lastStep) setStep(step + 1);
    else finish();
  };
  const handleBack = () => {
    if (step > 0) setStep(step - 1);
  };

  const titles: Record<OnboardingStepId, { title: string; subtitle: string }> = {
    goals: {
      title: t.chooseGoals || "Define Desired Outcomes",
      subtitle:
        currentLanguage === "de" ? "Definiere ein oder mehrere gewünschte Ziele."
        : currentLanguage === "fr" ? "Définis un ou plusieurs objectifs d'orientation."
        : currentLanguage === "it" ? "Definisci uno o più obiettivi formativi o professionali."
        : "Select your primary intentions for utilizing Inspirella guidance."
    },
    target: { title: c.targetTitle, subtitle: c.targetSubtitle },
    stage: {
      title: t.chooseStage || "Declare Your Current Stage",
      subtitle:
        currentLanguage === "de" ? "Wähle deine aktuelle Ausbildungs- oder Berufsphase (Einzelauswahl)."
        : currentLanguage === "fr" ? "Sélectionne ton profil d'activité (une seule option)."
        : currentLanguage === "it" ? "Seleziona la tua attuale fase accademica o lavorativa."
        : "Select your current secondary or vocational standing."
    },
    interests: {
      title: t.chooseInterests || "Select Spheres of Interest",
      subtitle:
        currentLanguage === "de" ? "Wähle ein oder mehrere Interessengebiete aus."
        : currentLanguage === "fr" ? "Sélectionne un ou plusieurs domaines d'intérêt."
        : currentLanguage === "it" ? "Seleziona una o più aree di interesse principale."
        : "Select one or more spheres you would like to investigate."
    },
    education: { title: c.eduTitle, subtitle: c.eduSubtitle },
    languages: { title: c.langTitle, subtitle: c.langSubtitle }
  };
  const currentStepInfo = titles[currentMeta.id];
  const stepLabelText = AUTH_TRANSLATIONS[currentLanguage]?.stepLabel || AUTH_TRANSLATIONS.en.stepLabel;

  const toggle = (list: string[], setList: (v: string[]) => void, id: string) =>
    setList(list.includes(id) ? list.filter(x => x !== id) : [...list, id]);

  const fieldLabel = `text-[11px] font-bold uppercase tracking-wider ${isDark ? "text-zinc-400" : "text-violet-900/70"}`;
  const inputClass = `rounded-xl border px-3 py-2 text-xs font-semibold ${
    isDark ? "bg-white/[0.03] border-white/10 text-white" : "bg-white border-purple-200 text-violet-950"
  }`;
  const panelProps = {
    initial: { opacity: 0, x: 15 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -15 },
    transition: { duration: 0.25 }
  };

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
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className={`text-xs uppercase tracking-wider ${isDark ? "text-violet-400 font-bold" : "text-violet-950 font-black animate-pulse"}`}>
              {t.onboardTitle || "Educational Calibration"}
            </span>
            <span className={`text-xs uppercase font-bold tracking-wider ${isDark ? "text-zinc-400" : "text-violet-900/60"}`}>
              {stepLabelText} {step + 1} / {ONBOARDING_STEPS.length}
            </span>
          </div>

          <div className="relative flex items-center justify-between">
            <div className={`absolute left-0 right-0 top-1/2 h-1 -translate-y-1/2 rounded-full ${isDark ? "bg-white/5" : "bg-violet-950/10"}`}></div>
            <div
              className="absolute left-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-gradient-to-r from-violet-600 via-indigo-600 to-purple-600 transition-all duration-300"
              style={{ width: `${(step / lastStep) * 100}%` }}
            ></div>
            {ONBOARDING_STEPS.map((s, idx) => {
              const isActive = step === idx;
              const isCompleted = step > idx;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => {
                    if (idx < step || canJumpTo(idx)) setStep(idx);
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
          <p className={`text-[11px] ${isDark ? "text-zinc-500" : "text-violet-950/60"}`}>{c.progressHint}</p>
        </div>

        <div className="space-y-1 pt-2 border-t border-violet-500/10">
          <h2 className={`text-lg font-black tracking-tight ${isDark ? "text-white" : "text-violet-950"}`}>
            {currentStepInfo.title}
          </h2>
          <p className={`text-xs ${isDark ? "text-zinc-400" : "text-violet-950/70 font-semibold"}`}>
            {currentStepInfo.subtitle}
          </p>
        </div>

        <div className="min-h-[220px]">
          <AnimatePresence mode="wait">
            {currentMeta.id === "goals" && (
              <motion.div key="step-goals" {...panelProps} className="grid gap-3 sm:grid-cols-2">
                {[
                  { id: "study_active", label: t.goals_study || "Study in Switzerland", icon: BookOpen },
                  { id: "career_pivot", label: t.goals_career || "Execute active pivot", icon: Briefcase },
                  { id: "global_compare", label: t.goals_explore || "Global System Comparisons", icon: Compass },
                  { id: "parent_routing", label: t.goals_child || "Parental advice", icon: GraduationCap }
                ].map(item => (
                  <OnboardingChoice
                    key={item.id}
                    selected={onboardGoals.includes(item.id)}
                    onClick={() => toggle(onboardGoals, setOnboardGoals, item.id)}
                    isDark={isDark}
                    icon={item.icon}
                  >
                    {item.label}
                  </OnboardingChoice>
                ))}
              </motion.div>
            )}

            {currentMeta.id === "target" && (
              <motion.div key="step-target" {...panelProps} className="space-y-5">
                <div className="grid gap-2 sm:grid-cols-2">
                  {TARGET_LEVELS.map(level => (
                    <OnboardingChoice
                      key={level}
                      selected={targetLevel === level}
                      onClick={() => setTargetLevel(targetLevel === level ? undefined : level)}
                      isDark={isDark}
                    >
                      {c[`tgt_${level}`]}
                    </OnboardingChoice>
                  ))}
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="space-y-1.5 block">
                    <span className={fieldLabel}>{c.startYear}</span>
                    <select
                      className={`${inputClass} w-full`}
                      value={startYear ?? ""}
                      onChange={e => setStartYear(e.target.value ? Number(e.target.value) : undefined)}
                    >
                      <option value="">{c.startUnsure}</option>
                      {[0, 1, 2, 3].map(offset => (
                        <option key={offset} value={currentYear + offset}>
                          {currentYear + offset}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="space-y-1.5 block">
                    <span className={fieldLabel}>{c.studyMode}</span>
                    <select
                      className={`${inputClass} w-full`}
                      value={studyMode ?? ""}
                      onChange={e => setStudyMode((e.target.value || undefined) as RouteBackground["studyModePreference"])}
                    >
                      <option value="">-</option>
                      {STUDY_MODES.map(mode => (
                        <option key={mode} value={mode}>
                          {c[`mode_${mode}`]}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
                <div className="space-y-2">
                  <span className={fieldLabel}>{c.living}</span>
                  <div className="flex flex-wrap gap-2">
                    <OnboardingChoice compact isDark={isDark} selected={livesInCh === true} onClick={() => setLivesInCh(livesInCh === true ? undefined : true)}>
                      {c.living_yes}
                    </OnboardingChoice>
                    <OnboardingChoice compact isDark={isDark} selected={livesInCh === false} onClick={() => setLivesInCh(livesInCh === false ? undefined : false)}>
                      {c.living_no}
                    </OnboardingChoice>
                  </div>
                </div>
              </motion.div>
            )}

            {currentMeta.id === "stage" && (
              <motion.div key="step-stage" {...panelProps} className="grid gap-3 sm:grid-cols-2">
                {[
                  { id: "stage_secondary", label: t.stage_schoolType || "Gymnasium / Secondary student", icon: GraduationCap },
                  { id: "stage_university", label: t.stage_university || "University student", icon: BookOpen },
                  { id: "stage_professional", label: t.stage_professional || "Active professional", icon: Briefcase },
                  { id: "stage_other", label: t.stage_other || "Curious citizen", icon: Compass }
                ].map(item => (
                  <OnboardingChoice
                    key={item.id}
                    selected={onboardStage === item.id}
                    onClick={() => setOnboardStage(item.id)}
                    isDark={isDark}
                    icon={item.icon}
                  >
                    {item.label}
                  </OnboardingChoice>
                ))}
              </motion.div>
            )}

            {currentMeta.id === "interests" && (
              <motion.div key="step-interests" {...panelProps} className="grid gap-3 sm:grid-cols-2">
                {[
                  { id: "academic", label: t.interests_academic || "Academic & Sciences", icon: GraduationCap },
                  { id: "vocational", label: t.interests_vocational || "Vocational & Artisanal", icon: Briefcase },
                  { id: "arts", label: t.interests_arts || "Creative Arts & Design", icon: Sparkles },
                  { id: "tech", label: t.interests_tech || "Software & Technology", icon: Activity },
                  { id: "business", label: t.interests_business || "Entrepreneurship & Finance", icon: Sparkles }
                ].map(item => (
                  <OnboardingChoice
                    key={item.id}
                    selected={onboardInterests.includes(item.id)}
                    onClick={() => toggle(onboardInterests, setOnboardInterests, item.id)}
                    isDark={isDark}
                    icon={item.icon}
                  >
                    {item.label}
                  </OnboardingChoice>
                ))}
              </motion.div>
            )}

            {currentMeta.id === "education" && (
              <motion.div key="step-education" {...panelProps} className="space-y-5">
                <div className="space-y-2">
                  <span className={fieldLabel}>{c.highest}</span>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {EDU_LEVELS.map(level => (
                      <OnboardingChoice
                        key={level}
                        compact
                        isDark={isDark}
                        selected={highestEdu === level}
                        onClick={() => setHighestEdu(highestEdu === level ? undefined : level)}
                      >
                        {c[`edu_${level}`]}
                      </OnboardingChoice>
                    ))}
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="space-y-1.5 block">
                    <span className={fieldLabel}>{c.eduCountry}</span>
                    <select className={`${inputClass} w-full`} value={eduCountry} onChange={e => setEduCountry(e.target.value)}>
                      <option value="">-</option>
                      {EDU_COUNTRIES.map(code => (
                        <option key={code} value={code}>
                          {c[`country_${code}`]}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="space-y-1.5 block">
                    <span className={fieldLabel}>{c.recognition}</span>
                    <select
                      className={`${inputClass} w-full`}
                      value={recognition ?? ""}
                      onChange={e => setRecognition((e.target.value || undefined) as RouteBackground["diplomaRecognitionStatus"])}
                    >
                      <option value="">-</option>
                      {RECOGNITION.map(status => (
                        <option key={status} value={status}>
                          {c[`rec_${status}`]}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="space-y-1.5 block">
                    <span className={fieldLabel}>{c.workYears}</span>
                    <input
                      type="number"
                      min={0}
                      max={60}
                      className={`${inputClass} w-full`}
                      value={workYears}
                      onChange={e => setWorkYears(e.target.value)}
                    />
                  </label>
                  <label className="space-y-1.5 block">
                    <span className={fieldLabel}>{c.birthYear}</span>
                    <input
                      type="number"
                      min={1920}
                      max={currentYear}
                      className={`${inputClass} w-full`}
                      value={birthYear}
                      onChange={e => setBirthYear(e.target.value)}
                    />
                  </label>
                </div>
              </motion.div>
            )}

            {currentMeta.id === "languages" && (
              <motion.div key="step-languages" {...panelProps} className="space-y-5">
                <div className="space-y-3">
                  {SWISS_LANGS.map(code => (
                    <div key={code} className="flex flex-wrap items-center gap-2">
                      <span className={`w-24 text-xs font-bold ${isDark ? "text-zinc-200" : "text-violet-950"}`}>{c[`lang_${code}`]}</span>
                      <div className="flex flex-wrap gap-1.5">
                        {CEFR_CHOICES.map(level => (
                          <OnboardingChoice
                            key={level}
                            compact
                            isDark={isDark}
                            selected={(levels[code] ?? "none") === level}
                            onClick={() => setLevels({ ...levels, [code]: level })}
                          >
                            {level === "none" ? c.levelNone : level}
                          </OnboardingChoice>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                <label className="space-y-1.5 block max-w-xs">
                  <span className={fieldLabel}>{c.firstLang}</span>
                  <select className={`${inputClass} w-full`} value={firstLang} onChange={e => setFirstLang(e.target.value)}>
                    <option value="">{c.firstLangNone}</option>
                    {FIRST_LANGS.map(code => (
                      <option key={code} value={code}>
                        {c[`fl_${code}`]}
                      </option>
                    ))}
                  </select>
                </label>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="flex items-center justify-between gap-3 pt-5 border-t border-violet-500/10">
          {step > 0 ? (
            <button
              type="button"
              onClick={handleBack}
              className="btn-secondary py-2.5 px-4 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <ChevronLeft className="h-4 w-4" />
              <span>{c.back}</span>
            </button>
          ) : (
            <div className="w-1"></div>
          )}

          <div className="flex items-center gap-4">
            {!currentMeta.required && step < lastStep && (
              <button
                type="button"
                onClick={() => setStep(step + 1)}
                className={`text-xs underline cursor-pointer ${isDark ? "text-zinc-400" : "text-violet-950/70"}`}
              >
                {c.skipStep}
              </button>
            )}
            {step > 0 && step < lastStep && isStepValid("goals") && (
              <button
                type="button"
                onClick={finish}
                className={`text-xs underline cursor-pointer ${isDark ? "text-zinc-400" : "text-violet-950/70"}`}
              >
                {c.finishNow}
              </button>
            )}
            <button
              type="button"
              onClick={handleNext}
              disabled={!currentValid}
              className={`btn-primary py-2.5 px-6 text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer ${
                !currentValid ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              {step < lastStep ? (
                <>
                  <span>{c.continue}</span>
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
      </div>
    </motion.div>
  );
}
