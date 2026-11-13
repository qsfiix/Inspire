import type { LanguageCode } from "../../types";

/**
 * Copy for the Alpenglühen home page, navigation and footer (2026-11 redesign).
 * German uses "du", French/Italian "tu", Ukrainian the polite "ви" (as on the other uk pages).
 * The timeline describes the typical German-speaking Swiss sequence and says so.
 */

export type NodeId =
  | "oberstufe" | "lehre" | "bm" | "fh" | "masterA"
  | "bp" | "hf"
  | "gym" | "matura" | "uni" | "masterB";

export interface HomeCopy {
  nav: {
    professions: string; schools: string; planner: string; myPath: string; about: string;
    login: string; findPath: string; menuOpen: string; menuClose: string; language: string;
    toNight: string; toDay: string; logout: string;
    dashboard: string; map: string; resources: string; tracker: string; profile: string;
  };
  hero: {
    sub: string; searchLabel: string; searchPlaceholder: string; searchButton: string;
    examplesLabel: string; examples: [string, string][]; assure: [string, string, string];
    noResults: string; allProfessions: string; topicLabel: string;
  };
  topics: [string, string][];
  who: { title: string; items: { title: string; desc: string; href: string }[]; uk: string };
  ways: {
    titleA: string; titleB: string; lead: string; showMe: string; both: string; viaLehre: string; viaGym: string;
    nodes: Record<NodeId, { t: string; i: string; short?: string }>;
    sub: { years: string; bmWhen: string; bachelor: string; fachausweis: string; diploma: string };
    passerelle: string; praxisjahr: string; hbbVertical: string;
    legend: [string, string, string, string];
    facts: [string, string][]; sources: string; toPlanner: string;
  };
  when: {
    title: string; lead: string; classes: [string, string, string, string]; groupLabel: string;
    items: { t: string; p: string; tags: ("l" | "g")[] }[];
    here: string; tagL: string; tagG: string; note: string; cantonLink: string;
  };
  prof: {
    titleA: string; titleB: string; lead: string;
    interests: { tech: string; natur: string; hand: string; buero: string };
    tag: (years: number) => string; wage: string; median: string; source: string; toProfession: string; next: string; nextList: string;
  };
  path: {
    titleA: string; titleB: string; lead: string; how: [string, string, string]; cta: string; hint: string;
    steps: { t: string; y: string }[];
  };
  trust: {
    items: { t: string; p: string }[]; dataDate: string; disclaimer: string; bizLink: string;
    faqTitle: string; faq: { q: string; a: string }[];
  };
  final: { word: string; lead: string; aud: [string, string, string, string] };
  footer: { tagline: string; explore: string; language: string; about: string; method: string; impressum: string; privacy: string; contact: string; dataDate: string; when: string };
}

/** Profession descriptions for the interest card (titles come from the database, per language). */
export const PROFESSION_DESC: Record<string, Record<LanguageCode, string>> = {
  "informatiker-in-efz": {
    de: "Software entwickeln, Systeme betreuen und Netzwerke aufbauen. Danach stehen viele Wege offen.",
    en: "Develop software, look after systems and build networks. Many paths open up afterwards.",
    fr: "Développer des logiciels, gérer des systèmes et construire des réseaux. Beaucoup de voies s'ouvrent ensuite.",
    it: "Sviluppare software, gestire sistemi e costruire reti. Dopo si aprono molte strade.",
    uk: "Розробка програм, супровід систем і побудова мереж. Після навчання відкривається багато шляхів."
  },
  "polymechaniker-in-efz": {
    de: "Präzisionsteile fertigen, Maschinen bauen und programmieren, in Produktion und Maschinenbau.",
    en: "Make precision parts, build and program machines, in production and mechanical engineering.",
    fr: "Fabriquer des pièces de précision, construire et programmer des machines.",
    it: "Produrre pezzi di precisione, costruire e programmare macchine.",
    uk: "Виготовлення точних деталей, збирання й програмування верстатів у виробництві."
  },
  "elektroinstallateur-in-efz": {
    de: "Elektrische Anlagen in Gebäuden installieren, prüfen und sicher in Betrieb nehmen.",
    en: "Install, test and safely commission electrical systems in buildings.",
    fr: "Installer, contrôler et mettre en service des installations électriques dans les bâtiments.",
    it: "Installare, controllare e mettere in funzione impianti elettrici negli edifici.",
    uk: "Монтаж, перевірка та безпечний запуск електричних систем у будівлях."
  },
  "mediamatiker-in-efz": {
    de: "Kommunikation, Gestaltung, Content und digitale Tools: an der Schnittstelle von Technik und Medien.",
    en: "Communication, design, content and digital tools, where technology meets media.",
    fr: "Communication, graphisme, contenus et outils numériques, entre technique et médias.",
    it: "Comunicazione, grafica, contenuti e strumenti digitali, tra tecnica e media.",
    uk: "Комунікація, дизайн, контент і цифрові інструменти на стику техніки та медіа."
  },
  "laborant-in-efz": {
    de: "Im Labor Proben vorbereiten, Versuche durchführen und Messwerte auswerten.",
    en: "Prepare samples, run experiments and analyse results in the lab.",
    fr: "Préparer des échantillons, mener des essais et analyser les mesures en laboratoire.",
    it: "Preparare campioni, svolgere esperimenti e analizzare i risultati in laboratorio.",
    uk: "Підготовка зразків, проведення дослідів та аналіз вимірювань у лабораторії."
  },
  "gaertner-in-efz": {
    de: "Pflanzen ziehen, Gärten gestalten und pflegen, meistens draussen.",
    en: "Grow plants, design and care for gardens, mostly outdoors.",
    fr: "Cultiver des plantes, aménager et entretenir des jardins, surtout dehors.",
    it: "Coltivare piante, progettare e curare giardini, quasi sempre all'aperto.",
    uk: "Вирощування рослин, облаштування й догляд за садами, здебільшого надворі."
  },
  "schreiner-in-efz": {
    de: "Möbel, Innenausbau und Fenster planen und aus Holz und anderen Materialien bauen.",
    en: "Plan and build furniture, interiors and windows from wood and other materials.",
    fr: "Concevoir et fabriquer des meubles, des agencements et des fenêtres en bois.",
    it: "Progettare e costruire mobili, arredi interni e finestre in legno e altri materiali.",
    uk: "Проєктування та виготовлення меблів, інтер'єрів і вікон з дерева та інших матеріалів."
  },
  "zeichner-in-efz": {
    de: "Technische Pläne zeichnen und digitale Projektunterlagen für Bau und Planung erstellen.",
    en: "Draw technical plans and create digital project documents for construction and planning.",
    fr: "Dessiner des plans techniques et préparer des dossiers numériques pour la construction.",
    it: "Disegnare piani tecnici e preparare documenti digitali per costruzione e pianificazione.",
    uk: "Технічні креслення та цифрова проєктна документація для будівництва."
  },
  "koch-koechin-efz": {
    de: "Gerichte planen, zubereiten und anrichten, im Team einer Restaurant- oder Spitalküche.",
    en: "Plan, cook and plate dishes as part of a restaurant or hospital kitchen team.",
    fr: "Planifier, préparer et dresser des plats dans une cuisine de restaurant ou d'hôpital.",
    it: "Pianificare, cucinare e impiattare in una cucina di ristorante o di ospedale.",
    uk: "Планування, приготування й подача страв у команді ресторанної або лікарняної кухні."
  },
  "kaufmann-frau-efz": {
    de: "Administration, Organisation und Kundenkontakt in Firmen, Verwaltung und Banken.",
    en: "Administration, organisation and customer contact in companies, public offices and banks.",
    fr: "Administration, organisation et contact clientèle en entreprise, administration ou banque.",
    it: "Amministrazione, organizzazione e contatto con i clienti in aziende, enti e banche.",
    uk: "Адміністрування, організація та робота з клієнтами в компаніях, установах і банках."
  },
  "detailhandelsfachmann-frau-efz": {
    de: "Kundinnen und Kunden beraten, Ware präsentieren und Abläufe im Laden organisieren.",
    en: "Advise customers, present products and organise how a shop runs.",
    fr: "Conseiller la clientèle, présenter les produits et organiser le magasin.",
    it: "Consigliare la clientela, presentare la merce e organizzare il negozio.",
    uk: "Консультування покупців, викладка товару та організація роботи магазину."
  },
  "logistiker-in-efz": {
    de: "Waren annehmen, lagern und verteilen, damit alles zur richtigen Zeit am richtigen Ort ist.",
    en: "Receive, store and distribute goods so everything is in the right place at the right time.",
    fr: "Réceptionner, stocker et distribuer des marchandises au bon endroit, au bon moment.",
    it: "Ricevere, immagazzinare e distribuire merci al posto giusto e al momento giusto.",
    uk: "Приймання, зберігання й розподіл товарів, щоб усе було вчасно на своєму місці."
  }
};

