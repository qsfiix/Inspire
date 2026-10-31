import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight, Briefcase, ExternalLink, Flag, MapPin, School, Sparkles, X } from "lucide-react";
import { DataRepository } from "../data/Repository";
import type { AudienceFact, CantonStageFact, EducationNode, EducationTransition, LanguageCode, RouteBackground } from "../types";
import { AdmissionBox, BridgeBox } from "./PathwayInfo";
import { kindLabel, nodeLabel } from "../lib/pathwayInfo";
import { inLang } from "../lib/localized";
import {
  admissionRoutesForNode,
  buildEdges,
  mapSize,
  MAP_GEOMETRY,
  nodeBox,
  NODE_LAYOUT,
  alternativePaths,
  estimateYears,
  nodeForTargetLevel,
  nodeForProfessionType,
  nodeForSubgroup,
  professionTypesForNode,
  institutionSubgroupsForNode,
  BAND_AGES,
  MAIN_KINDS,
  targetLevelForNode,
  type MapEdge
} from "../lib/pathMap";

/**
 * Swiss Path Map: the whole Swiss education system as one interactive chart (stages from
 * education_nodes, ways between them from education_transitions). Public: no login needed.
 * Wide screens get the chart, small screens a list of the same stages; both open the same detail card.
 */

interface Props {
  currentLanguage: LanguageCode;
  theme: "light" | "dark";
  isLoggedIn: boolean;
  /** After a stage was made the goal: open My Path. */
  onGoalSet: () => void;
  /** A visitor without a profile wants to plan: start the short guest survey. */
  onStartPlanning: () => void;
  /** Opened from a profession or a school: select this stage right away. */
  focusNode?: string | null;
  /** "Professions on this stage": opens Resources & Careers filtered to the stage. */
  onOpenProfessions: (node: string) => void;
  /** "Schools of this stage": opens Resources & Careers filtered to the stage. */
  onOpenSchools: (node: string) => void;
}

type Ui = {
  title: string;
  sub: string;
  intro: string;
  from: string;
  to: string;
  pick: string;
  newcomer: string;
  yourWay: string;
  stepsCount: (n: number) => string;
  noRoute: string;
  viewMap: string;
  viewList: string;
  legend: string;
  waysIn: string;
  waysOut: string;
  startHere: string;
  getHere: string;
  official: string;
  makeGoal: string;
  isGoal: string;
  goalSet: string;
  openMyPath: string;
  planRoute: string;
  needProfile: string;
  duration: string;
  age: string;
  diploma: string;
  requirements: string;
  cantonal: string;
  good: string;
  conditions: string;
  notes: string;
  pickCanton: string;
  anyCanton: string;
  germanNote: string;
  disclaimer: string;
  close: string;
  loading: string;
  failed: string;
  fromProfile: string;
  bands: Record<string, string>;
  kinds: Record<string, string>;
  edgeTitle: string;
  scrollHint: string;
  mainWays: string;
  allWays: (n: number) => string;
  ageNote: string;
  ageRange: (a: number, b: number) => string;
  professionsOnStage: (n: number) => string;
  schoolsOnStage: (n: number) => string;
  stageTies: string;
  myCanton: string;
  cantonHint: string;
  inCanton: (c: string) => string;
  offerYes: string;
  offerNo: string;
  offerPartial: string;
  option: (n: number) => string;
  yearsAbout: (a: number, b: number) => string;
  yearsNote: string;
  notHere: string;
  exceptionNote: string;
  onlyIn: (cantons: string) => string;
  statusSTitle: string;
  statusSHint: string;
  statusSLang: string;
  statusSCanton: (c: string) => string;
  statusSPickCanton: string;
  statusSNoCanton: string;
};

