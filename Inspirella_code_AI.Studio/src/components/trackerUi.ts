import type { ApplicationStatus, LanguageCode, TrackerItemKind } from "../types";

/** Texts of the tracker's date, board and log parts (the older goal form keeps its own TRANSLATIONS). */
export interface TrackerUiText {
  nextTitle: string;
  nextEmpty: string;
  overdue: string;
  today: string;
  tomorrow: string;
  inDays: string; // {n}
  ago: string; // {n}
  calendar: string;
  calendarHint: string;
  noDateHead: string;
  noDateHint: string;
  setDate: string;
  date: string;
  note: string;
  notePlaceholder: string;
  subtasks: string; // {done} {total}
  openStep: string;
  // applications board
  boardTitle: string;
  boardHint: string;
  firmPlaceholder: string;
  addFirm: string;
  boardEmpty: string;
  remove: string;
  statusLabel: Record<ApplicationStatus, string>;
  // Schnupperlehre log
  logTitle: string;
  logHint: string;
  logFirm: string;
  logDate: string;
  logRating: string;
  logWould: string;
  logYes: string;
  logNo: string;
  logSave: string;
  logEmpty: string;
  logNoteHint: string;
  // path / ladder
  toBoard: string;
  toLog: string;
  onBoard: string;
  inLog: string;
  signalGood: string;
  signalBad: string;
  signalRejected: string;
  kindLabel: Record<Exclude<TrackerItemKind, "task" | "application">, string>;
  dossierHead: string;
  weekTitle: string;
  weekAll: string;
  goalsHead: string;
}

const de: TrackerUiText = {
  nextTitle: "Das steht als Nächstes an",
  nextEmpty: "Nichts Dringendes. Setze bei deinen Aufgaben ein Datum, dann erinnern wir dich hier.",
  overdue: "überfällig",
  today: "heute",
  tomorrow: "morgen",
  inDays: "in {n} Tagen",
  ago: "seit {n} Tagen",
  calendar: "In den Kalender (.ics)",
  calendarHint: "Lädt eine Datei, die dein Handy oder Kalender mit Erinnerung am Vortag öffnet.",
  noDateHead: "Termine ohne Datum",
  noDateHint: "Trag das Datum ein, sobald du es kennst. Dann erinnern wir dich.",
  setDate: "Datum setzen",
  date: "Datum",
  note: "Notiz",
  notePlaceholder: "Zum Beispiel: Kontaktperson, Telefon, was mitbringen",
  subtasks: "{done} von {total} Teilaufgaben",
  openStep: "Schritt im Weg ansehen",
  boardTitle: "Meine Bewerbungen",
  boardHint: "Alle Betriebe, bei denen du dich bewirbst, mit dem Stand. Verschiebe sie mit dem Auswahlfeld.",
  firmPlaceholder: "Name des Betriebs",
  addFirm: "Hinzufügen",
  boardEmpty: "Noch keine Bewerbung. Füge einen Betrieb aus deinem Weg hinzu oder tippe einen Namen ein.",
  remove: "Entfernen",
  statusLabel: { planned: "Geplant", sent: "Abgeschickt", interview: "Gespräch", offer: "Zusage", rejected: "Absage", declined: "Selbst abgesagt" },
  logTitle: "Schnupper-Tagebuch",
  logHint: "Halte nach jedem Schnuppern fest, wie es war. Deine Eindrücke ordnen die Betriebs-Vorschläge neu.",
  logFirm: "Betrieb",
  logDate: "Datum",
  logRating: "Wie war es?",
  logWould: "Würdest du dich dort bewerben?",
  logYes: "Ja",
  logNo: "Nein",
  logSave: "Eintrag speichern",
  logEmpty: "Noch kein Schnuppern eingetragen.",
  logNoteHint: "Was hat dir gefallen, was nicht?",
  toBoard: "In meine Bewerbungen",
  toLog: "Schnuppertermin eintragen",
  onBoard: "In deiner Bewerbungsliste",
  inLog: "Im Schnupper-Tagebuch",
  signalGood: "Dein Eindruck: gut",
  signalBad: "Dein Eindruck: eher nicht",
  signalRejected: "Absage erhalten",
  kindLabel: { schnupper: "Schnuppern", interview: "Gespräch", deadline: "Frist", document: "Dokument" },
  dossierHead: "Dossier",
  weekTitle: "Das steht an",
  weekAll: "Alles im Tracker",
  goalsHead: "Deine Ziele"
};