const de: HomeCopy = {
  nav: {
    professions: "Berufe", schools: "Schulen", planner: "Wegplaner", myPath: "Mein Weg", about: "Über uns",
    login: "Anmelden", findPath: "Weg finden", menuOpen: "Menü öffnen", menuClose: "Menü schliessen", language: "Sprache",
    toNight: "Nachtmodus", toDay: "Tagmodus", logout: "Abmelden",
    dashboard: "Übersicht", map: "Karte", resources: "Berufe & Schulen", tracker: "Ziele", profile: "Profil"
  },
  hero: {
    sub: "Kostenlose, unabhängige Orientierung für Lehre, Gymnasium, Umschulung und den Neustart in der Schweiz. Mit offiziellen Daten, in fünf Sprachen.",
    searchLabel: "Suche", searchPlaceholder: "Beruf, Schule, Frage", searchButton: "Suchen",
    examplesLabel: "Zum Beispiel:",
    examples: [["Informatiker/in EFZ", "/beruf/informatiker-in-efz/"], ["Passerelle", "/passerelle/"], ["Zulassung nach Kanton", "/zulassung/"], ["Lehrlingslöhne", "/lehrlingsloehne/"]],
    assure: ["Kostenlos und ohne Werbung", "Ohne Anmeldung nutzbar", "Daten von SDBB, BFS, swissuniversities · Stand November 2026"],
    noResults: "Nichts gefunden. Alle Berufe ansehen", allProfessions: "Alle Berufe ansehen", topicLabel: "Thema"
  },
  topics: [["Passerelle", "/passerelle/"], ["Zulassung nach Kanton", "/zulassung/"], ["Lehrlingslöhne", "/lehrlingsloehne/"], ["Brückenangebote", "/brueckenangebote/"], ["Berufsabschluss für Erwachsene", "/berufsabschluss-fuer-erwachsene/"], ["Schutzstatus S", "/status-s/"], ["Bildungssystem Schweiz", "/bildungssystem/"], ["Schulen nach Kanton", "/schulen/"], ["EFZ oder EBA", "/efz-oder-eba/"], ["HF oder FH", "/hf-oder-fh/"]],
  who: {
    title: "Wer bist du?",
    items: [
      { title: "Ich bin in der Oberstufe", desc: "Berufe entdecken, Schnupperlehre planen, Lehrstelle finden", href: "#start-guest" },
      { title: "Ich bin Elternteil", desc: "Wege, Fristen und Kosten verstehen und mein Kind begleiten", href: "/bildungssystem/" },
      { title: "Ich will umsteigen", desc: "Berufsabschluss für Erwachsene, Weiterbildung, Quereinstieg", href: "/berufsabschluss-fuer-erwachsene/" },
      { title: "Ich bin neu in der Schweiz", desc: "Anerkennung, Zulassung und erste Schritte im System", href: "/zulassung/" }
    ],
    uk: "Українською"
  },
  ways: {
    titleA: "Zwei Wege.", titleB: "Sie kreuzen sich.",
    lead: "Lehre oder Gymnasium ist keine Entscheidung für immer. In der Schweiz führen Brücken von einem Weg zum anderen. Das heisst Durchlässigkeit: Dein erster Schritt schliesst keine Tür.",
    showMe: "Zeig mir:", both: "Beide Wege", viaLehre: "Über die Lehre", viaGym: "Übers Gymnasium",
    nodes: {
      oberstufe: { t: "Oberstufe", i: "Nach der 9. Klasse: Lehre, Gymnasium, FMS oder ein Brückenangebot." },
      lehre: { t: "Lehre EFZ", i: "3–4 Jahre im Betrieb und in der Berufsfachschule. Danach: BM, höhere Berufsbildung oder direkt arbeiten." },
      bm: { t: "Berufsmaturität", i: "Während der Lehre oder ein Jahr danach. Öffnet die Fachhochschule." },
      fh: { t: "Fachhochschule", i: "Bachelor in rund 3 Jahren, praxisnah." },
      masterA: { t: "Master / Beruf", i: "Master an FH oder Uni, oder direkt in den Beruf." },
      bp: { t: "Berufsprüfung", i: "Eidg. Fachausweis, berufsbegleitend nach einigen Jahren Praxis." },
      hf: { t: "Höhere Fachschule · HFP", i: "Diplom HF (2–3 Jahre) oder eidg. Diplom. Auch ohne Berufsmaturität." },
      gym: { t: "Gymnasium", i: "3–4 Jahre (Kurzgymnasium) oder ab der 6. Klasse (Langgymnasium, je nach Kanton)." },
      matura: { t: "Matura", i: "Öffnet alle Universitäten und die ETH. Für die Fachhochschule: ein Jahr Praxis." },
      uni: { t: "Universität / ETH", i: "Bachelor in rund 3 Jahren.", short: "Uni / ETH" },
      masterB: { t: "Master", i: "Meist 1,5 bis 2 Jahre." }
    },
    sub: { years: "3–4 Jahre", bmWhen: "während oder nach der Lehre", bachelor: "Bachelor", fachausweis: "eidg. Fachausweis", diploma: "Diplom HF, eidg. Diplom" },
    passerelle: "Passerelle", praxisjahr: "Praxisjahr", hbbVertical: "Höhere Berufsbildung · HF · BP",
    legend: ["Berufliche Grundbildung", "Höhere Berufsbildung nach der Lehre", "Allgemeinbildung", "Brücken zwischen den Wegen"],
    facts: [["2 von 3", "Jugendlichen in der Schweiz starten nach der Oberstufe mit einer beruflichen Grundbildung."], ["1 Jahr", "Passerelle: Mit Berufsmaturität an die Universität oder ETH."], ["Ohne Matura", "Höhere Fachschule und eidgenössische Prüfungen führen direkt nach der Lehre weiter."]],
    sources: "Quellen: SBFI, swissuniversities. Vereinfachte Darstellung.", toPlanner: "Alle Wege im Wegplaner ansehen"
  },
  when: {
    title: "Was passiert wann?",
    lead: "Die wichtigsten Etappen von der 6. Klasse bis zum Start in die Lehre oder ins Gymnasium. Wähle, wo du gerade bist.",
    classes: ["6. Klasse", "7. Klasse", "8. Klasse", "9. Klasse"], groupLabel: "Ich bin in der",
    items: [
      { t: "6. Klasse", p: "In einigen Kantonen gibt es schon jetzt eine Prüfung fürs Langgymnasium.", tags: ["g"] },
      { t: "7. Klasse", p: "Die Berufswahl beginnt: Interessen klären, Berufe kennenlernen, erster Besuch im BIZ.", tags: ["l"] },
      { t: "8. Klasse", p: "Schnupperlehren in zwei, drei Berufen. Ab Sommer werden die Lehrstellen fürs nächste Jahr ausgeschrieben.", tags: ["l"] },
      { t: "9. Klasse", p: "Bewerben, Eignungstests, Lehrvertrag unterschreiben. Prüfung fürs Kurzgymnasium meist im Frühling.", tags: ["l", "g"] },
      { t: "August", p: "Start in die Lehre, ins Gymnasium, an die FMS oder in ein Brückenangebot.", tags: ["l", "g"] }
    ],
    here: "Du bist hier", tagL: "Lehre", tagG: "Gymnasium",
    note: "Typischer Ablauf in der Deutschschweiz. Termine und Prüfungen unterscheiden sich je nach Kanton.",
    cantonLink: "Zulassung und Prüfungen nach Kanton"
  },
  prof: {
    titleA: "Ein Beruf.", titleB: "Echte Zahlen.",
    lead: "Was machst du den ganzen Tag, was verdienst du in der Lehre, und wie geht es weiter? Wähle, was dich interessiert.",
    interests: { tech: "Technik & Digital", natur: "Natur & Labor", hand: "Gestalten & Handwerk", buero: "Büro & Handel" },
    tag: y => `Lehre EFZ · ${y} Jahre`, wage: "CHF pro Monat während der Lehre", median: "CHF Medianlohn der Berufsgruppe, alle Erfahrungsstufen",
    source: "BFS LSE 2024 · Lehrlingslohn: Empfehlungen der Branche", toProfession: "Zum Beruf", next: "Ähnliche Berufe", nextList: "Weitere Berufe in diesem Bereich"
  },
  path: {
    titleA: "Dein Weg", titleB: "als Treppe.", lead: "Jede Stufe ist ein Schritt, den du wirklich machen kannst.",
    how: ["Erzähl uns, wo du stehst und was dich interessiert.", "Wähle ein Ziel, zum Beispiel eine Lehre oder die Berufsmaturität.", "Hake Schritt für Schritt ab und sieh, wie weit du bist."],
    cta: "Ohne Anmeldung starten", hint: "Beispielweg. Dein eigener Weg entsteht aus deinen Antworten.",
    steps: [{ t: "Schnuppern", y: "8. Klasse" }, { t: "Bewerbung", y: "Sommer nach der 8." }, { t: "Lehrvertrag", y: "9. Klasse" }, { t: "Lehre EFZ", y: "3–4 Jahre" }, { t: "Berufsmaturität", y: "dein Ziel" }]
  },
  trust: {
    items: [
      { t: "Offizielle Quellen", p: "Daten von SDBB/berufsberatung.ch, BFS, swissuniversities und den Kantonen. Jede Zahl mit Quelle." },
      { t: "Unabhängig", p: "Ein unabhängiges Projekt aus der Schweiz. Keine Werbung, kein Geld von Schulen oder Firmen." },
      { t: "In fünf Sprachen", p: "Deutsch, Français, Italiano, English und Українська. Kostenlos für alle." },
      { t: "Deine Daten", p: "Im Gastmodus bleibt alles auf deinem Gerät. Ein Konto ist freiwillig." }
    ],
    dataDate: "Stand der Daten:", disclaimer: "Inspirella ist kein Amt. Verbindliche Auskunft gibt das", bizLink: "BIZ deines Kantons",
    faqTitle: "Häufige Fragen",
    faq: [
      { q: "Kann ich nach der Lehre noch studieren?", a: "Ja. Mit der Berufsmaturität kommst du an die Fachhochschule, mit der Passerelle (ein Jahr) auch an Universität und ETH. Ohne Berufsmaturität führen höhere Fachschule und eidgenössische Prüfungen weiter." },
      { q: "Was kostet das Gymnasium?", a: "An öffentlichen Gymnasien zahlst du kein Schulgeld. Bücher, Material und Lager kosten je nach Kanton und Schule extra." },
      { q: "Was verdiene ich in der Lehre?", a: "Den Lohn legt der Lehrbetrieb fest, die Branchen geben Empfehlungen. Im ersten Lehrjahr sind es meist etwa CHF 550 bis 1'000 pro Monat, danach steigt er jedes Jahr." },
      { q: "Wird mein ausländischer Abschluss anerkannt?", a: "Das hängt vom Beruf ab. Für reglementierte Berufe brauchst du eine Anerkennung, zum Beispiel beim SBFI oder bei swissuniversities. Inspirella zeigt dir die zuständige Stelle." },
      { q: "Wer steckt hinter Inspirella?", a: "Ein unabhängiges Projekt aus der Schweiz, ohne Werbung und ohne Geld von Schulen oder Firmen. Mehr dazu unter «Über uns»." }
    ]
  },
  final: { word: "Sackgassen.", lead: "Nur nächste Schritte. Wo möchtest du anfangen?", aud: ["Oberstufe", "Eltern", "Umsteigen", "Neu in der Schweiz"] },
  footer: { tagline: "Unabhängige Orientierung für Bildung und Beruf in der Schweiz. Kostenlos, ohne Werbung.", explore: "Entdecken", language: "Sprache", about: "Über uns", method: "Methodik", impressum: "Impressum", privacy: "Datenschutz", contact: "Kontakt", dataDate: "Stand der Daten: November 2026", when: "Was passiert wann" }
};

