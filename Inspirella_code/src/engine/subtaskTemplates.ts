import type { LanguageCode } from "../types";

/** task = plain to-do; schnupper / interview = a dated appointment the user should enter; deadline = has a hard date; document = a paper for the application dossier. */
export type SubtaskKind = "task" | "schnupper" | "interview" | "deadline" | "document";

export interface SubtaskTemplate {
  text: Record<LanguageCode, string>;
  kind?: SubtaskKind; // omit for "task"
}

/** Key: learning_path_steps.step_order of the micro step (101..804). */
export const SUBTASK_TEMPLATES: Record<number, SubtaskTemplate[]> = {
  // ---------- Phase 1: Orientierung ----------
  101: [
    { text: {
      de: "Lies die Beschreibung von {beruf} und markiere, was dich überrascht",
      en: "Read the description of {beruf} and highlight what surprises you",
      fr: "Lis la description du métier de {beruf} et marque ce qui te surprend",
      it: "Leggi la descrizione della professione di {beruf} e segna ciò che ti sorprende",
    } },
    { text: {
      de: "Schau dir ein Video über den Arbeitsalltag in diesem Beruf an",
      en: "Watch a video about a typical working day in this profession",
      fr: "Regarde une vidéo sur le quotidien de ce métier",
      it: "Guarda un video sulla giornata tipo di questa professione",
    } },
    { text: {
      de: "Frag zwei Personen aus dem Beruf, wie ihr Alltag aussieht",
      en: "Ask two people who work in this profession what their day looks like",
      fr: "Demande à deux personnes qui exercent ce métier à quoi ressemble leur quotidien",
      it: "Chiedi a due persone che fanno questa professione com'è la loro giornata",
    } },
    { text: {
      de: "Schreib drei Dinge auf, die dir gefallen, und eins, das dich stört",
      en: "Write down three things you like and one that bothers you",
      fr: "Note trois choses qui te plaisent et une qui te dérange",
      it: "Scrivi tre cose che ti piacciono e una che ti disturba",
    } },
  ],
  102: [
    { text: {
      de: "Schreib die schulischen Anforderungen des Berufs auf",
      en: "Write down the school requirements for this profession",
      fr: "Note les exigences scolaires de ce métier",
      it: "Scrivi i requisiti scolastici di questa professione",
    } },
    { text: {
      de: "Vergleiche sie mit deinen letzten Noten in den wichtigen Fächern",
      en: "Compare them with your latest grades in the key subjects",
      fr: "Compare-les avec tes dernières notes dans les branches importantes",
      it: "Confrontali con i tuoi ultimi voti nelle materie importanti",
    } },
    { text: {
      de: "Prüfe, ob der Beruf besondere körperliche Anforderungen oder Arbeitszeiten hat",
      en: "Check whether the job has special physical demands or working hours",
      fr: "Vérifie si le métier a des exigences physiques ou des horaires particuliers",
      it: "Verifica se la professione ha requisiti fisici o orari particolari",
    } },
    { text: {
      de: "Markiere, was du schon kannst und was du noch üben müsstest",
      en: "Mark what you can already do and what you still need to practise",
      fr: "Marque ce que tu sais déjà faire et ce que tu dois encore travailler",
      it: "Segna cosa sai già fare e cosa devi ancora esercitare",
    } },
    { text: {
      de: "Frag eine Lehrperson, wie sie deine Chancen für diesen Beruf einschätzt",
      en: "Ask a teacher how they see your chances for this profession",
      fr: "Demande à une personne enseignante comment elle voit tes chances pour ce métier",
      it: "Chiedi a un docente cosa pensa delle tue possibilità per questa professione",
    } },
  ],
  103: [
    { text: {
      de: "Such die Berufsberatung deines Kantons und finde heraus, wie du einen Termin bekommst",
      en: "Find the careers advice service in your canton and see how to book an appointment",
      fr: "Trouve l'orientation professionnelle de ton canton et vois comment prendre rendez-vous",
      it: "Trova l'orientamento professionale del tuo cantone e scopri come fissare un appuntamento",
    } },
    { text: {
      de: "Melde dich für ein Beratungsgespräch an",
      en: "Sign up for a counselling session",
      fr: "Inscris-toi à un entretien de conseil",
      it: "Iscriviti a un colloquio di consulenza",
    } },
    { text: {
      de: "Schreib drei Fragen zu {beruf} auf, die du stellen willst",
      en: "Write down three questions about {beruf} that you want to ask",
      fr: "Écris trois questions sur {beruf} que tu veux poser",
      it: "Scrivi tre domande su {beruf} che vuoi fare",
    } },
    { text: {
      de: "Geh zum Gespräch und schreib die wichtigsten Tipps auf",
      en: "Go to the session and write down the most important tips",
      fr: "Va à l'entretien et note les conseils les plus importants",
      it: "Vai al colloquio e annota i consigli più importanti",
    } },
    { text: {
      de: "Notiere, was du danach noch klären musst",
      en: "Note what you still need to clarify afterwards",
      fr: "Note ce que tu dois encore clarifier ensuite",
      it: "Annota cosa devi ancora chiarire dopo",
    } },
  ],
  104: [
    { text: {
      de: "Schreib auf, was dir an {beruf} am wichtigsten ist",
      en: "Write down what matters most to you about {beruf}",
      fr: "Écris ce qui compte le plus pour toi dans {beruf}",
      it: "Scrivi cosa conta di più per te in {beruf}",
    } },
    { text: {
      de: "Such zwei bis drei Berufe, die ähnliche Dinge bieten",
      en: "Find two or three professions that offer similar things",
      fr: "Cherche deux ou trois métiers qui offrent des choses similaires",
      it: "Cerca due o tre professioni che offrono cose simili",
    } },
    { text: {
      de: "Vergleiche die Berufe nach Anforderungen, Alltag und Lehrstellenangebot",
      en: "Compare the professions by requirements, daily work and available apprenticeships",
      fr: "Compare les métiers selon les exigences, le quotidien et les places d'apprentissage",
      it: "Confronta le professioni per requisiti, quotidiano e posti di tirocinio disponibili",
    } },
    { text: {
      de: "Entscheide, welche Alternativen du auch schnuppern möchtest",
      en: "Decide which alternatives you also want to try out",
      fr: "Décide quelles alternatives tu veux aussi essayer en stage",
      it: "Decidi quali alternative vuoi provare con uno stage",
    } },
  ],

  // ---------- Phase 2: Schnuppern ----------
  201: [
    { text: {
      de: "Schau dir die Liste der Lehrbetriebe an und wähle fünf, die dich ansprechen",
      en: "Look at the list of training firms and pick five that appeal to you",
      fr: "Regarde la liste des entreprises formatrices et choisis-en cinq qui te plaisent",
      it: "Guarda l'elenco delle aziende formatrici e scegline cinque che ti piacciono",
    } },
    { text: {
      de: "Besuche die Website jedes Betriebs und prüfe, ob er Schnupperlehren anbietet",
      en: "Visit each firm's website and check whether it offers trial apprenticeships",
      fr: "Visite le site de chaque entreprise et vérifie si elle propose des stages d'observation",
      it: "Visita il sito di ogni azienda e verifica se offre stage di prova",
    } },
    { text: {
      de: "Prüfe den Arbeitsweg zu jedem Betrieb",
      en: "Check how you would get to each firm",
      fr: "Vérifie le trajet pour aller à chaque entreprise",
      it: "Verifica il tragitto per raggiungere ogni azienda",
    } },
    { text: {
      de: "Sortiere die Betriebe nach deinen Favoriten und notiere die Kontaktangaben",
      en: "Rank the firms by your favourites and note their contact details",
      fr: "Classe les entreprises selon tes préférences et note leurs coordonnées",
      it: "Ordina le aziende in base alle tue preferenze e annota i recapiti",
    } },
  ],
  202: [
    { text: {
      de: "Kläre mit deiner Lehrperson, wann du für das Schnuppern freibekommst",
      en: "Check with your teacher when you can get time off school for trial days",
      fr: "Clarifie avec ton enseignant quand tu peux être libéré pour un stage d'observation",
      it: "Chiarisci con il tuo docente quando puoi assentarti da scuola per lo stage",
    } },
    { text: {
      de: "Finde auf der Website des Betriebs heraus, wie man sich für eine Schnupperlehre meldet",
      en: "Find out on the firm's website how to apply for a trial apprenticeship",
      fr: "Trouve sur le site de l'entreprise comment demander un stage d'observation",
      it: "Scopri sul sito dell'azienda come richiedere uno stage di prova",
    } },
    { text: {
      de: "Schreib eine kurze, freundliche Anfrage für eine Schnupperlehre als {beruf}",
      en: "Write a short, friendly request for a trial apprenticeship as {beruf}",
      fr: "Rédige une demande courte et aimable pour un stage d'observation comme {beruf}",
      it: "Scrivi una richiesta breve e cordiale per uno stage di prova come {beruf}",
    } },
    { text: {
      de: "Schick die Anfrage an die ersten zwei bis drei Betriebe",
      en: "Send the request to the first two or three firms",
      fr: "Envoie la demande aux deux ou trois premières entreprises",
      it: "Invia la richiesta alle prime due o tre aziende",
    } },
    { text: {
      de: "Notiere, wann du nachfragst, falls keine Antwort kommt",
      en: "Note when you will follow up if no reply comes",
      fr: "Note quand tu relanceras si tu n'as pas de réponse",
      it: "Annota quando farai un sollecito se non arriva risposta",
    } },
  ],
  203: [
    { kind: "schnupper", text: {
      de: "Geh zur Schnupperlehre und trag Datum, Ort und Ansprechperson ein",
      en: "Attend the trial apprenticeship and enter the date, place and contact person",
      fr: "Va au stage d'observation et inscris la date, le lieu et la personne de contact",
      it: "Vai allo stage di prova e inserisci data, luogo e persona di contatto",
    } },
    { text: {
      de: "Nimm ein Notizheft mit und schreib in den Pausen auf, was du erlebst",
      en: "Bring a notebook and write down what you experience during breaks",
      fr: "Prends un carnet et note pendant les pauses ce que tu vis",
      it: "Porta un quaderno e annota durante le pause ciò che vivi",
    } },
    { text: {
      de: "Stell einer Fachperson im Betrieb zwei Fragen zur Lehre",
      en: "Ask a professional at the firm two questions about the apprenticeship",
      fr: "Pose deux questions sur l'apprentissage à un professionnel de l'entreprise",
      it: "Fai due domande sul tirocinio a un professionista dell'azienda",
    } },
    { text: {
      de: "Bitte am Ende um eine Rückmeldung zu deinem Einsatz",
      en: "Ask for feedback on your performance at the end",
      fr: "Demande à la fin un retour sur ton engagement",
      it: "Alla fine chiedi un riscontro sul tuo impegno",
    } },
    { text: {
      de: "Bedanke dich beim Betrieb für den Schnuppertag",
      en: "Thank the firm for the trial day",
      fr: "Remercie l'entreprise pour la journée",
      it: "Ringrazia l'azienda per la giornata",
    } },
  ],
  204: [
    { text: {
      de: "Schreib je drei Punkte auf: Was hat mir gefallen, was nicht?",
      en: "Write three points each: what did I like, what did I not?",
      fr: "Note trois points pour chaque question : ce qui m'a plu, ce qui ne m'a pas plu",
      it: "Scrivi tre punti per ciascuno: cosa mi è piaciuto e cosa no",
    } },
    { text: {
      de: "Vergleiche deine Eindrücke mit dem, was du dir vorher vorgestellt hast",
      en: "Compare your impressions with what you expected beforehand",
      fr: "Compare tes impressions avec ce que tu imaginais avant",
      it: "Confronta le tue impressioni con ciò che immaginavi prima",
    } },
    { text: {
      de: "Gib dem Beruf und dem Betrieb je eine Bewertung von 1 bis 5",
      en: "Rate the profession and the firm each from 1 to 5",
      fr: "Donne au métier et à l'entreprise une note de 1 à 5",
      it: "Dai alla professione e all'azienda un voto da 1 a 5",
    } },
    { text: {
      de: "Besprich dein Ergebnis mit deinen Eltern oder der Berufsberatung",
      en: "Discuss your result with your parents or the careers service",
      fr: "Discute de ton résultat avec tes parents ou l'orientation professionnelle",
      it: "Discuti il tuo risultato con i tuoi genitori o l'orientamento professionale",
    } },
    { text: {
      de: "Entscheide: Bewirbst du dich für diesen Beruf oder schnupperst du weiter?",
      en: "Decide: will you apply for this profession or keep trying out others?",
      fr: "Décide : tu postules pour ce métier ou tu continues les stages ?",
      it: "Decidi: ti candidi per questa professione o continui a provare?",
    } },
  ],

  // ---------- Phase 3: Bewerbungsdossier ----------
  301: [
    { text: {
      de: "Sammle deine Daten: Schulen, Sprachen, Hobbys und Ferienjobs",
      en: "Collect your details: schools, languages, hobbies and holiday jobs",
      fr: "Rassemble tes données : écoles, langues, loisirs et jobs de vacances",
      it: "Raccogli i tuoi dati: scuole, lingue, hobby e lavoretti estivi",
    } },
    { kind: "document", text: {
      de: "Schreib deinen Lebenslauf übersichtlich auf einer Seite",
      en: "Write your CV clearly on one page",
      fr: "Rédige ton CV de façon claire sur une page",
      it: "Scrivi il tuo curriculum in modo chiaro su una pagina",
    } },
    { text: {
      de: "Prüfe Rechtschreibung und Layout",
      en: "Check spelling and layout",
      fr: "Vérifie l'orthographe et la mise en page",
      it: "Controlla ortografia e impaginazione",
    } },
    { text: {
      de: "Lass den Lebenslauf von einer erwachsenen Person Korrektur lesen",
      en: "Have an adult proofread your CV",
      fr: "Fais relire ton CV par un adulte",
      it: "Fai rileggere il curriculum a un adulto",
    } },
    { text: {
      de: "Speichere ihn als PDF mit einem klaren Dateinamen",
      en: "Save it as a PDF with a clear file name",
      fr: "Enregistre-le en PDF avec un nom de fichier clair",
      it: "Salvalo in PDF con un nome file chiaro",
    } },
  ],
  302: [
    { text: {
      de: "Lies das Inserat genau und markiere, was der Betrieb sucht",
      en: "Read the job ad closely and highlight what the firm is looking for",
      fr: "Lis bien l'annonce et marque ce que l'entreprise recherche",
      it: "Leggi bene l'annuncio e segna ciò che l'azienda cerca",
    } },
    { text: {
      de: "Schreib in Stichworten auf, warum du {beruf} lernen willst",
      en: "Jot down in keywords why you want to learn {beruf}",
      fr: "Note en mots-clés pourquoi tu veux apprendre {beruf}",
      it: "Annota in parole chiave perché vuoi imparare {beruf}",
    } },
    { kind: "document", text: {
      de: "Verfasse das Bewerbungsschreiben auf höchstens einer Seite",
      en: "Write the cover letter on one page at most",
      fr: "Rédige la lettre de motivation sur une page au maximum",
      it: "Scrivi la lettera di candidatura su al massimo una pagina",
    } },
    { text: {
      de: "Erwähne darin, was du beim Schnuppern erlebt hast",
      en: "Mention what you experienced during your trial days",
      fr: "Mentionne ce que tu as vécu pendant ton stage d'observation",
      it: "Menziona ciò che hai vissuto durante lo stage di prova",
    } },
    { text: {
      de: "Prüfe Rechtschreibung, Anrede und den Namen der Ansprechperson",
      en: "Check spelling, salutation and the contact person's name",
      fr: "Vérifie l'orthographe, la formule d'appel et le nom de la personne de contact",
      it: "Controlla ortografia, saluto e nome della persona di contatto",
    } },
  ],
  303: [
    { kind: "document", text: {
      de: "Kopiere oder scanne deine letzten Zeugnisse",
      en: "Copy or scan your latest school reports",
      fr: "Photocopie ou scanne tes derniers bulletins",
      it: "Fotocopia o scansiona le tue ultime pagelle",
    } },
    { kind: "document", text: {
      de: "Hol Bestätigungen von Schnupperlehren, falls du welche hast",
      en: "Get confirmations of trial apprenticeships, if you have any",
      fr: "Demande des attestations de stages d'observation, si tu en as",
      it: "Richiedi le attestazioni degli stage di prova, se ne hai",
    } },
    { kind: "document", text: {
      de: "Mach ein ordentliches Bewerbungsfoto, falls der Betrieb eines möchte",
      en: "Take a neat application photo if the firm wants one",
      fr: "Fais une photo de candidature soignée si l'entreprise en souhaite une",
      it: "Fai una foto di candidatura curata se l'azienda la desidera",
    } },
    { kind: "document", text: {
      de: "Sammle weitere Nachweise wie Zertifikate oder Kursbestätigungen",
      en: "Gather other proof such as certificates or course confirmations",
      fr: "Rassemble d'autres justificatifs comme des certificats ou des attestations de cours",
      it: "Raccogli altri attestati come certificati o conferme di corsi",
    } },
    { text: {
      de: "Leg alles in einem Ordner ab und benenne die Dateien klar",
      en: "Put everything in one folder and name the files clearly",
      fr: "Range tout dans un dossier et nomme clairement les fichiers",
      it: "Metti tutto in una cartella e dai ai file nomi chiari",
    } },
  ],
  304: [
    { text: {
      de: "Finde heraus, ob der Beruf oder der Betrieb einen Eignungstest verlangt",
      en: "Find out whether the profession or the firm requires an aptitude test",
      fr: "Cherche si le métier ou l'entreprise demande un test d'aptitudes",
      it: "Scopri se la professione o l'azienda richiede un test attitudinale",
    } },
    { text: {
      de: "Such Übungsaufgaben für Eignungstests im Internet oder bei der Berufsberatung",
      en: "Find practice exercises for aptitude tests online or at the careers service",
      fr: "Cherche des exercices d'entraînement pour les tests d'aptitudes sur internet ou à l'orientation",
      it: "Cerca esercizi per i test attitudinali su internet o all'orientamento professionale",
    } },
    { text: {
      de: "Mach einen Probetest und notiere, wo du noch unsicher bist",
      en: "Take a practice test and note where you are still unsure",
      fr: "Fais un test d'essai et note où tu es encore hésitant",
      it: "Fai un test di prova e annota dove sei ancora insicuro",
    } },
    { text: {
      de: "Übe deine schwachen Bereiche in kurzen Einheiten an mehreren Tagen",
      en: "Practise your weak areas in short sessions over several days",
      fr: "Entraîne tes points faibles en courtes séances sur plusieurs jours",
      it: "Esercita i tuoi punti deboli in brevi sessioni distribuite su più giorni",
    } },
    { text: {
      de: "Mach einen zweiten Probetest und vergleiche das Ergebnis",
      en: "Take a second practice test and compare the result",
      fr: "Fais un deuxième test d'essai et compare le résultat",
      it: "Fai un secondo test di prova e confronta il risultato",
    } },
  ],
  305: [
    { text: {
      de: "Stell Lebenslauf, Bewerbungsschreiben und Zeugnisse zu einem Dossier zusammen",
      en: "Put your CV, cover letter and school reports together into one dossier",
      fr: "Rassemble CV, lettre de motivation et bulletins dans un dossier",
      it: "Riunisci curriculum, lettera di candidatura e pagelle in un dossier",
    } },
    { text: {
      de: "Lass eine erwachsene Person das ganze Dossier lesen und Rückmeldung geben",
      en: "Have an adult read the whole dossier and give you feedback",
      fr: "Fais lire tout le dossier par un adulte et demande-lui un retour",
      it: "Fai leggere tutto il dossier a un adulto e chiedi un parere",
    } },
    { text: {
      de: "Hol dir Feedback bei deiner Lehrperson oder der Berufsberatung",
      en: "Get feedback from your teacher or the careers service",
      fr: "Demande un avis à ton enseignant ou à l'orientation professionnelle",
      it: "Chiedi un parere al tuo docente o all'orientamento professionale",
    } },
    { text: {
      de: "Arbeite die Korrekturen ein",
      en: "Work in the corrections",
      fr: "Intègre les corrections",
      it: "Inserisci le correzioni",
    } },
    { text: {
      de: "Speichere die Endversion als PDF und prüfe, ob alle Seiten dabei sind",
      en: "Save the final version as a PDF and check that all pages are included",
      fr: "Enregistre la version finale en PDF et vérifie que toutes les pages y sont",
      it: "Salva la versione finale in PDF e controlla che ci siano tutte le pagine",
    } },
  ],

  // ---------- Phase 4: Bewerben ----------
  401: [
    { text: {
      de: "Such auf Lehrstellenportalen und Betriebswebsites nach offenen Stellen als {beruf}",
      en: "Search apprenticeship portals and firm websites for open places as {beruf}",
      fr: "Cherche sur les portails de places d'apprentissage et les sites d'entreprises des places ouvertes comme {beruf}",
      it: "Cerca sui portali dei posti di tirocinio e sui siti delle aziende posti liberi come {beruf}",
    } },
    { text: {
      de: "Speichere interessante Inserate und notiere die Bewerbungsfristen",
      en: "Save interesting ads and note the application deadlines",
      fr: "Enregistre les annonces intéressantes et note les délais de postulation",
      it: "Salva gli annunci interessanti e annota le scadenze di candidatura",
    } },
    { text: {
      de: "Frag Lehrperson und Berufsberatung nach Tipps zu offenen Lehrstellen",
      en: "Ask your teacher and the careers service for tips on open apprenticeships",
      fr: "Demande à ton enseignant et à l'orientation professionnelle des conseils sur les places ouvertes",
      it: "Chiedi al tuo docente e all'orientamento professionale consigli sui posti liberi",
    } },
    { text: {
      de: "Sag Familie und Bekannten, dass du eine Lehrstelle suchst",
      en: "Tell family and acquaintances that you are looking for an apprenticeship",
      fr: "Dis à ta famille et à tes connaissances que tu cherches une place d'apprentissage",
      it: "Di' a familiari e conoscenti che cerchi un posto di tirocinio",
    } },
  ],
  402: [
    { text: {
      de: "Erstelle eine Liste mit Betrieben, die dich interessieren",
      en: "Make a list of firms that interest you",
      fr: "Dresse une liste d'entreprises qui t'intéressent",
      it: "Crea un elenco di aziende che ti interessano",
    } },
    { text: {
      de: "Notiere pro Betrieb Ansprechperson, Adresse und Bewerbungsweg",
      en: "For each firm, note the contact person, address and how to apply",
      fr: "Note pour chaque entreprise la personne de contact, l'adresse et la façon de postuler",
      it: "Annota per ogni azienda persona di contatto, indirizzo e modalità di candidatura",
    } },
    { text: {
      de: "Sortiere die Liste nach deinen Favoriten",
      en: "Sort the list by your favourites",
      fr: "Classe la liste selon tes préférences",
      it: "Ordina l'elenco in base alle tue preferenze",
    } },
    { text: {
      de: "Wähle aus, bei welchen Betrieben du dich zuerst bewirbst",
      en: "Choose which firms you will apply to first",
      fr: "Choisis les entreprises auxquelles tu postules en premier",
      it: "Scegli a quali aziende ti candidi per prime",
    } },
  ],
  403: [
    { text: {
      de: "Passe das Bewerbungsschreiben für jeden Betrieb an (Name, Datum, Bezug zum Betrieb)",
      en: "Adapt the cover letter for each firm (name, date, reference to the firm)",
      fr: "Adapte la lettre de motivation pour chaque entreprise (nom, date, lien avec l'entreprise)",
      it: "Adatta la lettera di candidatura a ogni azienda (nome, data, riferimento all'azienda)",
    } },
    { text: {
      de: "Prüfe, ob der Betrieb Post, E-Mail oder ein Online-Formular verlangt",
      en: "Check whether the firm wants post, email or an online form",
      fr: "Vérifie si l'entreprise demande un envoi postal, un e-mail ou un formulaire en ligne",
      it: "Verifica se l'azienda richiede posta, e-mail o un modulo online",
    } },
    { text: {
      de: "Schick die erste Bewerbung ab und trag Datum und Betrieb in deine Liste ein",
      en: "Send the first application and enter the date and firm in your list",
      fr: "Envoie la première candidature et inscris la date et l'entreprise dans ta liste",
      it: "Invia la prima candidatura e annota data e azienda nel tuo elenco",
    } },
    { text: {
      de: "Schick weitere Bewerbungen ab und halte jede in deiner Liste fest",
      en: "Send further applications and record each one in your list",
      fr: "Envoie d'autres candidatures et note chacune dans ta liste",
      it: "Invia altre candidature e registra ognuna nel tuo elenco",
    } },
    { text: {
      de: "Speichere eine Kopie jeder abgeschickten Bewerbung",
      en: "Keep a copy of every application you sent",
      fr: "Garde une copie de chaque candidature envoyée",
      it: "Conserva una copia di ogni candidatura inviata",
    } },
  ],
  404: [
    { text: {
      de: "Notiere in deiner Liste, wann du bei jedem Betrieb nachfragen willst",
      en: "Note in your list when you want to follow up with each firm",
      fr: "Note dans ta liste quand tu veux relancer chaque entreprise",
      it: "Annota nel tuo elenco quando vuoi sollecitare ogni azienda",
    } },
    { text: {
      de: "Ruf an oder schreib eine freundliche E-Mail, ob dein Dossier angekommen ist",
      en: "Call or write a friendly email to ask whether your dossier arrived",
      fr: "Appelle ou écris un e-mail aimable pour savoir si ton dossier est bien arrivé",
      it: "Telefona o scrivi un'e-mail cordiale per chiedere se il dossier è arrivato",
    } },
    { text: {
      de: "Frag, wie es weitergeht und bis wann du mit einer Antwort rechnen kannst",
      en: "Ask what happens next and when you can expect an answer",
      fr: "Demande la suite de la procédure et quand tu peux attendre une réponse",
      it: "Chiedi come proseguirà e quando puoi aspettarti una risposta",
    } },
    { text: {
      de: "Halte jede Antwort in deiner Liste fest",
      en: "Record every reply in your list",
      fr: "Note chaque réponse dans ta liste",
      it: "Registra ogni risposta nel tuo elenco",
    } },
    { text: {
      de: "Bewirb dich nach einer Absage bei weiteren Betrieben",
      en: "After a rejection, apply to more firms",
      fr: "Après un refus, postule auprès d'autres entreprises",
      it: "Dopo un rifiuto, candidati ad altre aziende",
    } },
  ],

  // ---------- Phase 5: Vorstellungsgespräch ----------
  501: [
    { text: {
      de: "Lies das Inserat und die Website des Betriebs noch einmal genau durch",
      en: "Read the ad and the firm's website carefully once more",
      fr: "Relis attentivement l'annonce et le site de l'entreprise",
      it: "Rileggi con attenzione l'annuncio e il sito dell'azienda",
    } },
    { text: {
      de: "Schreib auf, was der Betrieb anbietet und was {beruf} dort macht",
      en: "Write down what the firm offers and what a {beruf} does there",
      fr: "Note ce que l'entreprise propose et ce que fait un {beruf} là-bas",
      it: "Scrivi cosa offre l'azienda e cosa fa un {beruf} lì",
    } },
    { text: {
      de: "Übe Antworten auf typische Fragen wie: Warum willst du diesen Beruf?",
      en: "Practise answers to typical questions such as: Why do you want this profession?",
      fr: "Entraîne-toi à répondre aux questions typiques, par exemple : pourquoi veux-tu ce métier ?",
      it: "Esercitati a rispondere a domande tipiche come: perché vuoi questa professione?",
    } },
    { text: {
      de: "Bereite zwei bis drei eigene Fragen an den Betrieb vor",
      en: "Prepare two or three questions of your own for the firm",
      fr: "Prépare deux ou trois questions à poser à l'entreprise",
      it: "Prepara due o tre domande tue da rivolgere all'azienda",
    } },
    { text: {
      de: "Plane die Anreise, lege Kleidung bereit und pack eine Kopie des Dossiers ein",
      en: "Plan your journey, lay out your clothes and pack a copy of your dossier",
      fr: "Planifie le trajet, prépare tes vêtements et prends une copie de ton dossier",
      it: "Pianifica il viaggio, prepara i vestiti e porta una copia del dossier",
    } },
  ],
  502: [
    { kind: "interview", text: {
      de: "Geh zum Vorstellungsgespräch und trag Datum, Uhrzeit, Ort und Ansprechperson ein",
      en: "Attend the interview and enter the date, time, place and contact person",
      fr: "Va à l'entretien d'embauche et inscris la date, l'heure, le lieu et la personne de contact",
      it: "Vai al colloquio e inserisci data, ora, luogo e persona di contatto",
    } },
    { text: {
      de: "Sei ein paar Minuten vor dem Termin da und begrüsse alle freundlich",
      en: "Arrive a few minutes early and greet everyone politely",
      fr: "Arrive quelques minutes à l'avance et salue tout le monde aimablement",
      it: "Arriva qualche minuto prima e saluta tutti con gentilezza",
    } },
    { text: {
      de: "Stell am Ende deine vorbereiteten Fragen",
      en: "Ask your prepared questions at the end",
      fr: "Pose tes questions préparées à la fin",
      it: "Alla fine fai le domande che hai preparato",
    } },
    { text: {
      de: "Frag, wie es weitergeht und bis wann du Bescheid bekommst",
      en: "Ask what happens next and when you will hear back",
      fr: "Demande comment la suite se passe et quand tu auras une réponse",
      it: "Chiedi come proseguirà e quando riceverai una risposta",
    } },
    { text: {
      de: "Schreib direkt danach auf, was gut lief und was du nächstes Mal anders machst",
      en: "Right afterwards, write down what went well and what you will do differently next time",
      fr: "Juste après, note ce qui s'est bien passé et ce que tu feras autrement la prochaine fois",
      it: "Subito dopo, scrivi cosa è andato bene e cosa farai diversamente la prossima volta",
    } },
  ],
  503: [
    { text: {
      de: "Schick kurz nach dem Gespräch eine freundliche Dankes-Mail an die Ansprechperson",
      en: "Shortly after the interview, send a friendly thank-you email to your contact person",
      fr: "Peu après l'entretien, envoie un e-mail de remerciement à la personne de contact",
      it: "Poco dopo il colloquio, invia un'e-mail di ringraziamento alla persona di contatto",
    } },
    { text: {
      de: "Notiere, bis wann sich der Betrieb melden wollte",
      en: "Note by when the firm said it would get back to you",
      fr: "Note jusqu'à quand l'entreprise voulait te répondre",
      it: "Annota entro quando l'azienda avrebbe risposto",
    } },
    { text: {
      de: "Frag höflich nach, wenn die genannte Frist vorbei ist",
      en: "Politely follow up if the stated date has passed",
      fr: "Relance poliment si le délai annoncé est dépassé",
      it: "Sollecita con cortesia se la data indicata è passata",
    } },
    { text: {
      de: "Bewirb dich weiter bei anderen Betrieben, solange du keine Zusage hast",
      en: "Keep applying to other firms until you have an offer",
      fr: "Continue à postuler ailleurs tant que tu n'as pas de réponse positive",
      it: "Continua a candidarti ad altre aziende finché non hai una conferma",
    } },
  ],

  // ---------- Phase 6: Zusage & Lehrvertrag ----------
  601: [
    { text: {
      de: "Bedanke dich für die Zusage und frag, bis wann du antworten sollst",
      en: "Thank them for the offer and ask by when you should reply",
      fr: "Remercie pour la réponse positive et demande jusqu'à quand tu dois répondre",
      it: "Ringrazia per la conferma e chiedi entro quando devi rispondere",
    } },
    { text: {
      de: "Lies den Lehrvertrag Zeile für Zeile durch",
      en: "Read the apprenticeship contract line by line",
      fr: "Lis le contrat d'apprentissage ligne par ligne",
      it: "Leggi il contratto di tirocinio riga per riga",
    } },
    { text: {
      de: "Prüfe Lehrbeginn, Lehrdauer, Lohn, Ferien und Probezeit im Vertrag",
      en: "Check the start date, duration, pay, holidays and probation period in the contract",
      fr: "Vérifie dans le contrat le début, la durée, le salaire, les vacances et le temps d'essai",
      it: "Verifica nel contratto inizio, durata, salario, vacanze e periodo di prova",
    } },
    { text: {
      de: "Markiere unklare Stellen und besprich sie mit deinen Eltern",
      en: "Mark anything unclear and discuss it with your parents",
      fr: "Marque ce qui n'est pas clair et discute-en avec tes parents",
      it: "Segna i punti poco chiari e parlane con i tuoi genitori",
    } },
    { text: {
      de: "Frag beim Betrieb oder bei der Berufsberatung nach, was unklar bleibt",
      en: "Ask the firm or the careers service about anything that stays unclear",
      fr: "Pose tes questions à l'entreprise ou à l'orientation professionnelle sur ce qui reste flou",
      it: "Chiedi all'azienda o all'orientamento professionale ciò che resta poco chiaro",
    } },
  ],
  602: [
    { text: {
      de: "Besprich den Vertrag mit deinen Eltern, denn deine gesetzliche Vertretung unterschreibt ebenfalls",
      en: "Go through the contract with your parents, as your legal guardian signs it too",
      fr: "Passe le contrat en revue avec tes parents, car ton représentant légal le signe aussi",
      it: "Rivedi il contratto con i tuoi genitori: lo firma anche il tuo rappresentante legale",
    } },
    { kind: "deadline", text: {
      de: "Unterschreibe den Lehrvertrag bis zur Frist des Betriebs (Datum eintragen)",
      en: "Sign the apprenticeship contract by the firm's deadline (enter the date)",
      fr: "Signe le contrat d'apprentissage avant le délai de l'entreprise (inscris la date)",
      it: "Firma il contratto di tirocinio entro la scadenza dell'azienda (inserisci la data)",
    } },
    { text: {
      de: "Schick den unterschriebenen Vertrag zurück und behalte eine Kopie",
      en: "Send back the signed contract and keep a copy",
      fr: "Renvoie le contrat signé et garde-en une copie",
      it: "Rispedisci il contratto firmato e tieni una copia",
    } },
    { text: {
      de: "Frag den Betrieb, ob der Vertrag beim kantonalen Amt für Berufsbildung angemeldet ist",
      en: "Ask the firm whether the contract has been registered with the cantonal vocational education office",
      fr: "Demande à l'entreprise si le contrat est enregistré auprès de l'office cantonal de la formation professionnelle",
      it: "Chiedi all'azienda se il contratto è stato registrato presso l'ufficio cantonale della formazione professionale",
    } },
    { text: {
      de: "Sag den anderen Betrieben, bei denen du dich beworben hast, höflich ab",
      en: "Politely withdraw your application from the other firms you applied to",
      fr: "Annule poliment tes candidatures auprès des autres entreprises",
      it: "Ritira con cortesia le candidature presentate ad altre aziende",
    } },
  ],
  603: [
    { text: {
      de: "Schreib auf, was du tust, falls du keine Zusage bekommst",
      en: "Write down what you will do if you do not get an offer",
      fr: "Écris ce que tu feras si tu n'obtiens pas de réponse positive",
      it: "Scrivi cosa farai se non ricevi una conferma",
    } },
    { text: {
      de: "Melde dich bei der Berufsberatung, wenn du noch keine Lehrstelle hast",
      en: "Contact the careers service if you do not have an apprenticeship yet",
      fr: "Contacte l'orientation professionnelle si tu n'as pas encore de place d'apprentissage",
      it: "Contatta l'orientamento professionale se non hai ancora un posto di tirocinio",
    } },
    { text: {
      de: "Informiere dich über Brückenangebote in deinem Kanton",
      en: "Find out about bridging programmes in your canton",
      fr: "Renseigne-toi sur les offres transitoires de ton canton",
      it: "Informati sulle offerte transitorie nel tuo cantone",
    } },
    { text: {
      de: "Such weiter nach Lehrstellen, die noch frei sind",
      en: "Keep looking for apprenticeships that are still open",
      fr: "Continue à chercher des places d'apprentissage encore libres",
      it: "Continua a cercare posti di tirocinio ancora liberi",
    } },
    { text: {
      de: "Halte Termine und Fristen für deinen Plan B fest",
      en: "Record the appointments and deadlines for your plan B",
      fr: "Note les rendez-vous et les délais de ton plan B",
      it: "Annota appuntamenti e scadenze del tuo piano B",
    } },
  ],

  // ---------- Phase 7: Lehre ----------
  701: [
    { text: {
      de: "Kläre vor dem ersten Tag Arbeitsweg, Arbeitszeiten und was du mitnehmen musst",
      en: "Before day one, sort out your commute, working hours and what to bring",
      fr: "Avant le premier jour, clarifie le trajet, les horaires et ce que tu dois apporter",
      it: "Prima del primo giorno chiarisci il tragitto, gli orari e cosa devi portare",
    } },
    { text: {
      de: "Stell dich allen vor und merke dir die Namen deiner Ansprechpersonen",
      en: "Introduce yourself to everyone and learn the names of your contact people",
      fr: "Présente-toi à tout le monde et retiens les noms de tes personnes de référence",
      it: "Presentati a tutti e memorizza i nomi delle tue persone di riferimento",
    } },
    { text: {
      de: "Frag in der ersten Woche nach den Regeln zu Pausen, Sicherheit und Abmeldung bei Krankheit",
      en: "In week one, ask about the rules for breaks, safety and reporting sick",
      fr: "La première semaine, renseigne-toi sur les règles : pauses, sécurité et annonce en cas de maladie",
      it: "Nella prima settimana chiedi le regole su pause, sicurezza e comunicazione di malattia",
    } },
    { text: {
      de: "Notiere jede Woche, was du Neues gelernt hast",
      en: "Write down each week what new things you have learned",
      fr: "Note chaque semaine ce que tu as appris de nouveau",
      it: "Annota ogni settimana cosa hai imparato di nuovo",
    } },
    { text: {
      de: "Bitte nach den ersten Wochen um ein kurzes Feedbackgespräch",
      en: "After the first few weeks, ask for a short feedback chat",
      fr: "Après les premières semaines, demande un court entretien de retour",
      it: "Dopo le prime settimane chiedi un breve colloquio di riscontro",
    } },
  ],
  702: [
    { text: {
      de: "Finde heraus, an welchen Tagen du die Berufsfachschule besuchst",
      en: "Find out on which days you attend vocational school",
      fr: "Cherche quels jours tu vas à l'école professionnelle",
      it: "Scopri in quali giorni frequenti la scuola professionale",
    } },
    { text: {
      de: "Trag Stundenplan und Schulferien in deinen Kalender ein",
      en: "Enter your timetable and the school holidays in your calendar",
      fr: "Inscris ton horaire et les vacances scolaires dans ton agenda",
      it: "Inserisci l'orario e le vacanze scolastiche nel tuo calendario",
    } },
    { text: {
      de: "Frag den Betrieb, welche überbetrieblichen Kurse du besuchst, und trag die Daten ein",
      en: "Ask the firm which inter-company courses you will attend and enter the dates",
      fr: "Demande à l'entreprise quels cours interentreprises tu suivras et inscris les dates",
      it: "Chiedi all'azienda quali corsi interaziendali frequenterai e inserisci le date",
    } },
    { text: {
      de: "Leg dir einen Ordner für Schulunterlagen und Noten an",
      en: "Set up a folder for school materials and grades",
      fr: "Crée un classeur pour les documents scolaires et les notes",
      it: "Crea una cartella per i materiali scolastici e i voti",
    } },
    { text: {
      de: "Plane vor jeder Prüfung feste Lernzeiten ein",
      en: "Schedule fixed study times before every exam",
      fr: "Planifie des moments d'étude fixes avant chaque examen",
      it: "Pianifica orari di studio fissi prima di ogni esame",
    } },
  ],
  703: [
    { text: {
      de: "Informiere dich, wie die Berufsmatura funktioniert und wann man sie machen kann",
      en: "Find out how the vocational baccalaureate works and when you can do it",
      fr: "Renseigne-toi sur le fonctionnement de la maturité professionnelle et sur le moment où on peut la faire",
      it: "Informati su come funziona la maturità professionale e quando si può svolgere",
    } },
    { text: {
      de: "Frag Berufsfachschule und Berufsberatung, ob die Berufsmatura zu dir passt",
      en: "Ask your vocational school and the careers service whether the Berufsmatura suits you",
      fr: "Demande à l'école professionnelle et à l'orientation si la maturité professionnelle te convient",
      it: "Chiedi alla scuola professionale e all'orientamento se la maturità professionale fa per te",
    } },
    { text: {
      de: "Frag deinen Betrieb, ob und wie er die Berufsmatura unterstützt",
      en: "Ask your firm whether and how it supports the Berufsmatura",
      fr: "Demande à ton entreprise si et comment elle soutient la maturité professionnelle",
      it: "Chiedi alla tua azienda se e come sostiene la maturità professionale",
    } },
    { text: {
      de: "Frag nach, ob es eine Aufnahmeprüfung gibt und bis wann die Anmeldung läuft",
      en: "Ask whether there is an entrance exam and until when you can register",
      fr: "Demande s'il y a un examen d'admission et jusqu'à quand on peut s'inscrire",
      it: "Chiedi se c'è un esame di ammissione e fino a quando ci si può iscrivere",
    } },
    { text: {
      de: "Entscheide mit Eltern und Betrieb, ob du die Berufsmatura machst",
      en: "Decide with your parents and the firm whether you will do the Berufsmatura",
      fr: "Décide avec tes parents et l'entreprise si tu fais la maturité professionnelle",
      it: "Decidi con i tuoi genitori e l'azienda se fare la maturità professionale",
    } },
  ],
  704: [
    { text: {
      de: "Frag Betrieb und Schule, wie das Qualifikationsverfahren in deinem Beruf abläuft",
      en: "Ask your firm and school how the final qualification procedure works in your profession",
      fr: "Demande à l'entreprise et à l'école comment se déroule la procédure de qualification dans ton métier",
      it: "Chiedi all'azienda e alla scuola come si svolge la procedura di qualificazione nella tua professione",
    } },
    { text: {
      de: "Lies im Bildungsplan deines Berufs nach, was geprüft wird",
      en: "Read the training plan for your profession to see what is examined",
      fr: "Consulte le plan de formation de ton métier pour savoir ce qui est examiné",
      it: "Leggi il piano di formazione della tua professione per sapere cosa viene esaminato",
    } },
    { text: {
      de: "Erstelle einen Lernplan, der von der Prüfung rückwärts rechnet",
      en: "Make a study plan that counts backwards from the exam date",
      fr: "Établis un plan d'étude en comptant à rebours depuis la date de l'examen",
      it: "Crea un piano di studio che parte a ritroso dalla data dell'esame",
    } },
    { text: {
      de: "Übe praktische Aufgaben im Betrieb und bitte um Feedback",
      en: "Practise practical tasks at work and ask for feedback",
      fr: "Entraîne-toi aux tâches pratiques en entreprise et demande des retours",
      it: "Esercitati nei compiti pratici in azienda e chiedi riscontri",
    } },
    { text: {
      de: "Löse Probeprüfungen oder frühere Aufgaben, falls vorhanden",
      en: "Work through practice exams or past exercises, if available",
      fr: "Résous des examens d'essai ou d'anciens exercices, s'il y en a",
      it: "Svolgi esami di prova o esercizi degli anni precedenti, se disponibili",
    } },
  ],

  // ---------- Phase 8: Weiterbildung / Studium ----------
  801: [
    { text: {
      de: "Schau, welche Studiengänge an Fachhochschulen zu {beruf} passen",
      en: "See which degree programmes at universities of applied sciences fit {beruf}",
      fr: "Regarde quelles filières des hautes écoles spécialisées correspondent à {beruf}",
      it: "Guarda quali corsi di studio delle scuole universitarie professionali si addicono a {beruf}",
    } },
    { text: {
      de: "Besuche einen Infotag einer Hochschule oder schau dir eine Online-Info an",
      en: "Attend a university open day or watch an online information session",
      fr: "Va à une journée d'information d'une haute école ou suis une séance en ligne",
      it: "Partecipa a una giornata informativa di una scuola universitaria o a una sessione online",
    } },
    { text: {
      de: "Vergleiche zwei bis drei Studiengänge nach Inhalt, Dauer und Ort",
      en: "Compare two or three programmes by content, length and location",
      fr: "Compare deux ou trois filières selon le contenu, la durée et le lieu",
      it: "Confronta due o tre corsi di studio per contenuti, durata e sede",
    } },
    { text: {
      de: "Sprich mit jemandem, der den Studiengang studiert oder abgeschlossen hat",
      en: "Talk to someone who is studying or has completed the programme",
      fr: "Parle avec quelqu'un qui étudie ou a terminé cette filière",
      it: "Parla con qualcuno che studia o ha concluso il corso di studio",
    } },
    { text: {
      de: "Wähle deinen Favoriten und eine Alternative aus",
      en: "Choose your favourite and one alternative",
      fr: "Choisis ta filière préférée et une alternative",
      it: "Scegli il tuo corso preferito e un'alternativa",
    } },
  ],
  802: [
    { text: {
      de: "Lies auf der Website der Hochschule nach, welche Abschlüsse zugelassen sind",
      en: "Read on the university's website which qualifications are accepted",
      fr: "Lis sur le site de la haute école quels diplômes sont admis",
      it: "Leggi sul sito della scuola universitaria quali titoli sono ammessi",
    } },
    { text: {
      de: "Prüfe, ob du mit deinem Abschluss direkt zugelassen wirst oder ob dir etwas fehlt",
      en: "Check whether your qualification gives you direct entry or whether something is missing",
      fr: "Vérifie si ton diplôme te donne un accès direct ou s'il te manque quelque chose",
      it: "Verifica se il tuo titolo dà accesso diretto o se ti manca qualcosa",
    } },
    { text: {
      de: "Prüfe, ob es eine Aufnahmeprüfung oder ein Eignungsverfahren gibt",
      en: "Check whether there is an entrance exam or an aptitude procedure",
      fr: "Vérifie s'il y a un examen d'admission ou une procédure d'aptitude",
      it: "Verifica se c'è un esame di ammissione o una procedura attitudinale",
    } },
    { text: {
      de: "Frag bei der Studienberatung nach, wenn etwas unklar ist",
      en: "Ask the student advisory service if anything is unclear",
      fr: "Demande au service de conseil aux études si quelque chose n'est pas clair",
      it: "Chiedi alla consulenza agli studi se qualcosa non è chiaro",
    } },
    { text: {
      de: "Notiere, welche Unterlagen du für die Anmeldung brauchst",
      en: "Note which documents you need for the application",
      fr: "Note quels documents il te faut pour l'inscription",
      it: "Annota quali documenti ti servono per l'iscrizione",
    } },
  ],
  803: [
    { kind: "deadline", text: {
      de: "Trag die Anmeldefrist der Hochschule als Datum ein",
      en: "Enter the university's registration deadline as a date",
      fr: "Inscris le délai d'inscription de la haute école comme date",
      it: "Inserisci come data la scadenza di iscrizione della scuola universitaria",
    } },
    { text: {
      de: "Sammle die nötigen Unterlagen wie Zeugnisse und Lebenslauf",
      en: "Gather the required documents such as certificates and CV",
      fr: "Rassemble les documents nécessaires, comme les diplômes et le CV",
      it: "Raccogli i documenti richiesti, come diplomi e curriculum",
    } },
    { text: {
      de: "Füll das Anmeldeformular aus",
      en: "Fill in the registration form",
      fr: "Remplis le formulaire d'inscription",
      it: "Compila il modulo di iscrizione",
    } },
    { text: {
      de: "Bezahle allfällige Anmeldegebühren",
      en: "Pay any registration fees",
      fr: "Paie les éventuels frais d'inscription",
      it: "Paga eventuali tasse di iscrizione",
    } },
    { text: {
      de: "Speichere die Bestätigung deiner Anmeldung",
      en: "Save the confirmation of your registration",
      fr: "Enregistre la confirmation de ton inscription",
      it: "Salva la conferma della tua iscrizione",
    } },
  ],
  804: [
    { text: {
      de: "Schätze deine monatlichen Kosten für Studium, Wohnen und Alltag",
      en: "Estimate your monthly costs for studies, housing and daily life",
      fr: "Estime tes frais mensuels pour les études, le logement et le quotidien",
      it: "Stima i tuoi costi mensili per studio, alloggio e vita quotidiana",
    } },
    { text: {
      de: "Informiere dich bei deinem Kanton über Stipendien und Ausbildungsbeiträge",
      en: "Ask your canton about scholarships and education grants",
      fr: "Renseigne-toi auprès de ton canton sur les bourses d'études",
      it: "Informati presso il tuo cantone su borse di studio e sussidi per la formazione",
    } },
    { text: {
      de: "Frag nach, bis wann du ein Stipendiengesuch einreichen musst",
      en: "Ask by when you have to submit a scholarship application",
      fr: "Demande jusqu'à quand tu dois déposer une demande de bourse",
      it: "Chiedi entro quando devi presentare la domanda di borsa di studio",
    } },
    { text: {
      de: "Überlege, ob und wie viel du neben dem Studium arbeiten möchtest",
      en: "Think about whether and how much you want to work alongside your studies",
      fr: "Réfléchis à si et combien tu veux travailler à côté des études",
      it: "Rifletti se e quanto vuoi lavorare accanto allo studio",
    } },
    { text: {
      de: "Sprich mit deinen Eltern darüber, wie sie dich unterstützen können",
      en: "Talk to your parents about how they can support you",
      fr: "Parle avec tes parents de la façon dont ils peuvent te soutenir",
      it: "Parla con i tuoi genitori di come possono sostenerti",
    } },
  ],
};
