import { EducationLevel, Institution, ResourceItem, LanguageCode } from "./types";

// Translation Dictionaries for the entire application UI
export const TRANSLATIONS: Record<LanguageCode, Record<string, string>> = {
  en: {
    // Navigation
    navHome: "Public Home",
    navAbout: "About Us",
    navContact: "Contact",
    navDashboard: "My Dashboard",
    navMap: "3D Swiss Map",
    navResources: "Resources & Careers",
    navTracker: "Life Tracker",
    navProfile: "Profile",
    navLogin: "Get Started",
    navSwitchLang: "Language",
    logout: "Log Out",

    // Public Home / Landing
    heroTitle: "The Future of Educational Discovery",
    heroSubtitle: "De-mystifying global education systems starting within Switzerland's dual-track system.",
    heroCTA: "Begin Your Discovery",
    exploreCTA: "Explore Without Credentials",
    statInstitutions: "Institutions",
    statProfessions: "Professions",
    statLearningPaths: "Learning Paths",
    statLanguages: "Languages",
    whyTitle: "Why Inspirella?",
    whyText: "National educational frameworks can be notoriously complex, especially multi-lingual ones. Inspirella structures academic and vocational routes into a unified, clear, and accessible platform.",
    swissSpecialGroup: "Switzerland: Stage 1 Focus",
    swissSpecialDesc: "As our launches first core country, Switzerland's dual VET (Vocational Education and Training) and high-academic tracking offers a perfect model for our platform.",
    howItWorks: "Personalized Guidance",
    howStepOnboarding: "1. Onboarding Consultations",
    howStepOnboardingDesc: "We calibrate to your specific age, objectives, and linguistic interests.",
    howStepMap: "2. Map Exploration",
    howStepMapDesc: "Explore the locations of research institutes and vocational colleges.",
    howStepTracker: "3. Life Tracker Integration",
    howStepTrackerDesc: "Establish, track, and record customizable goals across any realm of life.",
    howStepResources: "4. Official Resources",
    howStepResourcesDesc: "Access direct URLs to school application pages and regional cantonal bureaus.",
    futureVisionTitle: "The Global Educational Scalability Model",
    futureVisionDesc: "Inspirella's core metadata framework makes it easy to add future countries with identical detail. Denmark, Singapore, and Japan are currently planned for Stage 2 development.",

    // About Page
    aboutTitle: "Refining Educational Access",
    aboutPara1: "At Inspirella, we believe education is the ultimate vehicle for human potential. However, understanding how different country systems work — from the Swiss Gymnasiums and apprenticeships to universities of applied sciences — should not require endless browsing of legacy documents.",
    aboutPara2: "Inspirella provides interactive map data and localized translations to help any learner map out their educational journey in Switzerland.",
    aboutMissionEyebrow: "Our Mission",
    aboutMissionBody: "Choosing a school, a program, or an educational path is one of the most consequential decisions a person makes - yet the information needed to make it well is often scattered, contradictory, or written for institutions rather than for the person trying to decide. Inspirella exists to close that gap: to turn a confusing, high-stakes choice into something clear, personal, and possible to act on.",
    aboutWhyEyebrow: "Why It Matters",
    aboutWhyBody: "More information doesn't automatically mean more clarity. Inspirella starts from the belief that quality, structure, and honesty about what is - and isn't - verified matter more than sheer volume, because a recommendation is only as trustworthy as the data behind it.",
    aboutValuesTitle: "What We Stand On",
    aboutValue1Title: "Trust & Verified Data",
    aboutValue1Desc: "Every institution, program, and resource is checked against its source. When something isn't confirmed yet, we say so rather than guess.",
    aboutValue2Title: "Deep Personalization",
    aboutValue2Desc: "A path that fits you, not a generic list. Inspirella looks at your interests, goals, and stage to surface what's actually relevant.",
    aboutValue3Title: "Clarity Over Chaos",
    aboutValue3Desc: "Complex national systems - Swiss vocational and academic tracks included - are organized into something you can actually navigate.",
    aboutValue4Title: "Support, Not Just Information",
    aboutValue4Desc: "A tracker, a map, and a guided path work together, so you're not left alone with a wall of options.",
    aboutStageEyebrow: "Where We Are Today",
    aboutStageBody: "Inspirella launches with Switzerland as its first country - a deliberate starting point, given its uniquely dual-track academic and vocational system. Our dataset is real and growing: some entries are fully verified, others are still under review, and we label that difference honestly rather than presenting everything as equally certain.",
    aboutVisionEyebrow: "Where We're Headed",
    aboutVisionBody: "Switzerland is the beginning, not the limit. Over time, Inspirella aims to bring the same clarity and personalization to education systems beyond Switzerland - helping more people, in more places, find a path that genuinely fits them.",

    // Contact Page
    contactTitle: "Contact Us",
    contactSubtitle: "Our team stands ready to assist institutions, future candidates, and developers.",
    contactName: "Your Name",
    contactEmail: "Email Address",
    contactMsg: "Your Message",
    contactSend: "Send Message",
    contactSuccess: "Your email app should now be open with your message ready to send.",

    // Onboarding
    onboardTitle: "Educational Alignment Consultations",
    onboardSubtitle: "Calibrate variables to tailor your personalized orientation cluster.",
    chooseInterests: "Select Areas of Interest",
    chooseGoals: "Define Desired Outcomes",
    chooseStage: "Declare Your Current Stage",
    interests_academic: "Academic & Sciences",
    interests_vocational: "Vocational & Artisanal",
    interests_arts: "Creative Arts & Design",
    interests_tech: "Software & Technology",
    interests_business: "Entrepreneurship & Finance",
    goals_study: "Study Active in Switzerland",
    goals_career: "Execute a Career Pivot",
    goals_explore: "Global System Comparison",
    goals_child: "School System Info for Parents",
    stage_schoolType: "Secondary Student / Gymnasium",
    stage_university: "Tertiary Student / Academic",
    stage_professional: "Industry Practitioner",
    stage_other: "Curious Citizen",
    completeOnboard: "Complete Setup",

    // Dashboard & Personalized Home
    welcomeBack: "Welcome back to your dashboard,",
    personalizedGoalTitle: "Your Active Strategy Track",
    continueExplor: "Continue Educational Explorations",
    progressTitle: "Learning Progress",
    nextBestStep: "Recommended Next Step",
    recentActivity: "Recent Regional Insights",
    allSystemsGo: "System Ready: Educational Compass Active",
    quickAccess: "Quick Access",
    advisorsAdvice: "AI Educational Advisor Report",
    aiAnalyzing: "Querying Swiss educational frameworks...",
    aiAdviceTitle: "Your Learning Path",

    // Tracker Page
    trackerHeader: "Systematic Habit & Objective Tracker",
    trackerSub: "Establish daily checklists and log persistent streaks for any life area.",
    createTracker: "Create New Habit Tracker",
    trackerTitlePlace: "e.g., Daily Physics Practice, Swiss German Dialect",
    addGoalBtn: "Integrate Path",
    completeStreak: "streak activated",
    completionPercentage: "Level completion",
    noTrackers: "No trackers currently active. Create one above to get started.",
    addChecklistItem: "Integrate checklist sub-component",
    trackerDueDateLabel: "Target Date (optional)",
    trackerOverdueBadge: "Overdue",
    trackerDueSoonBadge: "Due soon",
    trackerDuePrefix: "Due",
    dashboardReminderTitle: "Tracker Reminders",
    dashboardReminderOverdueSuffix: "overdue",
    dashboardReminderDueSoonSuffix: "due this week",
    advisorAddPathToTracker: "Add this path to my tracker",
    advisorPathInTracker: "Added to your tracker",
    pathContentGermanOnly: "Steps shown in German — translation in progress",
    habitCat_education: "Education & Mindset",
    habitCat_habit: "Constructive Habits",
    habitCat_sport: "Sports & Athletics",
    habitCat_health: "Vitality & Bio-Health",
    habitCat_productivity: "Professional Output",
    habitCat_other: "Custom Goals",

    // Profile Page
    profileHeader: "Your Profile",
    profileTheme: "Appearance: Violet Glass Theme",
    profileRegion: "Current Base Geography",
    profileDataTitle: "System Registries & Security",
    profileUserAddress: "Authenticated Credentials",
    registeredAt: "Synchronized to Inspirella Core",
    profileBioLabel: "About Me",
    profileBioPlaceholder: "Write a little about yourself - your interests, what you're aiming for, anything you'd like this profile to reflect.",
    profileBioEmpty: "You haven't written anything about yourself yet.",
    profileBioEdit: "Edit",
    profileBioSave: "Save",
    profileBioCancel: "Cancel",

    // Map Page
    mapHeader: "Interactive Swiss Education Map",
    mapSub: "Discover federal institutes, applied sciences colleges, and dual-track learning centers.",
    selectPinAlert: "Select any pin to view institution details.",
    visitWebsite: "Visit Website",
    contactInstitution: "Contact Department",
    admissionInfo: "Admissions & Transfer Info",
    mapToggle3D: "Show 3D View",
    mapMappedLabel: "on the map",
    mapUnlocatedLabel: "without a verified location",
    mapUnlocatedHint: "These institutions are listed but not placed on the map, because Inspirella does not guess coordinates.",
    mapCantonUnknown: "Canton not recorded",
    mapNoCoordinates: "no verified coordinates",
    verifyWithInstitution: "Details can change. Please confirm with the institution before you decide.",

    // Institution comparison
    compareAdd: "Add to Compare",
    compareRemove: "Remove from Compare",
    compareFull: "You can compare up to 3 institutions at a time.",
    compareBarLabel: "Comparing",
    compareViewButton: "View Comparison",
    compareClear: "Clear",
    compareModalTitle: "Institution Comparison",
    compareFieldCanton: "Canton",
    compareFieldCategory: "Type",
    compareFieldEstablished: "Established",
    compareFieldStudents: "Students",
    compareFieldLanguage: "Language",
    compareFieldWebsite: "Website",
    compareFieldVerified: "Status",
    compareFieldRating: "Rating",
    compareNoData: "Not recorded",

    // Trust and data quality
    qualityVerified: "Verified",
    qualityProvisional: "Provisional data",
    dataNotAvailable: "Not available",
    originCurated: "Curated",
    originCuratedHint: "Part of Inspirella's curated starter set, not a live database record.",
    filterAll: "All",
    recommendedBadge: "Recommended",

    // Resources
    resourcesHeader: "Official Swiss Resources",
    resourcesSub: "Federal and cantonal gateways you can act on directly.",
    resourcesSearchPlaceholder: "Search resources...",
    resourcesAdaptedGuest: "Highlights adapted to your guest session",
    resourcesAdaptedUser: "Highlights adapted to your profile",
    resourcesEmptyTitle: "No resources match your search yet.",
    resourcesEmptyHint: "Try a shorter search term or switch back to the All category.",
    resourceFederal: "Federal resource",
    resourceSwiss: "Swiss resource",

    // Professions
    professionsEyebrow: "Vocations & Careers",
    professionsTitle: "Swiss Vocation & Profession Explorer",
    professionsSub: "Explore vocational routes, apprenticeship compatibility and typical pay indicators.",
    professionsSearchPlaceholder: "Search careers or skills...",
    professionsEmpty: "No vocational matches found.",
    professionsLoading: "Loading professions...",
    professionsCatalogGrowing: "Our professions catalog is still growing - check back soon for more.",
    professionsLoadError: "Couldn't load professions right now. Please try again in a moment.",
    professionSelectHint: "Select a vocation from the list to see the required education, demand level and skills.",
    professionSalaryLabel: "Typical annual pay",
    professionSalaryUnknown: "Pay data not recorded",
    professionEducationRequired: "Education required",
    professionVetLabel: "Apprenticeship (VET)",
    professionVetCompatible: "Reachable via apprenticeship",
    professionVetTertiary: "Tertiary route",
    professionDemand: "Demand",
    professionOutlook: "Outlook",
    professionSkillsLabel: "Core skills",
    professionClustersLabel: "Main regional clusters",

    // Resources & Careers hub (unifies web resources, professions, institutions)
    resourcesCareersHeader: "Resources & Careers",
    resourcesCareersSub: "Everything you need to explore opportunities in Switzerland - resources, professions, and institutions - in one place.",
    resourcesTabWeb: "Web Resources",
    resourcesTabProfessions: "Professions",
    resourcesTabInstitutions: "Institutions",
    institutionsEyebrow: "Institutions & Schools",
    institutionsTitle: "Swiss Institution Explorer",
    institutionsSub: "Search universities, colleges and schools, and compare the ones that matter to you.",
    institutionsSearchPlaceholder: "Search institutions...",
    institutionsEmpty: "No institutions match your search.",
    institutionsLoading: "Loading institutions...",
    institutionsCatalogGrowing: "Our institutions catalog is still growing - check back soon for more.",
    institutionsLoadError: "Couldn't load institutions right now. Please try again in a moment.",
    institutionSelectHint: "Select an institution from the list to see its details, contacts and admissions info."
  },
  de: {
    // Navigation
    navHome: "Startseite",
    navAbout: "Über uns",
    navContact: "Kontakt",
    navDashboard: "Mein Dashboard",
    navMap: "3D Schweiz-Karte",
    navResources: "Ressourcen & Karrieren",
    navTracker: "Lebens-Tracker",
    navProfile: "Konto-Profil",
    navLogin: "Starten",
    navSwitchLang: "Sprache",
    logout: "Abmelden",

    // Public Home / Landing
    heroTitle: "Die Zukunft der Bildungs-Erschließung",
    heroSubtitle: "Entmystifizierung globaler Bildungssysteme, beginnend mit der Schweizer Spitzenausbildung.",
    heroCTA: "Entdeckung starten",
    exploreCTA: "Ohne Anmeldung ansehen",
    statInstitutions: "Institutionen",
    statProfessions: "Berufe",
    statLearningPaths: "Bildungswege",
    statLanguages: "Sprachen",
    whyTitle: "Warum Inspirella?",
    whyText: "Nationale Bildungswege können besonders in mehrsprachigen Regionen komplex sein. Inspirella strukturiert akademische und berufliche Wege in einer klaren und modernen Plattform.",
    swissSpecialGroup: "Fokus Schweiz: Etappe 1",
    swissSpecialDesc: "Als unser erstes Kernland bietet die Schweiz mit ihrer dualen Berufsbildung (VET) und akademischen Exzellenz das perfekte Fundament für globale Skalierbarkeit.",
    howItWorks: "Vorgehen & Methodik",
    howStepOnboarding: "1. Profilierung & Abgleich",
    howStepOnboardingDesc: "Wir richten uns ganz nach Ihrem Alter, Ihren Zielen und Ihren Sprachinteressen.",
    howStepMap: "2. Räumliche 3D-Erkundung",
    howStepMapDesc: "Entdecken Sie die Standorte von Forschungsinstituten und Berufsschulen.",
    howStepTracker: "3. Integrierter Lebens-Tracker",
    howStepTrackerDesc: "Setzen und verfolgen Sie benutzerdefinierte Ziele für jeden Lebensbereich.",
    howStepResources: "4. Offizielle Ressourcen",
    howStepResourcesDesc: "Direkte Verknüpfungen zu staatlichen Bildungsportalen und kantonalen Ämtern.",
    futureVisionTitle: "Das globale Bildungsskalierungsmodell",
    futureVisionDesc: "Die Datenarchitektur von Inspirella ermöglicht die einfache Integration weiterer Länder wie Dänemark, Singapur und Japan in Etappe 2.",

    // About Page
    aboutTitle: "Bildungszugang neu definiert",
    aboutPara1: "Wir bei Inspirella sind überzeugt, dass Bildung das ultimative Werkzeug für das menschliche Potenzial ist. Das Verständnis nationaler Systeme – von Schweizer Gymnasien bis zu Fachhochschulen – sollte jedoch kein endloses Suchen erfordern.",
    aboutPara2: "Inspirella filtert komplexe Bildungsdaten und bietet interaktive Karten und Übersetzungen, um den passenden Bildungsweg zu finden.",
    aboutMissionEyebrow: "Unsere Mission",
    aboutMissionBody: "Die Wahl einer Schule, eines Programms oder eines Bildungswegs gehört zu den folgenreichsten Entscheidungen im Leben eines Menschen - und doch sind die dafür nötigen Informationen oft verstreut, widersprüchlich oder für Institutionen statt für die entscheidende Person geschrieben. Inspirella soll genau diese Lücke schliessen: aus einer verwirrenden, folgenreichen Entscheidung etwas Klares, Persönliches und Umsetzbares zu machen.",
    aboutWhyEyebrow: "Warum das wichtig ist",
    aboutWhyBody: "Mehr Information bedeutet nicht automatisch mehr Klarheit. Inspirella geht davon aus, dass Qualität, Struktur und Ehrlichkeit darüber, was geprüft ist - und was nicht - wichtiger sind als schiere Menge, denn eine Empfehlung ist nur so vertrauenswürdig wie die Daten dahinter.",
    aboutValuesTitle: "Worauf wir bauen",
    aboutValue1Title: "Vertrauen & geprüfte Daten",
    aboutValue1Desc: "Jede Institution, jedes Programm und jede Ressource wird mit ihrer Quelle abgeglichen. Ist etwas noch nicht bestätigt, sagen wir das offen, statt zu raten.",
    aboutValue2Title: "Tiefe Personalisierung",
    aboutValue2Desc: "Ein Weg, der zu Ihnen passt, keine generische Liste. Inspirella berücksichtigt Ihre Interessen, Ziele und Ihren aktuellen Stand, um wirklich Relevantes zu zeigen.",
    aboutValue3Title: "Klarheit statt Chaos",
    aboutValue3Desc: "Komplexe nationale Systeme - einschliesslich der Schweizer Berufs- und akademischen Bildungswege - werden zu etwas geordnet, in dem man sich wirklich zurechtfindet.",
    aboutValue4Title: "Begleitung, nicht nur Information",
    aboutValue4Desc: "Tracker, Karte und geführter Bildungsweg wirken zusammen, damit Sie nicht allein vor einer Wand aus Optionen stehen.",
    aboutStageEyebrow: "Wo wir heute stehen",
    aboutStageBody: "Inspirella startet mit der Schweiz als erstem Land - eine bewusste Wahl angesichts ihres einzigartigen dualen Systems aus Berufsbildung und Gymnasium. Unser Datenbestand ist real und wächst: Manche Einträge sind vollständig geprüft, andere noch in Prüfung - und wir kennzeichnen diesen Unterschied ehrlich, statt alles als gleich gesichert darzustellen.",
    aboutVisionEyebrow: "Wohin wir wollen",
    aboutVisionBody: "Die Schweiz ist der Anfang, nicht die Grenze. Mit der Zeit möchte Inspirella dieselbe Klarheit und Personalisierung auch auf Bildungssysteme ausserhalb der Schweiz übertragen - und mehr Menschen an mehr Orten helfen, einen Weg zu finden, der wirklich zu ihnen passt.",

    // Contact Page
    contactTitle: "Dialog aufnehmen",
    contactSubtitle: "Unser Team steht für Institutionen, Bildungskandidaten und Entwickler bereit.",
    contactName: "Name",
    contactEmail: "E-Mail-Adresse",
    contactMsg: "Ihre Mitteilung",
    contactSend: "Nachricht senden",
    contactSuccess: "Ihr E-Mail-Programm sollte sich jetzt mit der vorbereiteten Nachricht öffnen.",

    // Onboarding
    onboardTitle: "Bildungsausrichtungs-Beratung",
    onboardSubtitle: "Passen Sie die Variablen an, um Ihr persönliches Bildungs-Dashboard einzurichten.",
    chooseInterests: "Wählen Sie Ihre Interessengebiete",
    chooseGoals: "Definieren Sie Ihre Ziele",
    chooseStage: "Geben Sie Ihre aktuelle Stufe an",
    interests_academic: "Wissenschaft & Forschung",
    interests_vocational: "Berufsausbildung & Handwerk",
    interests_arts: "Kunst & Kreativität",
    interests_tech: "Software & Technologie",
    interests_business: "Unternehmertum & Wirtschaft",
    goals_study: "In der Schweiz studieren",
    goals_career: "Berufliche Neuorientierung",
    goals_explore: "Globaler Systemvergleich",
    goals_child: "Beratung für Kinder",
    stage_schoolType: "Schüler / Gymnasium",
    stage_university: "Student (Hochschule / Uni)",
    stage_professional: "Berufstätig / Professional",
    stage_other: "Bildungsinteressierte Bürger",
    completeOnboard: "Setup abschließen",

    // Dashboard
    welcomeBack: "Willkommen zurück,",
    personalizedGoalTitle: "Ihre aktuelle Strategie",
    continueExplor: "Bildungs-Erkundung fortsetzen",
    progressTitle: "Lernfortschritt",
    nextBestStep: "Empfohlener nächster Orientierungsschritt",
    recentActivity: "Letzte regionale Einblicke",
    allSystemsGo: "Globaler Bildungskompass kalibriert",
    quickAccess: "Schnellzugriff",
    advisorsAdvice: "Bericht des KI-Bildungsberaters",
    aiAnalyzing: "Analysiere Schweizer Bildungsstrukturen...",
    aiAdviceTitle: "Ihr Bildungsweg",

    // Tracker Page
    trackerHeader: "Systematischer Lebens- und Gewohnheits-Tracker",
    trackerSub: "Erstellen Sie tägliche Checklisten und protokollieren Sie Ihre Erfolge.",
    createTracker: "Neues Tracker-Protokoll erstellen",
    trackerTitlePlace: "z.B. Physik lernen, Schweizerdeutsch üben",
    addGoalBtn: "Weg integrieren",
    completeStreak: "tage in folge",
    completionPercentage: "Fortschritts-Niveau",
    noTrackers: "Keine Tracker-Protokolle aktiv. Erstellen Sie oben eines, um das tägliche Tracking zu starten.",
    addChecklistItem: "Unterpunkt hinzufügen",
    trackerDueDateLabel: "Zieldatum (optional)",
    trackerOverdueBadge: "Überfällig",
    trackerDueSoonBadge: "Bald fällig",
    trackerDuePrefix: "Fällig",
    dashboardReminderTitle: "Tracker-Erinnerungen",
    dashboardReminderOverdueSuffix: "überfällig",
    dashboardReminderDueSoonSuffix: "diese Woche fällig",
    advisorAddPathToTracker: "Diesen Weg zu meinem Tracker hinzufügen",
    advisorPathInTracker: "Zu Ihrem Tracker hinzugefügt",
    pathContentGermanOnly: "Schritte auf Deutsch verfügbar",
    habitCat_education: "Bildung & Mindset",
    habitCat_habit: "Förderliche Gewohnheiten",
    habitCat_sport: "Sport & Fitness",
    habitCat_health: "Gesundheit & Bio-Care",
    habitCat_productivity: "Berufliche Leistung",
    habitCat_other: "Eigene Ziele",

    // Profile Page
    profileHeader: "Ihr zentrales Koordinaten-Profil",
    profileTheme: "Erscheinungsbild: Violet Glass Theme",
    profileRegion: "Aktuelle Gegebenheit",
    profileDataTitle: "Systemregister & Sicherheit",
    profileUserAddress: "Authentifizierter Benutzerzugang",
    registeredAt: "Synchronisiert mit Inspirella-Core",
    profileBioLabel: "Über mich",
    profileBioPlaceholder: "Schreiben Sie etwas über sich - Ihre Interessen, Ihre Ziele, alles, was dieses Profil widerspiegeln soll.",
    profileBioEmpty: "Sie haben noch nichts über sich geschrieben.",
    profileBioEdit: "Bearbeiten",
    profileBioSave: "Speichern",
    profileBioCancel: "Abbrechen",

    // Map Page
    mapHeader: "Interaktive 3D Schweiz-Karte",
    mapSub: "Entdecken Sie Schweizer Universitäten, Fachhochschulen und Berufszentren.",
    selectPinAlert: "Wählen Sie eine Stecknadel auf der Karte aus, um Details anzuzeigen.",
    visitWebsite: "Webseite besuchen",
    contactInstitution: "Abteilung kontaktieren",
    admissionInfo: "Zulassungs- & Transferinformationen",
    mapToggle3D: "3D-Gelände darstellen",
    mapMappedLabel: "auf der Karte",
    mapUnlocatedLabel: "ohne geprüften Standort",
    mapUnlocatedHint: "Diese Institutionen sind aufgeführt, aber nicht auf der Karte platziert, weil Inspirella keine Koordinaten errät.",
    mapCantonUnknown: "Kanton nicht erfasst",
    mapNoCoordinates: "keine geprüften Koordinaten",
    verifyWithInstitution: "Angaben können sich ändern. Bitte bestätigen Sie sie vor einer Entscheidung bei der Institution.",

    // Institution comparison
    compareAdd: "Zum Vergleich hinzufügen",
    compareRemove: "Aus Vergleich entfernen",
    compareFull: "Sie können bis zu 3 Institutionen gleichzeitig vergleichen.",
    compareBarLabel: "Im Vergleich",
    compareViewButton: "Vergleich anzeigen",
    compareClear: "Leeren",
    compareModalTitle: "Institutionenvergleich",
    compareFieldCanton: "Kanton",
    compareFieldCategory: "Typ",
    compareFieldEstablished: "Gegründet",
    compareFieldStudents: "Studierende",
    compareFieldLanguage: "Sprache",
    compareFieldWebsite: "Webseite",
    compareFieldVerified: "Status",
    compareFieldRating: "Bewertung",
    compareNoData: "Nicht erfasst",

    // Trust and data quality
    qualityVerified: "Geprüft",
    qualityProvisional: "Vorläufige Daten",
    dataNotAvailable: "Nicht verfügbar",
    originCurated: "Kuratiert",
    originCuratedHint: "Teil des kuratierten Startdatensatzes von Inspirella, kein Live-Datenbankeintrag.",
    filterAll: "Alle",
    recommendedBadge: "Empfohlen",

    // Resources
    resourcesHeader: "Offizielle Schweizer Ressourcen",
    resourcesSub: "Bundes- und kantonale Portale, die Sie direkt nutzen können.",
    resourcesSearchPlaceholder: "Ressourcen suchen...",
    resourcesAdaptedGuest: "Hervorhebungen für Ihre Gastsitzung angepasst",
    resourcesAdaptedUser: "Hervorhebungen an Ihr Profil angepasst",
    resourcesEmptyTitle: "Noch keine Ressource passt zu Ihrer Suche.",
    resourcesEmptyHint: "Versuchen Sie einen kürzeren Suchbegriff oder wechseln Sie zur Kategorie Alle.",
    resourceFederal: "Bundesressource",
    resourceSwiss: "Schweizer Ressource",

    // Professions
    professionsEyebrow: "Berufe & Karrieren",
    professionsTitle: "Schweizer Berufs- und Laufbahn-Explorer",
    professionsSub: "Entdecken Sie Berufswege, Lehrstellen-Kompatibilität und typische Lohnindikatoren.",
    professionsSearchPlaceholder: "Berufe oder Kompetenzen suchen...",
    professionsEmpty: "Keine passenden Berufe gefunden.",
    professionsLoading: "Berufe werden geladen...",
    professionsCatalogGrowing: "Unser Berufskatalog wächst noch - schauen Sie bald wieder vorbei.",
    professionsLoadError: "Berufe konnten gerade nicht geladen werden. Bitte versuchen Sie es gleich noch einmal.",
    professionSelectHint: "Wählen Sie einen Beruf aus der Liste, um Ausbildung, Nachfrage und Kompetenzen zu sehen.",
    professionSalaryLabel: "Typischer Jahreslohn",
    professionSalaryUnknown: "Lohndaten nicht erfasst",
    professionEducationRequired: "Erforderliche Ausbildung",
    professionVetLabel: "Berufslehre (EFZ)",
    professionVetCompatible: "Über eine Lehre erreichbar",
    professionVetTertiary: "Tertiärer Weg",
    professionDemand: "Nachfrage",
    professionOutlook: "Aussichten",
    professionSkillsLabel: "Kernkompetenzen",
    professionClustersLabel: "Wichtigste regionale Cluster",

    // Resources & Careers hub (unifies web resources, professions, institutions)
    resourcesCareersHeader: "Ressourcen & Karrieren",
    resourcesCareersSub: "Alles, was Sie zur Erkundung von Möglichkeiten in der Schweiz brauchen - Ressourcen, Berufe und Institutionen - an einem Ort.",
    resourcesTabWeb: "Web-Ressourcen",
    resourcesTabProfessions: "Berufe",
    resourcesTabInstitutions: "Institutionen",
    institutionsEyebrow: "Institutionen & Schulen",
    institutionsTitle: "Schweizer Institutionen-Explorer",
    institutionsSub: "Durchsuchen Sie Universitäten, Hochschulen und Schulen und vergleichen Sie die für Sie relevanten.",
    institutionsSearchPlaceholder: "Institutionen suchen...",
    institutionsEmpty: "Keine passenden Institutionen gefunden.",
    institutionsLoading: "Institutionen werden geladen...",
    institutionsCatalogGrowing: "Unser Institutionenkatalog wächst noch - schauen Sie bald wieder vorbei.",
    institutionsLoadError: "Institutionen konnten gerade nicht geladen werden. Bitte versuchen Sie es gleich noch einmal.",
    institutionSelectHint: "Wählen Sie eine Institution aus der Liste, um Details, Kontakte und Zulassungsinformationen zu sehen."
  },
  fr: {
    // Navigation
    navHome: "Accueil",
    navAbout: "À Propos",
    navContact: "Contact",
    navDashboard: "Tableau de Bord",
    navMap: "Carte 3D Suisse",
    navResources: "Ressources & Carrières",
    navTracker: "Suivi de Vie",
    navProfile: "Profil Utilisateur",
    navLogin: "Démarrer",
    navSwitchLang: "Langue",
    logout: "Se déconnecter",

    // Public Home / Landing
    heroTitle: "L'Avenir de la Découverte Éducative",
    heroSubtitle: "Démystifier les systèmes éducatifs mondiaux en commençant par l'excellence de la Suisse.",
    heroCTA: "Démarrer la Découverte",
    exploreCTA: "Explorer sans Compte",
    statInstitutions: "Établissements",
    statProfessions: "Métiers",
    statLearningPaths: "Parcours",
    statLanguages: "Langues",
    whyTitle: "Pourquoi Inspirella?",
    whyText: "Les parcours éducatifs nationaux peuvent être complexes, en particulier dans les régions multilingues. Inspirella structure les voies académiques et professionnelles dans une plateforme claire et moderne.",
    swissSpecialGroup: "Suisse : Étape Clé 1",
    swissSpecialDesc: "En tant que premier pays d'étude, le système d'apprentissage professionnel dual (VET) et la rigueur académique suisse offrent le modèle parfait d'extensibilité mondiale.",
    howItWorks: "Méthodologie Orientée Produit",
    howStepOnboarding: "1. Profilage & Alignement",
    howStepOnboardingDesc: "Nous étalonnons nos recommandations selon votre âge, vos objectifs et vos préférences linguistiques.",
    howStepMap: "2. Visualisation 3D",
    howStepMapDesc: "Explorez les emplacements des grandes écoles et des centres de recherche.",
    howStepTracker: "3. Suivi de Vie Intégré",
    howStepTrackerDesc: "Établissez et suivez des objectifs personnalisés pour chaque aspect du quotidien.",
    howStepResources: "4. Passerelles Officielles",
    howStepResourcesDesc: "Allègements et accès directs aux formulaires des hautes écoles suisses et des bureaux cantonaux.",
    futureVisionTitle: "Le modèle d'échelle éducative globale",
    futureVisionDesc: "Grâce à notre plateforme, l'intégration du Danemark, de Singapour et du Japon est programmée pour l'Étape 2.",

    // About Page
    aboutTitle: "Accès à la connaissance redéfini",
    aboutPara1: "Chez Inspirella, nous croyons au pouvoir de la connaissance. Cependant, comprendre le fonctionnement des gymnases, apprentissages et hautes écoles spécialisées suisses ne devrait pas exiger des heures de recherche fastidieuse.",
    aboutPara2: "Grâce à des architectures de données avancées, une cartographie esthétique 3D et une approche multilingue de premier choix, nous vous aidons à trouver le bon parcours d’apprentissage.",
    aboutMissionEyebrow: "Notre mission",
    aboutMissionBody: "Choisir une école, un programme ou un parcours de formation compte parmi les décisions les plus lourdes de conséquences dans une vie - pourtant, les informations nécessaires pour bien décider sont souvent éparpillées, contradictoires, ou pensées pour les institutions plutôt que pour la personne qui doit trancher. Inspirella existe pour combler cet écart : transformer un choix complexe et déterminant en quelque chose de clair, de personnel et d'actionnable.",
    aboutWhyEyebrow: "Pourquoi cela compte",
    aboutWhyBody: "Plus d'information ne signifie pas automatiquement plus de clarté. Inspirella part du principe que la qualité, la structure et l'honnêteté sur ce qui est vérifié - ou ne l'est pas encore - comptent plus que le volume, car une recommandation ne vaut que par la fiabilité des données qui la fondent.",
    aboutValuesTitle: "Sur quoi nous nous appuyons",
    aboutValue1Title: "Confiance & données vérifiées",
    aboutValue1Desc: "Chaque établissement, programme et ressource est confronté à sa source. Quand une information n'est pas encore confirmée, nous le disons plutôt que de deviner.",
    aboutValue2Title: "Personnalisation approfondie",
    aboutValue2Desc: "Un parcours qui vous correspond, pas une liste générique. Inspirella s'appuie sur vos intérêts, vos objectifs et votre étape actuelle pour ne montrer que ce qui compte vraiment.",
    aboutValue3Title: "La clarté plutôt que le chaos",
    aboutValue3Desc: "Des systèmes nationaux complexes - y compris les filières suisses professionnelles et académiques - sont organisés en quelque chose que l'on peut réellement parcourir.",
    aboutValue4Title: "Un accompagnement, pas seulement de l'information",
    aboutValue4Desc: "Un suivi, une carte et un parcours guidé agissent ensemble pour que vous ne restiez pas seul face à un mur d'options.",
    aboutStageEyebrow: "Où nous en sommes aujourd'hui",
    aboutStageBody: "Inspirella se lance avec la Suisse comme premier pays - un choix délibéré, vu son système dual unique combinant filières académiques et professionnelles. Nos données sont réelles et en pleine croissance : certaines entrées sont pleinement vérifiées, d'autres encore en cours de révision, et nous indiquons cette différence honnêtement plutôt que de tout présenter comme également certain.",
    aboutVisionEyebrow: "Vers où nous allons",
    aboutVisionBody: "La Suisse est un point de départ, pas une limite. Avec le temps, Inspirella veut apporter la même clarté et la même personnalisation à des systèmes éducatifs au-delà de la Suisse - pour aider davantage de personnes, dans davantage de lieux, à trouver un parcours qui leur correspond vraiment.",

    // Contact Page
    contactTitle: "Nous Contacter",
    contactSubtitle: "Notre équipe est à l'écoute des institutions, des futurs candidats et des développeurs.",
    contactName: "Nom complet",
    contactEmail: "Adresse électronique",
    contactMsg: "Votre Message",
    contactSend: "Envoyer le Message",
    contactSuccess: "Votre application e-mail devrait s'ouvrir avec le message déjà prêt.",

    // Onboarding
    onboardTitle: "Consultation d'Orientation Éducative",
    onboardSubtitle: "Ajustez vos filtres d'orientation pour un accompagnement personnalisé.",
    chooseInterests: "Vos Centres d'Intérêt",
    chooseGoals: "Définissez vos Objectifs",
    chooseStage: "Votre Étape Actuelle",
    interests_academic: "Sciences & Recherche académique",
    interests_vocational: "Apprentissage & Métiers d'art",
    interests_arts: "Arts visuels & Design",
    interests_tech: "Technologie & Informatique",
    interests_business: "Entrepreneuriat & Finance",
    goals_study: "Étudier activement en Suisse",
    goals_career: "Opérer une reconversion professionnelle",
    goals_explore: "Comparaison des systèmes éducatifs",
    goals_child: "Conseil pour enfants & familles",
    stage_schoolType: "Élève / Gymnase",
    stage_university: "Étudiant (Haute École / Uni)",
    stage_professional: "Professionnel en activité",
    stage_other: "Citoyen curieux",
    completeOnboard: "Terminer la configuration",

    // Dashboard
    welcomeBack: "Ravi de vous revoir,",
    personalizedGoalTitle: "Votre plan stratégique actuel",
    continueExplor: "Continuer l'exploration",
    progressTitle: "Suivi de votre apprentissage",
    nextBestStep: "Recommandation d'orientation clé",
    recentActivity: "Dernières perspectives régionales",
    allSystemsGo: "Boussole éducative calibrée avec succès",
    quickAccess: "Accès rapide",
    advisorsAdvice: "Rapport de l'intelligence artificielle d'orientation",
    aiAnalyzing: "Analyse des structures éducatives suisses...",
    aiAdviceTitle: "Votre parcours d'apprentissage",

    // Tracker Page
    trackerHeader: "Suivi Quotidien d'Objectifs & de Vie",
    trackerSub: "Créez vos listes de tâches et enregistrez vos séries de succès pour tous vos objectifs.",
    createTracker: "Formuler un Nouveau Suivi",
    trackerTitlePlace: "ex. Pratiquer la physique, s'entraîner en allemand suisse",
    addGoalBtn: "Ajouter la routine",
    completeStreak: "jours consécutifs",
    completionPercentage: "Taux de complétion",
    noTrackers: "Aucun tracker actif. Créez-en un ci-dessus pour rythmer vos progrès quotidiens.",
    addChecklistItem: "Ajouter une sous-tâche",
    trackerDueDateLabel: "Date cible (facultatif)",
    trackerOverdueBadge: "En retard",
    trackerDueSoonBadge: "Bientôt dû",
    trackerDuePrefix: "Échéance",
    dashboardReminderTitle: "Rappels du suivi",
    dashboardReminderOverdueSuffix: "en retard",
    dashboardReminderDueSoonSuffix: "à échéance cette semaine",
    advisorAddPathToTracker: "Ajouter ce parcours à mon suivi",
    advisorPathInTracker: "Ajouté à votre suivi",
    pathContentGermanOnly: "Étapes affichées en allemand — traduction en cours",
    habitCat_education: "Éducation & Vision",
    habitCat_habit: "Habitudes Constructives",
    habitCat_sport: "Activités Sportives",
    habitCat_health: "Santé & Énergie",
    habitCat_productivity: "Performance Professionnelle",
    habitCat_other: "Objectifs Spécifiques",

    // Profile Page
    profileHeader: "Profil Utilisateur Central",
    profileTheme: "Apparence : Thème Violet Glass",
    profileRegion: "Secteur Actuel",
    profileDataTitle: "Sécurité & Registres Système",
    profileUserAddress: "Accès Authentifié",
    registeredAt: "Synchronisé avec le noyau Inspirella",
    profileBioLabel: "À propos de moi",
    profileBioPlaceholder: "Écrivez quelques mots sur vous - vos intérêts, vos objectifs, tout ce que ce profil devrait refléter.",
    profileBioEmpty: "Vous n'avez encore rien écrit sur vous.",
    profileBioEdit: "Modifier",
    profileBioSave: "Enregistrer",
    profileBioCancel: "Annuler",

    // Map Page
    mapHeader: "Carte interactive de la Suisse",
    mapSub: "Découvrez les universités et les centres d'apprentissage.",
    selectPinAlert: "Sélectionnez un repère pour afficher les détails du pôle éducatif.",
    visitWebsite: "Accéder au Site Officiel",
    contactInstitution: "Contacter l'Établissement",
    admissionInfo: "Conditions d'admissions & Transfert",
    mapToggle3D: "Activer le relief 3D",
    mapMappedLabel: "sur la carte",
    mapUnlocatedLabel: "sans localisation vérifiée",
    mapUnlocatedHint: "Ces établissements sont listés mais non placés sur la carte, car Inspirella ne devine pas les coordonnées.",
    mapCantonUnknown: "Canton non renseigné",
    mapNoCoordinates: "aucune coordonnée vérifiée",
    verifyWithInstitution: "Les informations peuvent changer. Confirmez-les auprès de l'établissement avant de décider.",

    // Institution comparison
    compareAdd: "Ajouter à la comparaison",
    compareRemove: "Retirer de la comparaison",
    compareFull: "Vous pouvez comparer jusqu'à 3 établissements à la fois.",
    compareBarLabel: "En comparaison",
    compareViewButton: "Voir la comparaison",
    compareClear: "Effacer",
    compareModalTitle: "Comparaison des établissements",
    compareFieldCanton: "Canton",
    compareFieldCategory: "Type",
    compareFieldEstablished: "Fondé en",
    compareFieldStudents: "Étudiants",
    compareFieldLanguage: "Langue",
    compareFieldWebsite: "Site web",
    compareFieldVerified: "Statut",
    compareFieldRating: "Note",
    compareNoData: "Non renseigné",

    // Trust and data quality
    qualityVerified: "Vérifié",
    qualityProvisional: "Données provisoires",
    dataNotAvailable: "Non disponible",
    originCurated: "Sélection Inspirella",
    originCuratedHint: "Fait partie du jeu de données initial d'Inspirella, ce n'est pas un enregistrement live.",
    filterAll: "Tout",
    recommendedBadge: "Recommandé",

    // Resources
    resourcesHeader: "Ressources officielles suisses",
    resourcesSub: "Portails fédéraux et cantonaux directement exploitables.",
    resourcesSearchPlaceholder: "Rechercher une ressource...",
    resourcesAdaptedGuest: "Mise en avant adaptée à votre session invité",
    resourcesAdaptedUser: "Mise en avant adaptée à votre profil",
    resourcesEmptyTitle: "Aucune ressource ne correspond encore à votre recherche.",
    resourcesEmptyHint: "Essayez un terme plus court ou revenez à la catégorie Tout.",
    resourceFederal: "Ressource fédérale",
    resourceSwiss: "Ressource suisse",

    // Professions
    professionsEyebrow: "Métiers & Carrières",
    professionsTitle: "Explorateur des métiers et filières suisses",
    professionsSub: "Explorez les voies professionnelles, la compatibilité CFC et les indicateurs de salaire.",
    professionsSearchPlaceholder: "Rechercher un métier ou une compétence...",
    professionsEmpty: "Aucun métier correspondant.",
    professionsLoading: "Chargement des métiers...",
    professionsCatalogGrowing: "Notre catalogue de métiers continue de s'enrichir - revenez bientôt.",
    professionsLoadError: "Impossible de charger les métiers pour le moment. Veuillez réessayer sous peu.",
    professionSelectHint: "Choisissez un métier dans la liste pour voir la formation requise, la demande et les compétences.",
    professionSalaryLabel: "Salaire annuel typique",
    professionSalaryUnknown: "Données salariales non renseignées",
    professionEducationRequired: "Formation requise",
    professionVetLabel: "Apprentissage (CFC)",
    professionVetCompatible: "Accessible par apprentissage",
    professionVetTertiary: "Voie tertiaire",
    professionDemand: "Demande",
    professionOutlook: "Perspectives",
    professionSkillsLabel: "Compétences clés",
    professionClustersLabel: "Principaux pôles régionaux",

    // Resources & Careers hub (unifies web resources, professions, institutions)
    resourcesCareersHeader: "Ressources & Carrières",
    resourcesCareersSub: "Tout ce qu'il faut pour explorer les opportunités en Suisse - ressources, métiers et établissements - au même endroit.",
    resourcesTabWeb: "Ressources web",
    resourcesTabProfessions: "Métiers",
    resourcesTabInstitutions: "Établissements",
    institutionsEyebrow: "Établissements & Écoles",
    institutionsTitle: "Explorateur des établissements suisses",
    institutionsSub: "Recherchez universités, hautes écoles et écoles, et comparez celles qui vous intéressent.",
    institutionsSearchPlaceholder: "Rechercher un établissement...",
    institutionsEmpty: "Aucun établissement correspondant.",
    institutionsLoading: "Chargement des établissements...",
    institutionsCatalogGrowing: "Notre catalogue d'établissements continue de s'enrichir - revenez bientôt.",
    institutionsLoadError: "Impossible de charger les établissements pour le moment. Veuillez réessayer sous peu.",
    institutionSelectHint: "Choisissez un établissement dans la liste pour voir ses détails, contacts et informations d'admission."
  },
  it: {
    // Navigation
    navHome: "Home",
    navAbout: "Chi Siamo",
    navContact: "Contatti",
    navDashboard: "Dashboard",
    navMap: "Mappa 3D Svizzera",
    navResources: "Risorse & Carriere",
    navTracker: "Life Tracker",
    navProfile: "Profilo",
    navLogin: "Inizia",
    navSwitchLang: "Lingua",
    logout: "Disconnetti",

    // Public Home / Landing
    heroTitle: "Il Futuro della Scoperta Educativa",
    heroSubtitle: "Demistificare i sistemi educativi globali, partendo dall'eccellenza dello studio duale svizzero.",
    heroCTA: "Inizia l'Esplorazione",
    exploreCTA: "Esplora come Ospite",
    statInstitutions: "Istituti",
    statProfessions: "Professioni",
    statLearningPaths: "Percorsi",
    statLanguages: "Lingue",
    whyTitle: "Perché Inspirella?",
    whyText: "I percorsi formativi nazionali sanno essere complessi, specialmente in contesti multilingue. Inspirella unifica le strade accademiche e professionali in un'elegante interfaccia d'avanguardia.",
    swissSpecialGroup: "Focus Svizzera: Fase 1",
    swissSpecialDesc: "Come prima nazione, il modello di apprendistato duale svizzero (VET) e il prestigio accademico garantiscono la perfetta base per la scalabilità globale.",
    howItWorks: "Metodologia d'Azione",
    howStepOnboarding: "1. Profilazione & Obiettivi",
    howStepOnboardingDesc: "Adattiamo i contenuti in base a età, obiettivi formativi e interessi linguistici.",
    howStepMap: "2. Esplorazione Spaziale 3D",
    howStepMapDesc: "Esplora le sedi delle facoltà e delle istituzioni di ricerca.",
    howStepTracker: "3. Integrazione Tracker",
    howStepTrackerDesc: "Pianifica e segna progressi quotidiani in qualsiasi sfera della tua vita.",
    howStepResources: "4. Risorse Ufficiali",
    howStepResourcesDesc: "Accesso diretto alle risorse di ammissione e agli uffici cantonali competenti.",
    futureVisionTitle: "Il modello di scalabilità accademica globale",
    futureVisionDesc: "L'architettura dati Inspirella consente l'aggiunta di Danimarca, Singapore e Giappone nella Fase 2.",

    // About Page
    aboutTitle: "Ridefinire l'accesso alla formazione",
    aboutPara1: "In Inspirella crediamo che la formazione sia il motore della crescita umana. Comprendere il percorso tra Licei, apprendistati e scuole universitarie professionali in Svizzera non dovrebbe richiedere infinite ricerche.",
    aboutPara2: "Grazie ad innovative strutture dati, una mappa tridimensionale interattiva ed un'esperienza multilingue, offriamo la migliore guida per percorsi di successo.",
    aboutMissionEyebrow: "La nostra missione",
    aboutMissionBody: "Scegliere una scuola, un percorso o un indirizzo di studio è una delle decisioni più importanti nella vita di una persona - eppure le informazioni necessarie per decidere bene sono spesso frammentate, contraddittorie o scritte per le istituzioni invece che per chi deve scegliere. Inspirella esiste per colmare questo divario: trasformare una scelta complessa e determinante in qualcosa di chiaro, personale e concretamente percorribile.",
    aboutWhyEyebrow: "Perché è importante",
    aboutWhyBody: "Più informazioni non significano automaticamente più chiarezza. Inspirella parte dal principio che qualità, struttura e onestà su ciò che è verificato - e ciò che non lo è ancora - contino più della quantità, perché un consiglio vale quanto i dati su cui si basa.",
    aboutValuesTitle: "Su cosa ci basiamo",
    aboutValue1Title: "Fiducia e dati verificati",
    aboutValue1Desc: "Ogni istituto, programma e risorsa viene confrontato con la propria fonte. Quando qualcosa non è ancora confermato, lo diciamo apertamente invece di indovinare.",
    aboutValue2Title: "Personalizzazione approfondita",
    aboutValue2Desc: "Un percorso su misura per te, non una lista generica. Inspirella considera i tuoi interessi, obiettivi e la tua fase attuale per mostrare ciò che conta davvero.",
    aboutValue3Title: "Chiarezza anziché caos",
    aboutValue3Desc: "Sistemi nazionali complessi - inclusi i percorsi svizzeri professionali e accademici - vengono organizzati in qualcosa che si può davvero esplorare.",
    aboutValue4Title: "Accompagnamento, non solo informazioni",
    aboutValue4Desc: "Tracker, mappa e percorso guidato lavorano insieme, così non resti solo davanti a un muro di opzioni.",
    aboutStageEyebrow: "Dove siamo oggi",
    aboutStageBody: "Inspirella parte dalla Svizzera come primo paese - una scelta deliberata, dato il suo sistema duale unico che unisce percorsi accademici e professionali. I nostri dati sono reali e in crescita: alcune voci sono pienamente verificate, altre ancora in revisione, e indichiamo questa differenza onestamente invece di presentare tutto come ugualmente certo.",
    aboutVisionEyebrow: "Dove stiamo andando",
    aboutVisionBody: "La Svizzera è un inizio, non un limite. Nel tempo, Inspirella vuole portare la stessa chiarezza e personalizzazione anche a sistemi educativi oltre la Svizzera - aiutando più persone, in più luoghi, a trovare un percorso davvero adatto a loro.",

    // Contact Page
    contactTitle: "Inizia il Dialogo",
    contactSubtitle: "Il nostro team è a disposizione di istituti, candidati e sviluppatori.",
    contactName: "Nome completo",
    contactEmail: "Indirizzo E-mail",
    contactMsg: "Il tuo Messaggio",
    contactSend: "Invia Messaggio",
    contactSuccess: "La tua app di posta dovrebbe aprirsi con il messaggio già pronto.",

    // Onboarding
    onboardTitle: "Consulenza d'Allineamento Formativo",
    onboardSubtitle: "Seleziona i tuoi filtri per configurare la tua dashboard personalizzata.",
    chooseInterests: "Seleziona i tuoi Interessi",
    chooseGoals: "Definisci gli Obiettivi",
    chooseStage: "Dichiara la tua Fase Attuale",
    interests_academic: "Scienza & Ricerca Academica",
    interests_vocational: "Apprendistato & Professionale",
    interests_arts: "Arti visive & Design",
    interests_tech: "Software & Tecnologia",
    interests_business: "Imprenditoria & Finanza",
    goals_study: "Studiare in Svizzera",
    goals_career: "Riorientamento professionale",
    goals_explore: "Confronto dei sistemi di studio",
    goals_child: "Consulenza per figli & famiglie",
    stage_schoolType: "Studente / Ginnasio",
    stage_university: "Studente (Università / SUPSI)",
    stage_professional: "Professionista in attività",
    stage_other: "Cittadino curioso",
    completeOnboard: "Completa configurazione",

    // Dashboard
    welcomeBack: "Bentornato,",
    personalizedGoalTitle: "La tua strategia di studio",
    continueExplor: "Continua ad Esplorare",
    progressTitle: "Progresso di Apprendimento",
    nextBestStep: "Raccomandazione chiave d'orientamento",
    recentActivity: "Ultimi approfondimenti regionali",
    allSystemsGo: "Bussola formativa calibrata con successo",
    quickAccess: "Accesso Rapido",
    advisorsAdvice: "Resoconto del Consulente IA",
    aiAnalyzing: "Analisi delle strutture formative svizzere...",
    aiAdviceTitle: "Il tuo percorso formativo",

    // Tracker Page
    trackerHeader: "Tracker Sistematico e Checklist Personale",
    trackerSub: "Crea liste quotidiane di attività e tieni traccia delle tue serie di successi.",
    createTracker: "Crea Nuovo Tracker",
    trackerTitlePlace: "es. Esercizi di fisica, praticare lo svizzero tedesco",
    addGoalBtn: "Includi attività",
    completeStreak: "giorni consecutivi",
    completionPercentage: "Tasso di completamento",
    noTrackers: "Nessun tracker attivo. Crea un piano qui sopra per iniziare il tuo progresso quotidiano.",
    addChecklistItem: "Includi sotto-attività",
    trackerDueDateLabel: "Data obiettivo (facoltativa)",
    trackerOverdueBadge: "In ritardo",
    trackerDueSoonBadge: "In scadenza",
    trackerDuePrefix: "Scadenza",
    dashboardReminderTitle: "Promemoria tracker",
    dashboardReminderOverdueSuffix: "in ritardo",
    dashboardReminderDueSoonSuffix: "in scadenza questa settimana",
    advisorAddPathToTracker: "Aggiungi questo percorso al mio tracker",
    advisorPathInTracker: "Aggiunto al tuo tracker",
    pathContentGermanOnly: "Passaggi mostrati in tedesco — traduzione in corso",
    habitCat_education: "Formazione & Mindset",
    habitCat_habit: "Abitudini Costruttive",
    habitCat_sport: "Attività Sportiva",
    habitCat_health: "Salute & Bio-Care",
    habitCat_productivity: "Produttività Professionale",
    habitCat_other: "Obiettivi Personalizzati",

    // Profile Page
    profileHeader: "Profilo Utente Centrale",
    profileTheme: "Aspetto: Tema Violet Glass",
    profileRegion: "Sito Geografico di Riferimento",
    profileDataTitle: "Sicurezza & Registri di Sistema",
    profileUserAddress: "Accesso Autenticato",
    registeredAt: "Sincronizzato al nucleo Inspirella",
    profileBioLabel: "Chi sono",
    profileBioPlaceholder: "Scrivi qualcosa su di te - i tuoi interessi, i tuoi obiettivi, tutto ciò che questo profilo dovrebbe riflettere.",
    profileBioEmpty: "Non hai ancora scritto nulla su di te.",
    profileBioEdit: "Modifica",
    profileBioSave: "Salva",
    profileBioCancel: "Annulla",

    // Map Page
    mapHeader: "Mappa Georiferita 3D della Svizzera",
    mapSub: "Esplora i politecnici, le università d'eccellenza ed i migliori centri di formazione geolocalizzati.",
    selectPinAlert: "Seleziona un punto sulla mappa per proiettare informazioni.",
    visitWebsite: "Visita Sito Ufficiale",
    contactInstitution: "Contatta l'Istituto",
    admissionInfo: "Ammissioni",
    mapToggle3D: "Visualizza rilievo 3D",
    mapMappedLabel: "sulla mappa",
    mapUnlocatedLabel: "senza posizione verificata",
    mapUnlocatedHint: "Questi istituti sono elencati ma non collocati sulla mappa, perché Inspirella non indovina le coordinate.",
    mapCantonUnknown: "Cantone non registrato",
    mapNoCoordinates: "nessuna coordinata verificata",
    verifyWithInstitution: "I dettagli possono cambiare. Confermali con l'istituto prima di decidere.",

    // Institution comparison
    compareAdd: "Aggiungi al confronto",
    compareRemove: "Rimuovi dal confronto",
    compareFull: "Puoi confrontare fino a 3 istituti alla volta.",
    compareBarLabel: "In confronto",
    compareViewButton: "Visualizza confronto",
    compareClear: "Svuota",
    compareModalTitle: "Confronto tra istituti",
    compareFieldCanton: "Cantone",
    compareFieldCategory: "Tipo",
    compareFieldEstablished: "Fondato nel",
    compareFieldStudents: "Studenti",
    compareFieldLanguage: "Lingua",
    compareFieldWebsite: "Sito web",
    compareFieldVerified: "Stato",
    compareFieldRating: "Valutazione",
    compareNoData: "Non registrato",

    // Trust and data quality
    qualityVerified: "Verificato",
    qualityProvisional: "Dati provvisori",
    dataNotAvailable: "Non disponibile",
    originCurated: "Selezione Inspirella",
    originCuratedHint: "Fa parte del set iniziale curato da Inspirella, non è un record live del database.",
    filterAll: "Tutti",
    recommendedBadge: "Consigliato",

    // Resources
    resourcesHeader: "Risorse ufficiali svizzere",
    resourcesSub: "Portali federali e cantonali utilizzabili subito.",
    resourcesSearchPlaceholder: "Cerca risorse...",
    resourcesAdaptedGuest: "Evidenze adattate alla tua sessione ospite",
    resourcesAdaptedUser: "Evidenze adattate al tuo profilo",
    resourcesEmptyTitle: "Nessuna risorsa corrisponde ancora alla tua ricerca.",
    resourcesEmptyHint: "Prova un termine più breve o torna alla categoria Tutti.",
    resourceFederal: "Risorsa federale",
    resourceSwiss: "Risorsa svizzera",

    // Professions
    professionsEyebrow: "Professioni & Carriere",
    professionsTitle: "Esploratore di professioni e percorsi svizzeri",
    professionsSub: "Esplora percorsi professionali, compatibilità con l'apprendistato e indicatori salariali.",
    professionsSearchPlaceholder: "Cerca professioni o competenze...",
    professionsEmpty: "Nessuna professione corrispondente.",
    professionsLoading: "Caricamento delle professioni...",
    professionsCatalogGrowing: "Il nostro catalogo di professioni è ancora in crescita - torna presto a controllare.",
    professionsLoadError: "Impossibile caricare le professioni al momento. Riprova tra poco.",
    professionSelectHint: "Scegli una professione dall'elenco per vedere formazione richiesta, domanda e competenze.",
    professionSalaryLabel: "Retribuzione annua tipica",
    professionSalaryUnknown: "Dati salariali non registrati",
    professionEducationRequired: "Formazione richiesta",
    professionVetLabel: "Apprendistato (AFC)",
    professionVetCompatible: "Raggiungibile con apprendistato",
    professionVetTertiary: "Percorso terziario",
    professionDemand: "Domanda",
    professionOutlook: "Prospettive",
    professionSkillsLabel: "Competenze chiave",
    professionClustersLabel: "Principali poli regionali",

    // Resources & Careers hub (unifies web resources, professions, institutions)
    resourcesCareersHeader: "Risorse & Carriere",
    resourcesCareersSub: "Tutto ciò che serve per esplorare le opportunità in Svizzera - risorse, professioni e istituti - in un unico posto.",
    resourcesTabWeb: "Risorse web",
    resourcesTabProfessions: "Professioni",
    resourcesTabInstitutions: "Istituti",
    institutionsEyebrow: "Istituti & Scuole",
    institutionsTitle: "Esploratore degli istituti svizzeri",
    institutionsSub: "Cerca università, scuole superiori e istituti, e confronta quelli che ti interessano.",
    institutionsSearchPlaceholder: "Cerca istituti...",
    institutionsEmpty: "Nessun istituto corrispondente.",
    institutionsLoading: "Caricamento degli istituti...",
    institutionsCatalogGrowing: "Il nostro catalogo di istituti è ancora in crescita - torna presto a controllare.",
    institutionsLoadError: "Impossibile caricare gli istituti al momento. Riprova tra poco.",
    institutionSelectHint: "Scegli un istituto dall'elenco per vedere dettagli, contatti e informazioni sulle ammissioni."
  }
};