const en: HomeCopy = {
  nav: {
    professions: "Careers", schools: "Schools", planner: "Path planner", myPath: "My path", about: "About",
    login: "Sign in", findPath: "Find your path", menuOpen: "Open menu", menuClose: "Close menu", language: "Language",
    toNight: "Night mode", toDay: "Day mode", logout: "Log out",
    dashboard: "Overview", map: "Map", resources: "Careers & schools", tracker: "Goals", profile: "Profile"
  },
  hero: {
    sub: "Free, independent guidance for apprenticeships, Gymnasium, retraining and a fresh start in Switzerland. Official data, in five languages.",
    searchLabel: "Search", searchPlaceholder: "Career, school, question", searchButton: "Search",
    examplesLabel: "For example:",
    examples: [["IT specialist EFZ", "/beruf/informatiker-in-efz/"], ["Passerelle", "/passerelle/"], ["Admission by canton", "/zulassung/"], ["Apprentice pay", "/lehrlingsloehne/"]],
    assure: ["Free and ad-free", "No account needed", "Data from SDBB, FSO, swissuniversities · as of November 2026"],
    noResults: "Nothing found. See all careers", allProfessions: "See all careers", topicLabel: "Topic"
  },
  topics: [["Passerelle", "/passerelle/"], ["Admission by canton", "/zulassung/"], ["Apprentice pay", "/lehrlingsloehne/"], ["Bridge programmes", "/brueckenangebote/"], ["Vocational qualification for adults", "/berufsabschluss-fuer-erwachsene/"], ["Protection status S", "/status-s/"], ["Swiss education system", "/en/swiss-education-system/"], ["Schools by canton", "/schulen/"], ["EFZ or EBA", "/efz-oder-eba/"], ["HF or FH", "/hf-oder-fh/"]],
  who: {
    title: "Who are you?",
    items: [
      { title: "I'm in lower secondary", desc: "Discover careers, plan a trial apprenticeship, find a place", href: "#start-guest" },
      { title: "I'm a parent", desc: "Understand paths, deadlines and costs, and support my child", href: "/en/swiss-education-system/" },
      { title: "I want to change careers", desc: "Vocational qualification for adults, further training, career change", href: "/berufsabschluss-fuer-erwachsene/" },
      { title: "I'm new to Switzerland", desc: "Recognition, admission and first steps in the system", href: "/zulassung/" }
    ],
    uk: "Українською"
  },
  ways: {
    titleA: "Two paths.", titleB: "They cross.",
    lead: "Apprenticeship or Gymnasium is not a decision for life. In Switzerland, bridges lead from one path to the other. That is called permeability: your first step closes no door.",
    showMe: "Show me:", both: "Both paths", viaLehre: "Via apprenticeship", viaGym: "Via Gymnasium",
    nodes: {
      oberstufe: { t: "Lower secondary", i: "After year 9: apprenticeship, Gymnasium, FMS or a bridge programme." },
      lehre: { t: "Apprenticeship EFZ", i: "3–4 years at a company and a vocational school. Then: BM, higher vocational education or straight into work." },
      bm: { t: "Vocational Baccalaureate", i: "During the apprenticeship or one year after. Opens universities of applied sciences." },
      fh: { t: "University of Applied Sciences", i: "Bachelor in about 3 years, close to practice.", short: "Applied Sciences" },
      masterA: { t: "Master / Career", i: "Master at a UAS or university, or straight into work." },
      bp: { t: "Professional exam", i: "Federal diploma of higher education, alongside work after some years of practice." },
      hf: { t: "Higher vocational college · HFP", i: "HF diploma (2–3 years) or advanced federal diploma. No Baccalaureate needed." },
      gym: { t: "Gymnasium", i: "3–4 years, or from year 6 in some cantons." },
      matura: { t: "Matura", i: "Opens every university and ETH. For a UAS: one year of work experience." },
      uni: { t: "University / ETH", i: "Bachelor in about 3 years.", short: "Uni / ETH" },
      masterB: { t: "Master", i: "Usually 1.5 to 2 years." }
    },
    sub: { years: "3–4 years", bmWhen: "during or after the apprenticeship", bachelor: "Bachelor", fachausweis: "federal diploma", diploma: "HF diploma, advanced diploma" },
    passerelle: "Passerelle", praxisjahr: "Work year", hbbVertical: "Higher vocational education · HF · BP",
    legend: ["Vocational education", "Higher vocational education after the apprenticeship", "General education", "Bridges between the paths"],
    facts: [["2 in 3", "young people in Switzerland start with vocational education after lower secondary."], ["1 year", "Passerelle: from the Vocational Baccalaureate to university or ETH."], ["No Matura needed", "Higher vocational colleges and federal exams continue straight after the apprenticeship."]],
    sources: "Sources: SERI, swissuniversities. Simplified.", toPlanner: "See every path in the planner"
  },
  when: {
    title: "What happens when?",
    lead: "The key steps from year 6 to starting an apprenticeship or Gymnasium. Choose where you are now.",
    classes: ["Year 6", "Year 7", "Year 8", "Year 9"], groupLabel: "I'm in",
    items: [
      { t: "Year 6", p: "Some cantons already hold an exam for the long-form Gymnasium.", tags: ["g"] },
      { t: "Year 7", p: "Career choice begins: find your interests, get to know careers, first visit to a careers centre (BIZ).", tags: ["l"] },
      { t: "Year 8", p: "Trial apprenticeships in two or three careers. From summer, places for the next year are advertised.", tags: ["l"] },
      { t: "Year 9", p: "Apply, take aptitude tests, sign the apprenticeship contract. The short Gymnasium exam is usually in spring.", tags: ["l", "g"] },
      { t: "August", p: "Start your apprenticeship, Gymnasium, FMS or a bridge programme.", tags: ["l", "g"] }
    ],
    here: "You are here", tagL: "Apprenticeship", tagG: "Gymnasium",
    note: "Typical sequence in German-speaking Switzerland. Dates and exams differ by canton.",
    cantonLink: "Admission and exams by canton"
  },
  prof: {
    titleA: "One career.", titleB: "Real numbers.",
    lead: "What do you do all day, what do you earn as an apprentice, and what comes next? Pick what interests you.",
    interests: { tech: "Tech & digital", natur: "Nature & lab", hand: "Design & craft", buero: "Office & retail" },
    tag: y => `Apprenticeship EFZ · ${y} years`, wage: "CHF per month during the apprenticeship", median: "CHF median wage of the occupational group, all experience levels",
    source: "FSO LSE 2024 · apprentice pay: industry recommendations", toProfession: "View career", next: "Similar careers", nextList: "More careers in this area"
  },
  path: {
    titleA: "Your path", titleB: "as a staircase.", lead: "Every step is one you can actually take.",
    how: ["Tell us where you are and what interests you.", "Choose a goal, for example an apprenticeship or the Vocational Baccalaureate.", "Tick off step by step and see how far you've come."],
    cta: "Start without an account", hint: "Example path. Yours is built from your answers.",
    steps: [{ t: "Trial apprenticeship", y: "Year 8" }, { t: "Application", y: "Summer after year 8" }, { t: "Contract", y: "Year 9" }, { t: "Apprenticeship EFZ", y: "3–4 years" }, { t: "Vocational Bacc.", y: "your goal" }]
  },
  trust: {
    items: [
      { t: "Official sources", p: "Data from SDBB/berufsberatung.ch, FSO, swissuniversities and the cantons. Every number has a source." },
      { t: "Independent", p: "An independent project from Switzerland. No ads, no money from schools or companies." },
      { t: "In five languages", p: "Deutsch, Français, Italiano, English and Українська. Free for everyone." },
      { t: "Your data", p: "In guest mode everything stays on your device. An account is optional." }
    ],
    dataDate: "Data as of:", disclaimer: "Inspirella is not a public office. For binding information, contact the", bizLink: "careers centre (BIZ) in your canton",
    faqTitle: "Common questions",
    faq: [
      { q: "Can I still go to university after an apprenticeship?", a: "Yes. The Vocational Baccalaureate opens universities of applied sciences, and the one-year Passerelle opens universities and ETH. Without it, higher vocational colleges and federal exams take you further." },
      { q: "What does Gymnasium cost?", a: "Public Gymnasiums charge no tuition. Books, materials and school camps cost extra, depending on the canton and school." },
      { q: "What do apprentices earn?", a: "The company sets the pay, guided by industry recommendations. In the first year it is usually about CHF 550 to 1,000 a month, rising every year." },
      { q: "Will my foreign qualification be recognised?", a: "It depends on the profession. Regulated professions need recognition, for example from SERI or swissuniversities. Inspirella shows you the right office." },
      { q: "Who is behind Inspirella?", a: "An independent project from Switzerland, with no ads and no money from schools or companies. More under “About”." }
    ]
  },
  final: { word: "dead ends.", lead: "Only next steps. Where would you like to start?", aud: ["Lower secondary", "Parents", "Career change", "New to Switzerland"] },
  footer: { tagline: "Independent guidance for education and careers in Switzerland. Free, without ads.", explore: "Explore", language: "Language", about: "About", method: "Method", impressum: "Legal notice", privacy: "Privacy", contact: "Contact", dataDate: "Data as of November 2026", when: "What happens when" }
};