const UI: Record<LanguageCode, Ui> = {
  de: {
    title: "Swiss Path Map",
    sub: "Das Bildungssystem der Schweiz auf einen Blick",
    intro: "Alle Wege von der Schule bis zum Doktorat und wie man zwischen ihnen wechseln kann. Tippe auf eine Station oder eine Linie, um zu sehen, was dahintersteckt. Oder wähle, wo du stehst und wo du hinwillst.",
    from: "Ich bin hier",
    to: "Ich will hierhin",
    pick: "Station wählen",
    newcomer: "Ich bin neu in der Schweiz",
    yourWay: "Dein Weg",
    stepsCount: n => (n === 1 ? "1 Schritt" : `${n} Schritte`),
    noRoute: "In unseren Daten gibt es dafür keinen direkten Weg. Oft hilft ein Brückenangebot oder die Berufsberatung weiter.",
    viewMap: "Karte",
    viewList: "Liste",
    legend: "Legende",
    waysIn: "Wege hierher",
    waysOut: "Wege von hier aus",
    startHere: "Hier starten",
    getHere: "Hier ankommen",
    official: "Offizielle Seite",
    makeGoal: "Zu meinem Ziel machen",
    isGoal: "Das ist dein Ziel",
    goalSet: "Ziel gesetzt: dein Weg ist aktualisiert.",
    openMyPath: "Meinen Weg öffnen",
    planRoute: "Meinen Weg planen",
    needProfile: "Mit einem kurzen Profil (auch als Gast) kannst du diese Station zu deinem Ziel machen und deinen persönlichen Weg sehen.",
    duration: "Dauer",
    age: "Typisches Alter",
    diploma: "Abschluss",
    requirements: "Wer kann starten",
    cantonal: "Unterschiede nach Kanton",
    good: "Gut zu wissen",
    conditions: "Bedingungen",
    notes: "Hinweise",
    pickCanton: "Zulassung in deinem Kanton ansehen",
    anyCanton: "Kanton wählen",
    germanNote: "Die Angaben unter der Zusammenfassung stammen aus offiziellen Quellen und sind auf Deutsch. Fristen und Bedingungen ändern sich: prüfe sie auf der offiziellen Seite.",
    disclaimer: "Orientierung, keine offizielle Auskunft. Quellen: berufsberatung.ch, SBFI, EDK, swissuniversities. Die Regeln unterscheiden sich je nach Kanton und Schule.",
    close: "Schliessen",
    loading: "Karte wird geladen…",
    failed: "Die Karte konnte nicht geladen werden. Bitte versuche es später noch einmal.",
    fromProfile: "aus deinem Profil",
    bands: { "-1": "Ankommen", "0": "Primarstufe", "1": "Sekundarstufe I", "2": "Sekundarstufe II", "3": "Tertiärstufe", "4": "Master, Doktorat, Weiterbildung" },
    kinds: { school: "Schule / Ausbildung", qualification: "Abschluss", bridge: "Brückenangebot", entry: "Ankommen", work: "Arbeit" },
    edgeTitle: "Weg",
    scrollHint: "Seitlich scrollen, um die ganze Karte zu sehen",
    mainWays: "Hauptwege",
    allWays: n => `Alle Wege zeigen (+${n})`,
    ageNote: "Alter: Richtwerte. Wer später einsteigt oder wechselt, ist nicht zu spät: viele Wege stehen auch Erwachsenen offen.",
    ageRange: (a, b) => `ca. ${a === b ? a : a + "–" + b} Jahre`,
    professionsOnStage: n => `${n} Berufe auf diesem Weg`,
    schoolsOnStage: n => `${n} Schulen dazu`,
    stageTies: "Weiter erkunden",
    myCanton: "Mein Kanton",
    cantonHint: "Wähle deinen Kanton, um zu sehen, wie es dort läuft (Schulmodell, Gymnasium, Ankommen, Ämter).",
    inCanton: c => `In ${c}`,
    offerYes: "Angebot vorhanden",
    offerNo: "Kein solches Angebot",
    offerPartial: "Nur teilweise",
    option: n => `Variante ${n}`,
    yearsAbout: (a, b) => `ca. ${a === b ? a : a + "–" + b} Jahre`,
    yearsNote: "Die Dauer ist eine grobe Schätzung aus den Angaben der Stufen; sie hängt von Kanton, Schule und Person ab.",
    notHere: "In diesem Kanton nicht angeboten",
    exceptionNote: "Ausnahme: nicht der übliche Weg. Er gilt nur unter besonderen Bedingungen und wird deshalb nie als Standardweg vorgeschlagen.",
    onlyIn: c => `Nur in einigen Kantonen: ${c}`,
    statusSTitle: "Mit Schutzstatus S (Ukraine)",
    statusSHint: "Kurz und mit offiziellen Quellen: Schule, Sprache, Lehre, Diplome, Studium.",
    statusSLang: "Texte auf Deutsch",
    statusSCanton: c => `In deinem Kanton (${c})`,
    statusSPickCanton: "Wähle oben deinen Kanton, dann siehst du die Angaben für Schule, Sprache und Lehre vor Ort.",
    statusSNoCanton: "Für diesen Kanton haben wir noch keine geprüften Angaben. Frag bei deiner Wohngemeinde oder der kantonalen Integrationsstelle nach."
  },
  en: {
    title: "Swiss Path Map",
    sub: "The Swiss education system at a glance",
    intro: "Every path from school to doctorate, and how you can switch between them. Tap a stage or a line to see what is behind it. Or choose where you are and where you want to get to.",
    from: "I am here",
    to: "I want to get here",
    pick: "Choose a stage",
    newcomer: "I am new in Switzerland",
    yourWay: "Your way",
    stepsCount: n => (n === 1 ? "1 step" : `${n} steps`),
    noRoute: "Our data has no direct way for this. A bridge programme or career guidance often helps.",
    viewMap: "Map",
    viewList: "List",
    legend: "Legend",
    waysIn: "Ways in",
    waysOut: "Ways on from here",
    startHere: "Start here",
    getHere: "Get here",
    official: "Official page",
    makeGoal: "Make this my goal",
    isGoal: "This is your goal",
    goalSet: "Goal set: your path is updated.",
    openMyPath: "Open my path",
    planRoute: "Plan my route",
    needProfile: "With a short profile (guest is fine) you can make this stage your goal and see your personal path.",
    duration: "Duration",
    age: "Typical age",
    diploma: "Qualification",
    requirements: "Who can start",
    cantonal: "Differences between cantons",
    good: "Good to know",
    conditions: "Conditions",
    notes: "Notes",
    pickCanton: "See admission in your canton",
    anyCanton: "Choose canton",
    germanNote: "The details below the summary come from official sources and are in German. Deadlines and conditions change: check them on the official page.",
    disclaimer: "Guidance, not an official service. Sources: berufsberatung.ch, SBFI, EDK, swissuniversities. Rules differ by canton and school.",
    close: "Close",
    loading: "Loading the map…",
    failed: "The map could not be loaded. Please try again later.",
    fromProfile: "from your profile",
    bands: { "-1": "Arriving", "0": "Primary", "1": "Lower secondary", "2": "Upper secondary", "3": "Tertiary", "4": "Master, doctorate, continuing education" },
    kinds: { school: "School / training", qualification: "Qualification", bridge: "Bridge offer", entry: "Arriving", work: "Work" },
    edgeTitle: "Way",
    scrollHint: "Scroll sideways to see the whole map",
    mainWays: "Main ways",
    allWays: n => `Show all ways (+${n})`,
    ageNote: "Ages are a rough guide. Starting later or switching is not too late: many ways are open to adults too.",
    ageRange: (a, b) => `about age ${a === b ? a : a + "–" + b}`,
    professionsOnStage: n => `${n} professions on this path`,
    schoolsOnStage: n => `${n} schools for it`,
    stageTies: "Keep exploring",
    myCanton: "My canton",
    cantonHint: "Choose your canton to see how it works there (school model, Gymnasium, arriving, offices).",
    inCanton: c => `In ${c}`,
    offerYes: "Offered",
    offerNo: "Not offered",
    offerPartial: "Only in part",
    option: n => `Option ${n}`,
    yearsAbout: (a, b) => `about ${a === b ? a : a + "–" + b} years`,
    yearsNote: "The length is a rough estimate from the stage details; it depends on canton, school and person.",
    notHere: "Not offered in this canton",
    exceptionNote: "Exception: not the usual way. It applies only under special conditions, so it is never suggested as the default route.",
    onlyIn: c => `Only in some cantons: ${c}`,
    statusSTitle: "With protection status S (Ukraine)",
    statusSHint: "Short and sourced from official pages: school, language, apprenticeship, diplomas, university.",
    statusSLang: "Texts in English",
    statusSCanton: c => `In your canton (${c})`,
    statusSPickCanton: "Choose your canton above to see the local details for school, language and apprenticeship.",
    statusSNoCanton: "We have no checked details for this canton yet. Ask your municipality or the cantonal integration office."
  },
  fr: {
    title: "Swiss Path Map",
    sub: "Le système éducatif suisse en un coup d'œil",
    intro: "Tous les parcours de l'école au doctorat et comment passer de l'un à l'autre. Touche une étape ou une ligne pour voir ce qu'il y a derrière. Ou choisis où tu en es et où tu veux aller.",
    from: "Je suis ici",
    to: "Je veux arriver ici",
    pick: "Choisir une étape",
    newcomer: "Je viens d'arriver en Suisse",
    yourWay: "Ton chemin",
    stepsCount: n => (n === 1 ? "1 étape" : `${n} étapes`),
    noRoute: "Nos données n'indiquent pas de voie directe. Une offre transitoire ou l'orientation professionnelle aide souvent.",
    viewMap: "Carte",
    viewList: "Liste",
    legend: "Légende",
    waysIn: "Voies d'accès",
    waysOut: "Voies pour continuer",
    startHere: "Partir d'ici",
    getHere: "Arriver ici",
    official: "Page officielle",
    makeGoal: "En faire mon objectif",
    isGoal: "C'est ton objectif",
    goalSet: "Objectif défini : ton parcours est mis à jour.",
    openMyPath: "Ouvrir mon parcours",
    planRoute: "Planifier mon parcours",
    needProfile: "Avec un court profil (en invité aussi), tu peux faire de cette étape ton objectif et voir ton parcours personnel.",
    duration: "Durée",
    age: "Âge typique",
    diploma: "Titre obtenu",
    requirements: "Qui peut commencer",
    cantonal: "Différences entre cantons",
    good: "Bon à savoir",
    conditions: "Conditions",
    notes: "Remarques",
    pickCanton: "Voir l'admission dans ton canton",
    anyCanton: "Choisir le canton",
    germanNote: "Les détails sous le résumé viennent de sources officielles et sont en allemand. Les délais et conditions changent : vérifie-les sur la page officielle.",
    disclaimer: "Une orientation, pas un service officiel. Sources : berufsberatung.ch, SEFRI, CDIP, swissuniversities. Les règles varient selon le canton et l'école.",
    close: "Fermer",
    loading: "Chargement de la carte…",
    failed: "La carte n'a pas pu être chargée. Réessaie plus tard.",
    fromProfile: "d'après ton profil",
    bands: { "-1": "Arriver", "0": "Primaire", "1": "Secondaire I", "2": "Secondaire II", "3": "Tertiaire", "4": "Master, doctorat, formation continue" },
    kinds: { school: "École / formation", qualification: "Diplôme", bridge: "Offre transitoire", entry: "Arriver", work: "Travail" },
    edgeTitle: "Voie",
    scrollHint: "Fais défiler latéralement pour voir toute la carte",
    mainWays: "Voies principales",
    allWays: n => `Afficher toutes les voies (+${n})`,
    ageNote: "Les âges sont indicatifs. Commencer plus tard ou changer de voie n'est pas trop tard : beaucoup de voies sont ouvertes aux adultes.",
    ageRange: (a, b) => `env. ${a === b ? a : a + "–" + b} ans`,
    professionsOnStage: n => `${n} métiers sur ce parcours`,
    schoolsOnStage: n => `${n} écoles`,
    stageTies: "Continuer à explorer",
    myCanton: "Mon canton",
    cantonHint: "Choisis ton canton pour voir comment cela se passe chez lui (modèle scolaire, gymnase, arrivée, offices).",
    inCanton: c => `Dans le canton ${c}`,
    offerYes: "Offre existante",
    offerNo: "Pas d'offre de ce type",
    offerPartial: "Seulement en partie",
    option: n => `Variante ${n}`,
    yearsAbout: (a, b) => `env. ${a === b ? a : a + "–" + b} ans`,
    yearsNote: "La durée est une estimation approximative d'après les étapes; elle dépend du canton, de l'école et de la personne.",
    notHere: "Non proposé dans ce canton",
    exceptionNote: "Exception : ce n'est pas la voie habituelle. Elle ne vaut qu'à des conditions particulières et n'est donc jamais proposée comme parcours par défaut.",
    onlyIn: c => `Seulement dans certains cantons : ${c}`,
    statusSTitle: "Avec le statut de protection S (Ukraine)",
    statusSHint: "Court et sourcé sur des pages officielles : école, langue, apprentissage, diplômes, université.",
    statusSLang: "Textes en anglais",
    statusSCanton: c => `Dans ton canton (${c})`,
    statusSPickCanton: "Choisis ton canton ci-dessus pour voir les informations locales sur l'école, la langue et l'apprentissage.",
    statusSNoCanton: "Nous n'avons pas encore d'informations vérifiées pour ce canton. Demande à ta commune ou au service cantonal d'intégration."
  },
  it: {
    title: "Swiss Path Map",
    sub: "Il sistema educativo svizzero a colpo d'occhio",
    intro: "Tutti i percorsi dalla scuola al dottorato e come passare dall'uno all'altro. Tocca una tappa o una linea per vedere cosa c'è dietro. Oppure scegli dove sei e dove vuoi arrivare.",
    from: "Sono qui",
    to: "Voglio arrivare qui",
    pick: "Scegli una tappa",
    newcomer: "Sono appena arrivato in Svizzera",
    yourWay: "Il tuo percorso",
    stepsCount: n => (n === 1 ? "1 passo" : `${n} passi`),
    noRoute: "Nei nostri dati non c'è una via diretta. Spesso aiutano un'offerta transitoria o l'orientamento professionale.",
    viewMap: "Mappa",
    viewList: "Elenco",
    legend: "Legenda",
    waysIn: "Vie d'accesso",
    waysOut: "Per proseguire",
    startHere: "Parti da qui",
    getHere: "Arriva qui",
    official: "Pagina ufficiale",
    makeGoal: "Rendilo il mio obiettivo",
    isGoal: "È il tuo obiettivo",
    goalSet: "Obiettivo impostato: il tuo percorso è aggiornato.",
    openMyPath: "Apri il mio percorso",
    planRoute: "Pianifica il mio percorso",
    needProfile: "Con un breve profilo (anche come ospite) puoi fare di questa tappa il tuo obiettivo e vedere il tuo percorso personale.",
    duration: "Durata",
    age: "Età tipica",
    diploma: "Titolo",
    requirements: "Chi può iniziare",
    cantonal: "Differenze tra i cantoni",
    good: "Da sapere",
    conditions: "Condizioni",
    notes: "Note",
    pickCanton: "Vedi l'ammissione nel tuo cantone",
    anyCanton: "Scegli il cantone",
    germanNote: "I dettagli sotto il riassunto provengono da fonti ufficiali e sono in tedesco. Scadenze e condizioni cambiano: verificale sulla pagina ufficiale.",
    disclaimer: "Un orientamento, non un servizio ufficiale. Fonti: berufsberatung.ch, SEFRI, CDPE, swissuniversities. Le regole variano da cantone a cantone e da scuola a scuola.",
    close: "Chiudi",
    loading: "Caricamento della mappa…",
    failed: "Non è stato possibile caricare la mappa. Riprova più tardi.",
    fromProfile: "dal tuo profilo",
    bands: { "-1": "Arrivare", "0": "Primario", "1": "Secondario I", "2": "Secondario II", "3": "Terziario", "4": "Master, dottorato, formazione continua" },
    kinds: { school: "Scuola / formazione", qualification: "Titolo", bridge: "Offerta transitoria", entry: "Arrivare", work: "Lavoro" },
    edgeTitle: "Via",
    scrollHint: "Scorri di lato per vedere tutta la mappa",
    mainWays: "Vie principali",
    allWays: n => `Mostra tutte le vie (+${n})`,
    ageNote: "Le età sono indicative. Iniziare più tardi o cambiare strada non è troppo tardi: molte vie sono aperte anche agli adulti.",
    ageRange: (a, b) => `circa ${a === b ? a : a + "–" + b} anni`,
    professionsOnStage: n => `${n} professioni su questo percorso`,
    schoolsOnStage: n => `${n} scuole`,
    stageTies: "Continua a esplorare",
    myCanton: "Il mio cantone",
    cantonHint: "Scegli il tuo cantone per vedere come funziona lì (modello scolastico, liceo, arrivo, uffici).",
    inCanton: c => `Nel cantone ${c}`,
    offerYes: "Offerta presente",
    offerNo: "Nessuna offerta di questo tipo",
    offerPartial: "Solo in parte",
    option: n => `Variante ${n}`,
    yearsAbout: (a, b) => `circa ${a === b ? a : a + "–" + b} anni`,
    yearsNote: "La durata è una stima approssimativa dalle tappe; dipende da cantone, scuola e persona.",
    notHere: "Non offerto in questo cantone",
    exceptionNote: "Eccezione: non è la via abituale. Vale solo a condizioni particolari e quindi non viene mai proposta come percorso predefinito.",
    onlyIn: c => `Solo in alcuni cantoni: ${c}`,
    statusSTitle: "Con lo statuto di protezione S (Ucraina)",
    statusSHint: "Breve e con fonti ufficiali: scuola, lingua, apprendistato, diplomi, università.",
    statusSLang: "Testi in inglese",
    statusSCanton: c => `Nel tuo cantone (${c})`,
    statusSPickCanton: "Scegli sopra il tuo cantone per vedere le informazioni locali su scuola, lingua e apprendistato.",
    statusSNoCanton: "Per questo cantone non abbiamo ancora informazioni verificate. Chiedi al tuo comune o al servizio cantonale per l'integrazione."
  },
  uk: {
    title: "Swiss Path Map",
    sub: "Система освіти Швейцарії з першого погляду",
    intro: "Усі шляхи від школи до докторантури та способи переходити з одного на інший. Торкніться етапу або лінії, щоб побачити, що за ними стоїть. Або оберіть, де ви зараз і куди хочете потрапити.",
    from: "Я тут",
    to: "Хочу потрапити сюди",
    pick: "Обрати етап",
    newcomer: "Я нещодавно приїхав(-ла) до Швейцарії",
    yourWay: "Ваш шлях",
    stepsCount: n => (n % 10 === 1 && n % 100 !== 11 ? `${n} крок` : n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 12 || n % 100 > 14) ? `${n} кроки` : `${n} кроків`),
    noRoute: "У наших даних немає прямого шляху. Часто допомагає перехідна програма (Brückenangebot) або профорієнтація.",
    viewMap: "Мапа",
    viewList: "Список",
    legend: "Умовні позначення",
    waysIn: "Шляхи сюди",
    waysOut: "Шляхи далі",
    startHere: "Почати тут",
    getHere: "Прийти сюди",
    official: "Офіційна сторінка",
    makeGoal: "Зробити це моєю ціллю",
    isGoal: "Це ваша ціль",
    goalSet: "Ціль встановлено: ваш шлях оновлено.",
    openMyPath: "Відкрити мій шлях",
    planRoute: "Спланувати мій шлях",
    needProfile: "З коротким профілем (можна й гостем) ви зможете зробити цей етап своєю ціллю та побачити свій особистий шлях.",
    duration: "Тривалість",
    age: "Типовий вік",
    diploma: "Кваліфікація",
    requirements: "Хто може почати",
    cantonal: "Відмінності між кантонами",
    good: "Корисно знати",
    conditions: "Умови",
    notes: "Примітки",
    pickCanton: "Переглянути умови вступу у вашому кантоні",
    anyCanton: "Обрати кантон",
    germanNote: "Дані під коротким описом взято з офіційних німецькомовних джерел і перекладено. Терміни й умови змінюються: перевіряйте їх на офіційній сторінці.",
    disclaimer: "Орієнтир, а не офіційна довідка. Джерела: berufsberatung.ch, SBFI, EDK, swissuniversities. Правила різняться залежно від кантону та школи.",
    close: "Закрити",
    loading: "Мапа завантажується…",
    failed: "Не вдалося завантажити мапу. Спробуйте пізніше.",
    fromProfile: "з вашого профілю",
    bands: { "-1": "Прибуття", "0": "Початкова школа", "1": "Нижча середня школа (Sekundarstufe I)", "2": "Вища середня школа (Sekundarstufe II)", "3": "Вища освіта", "4": "Магістратура, докторантура, підвищення кваліфікації" },
    kinds: { school: "Школа / навчання", qualification: "Кваліфікація", bridge: "Перехідна програма (Brückenangebot)", entry: "Прибуття", work: "Робота" },
    edgeTitle: "Шлях",
    scrollHint: "Прокрутіть убік, щоб побачити всю мапу",
    mainWays: "Головні шляхи",
    allWays: n => `Показати всі шляхи (+${n})`,
    ageNote: "Вік вказано приблизно. Почати пізніше або змінити шлях ніколи не пізно: багато шляхів відкриті й для дорослих.",
    ageRange: (a, b) => `прибл. ${a === b ? a : a + "–" + b} р.`,
    professionsOnStage: n => `Професій на цьому шляху: ${n}`,
    schoolsOnStage: n => `Шкіл: ${n}`,
    stageTies: "Досліджувати далі",
    myCanton: "Мій кантон",
    cantonHint: "Оберіть свій кантон, щоб побачити, як там усе влаштовано (шкільна модель, гімназія, прибуття, установи).",
    inCanton: c => `У кантоні ${c}`,
    offerYes: "Пропозиція є",
    offerNo: "Такої пропозиції немає",
    offerPartial: "Лише частково",
    option: n => `Варіант ${n}`,
    yearsAbout: (a, b) => `прибл. ${a === b ? a : a + "–" + b} р.`,
    yearsNote: "Тривалість — це приблизна оцінка за даними етапів; вона залежить від кантону, школи та людини.",
    notHere: "У цьому кантоні не пропонується",
    exceptionNote: "Виняток: це не звичайний шлях. Він діє лише за особливих умов, тому ми ніколи не пропонуємо його як основний маршрут.",
    onlyIn: c => `Лише в деяких кантонах: ${c}`,
    statusSTitle: "Зі статусом захисту S (Україна)",
    statusSHint: "Коротко й з офіційними джерелами: школа, мова, професійне навчання з практикою (Lehre), дипломи, університет.",
    statusSLang: "Тексти англійською",
    statusSCanton: c => `У вашому кантоні (${c})`,
    statusSPickCanton: "Оберіть свій кантон вище, і ви побачите місцеві дані про школу, мову та професійне навчання.",
    statusSNoCanton: "Для цього кантону в нас ще немає перевірених даних. Запитайте у своїй громаді або в кантональному відомстві з питань інтеграції."
  }
};