// Swiss Education System Structured Model
export const SWISS_EDUCATION_LEVELS: EducationLevel[] = [
  {
    id: "primary",
    title: {
      en: "Primary Level (Kindergarten & Volksschule)",
      de: "Primarstufe (Kindergarten & Volksschule)",
      fr: "Scolarité Obligatoire (École Primaire)",
      it: "Scuola Elementare (Scolarità Obbligatoria)"
    },
    sub: {
      en: "Ages 4 to 12 • Core Foundations",
      de: "Alter 4 bis 12 • Grundlegende Basis",
      fr: "Âges 4 à 12 • Fondations initiales",
      it: "Età da 4 a 12 • Competenze di Base"
    },
    description: {
      en: "Compulsory education managed by the individual 26 cantons, providing strong multilingual baselines. Children learn a second national language early.",
      de: "Obligatorische Schule unter kantonaler Hoheit mit starker Ausrichtung auf Mehrsprachigkeit. Kinder erlernen früh eine zweite Landessprache.",
      fr: "Scolarité obligatoire gérée de manière souveraine par les 26 cantons suisses. Apprentissage renforcé précoce des langues nationales.",
      it: "Scolarità obbligatoria regolata dai 26 cantoni con forte impronta sul multilinguismo. Apprendimento precoce di una seconda lingua nazionale."
    },
    keyFacts: {
      en: [
        "Completely public and funded via cantonal taxation.",
        "Duration spans 8 years, including 2 years of mandatory Kindergarten.",
        "Integration of special needs within regular classrooms is standard policy."
      ],
      de: [
        "Vollständig öffentlich finanziert durch kantonale Steuern.",
        "Dauer 8 Jahre, inklusive 2 Jahre obligatorischer Kindergarten.",
        "Standardpolitik ist die Integration von Förderbedarf in Regelklassen."
      ],
      fr: [
        "Entièrement public et financé par les impôts cantonaux.",
        "Durée totale de 8 ans, incluant 2 ans d'école enfantine obligatoire.",
        "L'intégration scolaire est la politique par défaut."
      ],
      it: [
        "Interamente pubblico e finanziato dalle imposte cantonali.",
        "Durata di 8 anni, compresi 2 anni di scuola dell'infanzia obbligatoria.",
        "Integrare le necessità scolastiche nella classe standard è la norma."
      ]
    },
    permeabilityText: {
      en: "Seamless progression to Lower Secondary tracking (Sekundarstufe I) based on academic evaluations and teacher-parent consensus.",
      de: "Reibungsloser Übergang in die Sekundarstufe I basierend auf Leistungsprüfungen und Lehrer-Eltern-Empfehlungen.",
      fr: "Passage direct au niveau secondaire I selon l'évaluation académique globale et l'accord des enseignants.",
      it: "Transizione diretta al livello medio inferiore (Scuola media) basata sulle valutazioni accademiche."
    },
    pathSteps: [
      {
        id: "p1",
        title: { en: "Kindergarten Entry", de: "Eintritt Kindergarten", fr: "Entrée à l'école enfantine", it: "Ingresso Infanzia" },
        description: { en: "Mandatory start focusing on developmental play and sensory mapping.", de: "Spielerische Förderung und sprachliche Erstsozialisation.", fr: "Sensibilisation et apprentissages par le jeu.", it: "Processo di apprendimento coordinato basato sul gioco." },
        timeframe: { en: "Age 4-5", de: "Alter 4-5", fr: "Âge 4-5", it: "Età 4-5" }
      },
      {
        id: "p2",
        title: { en: "Basic Skills Mastery", de: "Grundkompetenzen", fr: "Acquisition des fondamentaux", it: "Competenze Primarie" },
        description: { en: "Focus on reading, writing, mathematical structures, and canton language.", de: "Fokus auf Lesen, Schreiben, Rechnen und die jeweilige Kantonssprache.", fr: "Apprentissage des langues, calculs et sciences naturelles.", it: "Insegnamento di matematica, scrittura, lettura e seconda lingua." },
        timeframe: { en: "Grades 1-6", de: "Klassen 1-6", fr: "Degrés 1-6", it: "Classi 1-6" }
      }
    ]
  },
  {
    id: "secondary1",
    title: {
      en: "Lower Secondary Level (Sekundarstufe I)",
      de: "Sekundarstufe I (Stufe der Volksschule)",
      fr: "Secondaire I (Cycles d'Orientation)",
      it: "Secondario I (Scuola Media)"
    },
    sub: {
      en: "Ages 12 to 15 • Streamed Orientation",
      de: "Alter 12 bis 15 • Gestufte Orientierung",
      fr: "Âges 12 à 15 • Cycles d'Orientation structurés",
      it: "Età da 12 a 15 • Orientamento e Livelli"
    },
    description: {
      en: "Students are divided into distinct performance levels based on academic capabilities, paving the way for either professional apprenticeships or higher academics.",
      de: "Einteilung nach Leistungsniveaus (z.B. Sekundar-, Real- oder Oberschule, je nach Kanton), zur Vorbereitung auf Berufsbildung oder Gymnasium.",
      fr: "Les élèves sont répartis selon leurs aptitudes scolaires, orientant leur avenir vers l'apprentissage pratique ou le cursus d'études long.",
      it: "Gli studenti vengono divisi in livelli prestazionali per determinare l'attuazione di un apprendistato o del liceo accademico."
    },
    keyFacts: {
      en: [
        "Spans 3 years of classes.",
        "Features streamed tracks to match individual technical and cognitive capacities.",
        "Intense career and vocational counseling (BIZ) begins in Grade 8."
      ],
      de: [
        "Umfasst 3 Schuljahre.",
        "Niveauzüge zur optimalen Abstimmung auf kognitive Fähigkeiten.",
        "Intensive Berufsberatung (BIZ) startet bereits in der 8. Klasse."
      ],
      fr: [
        "Durée d'environ 3 ans.",
        "Voies différenciées pour correspondre aux forces cognitives privées.",
        "Début de l'orientation professionnelle obligatoire (conseillers d'orientation, BIZ)."
      ],
      it: [
        "Dura comunemente 3 o 4 anni.",
        "Flessibilità strutturata in livelli di rendimento (A o B).",
        "L'orientamento professionale approfondito inizia in seconda media."
      ]
    },
    permeabilityText: {
      en: "This is the core fork in Swiss education. High performing streams bridge to Gymnasium; other channels lead directly into high-tech corporate apprenticeships.",
      de: "Das Kern-Nadelöhr des Schweizer Systems: Leistungsstarke Kurse berechtigen zum Gymnasiumsaufstieg, andere zur dualen Berufsbildung.",
      fr: "C'est l'aiguillage fondamental : les profils académiques visent le gymnase, les profils pratiques entrent en apprentissage d'entreprise.",
      it: "La deviazione principale: i corsi attitudinali avanzano al liceo, altri portano direttamente a un apprendistato tecnico."
    },
    pathSteps: [
      {
        id: "s1_1",
        title: { en: "Stream Allocation", de: "Niveauzuweisung", fr: "Répartition par voies", it: "Assegnazione ai Livelli" },
        description: { en: "Cantonal metrics determine enrollment into basic or advanced classes.", de: "Zertifikate steuern die Einteilung in Basis- oder Erweiterungskurse.", fr: "Sélection sur dossier et notes pour l'admission de niveau.", it: "Inscrizione a corsi base o attitudinali basata sui risultati scolastici." },
        timeframe: { en: "Grade 7", de: "7. Schuljahr", fr: "Degré 7", it: "Fase 1" }
      },
      {
        id: "s1_2",
        title: { en: "Apprenticeship Sourcing or Gymi Prep", de: "Lehrstellensuche / Gymi-Vorbereitung", fr: "Recherche de contrat VET ou prépa Gymnase", it: "Ricerca Apprendistato o Preparazione Liceo" },
        description: { en: "Students search for apprenticeships in companies or take national Gymnasium entry exams.", de: "Suche nach Lehrstellen in Betrieben oder Vorbereitung auf das Gymnasiums-Zulassungsexamen.", fr: "Dépôts de CV pour les stages ou préparation intensive de l'examen de maturité gynmasiale.", it: "Candidature per posti d'apprendistato o preparazione all'esame cantonale di ammissione." },
        timeframe: { en: "Grade 8-9 (Age 14-15)", de: "8.-9. Schuljahr", fr: "Degrés 8-9", it: "Fine percorso" }
      }
    ]
  },
  {
    id: "secondary2",
    title: {
      en: "Upper Secondary Level (Maturity & Vocational VET)",
      de: "Sekundarstufe II (Berufsbildung & Gymnasium)",
      fr: "Secondaire II (Maturité & Apprentissage CFC/VET)",
      it: "Secondario II (Maturità & Formazione Professionale)"
    },
    sub: {
      en: "Ages 15 to 19 • Dual tracking at its peak",
      de: "Alter 15 bis 19 • Das Herzstück des Systems",
      fr: "Âges 15 à 19 • L'âge d'or de la voie duale",
      it: "Età da 15 a 19 • Il cuore dello studio svizzero"
    },
    description: {
      en: "The legendary Swiss dual-track system. About 70% of teens choose vocational education (VET) coupled with enterprise apprenticeships, while 30% choose academic Baccalaureate high schools (Gymnasiums).",
      de: "Die international bewunderte duale Berufsbildung. Ca. 70% der Jugendlichen wählen eine Berufslehre im Betrieb (EFZ / EBA); ca. 30% absolvieren das Gymnasium.",
      fr: "Le modèle par apprentissage de réputation mondiale. Près de 70% des jeunes choisissent un apprentissage professionnel en entreprise (CFC), tandis que 30% préparent la maturité gymnasiale.",
      it: "Il celebrato sistema formativo duale. Circa il 70% dei giovani adotta un tirocinio professionale AFC in azienda, mentre il 30% frequenta il liceo classico o scientifico."
    },
    keyFacts: {
      en: [
        "Gymnasiums take 3 to 4 years leading to the general 'Maturity' certificate.",
        "Vocational tracks blend 3-4 days of paid company work with 1-2 days of school room teaching.",
        "Both tracks enable access to highly qualified tertiary programs via 'Berufsmaturität'."
      ],
      de: [
        "Gymnasien dauern 3-4 Jahre und schließen mit der gymnasialen Maturität ab.",
        "Duale Berufslehren verbinden 3-4 Tage bezahlte Arbeit mit 1-2 Tagen Berufsschule.",
        "Beide Wege ermöglichen über die Berufsmaturität den Hochschulzugang."
      ],
      fr: [
        "Le gymnase ou collège dure 3 à 4 ans et mène à la Maturité gymnasiale.",
        "L'apprentissage associe 3-4 jours de travail en entreprise rémunéré et 1-2 jours de cours théoriques.",
        "Les deux parcours ouvrent l'entrée aux hautes écoles via la maturité professionnelle."
      ],
      it: [
        "Il liceo dura 4 anni e si conclude con l'attestato di Maturità cantonale.",
        "La formazione professionale alterna 3 giorni di lavoro retribuito in azienda e 2 giorni di scuola professionale.",
        "Le due strade si ricongiungono nei programmi universitari grazie alla Maturità Professionale."
      ]
    },
    permeabilityText: {
      en: "Absolute Transferability: A vocational graduate can take the 'Passerelle' bridge examination to enter the highest academic universities like ETH Zurich.",
      de: "Bedingungslose Durchlässigkeit: Berufslehrabgänger können über die Passerellenprüfung in jede klassische Universität (z.B. die ETH) einsteigen.",
      fr: "Une perméabilité totale : un diplômé de CFC technique peut passer l'examen de la 'Passerelle' pour s'inscrire direct aux cursus académiques de l'EPFL.",
      it: "Costante Permeabilità: un diplomato AFC può superare l'esame della 'Passerella' per immatricolarsi direttamente alle università come il Politecnico di Zurigo."
    },
    pathSteps: [
      {
        id: "s2_1",
        title: { en: "Dual Track Bifurcation", de: "Weichenstellung", fr: "La croisée des chemins", it: "Scelta del Percorso" },
        description: { en: "Enrollment into Gymnasium or starting a corporate employment VET apprenticeship.", de: "Eintritt ins Gymnasium oder offizieler Vertragsstart als Berufslernender im Betrieb.", fr: "Entrée définitive au gymnase ou début effectif de l'apprentissage rémunéré.", it: "Inizio ufficiale degli studi al liceo o avvio dell'apprendistato AFC stipendiato." },
        timeframe: { en: "Age 15", de: "Alter 15", fr: "Âge 15", it: "Età 15" }
      },
      {
        id: "s2_2",
        title: { en: "Federal Certificate Exams", de: "Lehrabschluss (EFZ) / Abitur", fr: "Examens finaux CFC ou Bac", it: "Esami Finali di Maturità o AFC" },
        description: { en: "Practical examinations and thesis defense for national title licenses.", de: "Abschlussprüfungen der Lehre (Qualifikationsverfahren QV) oder Maturitätsprüfungen.", fr: "Évaluations finales d'expertises d'apprentis ou épreuves de maturité fédérale.", it: "Procedura di qualificazione pratica (PQ) o prove cantonali scritte e orali." },
        timeframe: { en: "Age 18-19", de: "Alter 18-19", fr: "Âge 18-19", it: "Età 18-19" }
      }
    ]
  },
  {
    id: "tertiary",
    title: {
      en: "Tertiary Level (Universities & Professional Colleges)",
      de: "Tertiärstufe (Hochschulen & Höhere Berufsbildung)",
      fr: "Niveau Tertiaire (Universités & Écoles Supérieures)",
      it: "Livello Terziario (Politecnici & Formazione Superiore)"
    },
    sub: {
      en: "Ages 19+ • Academic and Technical Excellence",
      de: "Alter 19+ • Akademische und professionelle Elite",
      fr: "Âges 19+ • Recherche de pointe et perfectionnement",
      it: "Età 19+ • Scienze ed alta specializzazione"
    },
    description: {
      en: "Switzerland's world-class tertiary institutions. Divided between world-leading traditional universities (like ETH and EPFL), Universities of Applied Sciences (Fachhochschulen), and Higher Professional Colleges (Höhere Fachschulen).",
      de: "Weltklasse-Hochschulwesen. Es gliedert sich in universitäre Hochschulen (wie ETHZ / EPFL), Fachhochschulen mit Praxisbezug und Höhere Fachschulen für Praxis-Experten.",
      fr: "L'enseignement supérieur d'excellence. Réparti entre universités du top mondial (comme l'ETH et l'EPFL), Hautes Écoles Spécialisées (HES) et Écoles Supérieures (ES) professionnelles.",
      it: "Formazione terziaria svizzera tra le migliori al mondo. Sviluppata in Politecnici federali di eccellenza, Scuole universitarie professionali (SUP) e Scuole Superiori (SS)."
    },
    keyFacts: {
      en: [
        "Traditional universities focus on high-level scientific research and theory.",
        "Fachhochschulen bridge research directly with local corporate and technical applications.",
        "Tertiary B (Höhere Berufsbildung) produces top-tier industry executives from apprentices."
      ],
      de: [
        "Universitäre Hochschulen fokussieren auf wissenschaftliche Grundlagenforschung.",
        "Fachhochschulen vernetzen Spitzenforschung direkt mit der Wirtschaft.",
        "Die Höhere Berufsbildung (Tertiär B) qualifiziert gelernte Berufsleute für Managementpositionen."
      ],
      fr: [
        "Les universités privilégient la recherche académique théorique haut de gamme.",
        "Les hautes écoles spécialisées (HES) allient recherche académique et applications pratiques directes.",
        "La formation professionnelle supérieure (Tertiaire B) installe des praticiens certifiés aux postes de direction."
      ],
      it: [
        "Le università tradizionali spingono sulla ricerca scientifica di base.",
        "Le scuole universitarie professionali (SUPSI) uniscono teoria ed esercizi applicativi commerciali.",
        "Il livello professionale superiore (Terziario B) qualifica i talenti pratici a ruoli dirigenziali d'azienda."
      ]
    },
    permeabilityText: {
      en: "There are no dead ends. A student who starts as an apprentice can easily transition to a master-level university or obtain postdoctoral academic titles later.",
      de: "Keine Einbahnstraßen: Ein gelernter Handwerker kann per Berufsausübung und Fortbildung Doktortitel an technischen Universitäten erwerben.",
      fr: "Aucune voie sans issue : un apprenti passionné peut obtenir un doctorat de recherche postdoctorat dans nos instituts fédéraux.",
      it: "Nessun vicolo cieco formativo: chi inizia col lavoro sul campo può raggiungere il titolo di dottorato ai politecnici federali più alti."
    },
    pathSteps: [
      {
        id: "t1",
        title: { en: "Tertiary Enrollment", de: "Immatrikulation", fr: "Immatriculation universitaire / HES", it: "Immatricolazione Accademia" },
        description: { en: "Applying to federal institutes, arts academies, or professional polytechnics.", de: "Einschreibung an Universitäten, Fachhochschulen oder höheren Fachschulen.", fr: "Dossiers d'études supérieures ou inscriptions directes sur concours.", it: "Domanda di iscrizione ai politecnici federali o alle SUPSI regionali." },
        timeframe: { en: "Age 19-20", de: "Alter 19-20", fr: "Âge 19-20", it: "Età 19-20" }
      },
      {
        id: "t2",
        title: { en: "Bologna System Graduation", de: "Hochschulabschluss (Bologna)", fr: "Diplômes de Bachelors/Masters", it: "Laurea di Percorso (Bologna)" },
        description: { en: "Securing globally recognized Bachelor, Master, PhD, or Federal Diploma credentials.", de: "Erwerb anerkannter Abschlüsse wie Bachelor, Master, Doktorat oder Eidg. Diplom.", fr: "Défense de thèses professionnelles ou de programmes techniques.", it: "Conclusione degli studi e conseguimento di Bachelor, Master o Diplomi federali." },
        timeframe: { en: "Age 22+", de: "Alter 22+", fr: "Âge 22+", it: "Età 22+" }
      }
    ]
  }
];