const en: TrackerUiText = {
  nextTitle: "Coming up next",
  nextEmpty: "Nothing urgent. Put a date on your tasks and we will remind you here.",
  overdue: "overdue",
  today: "today",
  tomorrow: "tomorrow",
  inDays: "in {n} days",
  ago: "{n} days ago",
  calendar: "Add to calendar (.ics)",
  calendarHint: "Downloads a file your phone or calendar opens, with a reminder the day before.",
  noDateHead: "Appointments without a date",
  noDateHint: "Enter the date as soon as you know it. Then we remind you.",
  setDate: "Set date",
  date: "Date",
  note: "Note",
  notePlaceholder: "For example: contact person, phone, what to bring",
  subtasks: "{done} of {total} subtasks",
  openStep: "See the step in your path",
  boardTitle: "My applications",
  boardHint: "Every company you apply to, with where it stands. Move them with the selector.",
  firmPlaceholder: "Company name",
  addFirm: "Add",
  boardEmpty: "No application yet. Add a company from your path or type a name.",
  remove: "Remove",
  statusLabel: { planned: "Planned", sent: "Sent", interview: "Interview", offer: "Offer", rejected: "Rejected", declined: "Withdrawn" },
  logTitle: "Trial-day diary",
  logHint: "Note how each trial day went. Your impressions reorder the company suggestions.",
  logFirm: "Company",
  logDate: "Date",
  logRating: "How was it?",
  logWould: "Would you apply there?",
  logYes: "Yes",
  logNo: "No",
  logSave: "Save entry",
  logEmpty: "No trial day entered yet.",
  logNoteHint: "What did you like, what not?",
  toBoard: "Add to my applications",
  toLog: "Enter a trial-day date",
  onBoard: "On your applications list",
  inLog: "In your trial-day diary",
  signalGood: "Your impression: good",
  signalBad: "Your impression: rather not",
  signalRejected: "Rejection received",
  kindLabel: { schnupper: "Trial day", interview: "Interview", deadline: "Deadline", document: "Document" },
  dossierHead: "Dossier",
  weekTitle: "What is coming up",
  weekAll: "Everything in the tracker",
  goalsHead: "Your goals"
};

const fr: TrackerUiText = {
  nextTitle: "Prochaines échéances",
  nextEmpty: "Rien d'urgent. Mets une date sur tes tâches et nous te le rappellerons ici.",
  overdue: "en retard",
  today: "aujourd'hui",
  tomorrow: "demain",
  inDays: "dans {n} jours",
  ago: "il y a {n} jours",
  calendar: "Ajouter au calendrier (.ics)",
  calendarHint: "Télécharge un fichier que ton téléphone ou ton calendrier ouvre, avec un rappel la veille.",
  noDateHead: "Rendez-vous sans date",
  noDateHint: "Entre la date dès que tu la connais. Nous te le rappellerons.",
  setDate: "Fixer la date",
  date: "Date",
  note: "Note",
  notePlaceholder: "Par exemple : personne de contact, téléphone, quoi apporter",
  subtasks: "{done} sur {total} sous-tâches",
  openStep: "Voir l'étape dans ton parcours",
  boardTitle: "Mes candidatures",
  boardHint: "Toutes les entreprises auxquelles tu postules, avec l'état. Déplace-les avec le sélecteur.",
  firmPlaceholder: "Nom de l'entreprise",
  addFirm: "Ajouter",
  boardEmpty: "Pas encore de candidature. Ajoute une entreprise de ton parcours ou tape un nom.",
  remove: "Retirer",
  statusLabel: { planned: "Prévue", sent: "Envoyée", interview: "Entretien", offer: "Réponse positive", rejected: "Refus", declined: "Retirée" },
  logTitle: "Journal des stages",
  logHint: "Note comment s'est passé chaque stage d'observation. Tes impressions réorganisent les suggestions d'entreprises.",
  logFirm: "Entreprise",
  logDate: "Date",
  logRating: "Comment c'était ?",
  logWould: "Postulerais-tu là-bas ?",
  logYes: "Oui",
  logNo: "Non",
  logSave: "Enregistrer",
  logEmpty: "Aucun stage saisi pour l'instant.",
  logNoteHint: "Qu'est-ce qui t'a plu, qu'est-ce qui ne t'a pas plu ?",
  toBoard: "Dans mes candidatures",
  toLog: "Saisir une date de stage",
  onBoard: "Dans ta liste de candidatures",
  inLog: "Dans ton journal des stages",
  signalGood: "Ton impression : bonne",
  signalBad: "Ton impression : plutôt non",
  signalRejected: "Refus reçu",
  kindLabel: { schnupper: "Stage", interview: "Entretien", deadline: "Délai", document: "Document" },
  dossierHead: "Dossier",
  weekTitle: "À venir",
  weekAll: "Tout dans le suivi",
  goalsHead: "Tes objectifs"
};