const CANTONS = ["AG", "AI", "AR", "BE", "BL", "BS", "FR", "GE", "GL", "GR", "JU", "LU", "NE", "NW", "OW", "SG", "SH", "SO", "SZ", "TG", "TI", "UR", "VD", "VS", "ZG", "ZH"];

/** The five kinds of ways, each with its own line pattern (not only a colour) and a colour per theme. */
const EDGE_STYLE: Record<string, { dash?: string; light: string; dark: string }> = {
  direct: { light: "#7c3aed", dark: "#a78bfa" },
  shortened: { dash: "8 4", light: "#0d9488", dark: "#2dd4bf" },
  with_exam: { dash: "3 3", light: "#d97706", dark: "#fbbf24" },
  with_bridge: { dash: "10 3 2 3", light: "#0284c7", dark: "#38bdf8" },
  second_chance: { dash: "1 5", light: "#db2777", dark: "#f472b6" },
  after_work: { dash: "14 5", light: "#475569", dark: "#94a3b8" }
};
const edgeStyle = (kind: string) => EDGE_STYLE[kind] ?? EDGE_STYLE.direct;

const BAND_COLUMNS: { band: string; cols: number[] }[] = [
  { band: "-1", cols: [0] },
  { band: "0", cols: [1] },
  { band: "1", cols: [2] },
  { band: "2", cols: [3, 4] },
  { band: "3", cols: [5] },
  { band: "4", cols: [6, 7] }
];