const fr: HomeCopy = {
  nav: {
    professions: "Métiers", schools: "Écoles", planner: "Planificateur", myPath: "Mon parcours", about: "À propos",
    login: "Se connecter", findPath: "Trouver ma voie", menuOpen: "Ouvrir le menu", menuClose: "Fermer le menu", language: "Langue",
    toNight: "Mode nuit", toDay: "Mode jour", logout: "Se déconnecter",
    dashboard: "Aperçu", map: "Carte", resources: "Métiers & écoles", tracker: "Objectifs", profile: "Profil"
  },
  hero: {
    sub: "Une orientation gratuite et indépendante pour l'apprentissage, le gymnase, la reconversion et un nouveau départ en Suisse. Avec des données officielles, en cinq langues.",
    searchLabel: "Recherche", searchPlaceholder: "Métier, école, question", searchButton: "Chercher",
    examplesLabel: "Par exemple :",
    examples: [["Informaticien·ne CFC", "/beruf/informatiker-in-efz/"], ["Passerelle", "/passerelle/"], ["Admission par canton", "/zulassung/"], ["Salaires d'apprentissage", "/lehrlingsloehne/"]],
    assure: ["Gratuit et sans publicité", "Sans inscription", "Données SDBB, OFS, swissuniversities · novembre 2026"],
    noResults: "Aucun résultat. Voir tous les métiers", allProfessions: "Voir tous les métiers", topicLabel: "Thème"
  },
  topics: [["Passerelle", "/passerelle/"], ["Admission par canton", "/zulassung/"], ["Salaires d'apprentissage", "/lehrlingsloehne/"], ["Solutions transitoires", "/brueckenangebote/"], ["Diplôme professionnel pour adultes", "/berufsabschluss-fuer-erwachsene/"], ["Statut de protection S", "/status-s/"], ["Système éducatif suisse", "/en/swiss-education-system/"], ["Écoles par canton", "/schulen/"], ["CFC ou AFP", "/efz-oder-eba/"], ["ES ou HES", "/hf-oder-fh/"]],
  who: {
    title: "Qui es-tu ?",
    items: [
      { title: "Je suis au secondaire I", desc: "Découvrir des métiers, planifier un stage, trouver une place d'apprentissage", href: "#start-guest" },
      { title: "Je suis parent", desc: "Comprendre les voies, les délais et les coûts, et accompagner mon enfant", href: "/en/swiss-education-system/" },
      { title: "Je veux me reconvertir", desc: "Diplôme professionnel pour adultes, formation continue, réorientation", href: "/berufsabschluss-fuer-erwachsene/" },
      { title: "Je suis nouveau en Suisse", desc: "Reconnaissance, admission et premiers pas dans le système", href: "/zulassung/" }
    ],
    uk: "Українською"
  },
  ways: {
    titleA: "Deux voies.", titleB: "Elles se croisent.",
    lead: "Apprentissage ou gymnase, ce n'est pas un choix pour la vie. En Suisse, des passerelles mènent d'une voie à l'autre. C'est la perméabilité : ton premier pas ne ferme aucune porte.",
    showMe: "Montre-moi :", both: "Les deux voies", viaLehre: "Par l'apprentissage", viaGym: "Par le gymnase",
    nodes: {
      oberstufe: { t: "Secondaire I", i: "Après la 11H : apprentissage, gymnase, école de culture générale ou solution transitoire." },
      lehre: { t: "Apprentissage CFC", i: "3 à 4 ans en entreprise et en école professionnelle. Ensuite : maturité professionnelle, formation supérieure ou travail." },
      bm: { t: "Maturité prof.", i: "Pendant l'apprentissage ou une année après. Ouvre les hautes écoles spécialisées." },
      fh: { t: "Haute école spécialisée", i: "Bachelor en 3 ans environ, proche de la pratique.", short: "HES" },
      masterA: { t: "Master / Métier", i: "Master en HES ou à l'université, ou directement le métier." },
      bp: { t: "Examen professionnel", i: "Brevet fédéral, en cours d'emploi après quelques années de pratique." },
      hf: { t: "École supérieure · EPS", i: "Diplôme ES (2 à 3 ans) ou diplôme fédéral. Sans maturité." },
      gym: { t: "Gymnase", i: "3 à 4 ans selon le canton." },
      matura: { t: "Maturité gymnasiale", i: "Ouvre toutes les universités et les EPF. Pour une HES : une année de pratique.", short: "Maturité" },
      uni: { t: "Université / EPF", i: "Bachelor en 3 ans environ.", short: "Uni / EPF" },
      masterB: { t: "Master", i: "En général 1,5 à 2 ans." }
    },
    sub: { years: "3–4 ans", bmWhen: "pendant ou après l'apprentissage", bachelor: "Bachelor", fachausweis: "brevet fédéral", diploma: "diplôme ES, diplôme fédéral" },
    passerelle: "Passerelle", praxisjahr: "Année de pratique", hbbVertical: "Formation professionnelle supérieure",
    legend: ["Formation professionnelle initiale", "Formation professionnelle supérieure après l'apprentissage", "Formation générale", "Passerelles entre les voies"],
    facts: [["2 sur 3", "jeunes en Suisse commencent par une formation professionnelle après le secondaire I."], ["1 an", "Passerelle : de la maturité professionnelle à l'université ou à l'EPF."], ["Sans maturité", "Les écoles supérieures et les examens fédéraux prolongent directement l'apprentissage."]],
    sources: "Sources : SEFRI, swissuniversities. Présentation simplifiée.", toPlanner: "Voir toutes les voies dans le planificateur"
  },
  when: {
    title: "Que se passe-t-il quand ?",
    lead: "Les étapes clés de la 6e à l'entrée en apprentissage ou au gymnase (comptage alémanique, sans école enfantine). Choisis où tu en es.",
    classes: ["6e", "7e", "8e", "9e"], groupLabel: "Je suis en",
    items: [
      { t: "6e", p: "Dans certains cantons, il y a déjà un examen pour le gymnase long.", tags: ["g"] },
      { t: "7e", p: "Le choix professionnel commence : clarifier ses intérêts, découvrir des métiers, première visite à l'orientation.", tags: ["l"] },
      { t: "8e", p: "Stages dans deux ou trois métiers. Dès l'été, les places d'apprentissage pour l'année suivante sont publiées.", tags: ["l"] },
      { t: "9e", p: "Postuler, passer des tests d'aptitude, signer le contrat. L'examen du gymnase court a lieu souvent au printemps.", tags: ["l", "g"] },
      { t: "Août", p: "Début de l'apprentissage, du gymnase, de l'école de culture générale ou d'une solution transitoire.", tags: ["l", "g"] }
    ],
    here: "Tu es ici", tagL: "Apprentissage", tagG: "Gymnase",
    note: "Déroulement typique en Suisse alémanique. Les dates et les examens varient selon le canton.",
    cantonLink: "Admission et examens par canton"
  },
  prof: {
    titleA: "Un métier.", titleB: "De vrais chiffres.",
    lead: "Que fais-tu toute la journée, combien gagnes-tu en apprentissage, et ensuite ? Choisis ce qui t'intéresse.",
    interests: { tech: "Technique & numérique", natur: "Nature & labo", hand: "Création & artisanat", buero: "Bureau & commerce" },
    tag: y => `Apprentissage CFC · ${y} ans`, wage: "CHF par mois pendant l'apprentissage", median: "CHF salaire médian du groupe professionnel, tous niveaux d'expérience",
    source: "OFS ESS 2024 · salaire d'apprentissage : recommandations de la branche", toProfession: "Voir le métier", next: "Métiers proches", nextList: "Autres métiers du domaine"
  },
  path: {
    titleA: "Ton parcours", titleB: "en escalier.", lead: "Chaque marche est un pas que tu peux vraiment faire.",
    how: ["Dis-nous où tu en es et ce qui t'intéresse.", "Choisis un objectif, par exemple un apprentissage ou la maturité professionnelle.", "Coche étape par étape et vois ton avancée."],
    cta: "Commencer sans compte", hint: "Exemple. Ton parcours se construit à partir de tes réponses.",
    steps: [{ t: "Stage", y: "8e" }, { t: "Candidature", y: "été après la 8e" }, { t: "Contrat", y: "9e" }, { t: "Apprentissage CFC", y: "3–4 ans" }, { t: "Maturité prof.", y: "ton objectif" }]
  },
  trust: {
    items: [
      { t: "Sources officielles", p: "Données d'orientation.ch, de l'OFS, de swissuniversities et des cantons. Chaque chiffre a sa source." },
      { t: "Indépendant", p: "Un projet indépendant de Suisse. Pas de publicité, pas d'argent d'écoles ou d'entreprises." },
      { t: "En cinq langues", p: "Deutsch, Français, Italiano, English et Українська. Gratuit pour tous." },
      { t: "Tes données", p: "En mode invité, tout reste sur ton appareil. Un compte est facultatif." }
    ],
    dataDate: "État des données :", disclaimer: "Inspirella n'est pas un office public. Pour des informations contraignantes, adresse-toi à", bizLink: "l'orientation de ton canton",
    faqTitle: "Questions fréquentes",
    faq: [
      { q: "Puis-je encore étudier après un apprentissage ?", a: "Oui. Avec la maturité professionnelle, tu accèdes aux hautes écoles spécialisées, et avec la passerelle (un an) aussi aux universités et aux EPF. Sans maturité, les écoles supérieures et les examens fédéraux te mènent plus loin." },
      { q: "Combien coûte le gymnase ?", a: "Les gymnases publics ne facturent pas d'écolage. Les livres, le matériel et les camps coûtent en plus, selon le canton et l'école." },
      { q: "Combien gagne-t-on en apprentissage ?", a: "L'entreprise fixe le salaire, selon les recommandations de la branche. En première année, c'est souvent entre CHF 550 et 1000 par mois, puis il augmente chaque année." },
      { q: "Mon diplôme étranger sera-t-il reconnu ?", a: "Cela dépend du métier. Les professions réglementées demandent une reconnaissance, par exemple auprès du SEFRI ou de swissuniversities. Inspirella t'indique le bon service." },
      { q: "Qui est derrière Inspirella ?", a: "Un projet indépendant de Suisse, sans publicité et sans argent d'écoles ou d'entreprises. Plus d'infos sous « À propos »." }
    ]
  },
  final: { word: "impasse.", lead: "Que des prochaines étapes. Par où veux-tu commencer ?", aud: ["Secondaire I", "Parents", "Reconversion", "Nouveau en Suisse"] },
  footer: { tagline: "Orientation indépendante pour la formation et le métier en Suisse. Gratuite, sans publicité.", explore: "Explorer", language: "Langue", about: "À propos", method: "Méthode", impressum: "Mentions légales", privacy: "Confidentialité", contact: "Contact", dataDate: "Données : novembre 2026", when: "Que se passe-t-il quand" }
};