// Swiss Elite Educational Institutions for the 3D Mapbox Map
export const SWISS_INSTITUTIONS: Institution[] = [
  {
    id: "ethz",
    title: "ETH Zurich",
    category: "university",
    coordinates: [8.5482, 47.3763],
    canton: "Zurich",
    description: {
      en: "Consistently ranked as one of the world's absolute top 10 universities. Famously associated with Albert Einstein and 21 other Nobel laureates.",
      de: "Regelmäßig unter den weltweiten Top 10 Universitäten gerankt. Berühmt für Albert Einstein und 21 weitere Nobelpreisträger.",
      fr: "Régulièrement classée parmi les 10 meilleures universités de notre planète. Célèbre pour avoir formé Albert Einstein et 21 autres lauréats du prix Nobel.",
      it: "Costantemente inserita tra le prime 10 università mondiali. Celebre università dove studiò Albert Einstein ed altri 21 premi Nobel."
    },
    website: "https://ethz.ch",
    email: "admission@ethz.ch",
    phone: "+41 44 632 11 11",
    address: "Rämistrasse 101, 8092 Zürich",
    imageUrl: "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&w=800&q=80",
    admissionRequirements: {
      en: "Requires Swiss Maturity or equivalent entry examination (reduced or comprehensive). High level of academic excellence is expected.",
      de: "Erfordert eidgenössische Maturität oder gleichwertiges Zulassungsverfahren. Höchste akademische Leistungsbereitschaft.",
      fr: "Maturité suisse requise ou examen d'admission équivalent. Très rigoureuse sélection sur critères académiques.",
      it: "Richiede Maturità federale o esame d'ammissione equivalente. Elevata selezione accademica dei candidati."
    }
  },
  {
    id: "epfl",
    title: "EPFL Lausanne",
    category: "university",
    coordinates: [6.5685, 46.5191],
    canton: "Vaud",
    description: {
      en: "Europe's most cosmopolitan technical university, excelling in computer science, biotechnology, robotics, and hardware rendering.",
      de: "Europas internationalste technische Hochschule. Führend im Bereich Informatik, Biotechnik, Robotik und Systemforschung.",
      fr: "L'université technique la plus cosmopolite d'Europe, leader en informatique, biotechnologie, robotique et recherche spatiale.",
      it: "Il politecnico più cosmopolita d'Europa, polo primario per informatica, robotica, scienze biologiche e ingegnerie."
    },
    website: "https://epfl.ch",
    email: "student.services@epfl.ch",
    phone: "+41 21 693 11 11",
    address: "Route Cantonale, 1015 Lausanne",
    imageUrl: "https://images.unsplash.com/photo-1562774053-701939374585?auto=format&fit=crop&w=800&q=80",
    admissionRequirements: {
      en: "Swiss gymnasial maturity or foreign certificate with identical curricular credentials. Fluent French (C1) or English depending on department.",
      de: "Gymnasiale Maturität oder ausländischer Ausweis mit identischen Kriterien. Fließend Französisch (C1) oder Englisch nötig.",
      fr: "Maturité gymnasiale ou diplôme étranger équivalent. Exigence de français (niveau C1) ou d'anglais selon la filière d'études.",
      it: "Maturità ginnasiale o certificati d'istruzione esteri equivalenti. Richiesto francese fluente (C1) o inglese ad indirizzo."
    }
  },
  {
    id: "uzh",
    title: "University of Zurich",
    category: "applied_science",
    coordinates: [8.5488, 47.3750],
    canton: "Zurich",
    description: {
      en: "Founded in 1833, UZH is Switzerland's largest university, representing breakthrough medical science, genomics, and leading economics.",
      de: "Gegründet 1833, ist die UZH die größte Universität der Schweiz, bekannt für Medizin, Genomforschung und exzellente Ökonomie.",
      fr: "Fondée en 1833, l'UZH est la plus grande université helvétique, réputée pour ses percées en médecine, génomique et économie.",
      it: "Fondata nel 1833, UZH è la più grande università della Svizzera, leader per medicina, economia e genetica d'avanguardia."
    },
    website: "https://uzh.ch",
    email: "admission@uzh.ch",
    phone: "+41 44 634 11 11",
    address: "Künstlergasse 15, 8001 Zürich",
    imageUrl: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=800&q=80",
    admissionRequirements: {
      en: "Accredited Baccalaureate. Requires high German language capability (C1) for undergraduate structures.",
      de: "Anerkannte Maturität. C1 Deutschkenntnisse für Bachelor-Studiengänge zwingend erforderlich.",
      fr: "Certificat de maturité reconnu. Maîtrise avancée de l'allemand (C1) requise pour le premier cycle.",
      it: "Certificato di maturità riconosciuto. Richiesta conoscenza avanzata della lingua tedesca (C1) per i programmi di laurea."
    }
  },
  {
    id: "unige",
    title: "University of Geneva",
    category: "university",
    coordinates: [6.1428, 46.1993],
    canton: "Geneva",
    description: {
      en: "Highly international university deeply integrated with global governance agencies, the UN, and international finance structures.",
      de: "Sehr internationale Universität, eng vernetzt mit globalen Organisationen, der UNO und dem internationalen Finanzwesen.",
      fr: "Université prestigieuse avec une insertion unique auprès des organisations mondiales (ONU, OMC, OMS) et de la finance d'élite.",
      it: "Ateneo ad altissima internazionalità, strettamente connesso alle agenzie globali dell'ONU, all'OMC e alla finanza internazionale."
    },
    website: "https://unige.ch",
    email: "admissions@unige.ch",
    phone: "+41 22 379 71 11",
    address: "24 Rue du Général-Dufour, 1211 Genève",
    imageUrl: "https://images.unsplash.com/photo-1507537297725-24a1c029d3ca?auto=format&fit=crop&w=800&q=80",
    admissionRequirements: {
      en: "Requires general maturity or similar. High French level is standard constraint.",
      de: "Allgemeine Maturität oder Äquivalent erforderlich. Fließend Französisch ist Standardanforderung.",
      fr: "Maturité reconnue ou titre jugé équivalent. Maîtrise certifiée de la langue française requise.",
      it: "Maturità Cantonale o estera equivalente. Requisito primario è il possesso del livello C1 in francese."
    }
  },
  {
    id: "cern",
    title: "CERN - European Lab for Particle Physics",
    category: "research",
    coordinates: [6.0528, 46.2330],
    canton: "Geneva",
    description: {
      en: "Unifies global academic postdoctoral researchers to test quantum mechanics using the world's largest Large Hadron Collider.",
      de: "Vereint globale Forscher zur Erforschung der Quantenmechanik am weltweit größten Teilchenbeschleuniger (LHC).",
      fr: "Le centre ultime de recherche atomique et physique quantique au monde, abritant le Grand collisionneur de hadrons.",
      it: "Il centro più importante al mondo per lo studio della fisica atomica, contenitore del Large Hadron Collider (LHC)."
    },
    website: "https://home.cern",
    email: "recruitment@cern.ch",
    phone: "+41 22 767 61 11",
    address: "Esplanade des Particules 1, 1211 Meyrin",
    imageUrl: "https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=800&q=80"
  },
  {
    id: "unisg",
    title: "University of St. Gallen (HSG)",
    category: "applied_science",
    coordinates: [9.3748, 47.4316],
    canton: "St. Gallen",
    description: {
      en: "Top tier academic powerhouse for management, law, business administration, and international affairs in Europe.",
      de: "Führende europäische Kaderschmiede für Betriebswirtschaft, Recht, Wirtschaftswissenschaften und Internationale Beziehungen.",
      fr: "L'un des meilleurs centres éducatifs européens pour le management, la gestion d'entreprise et les relations internationales.",
      it: "Università d'élite a livello europeo per amministrazione aziendale, finanza internazionale, giurisprudenza e affari esteri."
    },
    website: "https://unisg.ch",
    email: "admissions@unisg.ch",
    phone: "+41 71 224 21 11",
    address: "Dufourstrasse 50, 9000 St. Gallen",
    imageUrl: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=800&q=80"
  },
  {
    id: "zhaw",
    title: "ZHAW Zurich University of Applied Sciences",
    category: "vocational",
    coordinates: [8.7294, 47.5012],
    canton: "Zurich",
    description: {
      en: "One of the largest vocational ternary-track bridges in German-speaking Switzerland, excelling in applied engineering, aviation, and health.",
      de: "Eine der größten Fachhochschulen für anwendungsorientierte Ingenieurwissenschaften, Luftfahrt und Gesundheit im Kanton Zürich.",
      fr: "L'une des plus grandes hautes écoles spécialisées (HES), leader en ingénierie appliquée, aviation et sciences de la santé.",
      it: "Una delle più grandi università di scienze applicate, orientata a ingegnerieria, aeronautica civile e medicina pratica."
    },
    website: "https://zhaw.ch",
    email: "info@zhaw.ch",
    phone: "+41 58 934 00 00",
    address: "Gertrudstrasse 15, 8401 Winterthur",
    imageUrl: "https://images.unsplash.com/photo-1581092921461-eab62e97a780?auto=format&fit=crop&w=800&q=80"
  }
];