/** On the chart a long name loses its bracket (the full name stays in the tooltip and the card). */
const shortLabel = (name: string): string => (name.length > 24 ? name.replace(/\s*\([^)]*\)/g, "").trim() || name : name);

const edgeKey = (e: { from: string; to: string }) => `${e.from}>${e.to}`;

function edgePath(e: MapEdge): string {
  const a = nodeBox(e.from);
  const b = nodeBox(e.to);
  if (!a || !b) return "";
  if (!e.loops) {
    const x1 = a.x + a.w;
    const y1 = a.y + a.h / 2;
    const x2 = b.x;
    const y2 = b.y + b.h / 2;
    const dx = Math.max(24, (x2 - x1) * 0.45);
    return `M${x1} ${y1} C${x1 + dx} ${y1} ${x2 - dx} ${y2} ${x2} ${y2}`;
  }
  if (NODE_LAYOUT[e.from].col === NODE_LAYOUT[e.to].col) {
    const x = a.x + a.w;
    const y1 = a.y + a.h / 2;
    const y2 = b.y + b.h / 2;
    return `M${x} ${y1} C${x + 30} ${y1} ${x + 30} ${y2} ${x} ${y2}`;
  }
  const x1 = a.x + a.w / 2;
  const y1 = a.y + a.h;
  const x2 = b.x + b.w / 2;
  const y2 = b.y + b.h;
  const drop = 46;
  return `M${x1} ${y1} C${x1} ${y1 + drop} ${x2} ${y2 + drop} ${x2} ${y2}`;
}

/** Stages in reading order for selects and the list view. */
function orderedNodes(nodes: Map<string, EducationNode>): EducationNode[] {
  return [...nodes.values()].sort((a, b) => a.band - b.band || a.sortOrder - b.sortOrder);
}

function nodeFromProfile(route: RouteBackground | undefined): { from?: string; to?: string } {
  if (!route) return {};
  let from: string | undefined;
  switch (route.highestEducation) {
    case "compulsory_school": from = "sek1"; break;
    case "upper_secondary_general": from = "gym_matura"; break;
    case "upper_secondary_vocational": from = "efz"; break;
    case "tertiary_professional": from = "hf"; break;
    case "bachelor": from = "fh"; break;
    case "master": from = "master"; break;
    default: from = undefined;
  }
  return { from: from && NODE_LAYOUT[from] ? from : undefined, to: nodeForTargetLevel(route.targetLevel) };
}

type Selection = { type: "node"; code: string } | { type: "edge"; key: string } | null;