const it: HomeCopy = {
  nav: {
    professions: "Professioni", schools: "Scuole", planner: "Percorsi", myPath: "Il mio percorso", about: "Chi siamo",
    login: "Accedi", findPath: "Trova la tua strada", menuOpen: "Apri il menu", menuClose: "Chiudi il menu", language: "Lingua",
    toNight: "Modalità notte", toDay: "Modalità giorno", logout: "Esci",
    dashboard: "Panoramica", map: "Mappa", resources: "Professioni & scuole", tracker: "Obiettivi", profile: "Profilo"
  },
  hero: {
    sub: "Orientamento gratuito e indipendente per tirocinio, liceo, riqualificazione e un nuovo inizio in Svizzera. Con dati ufficiali, in cinque lingue.",
    searchLabel: "Cerca", searchPlaceholder: "Professione, scuola, domanda", searchButton: "Cerca",
    examplesLabel: "Per esempio:",
    examples: [["Informatico/a AFC", "/beruf/informatiker-in-efz/"], ["Passerelle", "/passerelle/"], ["Ammissione per cantone", "/zulassung/"], ["Salari di tirocinio", "/lehrlingsloehne/"]],
    assure: ["Gratuito e senza pubblicità", "Senza registrazione", "Dati SDBB, UST, swissuniversities · novembre 2026"],
    noResults: "Nessun risultato. Vedi tutte le professioni", allProfessions: "Vedi tutte le professioni", topicLabel: "Tema"
  },
  topics: [["Passerelle", "/passerelle/"], ["Ammissione per cantone", "/zulassung/"], ["Salari di tirocinio", "/lehrlingsloehne/"], ["Offerte transitorie", "/brueckenangebote/"], ["Diploma professionale per adulti", "/berufsabschluss-fuer-erwachsene/"], ["Statuto di protezione S", "/status-s/"], ["Sistema formativo svizzero", "/en/swiss-education-system/"], ["Scuole per cantone", "/schulen/"], ["AFC o CFP", "/efz-oder-eba/"], ["SSS o SUP", "/hf-oder-fh/"]],
  who: {
    title: "Chi sei?",
    items: [
      { title: "Frequento la scuola media", desc: "Scoprire professioni, pianificare uno stage, trovare un posto di tirocinio", href: "#start-guest" },
      { title: "Sono un genitore", desc: "Capire percorsi, scadenze e costi e accompagnare mio figlio", href: "/en/swiss-education-system/" },
      { title: "Voglio cambiare strada", desc: "Diploma professionale per adulti, formazione continua, riqualificazione", href: "/berufsabschluss-fuer-erwachsene/" },
      { title: "Sono nuovo in Svizzera", desc: "Riconoscimento, ammissione e primi passi nel sistema", href: "/zulassung/" }
    ],
    uk: "Українською"
  },
  ways: {
    titleA: "Due strade.", titleB: "Si incrociano.",
    lead: "Tirocinio o liceo non è una scelta per sempre. In Svizzera ci sono ponti da una strada all'altra. Si chiama permeabilità: il tuo primo passo non chiude nessuna porta.",
    showMe: "Mostrami:", both: "Entrambe", viaLehre: "Con il tirocinio", viaGym: "Con il liceo",
    nodes: {
      oberstufe: { t: "Scuola media", i: "Dopo la scuola dell'obbligo: tirocinio, liceo, scuola specializzata o offerta transitoria." },
      lehre: { t: "Tirocinio AFC", i: "3–4 anni in azienda e a scuola professionale. Poi: maturità professionale, formazione superiore o lavoro." },
      bm: { t: "Maturità prof.", i: "Durante il tirocinio o un anno dopo. Apre le scuole universitarie professionali." },
      fh: { t: "Scuola univ. professionale", i: "Bachelor in circa 3 anni, vicino alla pratica.", short: "SUP" },
      masterA: { t: "Master / Lavoro", i: "Master in una SUP o all'università, oppure direttamente il lavoro." },
      bp: { t: "Esame di professione", i: "Attestato professionale federale, in parallelo al lavoro dopo qualche anno di pratica." },
      hf: { t: "Scuola spec. superiore · EPS", i: "Diploma SSS (2–3 anni) o diploma federale. Anche senza maturità." },
      gym: { t: "Liceo", i: "3–4 anni a seconda del cantone." },
      matura: { t: "Maturità liceale", i: "Apre tutte le università e i PF. Per una SUP: un anno di pratica.", short: "Maturità" },
      uni: { t: "Università / PF", i: "Bachelor in circa 3 anni.", short: "Uni / PF" },
      masterB: { t: "Master", i: "Di solito da 1,5 a 2 anni." }
    },
    sub: { years: "3–4 anni", bmWhen: "durante o dopo il tirocinio", bachelor: "Bachelor", fachausweis: "attestato federale", diploma: "diploma SSS, diploma federale" },
    passerelle: "Passerelle", praxisjahr: "Anno di pratica", hbbVertical: "Formazione professionale superiore",
    legend: ["Formazione professionale di base", "Formazione professionale superiore dopo il tirocinio", "Formazione generale", "Ponti tra le strade"],
    facts: [["2 su 3", "giovani in Svizzera iniziano con una formazione professionale dopo la scuola media."], ["1 anno", "Passerelle: dalla maturità professionale all'università o al PF."], ["Senza maturità", "Scuole specializzate superiori ed esami federali proseguono subito dopo il tirocinio."]],
    sources: "Fonti: SEFRI, swissuniversities. Rappresentazione semplificata.", toPlanner: "Vedi tutti i percorsi"
  },
  when: {
    title: "Cosa succede quando?",
    lead: "Le tappe principali dalla 6a all'inizio del tirocinio o del liceo (conteggio della Svizzera tedesca, senza scuola dell'infanzia). Scegli dove sei.",
    classes: ["6a", "7a", "8a", "9a"], groupLabel: "Sono in",
    items: [
      { t: "6a", p: "In alcuni cantoni c'è già un esame per il liceo lungo.", tags: ["g"] },
      { t: "7a", p: "Inizia la scelta professionale: chiarire gli interessi, conoscere le professioni, prima visita all'orientamento.", tags: ["l"] },
      { t: "8a", p: "Stage in due o tre professioni. Dall'estate vengono pubblicati i posti di tirocinio per l'anno dopo.", tags: ["l"] },
      { t: "9a", p: "Candidarsi, fare test attitudinali, firmare il contratto. L'esame per il liceo breve è di solito in primavera.", tags: ["l", "g"] },
      { t: "Agosto", p: "Inizio del tirocinio, del liceo, della scuola specializzata o di un'offerta transitoria.", tags: ["l", "g"] }
    ],
    here: "Sei qui", tagL: "Tirocinio", tagG: "Liceo",
    note: "Percorso tipico della Svizzera tedesca. Date ed esami cambiano da cantone a cantone.",
    cantonLink: "Ammissione ed esami per cantone"
  },
  prof: {
    titleA: "Una professione.", titleB: "Numeri veri.",
    lead: "Cosa fai tutto il giorno, quanto guadagni durante il tirocinio e cosa viene dopo? Scegli cosa ti interessa.",
    interests: { tech: "Tecnica & digitale", natur: "Natura & laboratorio", hand: "Creatività & artigianato", buero: "Ufficio & commercio" },
    tag: y => `Tirocinio AFC · ${y} anni`, wage: "CHF al mese durante il tirocinio", median: "CHF salario mediano del gruppo professionale, tutti i livelli di esperienza",
    source: "UST RSS 2024 · salario di tirocinio: raccomandazioni del settore", toProfession: "Vai alla professione", next: "Professioni simili", nextList: "Altre professioni del settore"
  },
  path: {
    titleA: "Il tuo percorso", titleB: "a gradini.", lead: "Ogni gradino è un passo che puoi davvero fare.",
    how: ["Dicci a che punto sei e cosa ti interessa.", "Scegli un obiettivo, per esempio un tirocinio o la maturità professionale.", "Spunta passo dopo passo e guarda quanta strada hai fatto."],
    cta: "Inizia senza account", hint: "Percorso di esempio. Il tuo nasce dalle tue risposte.",
    steps: [{ t: "Stage", y: "8a" }, { t: "Candidatura", y: "estate dopo l'8a" }, { t: "Contratto", y: "9a" }, { t: "Tirocinio AFC", y: "3–4 anni" }, { t: "Maturità prof.", y: "il tuo obiettivo" }]
  },
  trust: {
    items: [
      { t: "Fonti ufficiali", p: "Dati di orientamento.ch, UST, swissuniversities e dei cantoni. Ogni numero con la sua fonte." },
      { t: "Indipendente", p: "Un progetto indipendente dalla Svizzera. Niente pubblicità, niente soldi da scuole o aziende." },
      { t: "In cinque lingue", p: "Deutsch, Français, Italiano, English e Українська. Gratuito per tutti." },
      { t: "I tuoi dati", p: "In modalità ospite tutto resta sul tuo dispositivo. Un account è facoltativo." }
    ],
    dataDate: "Dati aggiornati a:", disclaimer: "Inspirella non è un ufficio pubblico. Per informazioni vincolanti rivolgiti", bizLink: "all'orientamento del tuo cantone",
    faqTitle: "Domande frequenti",
    faq: [
      { q: "Posso ancora studiare dopo il tirocinio?", a: "Sì. Con la maturità professionale accedi alle scuole universitarie professionali, con la passerelle (un anno) anche alle università e ai PF. Senza maturità proseguono le scuole specializzate superiori e gli esami federali." },
      { q: "Quanto costa il liceo?", a: "I licei pubblici non chiedono tasse scolastiche. Libri, materiale e campi costano a parte, secondo il cantone e la scuola." },
      { q: "Quanto si guadagna in tirocinio?", a: "Il salario lo stabilisce l'azienda, seguendo le raccomandazioni del settore. Nel primo anno di solito tra CHF 550 e 1000 al mese, poi cresce ogni anno." },
      { q: "Il mio diploma estero sarà riconosciuto?", a: "Dipende dalla professione. Le professioni regolamentate richiedono un riconoscimento, per esempio presso la SEFRI o swissuniversities. Inspirella ti indica l'ufficio giusto." },
      { q: "Chi c'è dietro Inspirella?", a: "Un progetto indipendente dalla Svizzera, senza pubblicità e senza soldi da scuole o aziende. Di più sotto «Chi siamo»." }
    ]
  },
  final: { word: "vicoli ciechi.", lead: "Solo prossimi passi. Da dove vuoi cominciare?", aud: ["Scuola media", "Genitori", "Cambiare strada", "Nuovo in Svizzera"] },
  footer: { tagline: "Orientamento indipendente per formazione e professione in Svizzera. Gratuito, senza pubblicità.", explore: "Scopri", language: "Lingua", about: "Chi siamo", method: "Metodo", impressum: "Note legali", privacy: "Privacy", contact: "Contatto", dataDate: "Dati: novembre 2026", when: "Cosa succede quando" }
};