const it: TrackerUiText = {
  nextTitle: "Prossime scadenze",
  nextEmpty: "Niente di urgente. Metti una data ai tuoi compiti e te lo ricorderemo qui.",
  overdue: "in ritardo",
  today: "oggi",
  tomorrow: "domani",
  inDays: "tra {n} giorni",
  ago: "{n} giorni fa",
  calendar: "Aggiungi al calendario (.ics)",
  calendarHint: "Scarica un file che il telefono o il calendario aprono, con un promemoria il giorno prima.",
  noDateHead: "Appuntamenti senza data",
  noDateHint: "Inserisci la data appena la conosci. Poi te lo ricordiamo.",
  setDate: "Imposta la data",
  date: "Data",
  note: "Nota",
  notePlaceholder: "Per esempio: persona di contatto, telefono, cosa portare",
  subtasks: "{done} di {total} sottocompiti",
  openStep: "Vedi il passo nel tuo percorso",
  boardTitle: "Le mie candidature",
  boardHint: "Tutte le aziende a cui ti candidi, con lo stato. Spostale con il selettore.",
  firmPlaceholder: "Nome dell'azienda",
  addFirm: "Aggiungi",
  boardEmpty: "Ancora nessuna candidatura. Aggiungi un'azienda dal tuo percorso o scrivi un nome.",
  remove: "Rimuovi",
  statusLabel: { planned: "Prevista", sent: "Inviata", interview: "Colloquio", offer: "Risposta positiva", rejected: "Rifiuto", declined: "Ritirata" },
  logTitle: "Diario degli stage",
  logHint: "Annota com'è andato ogni stage di prova. Le tue impressioni riordinano i suggerimenti di aziende.",
  logFirm: "Azienda",
  logDate: "Data",
  logRating: "Com'è andata?",
  logWould: "Ti candideresti lì?",
  logYes: "Sì",
  logNo: "No",
  logSave: "Salva",
  logEmpty: "Nessuno stage inserito per ora.",
  logNoteHint: "Cosa ti è piaciuto, cosa no?",
  toBoard: "Nelle mie candidature",
  toLog: "Inserisci una data di stage",
  onBoard: "Nella tua lista di candidature",
  inLog: "Nel tuo diario degli stage",
  signalGood: "La tua impressione: buona",
  signalBad: "La tua impressione: piuttosto no",
  signalRejected: "Rifiuto ricevuto",
  kindLabel: { schnupper: "Stage", interview: "Colloquio", deadline: "Scadenza", document: "Documento" },
  dossierHead: "Dossier",
  weekTitle: "In arrivo",
  weekAll: "Tutto nel tracker",
  goalsHead: "I tuoi obiettivi"
};

const BY_LANG: Record<LanguageCode, TrackerUiText> = { de, en, fr, it };
export const trackerUi = (language: LanguageCode): TrackerUiText => BY_LANG[language] ?? de;

/** "heute", "in 3 Tagen", "überfällig seit 2 Tagen". */
export function whenText(days: number, ui: TrackerUiText): string {
  if (days === 0) return ui.today;
  if (days === 1) return ui.tomorrow;
  if (days > 1) return ui.inDays.replace("{n}", String(days));
  return `${ui.overdue} · ${ui.ago.replace("{n}", String(-days))}`;
}