export default function SwissPathMap({ currentLanguage, theme, isLoggedIn, onGoalSet, onStartPlanning, focusNode, onOpenProfessions, onOpenSchools }: Props) {
  const ui = UI[currentLanguage] ?? UI.de;
  const isDark = theme === "dark";
  const [nodes, setNodes] = useState<Map<string, EducationNode>>(new Map());
  const [transitions, setTransitions] = useState<EducationTransition[]>([]);
  const [state, setState] = useState<"loading" | "ready" | "failed">("loading");
  const [selection, setSelection] = useState<Selection>(null);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [fromProfile, setFromProfile] = useState(false);
  const [view, setView] = useState<"map" | "list">(() => (typeof window !== "undefined" && window.innerWidth < 768 ? "list" : "map"));
  const [canton, setCanton] = useState(() => {
    try {
      return localStorage.getItem("inspirella_pathmap_canton") ?? "";
    } catch {
      return "";
    }
  });
  const [cantonFacts, setCantonFacts] = useState<CantonStageFact[]>([]);
  const [statusSFacts, setStatusSFacts] = useState<AudienceFact[]>([]);
  const [routeIndex, setRouteIndex] = useState(0);
  const [showAllWays, setShowAllWays] = useState(false);
  const [professionCounts, setProfessionCounts] = useState<Record<string, number>>({});
  const [schoolCounts, setSchoolCounts] = useState<Record<string, number>>({});
  const [route, setRoute] = useState<RouteBackground | undefined>();
  const [goalNote, setGoalNote] = useState<string | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let active = true;
    Promise.all([DataRepository.getEducationNodes(), DataRepository.getEducationTransitions(), DataRepository.getRouteBackground().catch(() => undefined)])
      .then(([nodeList, transitionList, routeAnswers]) => {
        if (!active) return;
        setNodes(new Map(nodeList.map(n => [n.code, n])));
        setTransitions(transitionList);
        setRoute(routeAnswers ?? undefined);
        setState(nodeList.length + transitionList.length > 0 ? "ready" : "failed");
        const guess = nodeFromProfile(routeAnswers ?? undefined);
        if (guess.from || guess.to) {
          setFrom(guess.from ?? "");
          setTo(guess.to ?? "");
          setFromProfile(true);
        }
      })
      .catch(() => active && setState("failed"));
    return () => {
      active = false;
    };
  }, []);

  // a way limited to some cantons disappears when another canton is chosen
  const edges = useMemo(
    () => buildEdges(transitions.filter(t => !canton || !t.cantons || t.cantons.includes(canton.toUpperCase()))),
    [transitions, canton]
  );

  useEffect(() => {
    try {
      localStorage.setItem("inspirella_pathmap_canton", canton);
    } catch {
      // private mode: the choice just is not remembered
    }
  }, [canton]);

  useEffect(() => {
    let active = true;
    DataRepository.getCantonStageFacts().then(rows => active && setCantonFacts(rows)).catch(() => undefined);
    DataRepository.getAudienceFacts("ukraine_s").then(rows => active && setStatusSFacts(rows)).catch(() => undefined);
    return () => {
      active = false;
    };
  }, []);

  // How many professions and schools hang on each stage (for the "explore further" buttons).
  useEffect(() => {
    let active = true;
    Promise.all([DataRepository.getProfessions(), DataRepository.getInstitutions()])
      .then(([professions, institutions]) => {
        if (!active) return;
        const byProfession: Record<string, number> = {};
        for (const p of professions) {
          const node = nodeForProfessionType(p.professionType);
          if (node) byProfession[node] = (byProfession[node] ?? 0) + 1;
        }
        const bySchool: Record<string, number> = {};
        for (const i of institutions) {
          const node = nodeForSubgroup(i.subgroup);
          if (node) bySchool[node] = (bySchool[node] ?? 0) + 1;
        }
        setProfessionCounts(byProfession);
        setSchoolCounts(bySchool);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, []);

  // Coming from a profession or a school: open that stage.
  useEffect(() => {
    if (focusNode && NODE_LAYOUT[focusNode]) setSelection({ type: "node", code: focusNode });
  }, [focusNode]);
  const routeOptions = useMemo(() => (from && to && from !== to ? alternativePaths(edges, from, to, 3) : []), [edges, from, to]);
  useEffect(() => setRouteIndex(0), [from, to]);
  const path = routeOptions[Math.min(routeIndex, Math.max(0, routeOptions.length - 1))];
  const pathEdgeKeys = useMemo(() => new Set((path ?? []).map(s => edgeKey(s.edge))), [path]);
  const pathNodes = useMemo(() => new Set((path ?? []).flatMap(s => [s.from, s.to])), [path]);
  const factFor = (code: string): CantonStageFact | undefined => (canton ? cantonFacts.find(f => f.canton === canton && f.node === code) : undefined);
  // "no" on the Gymnasium row only means "no Langzeitgymnasium", so it never greys out the whole stage.
  const notOfferedHere = (code: string) => code !== "gymnasium" && factFor(code)?.available === "no";
  const ordered = useMemo(() => orderedNodes(nodes), [nodes]);

  const labelOf = (code: string) => nodes.get(code)?.label[currentLanguage] ?? nodeLabel(code, currentLanguage);
  const selectedNodeCode = selection?.type === "node" ? selection.code : undefined;
  const selectedEdge = selection?.type === "edge" ? edges.find(e => edgeKey(e) === selection.key) : undefined;

  // Esc closes the card; the card takes focus when it opens so keyboard users land in it.
  useEffect(() => {
    if (!selection) return;
    panelRef.current?.focus();
    const onKey = (ev: KeyboardEvent) => ev.key === "Escape" && setSelection(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selection]);

  const related = useMemo(() => {
    const set = new Set<string>();
    if (selectedNodeCode) {
      set.add(selectedNodeCode);
      for (const e of edges) {
        if (e.from === selectedNodeCode) set.add(e.to);
        if (e.to === selectedNodeCode) set.add(e.from);
      }
    }
    if (selectedEdge) {
      set.add(selectedEdge.from);
      set.add(selectedEdge.to);
    }
    return set;
  }, [selectedNodeCode, selectedEdge, edges]);

  const focusActive = !!selection || pathNodes.size > 0;
  const hiddenWays = edges.filter(e => !MAIN_KINDS.has(e.kind) || e.exception).length;
  /** The main ways always; the others when asked for, and whenever a stage, a way or a route points at them. */
  const edgeVisible = (e: MapEdge): boolean =>
    showAllWays ||
    (MAIN_KINDS.has(e.kind) && !e.exception) ||
    pathEdgeKeys.has(edgeKey(e)) ||
    (!!selectedNodeCode && (e.from === selectedNodeCode || e.to === selectedNodeCode)) ||
    (!!selectedEdge && edgeKey(selectedEdge) === edgeKey(e));
  const edgeEmphasis = (e: MapEdge): "strong" | "normal" | "dim" => {
    if (pathEdgeKeys.size > 0) return pathEdgeKeys.has(edgeKey(e)) ? "strong" : "dim";
    if (selectedEdge) return edgeKey(selectedEdge) === edgeKey(e) ? "strong" : "dim";
    if (selectedNodeCode) return e.from === selectedNodeCode || e.to === selectedNodeCode ? "strong" : "dim";
    return "normal";
  };
  const nodeDimmed = (code: string) => {
    if (pathNodes.size > 0) return !pathNodes.has(code) && code !== selectedNodeCode;
    if (selection) return !related.has(code);
    return false;
  };

  const setGoalForStage = async (code: string) => {
    const level = targetLevelForNode(code);
    if (!level) return;
    const current = (await DataRepository.getRouteBackground().catch(() => undefined)) ?? { languageLevels: [] };
    const keep = current.targetLevel === level;
    const next: RouteBackground = {
      ...current,
      targetLevel: level as RouteBackground["targetLevel"],
      targetProfessionId: keep ? current.targetProfessionId : undefined,
      targetInstitutionId: keep ? current.targetInstitutionId : undefined
    };
    await DataRepository.saveRouteBackground(next);
    setRoute(next);
    setGoalNote(ui.goalSet);
  };

  // --- Drawing -------------------------------------------------------------------------------
  const size = mapSize();
  const g = MAP_GEOMETRY;
  const frameRef = useRef<HTMLDivElement>(null);
  const [frameWidth, setFrameWidth] = useState(0);
  useEffect(() => {
    const el = frameRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(entries => setFrameWidth(entries[0].contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, [view, state]);
  const scale = frameWidth > 0 ? Math.min(1, Math.max(0.8, frameWidth / size.width)) : 1;

  const colX = (c: number) => g.padX + c * g.colGap - (g.colGap - g.nodeW) / 2;
  const palette = {
    ink: isDark ? "#e4e4e7" : "#2e1065",
    bandA: isDark ? "rgba(255,255,255,0.025)" : "rgba(124,58,237,0.045)",
    bandB: isDark ? "rgba(255,255,255,0.0)" : "rgba(124,58,237,0.0)",
    bandLine: isDark ? "rgba(255,255,255,0.08)" : "rgba(124,58,237,0.16)"
  };

  const nodeClasses = (code: string, kind: string) => {
    const base = "absolute flex items-center justify-center px-2 text-center text-[11px] font-semibold leading-tight transition-all duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-400 cursor-pointer";
    const shape = kind === "qualification" ? "rounded-full" : "rounded-xl";
    const dashed = kind === "bridge" || kind === "entry" ? "border-dashed" : "border-solid";
    const tone =
      kind === "entry"
        ? isDark ? "bg-amber-400/10 border-amber-300/50 text-amber-100" : "bg-amber-50 border-amber-500/60 text-amber-950"
        : kind === "bridge"
          ? isDark ? "bg-sky-400/10 border-sky-300/50 text-sky-100" : "bg-sky-50 border-sky-500/60 text-sky-950"
          : kind === "work"
            ? isDark ? "bg-emerald-400/10 border-emerald-300/50 text-emerald-100" : "bg-emerald-50 border-emerald-600/50 text-emerald-950"
            : kind === "qualification"
              ? isDark ? "bg-violet-400/15 border-violet-300/60 text-violet-50" : "bg-violet-100 border-violet-500/60 text-violet-950"
              : isDark ? "bg-zinc-900/80 border-violet-400/40 text-white" : "bg-white border-violet-400/70 text-violet-950";
    const selected = selectedNodeCode === code || selectedEdge?.from === code || selectedEdge?.to === code;
    const onPath = pathNodes.has(code);
    const ring = selected ? "ring-2 ring-violet-400 shadow-[0_0_18px_rgba(167,139,250,0.55)]" : onPath ? "ring-2 ring-violet-400/80" : "";
    const unavailable = notOfferedHere(code) ? "opacity-40 border-dotted" : "";
    return `${base} ${shape} border ${dashed} ${tone} ${ring} ${nodeDimmed(code) ? "opacity-30" : "opacity-100"} ${unavailable} hover:opacity-100`;
  };

  const openNode = (code: string) => {
    setGoalNote(null);
    setSelection({ type: "node", code });
  };

  // --- Panels --------------------------------------------------------------------------------
  const cardText = isDark ? "text-zinc-200" : "text-violet-950";
  const muted = isDark ? "text-zinc-400" : "text-violet-950/70";
  const label = "block text-[10px] font-mono uppercase tracking-wider text-violet-400";
  const chip = `inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-mono font-bold ${isDark ? "border-violet-300/30 bg-violet-400/10 text-violet-200" : "border-violet-300 bg-violet-50 text-violet-800"}`;
  const btn = `inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[11px] font-bold transition-colors cursor-pointer ${isDark ? "border-violet-300/40 bg-violet-400/10 text-violet-100 hover:bg-violet-400/20" : "border-violet-400 bg-violet-50 text-violet-900 hover:bg-violet-100"}`;
  const btnPrimary = `inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-bold transition-colors cursor-pointer ${isDark ? "bg-violet-500 text-white hover:bg-violet-400" : "bg-violet-700 text-white hover:bg-violet-800"}`;
  const link = `inline-flex items-center gap-1 text-[11px] font-semibold underline-offset-2 hover:underline ${isDark ? "text-violet-300" : "text-violet-700"}`;

  const Fact = ({ name, value }: { name: string; value?: string }) =>
    value ? (
      <div>
        <span className={label}>{name}</span>
        <p className={`text-[12px] leading-relaxed ${cardText}`}>{value}</p>
      </div>
    ) : null;

  const wayButton = (e: MapEdge, otherCode: string) => (
    <li key={edgeKey(e)}>
      <button type="button" onClick={() => setSelection({ type: "edge", key: edgeKey(e) })} className={`w-full cursor-pointer rounded-lg border px-2.5 py-1.5 text-left transition-colors ${isDark ? "border-white/10 bg-[#0c0916]/90 hover:bg-[#17112b]" : "border-violet-200 bg-white hover:bg-violet-50"}`}>
        <span className="flex items-center justify-between gap-2">
          <b className={`text-[12px] ${isDark ? "text-white" : "text-violet-950"}`}>{labelOf(otherCode)}</b>
          <span className="shrink-0 text-[10px] font-mono text-violet-400">{kindLabel(e.kind, currentLanguage)}</span>
        </span>
        {e.transitions.length > 1 && <span className={`block text-[10.5px] ${muted}`}>+{e.transitions.length - 1}</span>}
      </button>
    </li>
  );

  const renderNodePanel = (code: string) => {
    const n = nodes.get(code);
    const title = labelOf(code);
    const ways = {
      in: edges.filter(e => e.to === code),
      out: edges.filter(e => e.from === code)
    };
    const routes = admissionRoutesForNode(code);
    const level = targetLevelForNode(code);
    const isGoal = !!level && route?.targetLevel === level && !route?.targetProfessionId && !route?.targetInstitutionId;
    return (
      <div className="space-y-4">
        <div>
          <div className="flex flex-wrap items-center gap-1.5">
            {n && <span className={chip}>{ui.bands[String(n.band)] ?? ""}</span>}
            {n && <span className={chip}>{ui.kinds[n.kind] ?? n.kind}</span>}
          </div>
          <h2 className={`mt-2 text-lg font-bold leading-tight ${isDark ? "text-white" : "text-violet-950"}`}>{title}</h2>
          {n?.summary[currentLanguage] && <p className={`mt-1.5 text-[13px] leading-relaxed ${cardText}`}>{n.summary[currentLanguage]}</p>}
        </div>

        <div className="flex flex-wrap gap-2">
          <button type="button" className={btn} onClick={() => { setFrom(code); setFromProfile(false); setSelection(null); }}>
            <MapPin className="h-3.5 w-3.5" /> {ui.startHere}
          </button>
          <button type="button" className={btn} onClick={() => { setTo(code); setFromProfile(false); setSelection(null); }}>
            <Flag className="h-3.5 w-3.5" /> {ui.getHere}
          </button>
        </div>

        {n && (
          <div className={`space-y-3 rounded-xl border p-3 ${isDark ? "border-violet-400/20 bg-[#120c24]/90" : "border-violet-200 bg-violet-50/95"}`}>
            <Fact name={ui.duration} value={inLang(currentLanguage, n.duration, n.uk?.duration)} />
            <Fact name={ui.age} value={inLang(currentLanguage, n.typicalAge, n.uk?.typicalAge)} />
            <Fact name={ui.diploma} value={inLang(currentLanguage, n.diploma, n.uk?.diploma)} />
            <Fact name={ui.requirements} value={inLang(currentLanguage, n.requirements, n.uk?.requirements)} />
            <Fact name={ui.cantonal} value={inLang(currentLanguage, n.cantonalNote, n.uk?.cantonalNote)} />
            <p className={`text-[11px] ${muted}`}>{ui.germanNote}</p>
          </div>
        )}

        {n && inLang(currentLanguage, n.goodToKnow, n.uk?.goodToKnow && n.uk.goodToKnow.length === n.goodToKnow.length ? n.uk.goodToKnow : undefined).length > 0 && (
          <div>
            <span className={label}>{ui.good}</span>
            <ul className={`mt-1 list-disc space-y-1 pl-4 text-[12px] leading-relaxed ${cardText}`}>
              {inLang(currentLanguage, n.goodToKnow, n.uk?.goodToKnow && n.uk.goodToKnow.length === n.goodToKnow.length ? n.uk.goodToKnow : undefined).map(f => <li key={f}>{f}</li>)}
            </ul>
          </div>
        )}

        {!canton && cantonFacts.length > 0 && (
          <p className={`text-[11.5px] leading-relaxed ${muted}`}>{ui.cantonHint}</p>
        )}
        {canton && factFor(code) && (() => {
          const fact = factFor(code)!;
          const offer = code === "gymnasium" ? "" : fact.available === "yes" ? ui.offerYes : fact.available === "no" ? ui.offerNo : fact.available === "partial" ? ui.offerPartial : "";
          return (
            <div className={`space-y-1.5 rounded-xl border p-3 ${isDark ? "border-emerald-300/25 bg-emerald-400/[0.06]" : "border-emerald-500/40 bg-emerald-50"}`}>
              <div className="flex items-start justify-between gap-2">
                <span className={label}>{ui.inCanton(canton)}</span>
                {offer && <span className={chip}>{offer}</span>}
              </div>
              <p className={`text-[12.5px] font-semibold leading-snug ${isDark ? "text-white" : "text-emerald-950"}`}>{inLang(currentLanguage, fact.headline, fact.uk?.headline)}</p>
              {fact.text && <p className={`text-[12px] leading-relaxed ${cardText}`}>{inLang(currentLanguage, fact.text, fact.uk?.text)}</p>}
              {fact.url && (
                <a href={fact.url} target="_blank" rel="noopener noreferrer" className={link}>
                  {ui.official} <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>
          );
        })()}
        {code === "arrival" && statusSFacts.length > 0 && (
          <details open className={`rounded-xl border ${isDark ? "border-amber-300/30 bg-[#1a1405]/90" : "border-amber-500/50 bg-amber-50"}`}>
            <summary className={`cursor-pointer px-3 py-2 text-[12.5px] font-bold ${isDark ? "text-amber-100" : "text-amber-950"}`}>{ui.statusSTitle}</summary>
            <div className="space-y-2.5 px-3 pb-3">
              <p className={`text-[11px] ${muted}`}>{ui.statusSHint}{currentLanguage !== "de" && currentLanguage !== "uk" ? " " + ui.statusSLang + "." : ""}</p>
              {(() => {
                const lang = currentLanguage === "de" ? "de" : currentLanguage === "uk" ? "uk" : "en";
                const cantonal = canton ? statusSFacts.filter(f => f.canton === canton) : [];
                const renderFact = (f: AudienceFact) => (
                  <div key={f.canton ? `${f.canton}-${f.topic}` : f.topic} className="space-y-0.5">
                    <p className={`text-[12.5px] font-semibold leading-snug ${isDark ? "text-white" : "text-amber-950"}`}>{f.headline[lang]}</p>
                    {f.text[lang] && <p className={`text-[12px] leading-relaxed ${cardText}`}>{f.text[lang]}</p>}
                    {f.url && (
                      <a href={f.url} target="_blank" rel="noopener noreferrer" className={link}>
                        {ui.official} <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                );
                return (
                  <>
                    <div className="space-y-2.5">
                      <span className={label}>{canton ? ui.statusSCanton(canton) : ""}</span>
                      {canton && cantonal.length === 0 && <p className={`text-[11.5px] ${muted}`}>{ui.statusSNoCanton}</p>}
                      {!canton && <p className={`text-[11.5px] ${muted}`}>{ui.statusSPickCanton}</p>}
                      {cantonal.map(renderFact)}
                    </div>
                    {statusSFacts.filter(f => !f.canton).map(renderFact)}
                  </>
                );
              })()}
              {false && statusSFacts.map(f => {
                const lang = currentLanguage === "de" ? "de" : currentLanguage === "uk" ? "uk" : "en";
                return (
                  <div key={f.topic} className="space-y-0.5">
                    <p className={`text-[12.5px] font-semibold leading-snug ${isDark ? "text-white" : "text-amber-950"}`}>{f.headline[lang]}</p>
                    {f.text[lang] && <p className={`text-[12px] leading-relaxed ${cardText}`}>{f.text[lang]}</p>}
                    {f.url && (
                      <a href={f.url} target="_blank" rel="noopener noreferrer" className={link}>
                        {ui.official} <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                );
              })}
            </div>
          </details>
        )}
        {(code === "bridge" || code === "integration") && canton && <BridgeBox canton={canton} language={currentLanguage} isDark={isDark} />}
        {routes.length > 0 && <AdmissionBox canton={canton || undefined} routes={routes} language={currentLanguage} isDark={isDark} />}

        {(ways.in.length > 0 || ways.out.length > 0) && (
          <div className="grid gap-3 sm:grid-cols-1">
            {ways.out.length > 0 && (
              <div>
                <span className={label}>{ui.waysOut}</span>
                <ul className="mt-1 space-y-1.5">{ways.out.map(e => wayButton(e, e.to))}</ul>
              </div>
            )}
            {ways.in.length > 0 && (
              <div>
                <span className={label}>{ui.waysIn}</span>
                <ul className="mt-1 space-y-1.5">{ways.in.map(e => wayButton(e, e.from))}</ul>
              </div>
            )}
          </div>
        )}

        {(professionTypesForNode(code).length > 0 || institutionSubgroupsForNode(code).length > 0) && (
          <div>
            <span className={label}>{ui.stageTies}</span>
            <div className="mt-1.5 flex flex-wrap gap-2">
              {professionTypesForNode(code).length > 0 && (professionCounts[code] ?? 0) > 0 && (
                <button type="button" className={btn} onClick={() => onOpenProfessions(code)}>
                  <Briefcase className="h-3.5 w-3.5" /> {ui.professionsOnStage(professionCounts[code])}
                </button>
              )}
              {institutionSubgroupsForNode(code).length > 0 && (schoolCounts[code] ?? 0) > 0 && (
                <button type="button" className={btn} onClick={() => onOpenSchools(code)}>
                  <School className="h-3.5 w-3.5" /> {ui.schoolsOnStage(schoolCounts[code])}
                </button>
              )}
            </div>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2 border-t border-violet-400/15 pt-3">
          {level && isLoggedIn && (
            isGoal ? (
              <span className={`${chip} gap-1`}><Sparkles className="h-3 w-3" /> {ui.isGoal}</span>
            ) : (
              <button type="button" className={btnPrimary} onClick={() => void setGoalForStage(code)}>
                <Flag className="h-3.5 w-3.5" /> {ui.makeGoal}
              </button>
            )
          )}
          {goalNote && (
            <button type="button" className={btn} onClick={onGoalSet}>
              {goalNote} {ui.openMyPath} <ArrowRight className="h-3.5 w-3.5" />
            </button>
          )}
          {n?.url && (
            <a href={n.url} target="_blank" rel="noopener noreferrer" className={link}>
              {ui.official} <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>
        {level && !isLoggedIn && (
          <div className={`rounded-xl border p-3 ${isDark ? "border-violet-400/20 bg-[#120c24]/90" : "border-violet-200 bg-violet-50/95"}`}>
            <p className={`text-[12px] leading-relaxed ${cardText}`}>{ui.needProfile}</p>
            <button type="button" className={`${btnPrimary} mt-2`} onClick={onStartPlanning}>{ui.planRoute} <ArrowRight className="h-3.5 w-3.5" /></button>
          </div>
        )}
      </div>
    );
  };

  const renderEdgePanel = (e: MapEdge) => (
    <div className="space-y-4">
      <div>
        <span className={chip}>{ui.edgeTitle} · {kindLabel(e.kind, currentLanguage)}</span>
        <h2 className={`mt-2 text-lg font-bold leading-tight ${isDark ? "text-white" : "text-violet-950"}`}>
          {labelOf(e.from)} <ArrowRight className="mx-1 inline h-4 w-4 text-violet-400" /> {labelOf(e.to)}
        </h2>
      </div>
      <div className="flex flex-wrap gap-2">
        <button type="button" className={btn} onClick={() => openNode(e.from)}>{labelOf(e.from)}</button>
        <button type="button" className={btn} onClick={() => openNode(e.to)}>{labelOf(e.to)}</button>
      </div>
      <ul className="space-y-3">
        {e.transitions.map(t => (
          <li key={t.id} className={`space-y-2 rounded-xl border p-3 ${isDark ? "border-violet-400/20 bg-[#120c24]/90" : "border-violet-200 bg-violet-50/95"}`}>
            <div className="flex items-start justify-between gap-2">
              <b className={`text-[13px] leading-snug ${isDark ? "text-white" : "text-violet-950"}`}>{inLang(currentLanguage, t.label, t.uk?.label)}</b>
              <span className="shrink-0 text-[10px] font-mono text-violet-400">{kindLabel(t.kind, currentLanguage)}</span>
            </div>
            {(t.exception || t.cantons) && (
              <p className={`rounded-lg border px-2.5 py-1.5 text-[11.5px] leading-snug ${isDark ? "border-amber-400/30 bg-amber-400/10 text-amber-200" : "border-amber-300 bg-amber-50 text-amber-900"}`}>
                {[t.exception ? ui.exceptionNote : "", t.cantons ? ui.onlyIn(t.cantons.join(", ")) : ""].filter(Boolean).join(" ")}
              </p>
            )}
            <Fact name={ui.conditions} value={inLang(currentLanguage, t.conditions, t.uk?.conditions)} />
            <Fact name={ui.duration} value={inLang(currentLanguage, t.duration, t.uk?.duration)} />
            <Fact name={ui.age} value={inLang(currentLanguage, t.typicalAge, t.uk?.typicalAge)} />
            <Fact name={ui.notes} value={inLang(currentLanguage, t.notes, t.uk?.notes)} />
            {t.url && (
              <a href={t.url} target="_blank" rel="noopener noreferrer" className={link}>
                {ui.official} <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </li>
        ))}
      </ul>
      <p className={`text-[11px] ${muted}`}>{ui.germanNote}</p>
    </div>
  );

  // --- Layout --------------------------------------------------------------------------------
  const startNewcomer = () => {
    setFrom("arrival");
    setFromProfile(false);
    openNode("arrival");
  };

  const card = `rounded-2xl border backdrop-blur-sm ${isDark ? "border-white/10 bg-[#0c0916]/90" : "border-violet-200 bg-white/95"}`;
  const select = `w-full rounded-lg border px-2.5 py-2 text-[12.5px] ${isDark ? "border-white/15 bg-zinc-900 text-white" : "border-violet-300 bg-white text-violet-950"}`;

  const nodeOption = (n: EducationNode) => <option key={n.code} value={n.code}>{n.label[currentLanguage]}</option>;
  const selectable = ordered.filter(n => NODE_LAYOUT[n.code]);

  const stepSummary = (stepEdge: MapEdge) => {
    const t = stepEdge.transitions[0];
    // "Von X zu Y: what happens" -> "what happens"; the stage names are already shown.
    const label = inLang(currentLanguage, t?.label ?? "", t?.uk?.label);
    return label.split(": ").slice(1).join(": ") || inLang(currentLanguage, t?.duration, t?.uk?.duration) || label;
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className={`text-xl font-bold tracking-tight ${isDark ? "text-white" : "text-black font-black"}`}>{ui.title}</h1>
        <p className={`mt-0.5 text-xs font-semibold ${isDark ? "text-violet-300" : "text-violet-800"}`}>{ui.sub}</p>
        <p className={`mt-2 max-w-3xl text-[13px] leading-relaxed ${isDark ? "text-zinc-300" : "text-violet-950"}`}>{ui.intro}</p>
      </div>

      {state === "loading" && <p className={`text-sm ${muted}`}>{ui.loading}</p>}
      {state === "failed" && <p className={`text-sm ${muted}`}>{ui.failed}</p>}

      {state === "ready" && (
        <>
          <section aria-label={ui.yourWay} className={`${card} p-3 sm:p-4 space-y-3`}>
            <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
              <label className="block">
                <span className={label}>{ui.from}{fromProfile && from ? ` · ${ui.fromProfile}` : ""}</span>
                <select className={`${select} mt-1`} value={from} onChange={ev => { setFrom(ev.target.value); setFromProfile(false); }}>
                  <option value="">{ui.pick}</option>
                  {selectable.map(nodeOption)}
                </select>
              </label>
              <label className="block">
                <span className={label}>{ui.to}{fromProfile && to ? ` · ${ui.fromProfile}` : ""}</span>
                <select className={`${select} mt-1`} value={to} onChange={ev => { setTo(ev.target.value); setFromProfile(false); }}>
                  <option value="">{ui.pick}</option>
                  {selectable.map(nodeOption)}
                </select>
              </label>
              <button type="button" onClick={startNewcomer} className={btn}>
                <Sparkles className="h-3.5 w-3.5" /> {ui.newcomer}
              </button>
            </div>
            <label className="flex max-w-xs flex-col">
              <span className={label}>{ui.myCanton}</span>
              <select className={`${select} mt-1`} value={canton} onChange={ev => setCanton(ev.target.value)}>
                <option value="">{ui.anyCanton}</option>
                {CANTONS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </label>

            {from && to && from !== to && (
              <div role="status" aria-live="polite">
                {path && path.length > 0 ? (
                  <div className="space-y-2">
                    {routeOptions.length > 1 && (
                      <div role="tablist" aria-label={ui.yourWay} className="flex flex-wrap gap-1.5">
                        {routeOptions.map((option, i) => {
                          const y = estimateYears(option);
                          const active = i === routeIndex;
                          return (
                            <button
                              key={i}
                              type="button"
                              role="tab"
                              aria-selected={active}
                              onClick={() => setRouteIndex(i)}
                              className={`cursor-pointer rounded-lg border px-2.5 py-1 text-left text-[11px] font-bold transition-colors ${active ? (isDark ? "border-violet-300 bg-violet-500/30 text-white" : "border-violet-700 bg-violet-700 text-white") : isDark ? "border-white/15 text-zinc-300 hover:bg-white/[0.06]" : "border-violet-300 text-violet-900 hover:bg-violet-50"}`}
                            >
                              {ui.option(i + 1)}
                              <span className="ml-1.5 font-mono font-normal opacity-80">{ui.yearsAbout(Math.round(y.min), Math.round(y.max))}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                    <span className={label}>
                      {ui.yourWay} · {ui.stepsCount(path.length)}
                      {routeOptions.length === 1 ? " · " + ui.yearsAbout(Math.round(estimateYears(path).min), Math.round(estimateYears(path).max)) : ""}
                    </span>
                    <ol className="flex flex-col gap-2 md:flex-row md:flex-wrap md:items-stretch">
                      <li className={`rounded-lg border px-2.5 py-1.5 text-[12px] font-bold ${isDark ? "border-violet-300/40 bg-violet-400/10 text-white" : "border-violet-400 bg-violet-50 text-violet-950"}`}>{labelOf(from)}</li>
                      {path.map(step => (
                        <li key={edgeKey(step.edge)} className="flex items-center gap-2">
                          <ArrowRight className="h-4 w-4 shrink-0 text-violet-400" />
                          <button type="button" onClick={() => setSelection({ type: "edge", key: edgeKey(step.edge) })} className={`cursor-pointer rounded-lg border px-2.5 py-1.5 text-left transition-colors ${isDark ? "border-white/15 bg-[#0c0916]/90 hover:bg-[#17112b]" : "border-violet-200 bg-white hover:bg-violet-50"}`}>
                            <b className={`block text-[12px] ${isDark ? "text-white" : "text-violet-950"}`}>{labelOf(step.to)}</b>
                            <span className="block text-[10px] font-mono text-violet-400">{kindLabel(step.edge.kind, currentLanguage)}{stepSummary(step.edge) ? ` · ${stepSummary(step.edge).slice(0, 60)}` : ""}</span>
                          </button>
                        </li>
                      ))}
                    </ol>
                  </div>
                ) : (
                  <p className={`text-[12.5px] ${cardText}`}>{ui.noRoute}</p>
                )}
                {path && path.length > 0 && <p className={`mt-1.5 text-[10.5px] ${muted}`}>{ui.yearsNote}</p>}
              </div>
            )}
          </section>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div role="group" aria-label={`${ui.viewMap} / ${ui.viewList}`} className={`inline-flex rounded-lg border p-0.5 ${isDark ? "border-white/15" : "border-violet-300"}`}>
              {(["map", "list"] as const).map(v => (
                <button key={v} type="button" aria-pressed={view === v} onClick={() => setView(v)} className={`cursor-pointer rounded-md px-3 py-1 text-[11px] font-bold transition-colors ${view === v ? (isDark ? "bg-violet-500 text-white" : "bg-violet-700 text-white") : isDark ? "text-zinc-300 hover:text-white" : "text-violet-900 hover:bg-violet-50"}`}>
                  {v === "map" ? ui.viewMap : ui.viewList}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5" aria-label={ui.legend}>
              {Object.keys(EDGE_STYLE).map(kind => {
                const s = edgeStyle(kind);
                return (
                  <span key={kind} className={`inline-flex items-center gap-1.5 text-[10.5px] ${muted}`}>
                    <svg width="26" height="8" aria-hidden="true">
                      <line x1="1" y1="4" x2="25" y2="4" stroke={isDark ? s.dark : s.light} strokeWidth="2.2" strokeDasharray={s.dash} strokeLinecap="round" />
                    </svg>
                    {kindLabel(kind, currentLanguage)}
                  </span>
                );
              })}
              {view === "map" && hiddenWays > 0 && (
                <button type="button" aria-pressed={showAllWays} onClick={() => setShowAllWays(v => !v)} className={btn}>
                  {showAllWays ? ui.mainWays : ui.allWays(hiddenWays)}
                </button>
              )}
            </div>
          </div>

          {view === "map" ? (
            <div ref={frameRef} className={`${card} overflow-x-auto`}>
              <div style={{ width: size.width * scale, height: size.height * scale }}>
                <div style={{ width: size.width, height: size.height, transform: `scale(${scale})`, transformOrigin: "top left" }} className="relative">
                  <svg width={size.width} height={size.height} className="absolute inset-0" role="img" aria-label={ui.title}>
                    <defs>
                      {Object.keys(EDGE_STYLE).map(kind => (
                        <marker key={kind} id={`pm-arrow-${kind}`} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
                          <path d="M0 1 L9 5 L0 9 z" fill={isDark ? edgeStyle(kind).dark : edgeStyle(kind).light} />
                        </marker>
                      ))}
                    </defs>
                    {BAND_COLUMNS.map((b, i) => {
                      const x = colX(b.cols[0]);
                      const w = b.cols.length * g.colGap;
                      return (
                        <g key={b.band}>
                          <rect x={x} y={0} width={w} height={size.height} fill={i % 2 === 0 ? palette.bandA : palette.bandB} />
                          <line x1={x} y1={0} x2={x} y2={size.height} stroke={palette.bandLine} />
                          <text x={x + 10} y={16} fontSize="10.5" fontWeight="700" letterSpacing="0.06em" fill={palette.ink} opacity="0.7" style={{ textTransform: "uppercase" }}>
                            {/* long names (Ukrainian, French) would run into the next column: drop the bracket, then shorten */}
                            <title>{ui.bands[b.band]}</title>
                            {(() => {
                              const full = ui.bands[b.band] ?? "";
                              const short = full.length * 7 > w - 16 ? full.replace(/\s*\([^)]*\)/g, "").trim() : full;
                              const max = Math.floor((w - 16) / 7);
                              return short.length > max ? short.slice(0, Math.max(1, max - 1)).trimEnd() + "…" : short;
                            })()}
                          </text>
                          {BAND_AGES[b.band] && (
                            <text x={x + 10} y={29} fontSize="10" fill={palette.ink} opacity="0.55">
                              {ui.ageRange(BAND_AGES[b.band]![0], BAND_AGES[b.band]![1])}
                            </text>
                          )}
                        </g>
                      );
                    })}
                    {edges.filter(edgeVisible).map(e => {
                      const s = edgeStyle(e.kind);
                      const emphasis = edgeEmphasis(e);
                      const d = edgePath(e);
                      if (!d) return null;
                      return (
                        <g key={edgeKey(e)}>
                          <path
                            d={d}
                            fill="none"
                            stroke={isDark ? s.dark : s.light}
                            strokeWidth={emphasis === "strong" ? 3 : 1.8}
                            strokeDasharray={e.loops ? (s.dash ? s.dash : "6 4") : s.dash}
                            strokeLinecap="round"
                            opacity={emphasis === "strong" ? 1 : emphasis === "dim" ? 0.1 : e.loops ? 0.4 : 0.6}
                            markerEnd={`url(#pm-arrow-${EDGE_STYLE[e.kind] ? e.kind : "direct"})`}
                          />
                          <path d={d} fill="none" stroke="transparent" strokeWidth={14} style={{ cursor: "pointer" }} aria-hidden="true" onClick={() => { setGoalNote(null); setSelection({ type: "edge", key: edgeKey(e) }); }}>
                            <title>{`${labelOf(e.from)} → ${labelOf(e.to)}`}</title>
                          </path>
                        </g>
                      );
                    })}
                  </svg>
                  {Object.keys(NODE_LAYOUT).map(code => {
                    const box = nodeBox(code)!;
                    const n = nodes.get(code);
                    return (
                      <button
                        key={code}
                        type="button"
                        aria-pressed={selectedNodeCode === code}
                        title={labelOf(code) + (notOfferedHere(code) ? " (" + ui.notHere + ")" : "")}
                        onClick={() => openNode(code)}
                        className={nodeClasses(code, n?.kind ?? "school")}
                        style={{ left: box.x, top: box.y, width: box.w, height: box.h }}
                      >
                        <span className="line-clamp-2">{shortLabel(labelOf(code))}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
              {scale < 1 && frameWidth < size.width && <p className={`px-3 pb-2 text-[10.5px] ${muted}`}>{ui.scrollHint}</p>}
            </div>
          ) : (
            <div className="space-y-5">
              {BAND_COLUMNS.map(b => {
                const items = selectable.filter(n => String(n.band) === b.band);
                if (items.length === 0) return null;
                return (
                  <section key={b.band} className="space-y-2">
                    <h2 className={`text-[11px] font-mono font-bold uppercase tracking-wider ${isDark ? "text-violet-300" : "text-violet-800"}`}>{ui.bands[b.band]}{BAND_AGES[b.band] ? " · " + ui.ageRange(BAND_AGES[b.band]![0], BAND_AGES[b.band]![1]) : ""}</h2>
                    <ul className="grid gap-2 sm:grid-cols-2">
                      {items.map(n => (
                        <li key={n.code}>
                          <button type="button" onClick={() => openNode(n.code)} className={`h-full w-full cursor-pointer rounded-xl border p-3 text-left transition-colors ${nodeDimmed(n.code) ? "opacity-40" : ""} ${isDark ? "border-white/10 bg-[#0c0916]/90 hover:bg-[#17112b]" : "border-violet-200 bg-white hover:bg-violet-50"}`}>
                            <span className="flex items-start justify-between gap-2">
                              <b className={`text-[13px] leading-snug ${isDark ? "text-white" : "text-violet-950"}`}>{n.label[currentLanguage]}</b>
                              <span className="shrink-0 text-[10px] font-mono text-violet-400">{ui.kinds[n.kind] ?? n.kind}</span>
                            </span>
                            <span className={`mt-1 line-clamp-3 block text-[12px] leading-relaxed ${muted}`}>{n.summary[currentLanguage]}</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </section>
                );
              })}
            </div>
          )}

          <p className={`max-w-3xl text-[11px] leading-relaxed ${muted}`}>{ui.ageNote}</p>
          <p className={`max-w-3xl text-[11px] leading-relaxed ${muted}`}>{ui.disclaimer}</p>
        </>
      )}

      {selection && (
        <div
          ref={panelRef}
          tabIndex={-1}
          role="dialog"
          aria-modal="false"
          aria-label={selectedNodeCode ? labelOf(selectedNodeCode) : ui.edgeTitle}
          className={`fixed inset-x-0 bottom-0 z-40 max-h-[82vh] overflow-y-auto rounded-t-2xl border-t p-4 shadow-2xl outline-none sm:inset-y-0 sm:left-auto sm:right-0 sm:top-16 sm:max-h-none sm:w-[440px] sm:rounded-none sm:border-l sm:border-t-0 ${isDark ? "border-violet-400/25 bg-zinc-950/95 backdrop-blur-xl" : "border-violet-300 bg-white/97 backdrop-blur-xl"}`}
        >
          <button type="button" onClick={() => setSelection(null)} aria-label={ui.close} className={`absolute right-3 top-3 cursor-pointer rounded-lg p-1.5 ${isDark ? "text-zinc-300 hover:bg-white/10" : "text-violet-900 hover:bg-violet-100"}`}>
            <X className="h-4 w-4" />
          </button>
          <div className="pr-8">{selectedNodeCode ? renderNodePanel(selectedNodeCode) : selectedEdge ? renderEdgePanel(selectedEdge) : null}</div>
        </div>
      )}
    </div>
  );
}