const uk: HomeCopy = {
  nav: {
    professions: "Професії", schools: "Школи", planner: "Планувальник", myPath: "Мій шлях", about: "Про нас",
    login: "Увійти", findPath: "Знайти шлях", menuOpen: "Відкрити меню", menuClose: "Закрити меню", language: "Мова",
    toNight: "Нічний режим", toDay: "Денний режим", logout: "Вийти",
    dashboard: "Огляд", map: "Мапа", resources: "Професії та школи", tracker: "Цілі", profile: "Профіль"
  },
  hero: {
    sub: "Безкоштовна й незалежна орієнтація: професійне навчання, гімназія, перекваліфікація та новий старт у Швейцарії. З офіційними даними, п'ятьма мовами.",
    searchLabel: "Пошук", searchPlaceholder: "Професія, школа, питання", searchButton: "Шукати",
    examplesLabel: "Наприклад:",
    examples: [["Інформатик EFZ", "/beruf/informatiker-in-efz/"], ["Пасерель", "/passerelle/"], ["Вступ за кантонами", "/uk/pryjom/"], ["Зарплати учнів", "/lehrlingsloehne/"]],
    assure: ["Безкоштовно і без реклами", "Без реєстрації", "Дані SDBB, BFS, swissuniversities · листопад 2026"],
    noResults: "Нічого не знайдено. Усі професії", allProfessions: "Усі професії", topicLabel: "Тема"
  },
  topics: [["Пасерель", "/passerelle/"], ["Вступ за кантонами", "/uk/pryjom/"], ["Зарплати учнів", "/lehrlingsloehne/"], ["Перехідні програми", "/uk/perekhidni-prohramy/"], ["Диплом для дорослих", "/uk/diplom-dlia-doroslykh/"], ["Статус S", "/uk/status-s/"], ["Система освіти Швейцарії", "/uk/systema-osvity-shveitsarii/"], ["Школи за кантонами", "/schulen/"], ["EFZ чи EBA", "/efz-oder-eba/"], ["HF чи FH", "/hf-oder-fh/"]],
  who: {
    title: "Хто ви?",
    items: [
      { title: "Я у старших класах", desc: "Дізнатися про професії, спланувати пробну практику, знайти місце навчання", href: "#start-guest" },
      { title: "Я батько чи мати", desc: "Зрозуміти шляхи, терміни й витрати та підтримати дитину", href: "/uk/dity/" },
      { title: "Я хочу змінити професію", desc: "Диплом для дорослих, підвищення кваліфікації, новий старт", href: "/uk/diplom-dlia-doroslykh/" },
      { title: "Я нещодавно у Швейцарії", desc: "Визнання, вступ і перші кроки в системі", href: "/uk/" }
    ],
    uk: "Українською"
  },
  ways: {
    titleA: "Два шляхи.", titleB: "Вони перетинаються.",
    lead: "Професійне навчання чи гімназія — це не вибір на все життя. У Швейцарії є мости від одного шляху до іншого. Це називається проникністю: ваш перший крок не зачиняє жодних дверей.",
    showMe: "Показати:", both: "Обидва шляхи", viaLehre: "Через навчання", viaGym: "Через гімназію",
    nodes: {
      oberstufe: { t: "Старші класи", i: "Після 9-го класу: професійне навчання, гімназія, FMS або перехідна програма." },
      lehre: { t: "Навчання EFZ", i: "3–4 роки на підприємстві та у профшколі. Далі: професійна матура, вища професійна освіта або робота." },
      bm: { t: "Професійна матура", i: "Під час навчання або рік після. Відкриває вищі прикладні школи (FH)." },
      fh: { t: "Вища прикладна школа", i: "Бакалавр приблизно за 3 роки, близько до практики.", short: "FH" },
      masterA: { t: "Магістр / робота", i: "Магістратура у FH чи університеті або одразу робота." },
      bp: { t: "Професійний іспит", i: "Федеральне свідоцтво, паралельно з роботою після кількох років практики." },
      hf: { t: "Вища фахова школа · HFP", i: "Диплом HF (2–3 роки) або федеральний диплом. Без матури." },
      gym: { t: "Гімназія", i: "3–4 роки, залежно від кантону." },
      matura: { t: "Матура", i: "Відкриває всі університети та ETH. Для FH: рік практики." },
      uni: { t: "Університет / ETH", i: "Бакалавр приблизно за 3 роки.", short: "Уні / ETH" },
      masterB: { t: "Магістратура", i: "Зазвичай 1,5–2 роки." }
    },
    sub: { years: "3–4 роки", bmWhen: "під час або після навчання", bachelor: "Бакалавр", fachausweis: "федеральне свідоцтво", diploma: "диплом HF, федеральний диплом" },
    passerelle: "Пасерель", praxisjahr: "Рік практики", hbbVertical: "Вища професійна освіта · HF · BP",
    legend: ["Професійне навчання", "Вища професійна освіта після навчання", "Загальна освіта", "Мости між шляхами"],
    facts: [["2 з 3", "підлітків у Швейцарії після школи починають із професійного навчання."], ["1 рік", "Пасерель: із професійною матурою до університету або ETH."], ["Без матури", "Вищі фахові школи та федеральні іспити ведуть далі одразу після навчання."]],
    sources: "Джерела: SBFI, swissuniversities. Спрощена схема.", toPlanner: "Усі шляхи в планувальнику"
  },
  when: {
    title: "Що і коли відбувається?",
    lead: "Головні етапи від 6-го класу до початку навчання або гімназії. Оберіть, де ви зараз.",
    classes: ["6 клас", "7 клас", "8 клас", "9 клас"], groupLabel: "Я у",
    items: [
      { t: "6 клас", p: "У деяких кантонах уже зараз є іспит до довгої гімназії.", tags: ["g"] },
      { t: "7 клас", p: "Починається вибір професії: інтереси, знайомство з професіями, перший візит до BIZ.", tags: ["l"] },
      { t: "8 клас", p: "Пробна практика у двох-трьох професіях. Із літа оголошують місця навчання на наступний рік.", tags: ["l"] },
      { t: "9 клас", p: "Заявки, тести на придатність, підписання договору. Іспит до короткої гімназії зазвичай навесні.", tags: ["l", "g"] },
      { t: "Серпень", p: "Початок навчання, гімназії, FMS або перехідної програми.", tags: ["l", "g"] }
    ],
    here: "Ви тут", tagL: "Навчання", tagG: "Гімназія",
    note: "Типовий порядок у німецькомовній Швейцарії. Терміни та іспити залежать від кантону.",
    cantonLink: "Вступ та іспити за кантонами"
  },
  prof: {
    titleA: "Одна професія.", titleB: "Реальні цифри.",
    lead: "Що ви робите протягом дня, скільки заробляєте під час навчання і що далі? Оберіть, що вас цікавить.",
    interests: { tech: "Техніка й цифрове", natur: "Природа й лабораторія", hand: "Творчість і ремесло", buero: "Офіс і торгівля" },
    tag: y => `Навчання EFZ · ${y} ${y === 4 ? "роки" : "роки"}`, wage: "CHF на місяць під час навчання", median: "CHF медіанна зарплата групи професій, усі рівні досвіду",
    source: "BFS LSE 2024 · зарплата учня: рекомендації галузі", toProfession: "До професії", next: "Схожі професії", nextList: "Інші професії в цій сфері"
  },
  path: {
    titleA: "Ваш шлях", titleB: "як сходи.", lead: "Кожна сходинка — це крок, який ви справді можете зробити.",
    how: ["Розкажіть, де ви зараз і що вас цікавить.", "Оберіть ціль, наприклад професійне навчання чи професійну матуру.", "Позначайте крок за кроком і бачте, скільки вже пройдено."],
    cta: "Почати без реєстрації", hint: "Приклад. Ваш шлях складається з ваших відповідей.",
    steps: [{ t: "Пробна практика", y: "8 клас" }, { t: "Заявка", y: "літо після 8-го" }, { t: "Договір", y: "9 клас" }, { t: "Навчання EFZ", y: "3–4 роки" }, { t: "Проф. матура", y: "ваша ціль" }]
  },
  trust: {
    items: [
      { t: "Офіційні джерела", p: "Дані SDBB/berufsberatung.ch, BFS, swissuniversities і кантонів. Кожна цифра з джерелом." },
      { t: "Незалежно", p: "Незалежний проєкт зі Швейцарії. Без реклами, без грошей від шкіл чи компаній." },
      { t: "П'ятьма мовами", p: "Deutsch, Français, Italiano, English і Українська. Безкоштовно для всіх." },
      { t: "Ваші дані", p: "У гостьовому режимі все залишається на вашому пристрої. Обліковий запис не обов'язковий." }
    ],
    dataDate: "Дані станом на:", disclaimer: "Inspirella не є державною установою. Офіційну інформацію надає", bizLink: "BIZ вашого кантону",
    faqTitle: "Часті питання",
    faq: [
      { q: "Чи можна вступити до вишу після професійного навчання?", a: "Так. З професійною матурою — до вищих прикладних шкіл (FH), а з пасерель (один рік) — і до університетів та ETH. Без матури далі ведуть вищі фахові школи та федеральні іспити." },
      { q: "Скільки коштує гімназія?", a: "Державні гімназії не беруть плати за навчання. Книжки, матеріали й табори оплачуються окремо, залежно від кантону та школи." },
      { q: "Скільки заробляє учень?", a: "Зарплату встановлює підприємство за рекомендаціями галузі. На першому році це зазвичай приблизно CHF 550–1000 на місяць, далі щороку більше." },
      { q: "Чи визнають мій іноземний диплом?", a: "Залежить від професії. Для регульованих професій потрібне визнання, наприклад у SBFI чи swissuniversities. Inspirella покаже, куди звертатися." },
      { q: "Хто стоїть за Inspirella?", a: "Незалежний проєкт зі Швейцарії, без реклами та без грошей від шкіл чи компаній. Більше — у розділі «Про нас»." }
    ]
  },
  final: { word: "глухих кутів.", lead: "Лише наступні кроки. З чого ви хочете почати?", aud: ["Старші класи", "Батьки", "Нова професія", "Нові у Швейцарії"] },
  footer: { tagline: "Незалежна орієнтація в освіті та професіях у Швейцарії. Безкоштовно, без реклами.", explore: "Дізнатися", language: "Мова", about: "Про нас", method: "Методика", impressum: "Impressum", privacy: "Захист даних", contact: "Контакт", dataDate: "Дані: листопад 2026", when: "Що і коли" }
};

export const HOME_COPY: Record<LanguageCode, HomeCopy> = { de, en, fr, it, uk };