// Rich Education-focused Resources & Official Gateways
export const OFF_RESOURCES: ResourceItem[] = [
  {
    id: "r1",
    category: "official_portal",
    country: "CH",
    title: {
      en: "CH.ch - Swiss Authority Education Portal",
      de: "CH.ch - Bildungsportal der Bundeskanzlei",
      fr: "CH.ch - Informations officielles du système scolaire",
      it: "CH.ch - Portale ufficiale delle autorità svizzere"
    },
    description: {
      en: "Main federal gateway outlining school structures, cantonal rules, and school holiday tables.",
      de: "Zentraler Bundeskompass mit kantonalen Gegebenheiten, Schulrechten und Feriensystemen.",
      fr: "Principal site de la Confédération décrivant les cursus obligatoires et la souveraineté cantonale.",
      it: "Principale portale federale che regola i cicli scolastici nei vari cantoni."
    },
    url: "https://www.ch.ch/en/school-and-education/"
  },
  {
    id: "r2",
    category: "apprenticeship",
    country: "CH",
    title: {
      en: "Berufsberatung.ch - Official Apprenticeship Registry",
      de: "Berufsberatung.ch - Offizielle Lehrstellenbörse",
      fr: "Orientation.ch - Portail officiel suisse des places d'apprentissage",
      it: "Orientamento.ch - Servizio ufficiale svizzero per i posti di tirocinio"
    },
    description: {
      en: "Comprehensive national directory to search and apply for active corporate vocational training contracts.",
      de: "Nationale Datenbank zum Finden und Bewerben auf freie Lehrstellen in Betrieben.",
      fr: "Répertoire officiel pour postuler en direct aux contrats d'apprentissage d'entreprises.",
      it: "La risorsa ufficiale per individuare e contrattualizzare l'apprendistato commerciale o tecnico."
    },
    url: "https://www.berufsberatung.ch"
  },
  {
    id: "r3",
    category: "scholarship",
    country: "CH",
    title: {
      en: "SBF_Swiss Government Excellence Scholarships",
      de: "SBFI - Bundesstipendien für ausländische Forschende",
      fr: "SEFRI - Bourses d'excellence de la Confédération",
      it: "SEFRI - Borse di studio d'eccellenza della Confederazione svizzera"
    },
    description: {
      en: "State-offered financial grants for foreign academic investigators, PhD students, and researchers.",
      de: "Staatliche Stipendienprogramme für ausländische Forschende und wissenschaftliche Spitzenkräfte.",
      fr: "Bourses fédérales destinées aux chercheurs et doctorants internationaux hautement qualifiés.",
      it: "Finanziamenti statali svizzeri destinati a ricercatori d'eccellenza stranieri."
    },
    url: "https://www.sbfi.admin.ch/sbfi/en/home/education/scholarships-and-grants.html"
  },
  {
    id: "r4",
    category: "visa_guide",
    country: "CH",
    title: {
      en: "SEM - State Secretariat for Migration Setup",
      de: "SEM - Staatssekretariat für Migration (Visa & Einreise)",
      fr: "SEM - Secrétariat d'État aux migrations",
      it: "SEM - Segreteria di Stato della migrazione"
    },
    description: {
      en: "Visa guidelines for international educational applicants entering the Swiss Schengen zone.",
      de: "Offizielle Richtlinien für die Beantragung eines Studierendenvisums (Schengen-Raum).",
      fr: "Démarches pour l'obtention des visas d'études et autorisations de séjours cantonaux.",
      it: "Linee guida per l'ingresso in Svizzera per motivi di studio."
    },
    url: "https://www.sem.admin.ch"
  }
];
