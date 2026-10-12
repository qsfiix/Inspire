import type { LanguageCode } from "../types";

/**
 * Impressum and privacy notice in the four site languages.
 * Inline markup: **bold**; e-mail addresses become mailto links. Plain language on
 * purpose (see the closing note of the privacy notice): not a substitute for legal advice.
 */
export interface LegalSection {
  heading: string;
  paragraphs?: string[];
  bullets?: string[];
}

export interface LegalDoc {
  eyebrow: string;
  title: string;
  updated: string;
  sections: LegalSection[];
  closing?: string;
  back: string;
}

export const CONTACT_EMAIL = "iinspirella@gmail.com";

export const IMPRESSUM: Record<LanguageCode, LegalDoc> = {
  de: {
    eyebrow: "Rechtliches",
    title: "Impressum",
    updated: "Stand: 12. Oktober 2026",
    sections: [
      {
        heading: "Verantwortlich",
        bullets: [
          "**Projekt:** Inspirella",
          "**Verantwortliche Person:** Sofiia Bokata",
          "**Sitz:** Schweiz, Kanton Bern",
          `**Kontakt:** ${CONTACT_EMAIL}`
        ]
      },
      {
        heading: "Rechtsform",
        paragraphs: ["Inspirella ist ein privates Projekt. Es gibt (noch) keine eingetragene Firma und keinen Verein."]
      },
      {
        heading: "Wofür Inspirella da ist (und wofür nicht)",
        paragraphs: [
          "Inspirella ist ein Orientierungswerkzeug und **keine offizielle Stelle**. Die Empfehlungen und Angaben sind eine Hilfe zum Nachdenken, keine Beratung im rechtlichen oder behördlichen Sinn und keine Zusicherung eines Platzes oder Abschlusses.",
          "Verbindliche Informationen zu Zulassung, Fristen, Kosten und reglementierten Berufen findest du bei den Berufsinformationszentren (BIZ) deines Kantons, auf berufsberatung.ch und bei den Schulen selbst."
        ]
      },
      {
        heading: "Datenquellen",
        paragraphs: [
          "Die Inhalte stammen aus öffentlich zugänglichen Quellen, vor allem berufsberatung.ch (SDBB | CSFO), den kantonalen Berufsinformationszentren und Bildungsämtern sowie den Websites der Schulen. Texte sind sinngemäss zusammengefasst, nicht abgeschrieben. In der App ist gekennzeichnet, was geprüft ist («Geprüft») und was noch vorläufig ist («Vorläufig»). Trotz Sorgfalt können Angaben veraltet oder unvollständig sein: Bitte prüfe sie an der verlinkten Quelle."
        ]
      },
      {
        heading: "Haftung für Inhalte und Links",
        paragraphs: [
          "Wir bemühen uns um richtige und aktuelle Angaben, übernehmen aber keine Gewähr dafür. Für Inhalte externer Websites, auf die verlinkt wird, sind ausschliesslich deren Betreiber verantwortlich."
        ]
      },
      {
        heading: "Urheberrecht",
        paragraphs: [
          "Gestaltung, Texte und Zusammenstellung von Inspirella: © Inspirella. Logos, Namen und Bilder von Schulen und Organisationen gehören den jeweiligen Inhabern. Kartendaten: © Mapbox, © OpenStreetMap-Mitwirkende."
        ]
      },
      {
        heading: "Datenschutz",
        paragraphs: ["Wie wir mit Daten umgehen, steht in der Datenschutzerklärung."]
      }
    ],
    back: "Zurück"
  },
  en: {
    eyebrow: "Legal",
    title: "Legal notice (Impressum)",
    updated: "As of 12 October 2026",
    sections: [
      {
        heading: "Responsible",
        bullets: [
          "**Project:** Inspirella",
          "**Responsible person:** Sofiia Bokata",
          "**Based in:** Switzerland, canton of Bern",
          `**Contact:** ${CONTACT_EMAIL}`
        ]
      },
      {
        heading: "Legal form",
        paragraphs: ["Inspirella is a private project. There is no registered company or association (yet)."]
      },
      {
        heading: "What Inspirella is for (and what it is not)",
        paragraphs: [
          "Inspirella is an orientation tool and **not an official authority**. Its recommendations and information are an aid to thinking, not advice in a legal or administrative sense and not a promise of a place or a qualification.",
          "For binding information on admission, deadlines, costs and regulated professions, go to the careers information centres (BIZ) of your canton, to berufsberatung.ch and to the schools themselves."
        ]
      },
      {
        heading: "Data sources",
        paragraphs: [
          "The content comes from publicly available sources, mainly berufsberatung.ch (SDBB | CSFO), the cantonal careers information centres and education offices, and the schools' own websites. Texts are paraphrased, not copied. The app marks what is checked (\"Verified\") and what is still provisional (\"Provisional\"). Despite our care, details may be outdated or incomplete: please check them at the linked source."
        ]
      },
      {
        heading: "Liability for content and links",
        paragraphs: [
          "We aim for correct and current information but give no guarantee. The operators of external websites we link to are solely responsible for their content."
        ]
      },
      {
        heading: "Copyright",
        paragraphs: [
          "Design, texts and compilation of Inspirella: © Inspirella. Logos, names and images of schools and organisations belong to their respective owners. Map data: © Mapbox, © OpenStreetMap contributors."
        ]
      },
      {
        heading: "Privacy",
        paragraphs: ["How we handle data is described in the privacy notice."]
      }
    ],
    back: "Back"
  },
  fr: {
    eyebrow: "Mentions légales",
    title: "Mentions légales (Impressum)",
    updated: "État au 12 octobre 2026",
    sections: [
      {
        heading: "Responsable",
        bullets: [
          "**Projet :** Inspirella",
          "**Personne responsable :** Sofiia Bokata",
          "**Siège :** Suisse, canton de Berne",
          `**Contact :** ${CONTACT_EMAIL}`
        ]
      },
      {
        heading: "Forme juridique",
        paragraphs: ["Inspirella est un projet privé. Il n'existe (pour l'instant) ni entreprise inscrite ni association."]
      },
      {
        heading: "À quoi sert Inspirella (et à quoi il ne sert pas)",
        paragraphs: [
          "Inspirella est un outil d'orientation et **non une instance officielle**. Les recommandations et les informations aident à réfléchir ; elles ne constituent ni un conseil au sens juridique ou administratif ni la promesse d'une place ou d'un diplôme.",
          "Pour des informations contraignantes sur l'admission, les délais, les coûts et les professions réglementées, adresse-toi aux centres d'information professionnelle (OP / BIZ) de ton canton, à berufsberatung.ch et aux écoles elles-mêmes."
        ]
      },
      {
        heading: "Sources des données",
        paragraphs: [
          "Les contenus proviennent de sources publiques, surtout berufsberatung.ch (CSFO), les centres cantonaux d'information professionnelle et les offices de formation, ainsi que les sites des écoles. Les textes sont reformulés, non copiés. L'application indique ce qui est vérifié (« Vérifié ») et ce qui est encore provisoire (« Provisoire »). Malgré notre soin, des informations peuvent être périmées ou incomplètes : vérifie-les à la source indiquée."
        ]
      },
      {
        heading: "Responsabilité pour les contenus et les liens",
        paragraphs: [
          "Nous visons des informations exactes et à jour, mais sans garantie. Les exploitants des sites externes vers lesquels nous renvoyons sont seuls responsables de leurs contenus."
        ]
      },
      {
        heading: "Droit d'auteur",
        paragraphs: [
          "Conception, textes et compilation d'Inspirella : © Inspirella. Les logos, noms et images des écoles et organisations appartiennent à leurs détenteurs. Données cartographiques : © Mapbox, © contributeurs d'OpenStreetMap."
        ]
      },
      {
        heading: "Protection des données",
        paragraphs: ["La manière dont nous traitons les données est décrite dans la déclaration de confidentialité."]
      }
    ],
    back: "Retour"
  },
  it: {
    eyebrow: "Note legali",
    title: "Note legali (Impressum)",
    updated: "Stato al 12 ottobre 2026",
    sections: [
      {
        heading: "Responsabile",
        bullets: [
          "**Progetto:** Inspirella",
          "**Persona responsabile:** Sofiia Bokata",
          "**Sede:** Svizzera, Canton Berna",
          `**Contatto:** ${CONTACT_EMAIL}`
        ]
      },
      {
        heading: "Forma giuridica",
        paragraphs: ["Inspirella è un progetto privato. Non esiste (ancora) né un'azienda iscritta né un'associazione."]
      },
      {
        heading: "A cosa serve Inspirella (e a cosa no)",
        paragraphs: [
          "Inspirella è uno strumento di orientamento e **non un'autorità ufficiale**. Raccomandazioni e informazioni aiutano a riflettere; non sono una consulenza in senso giuridico o amministrativo né la promessa di un posto o di un titolo.",
          "Per informazioni vincolanti su ammissione, scadenze, costi e professioni regolamentate rivolgiti agli uffici di orientamento (UOSP / BIZ) del tuo cantone, a berufsberatung.ch e alle scuole stesse."
        ]
      },
      {
        heading: "Fonti dei dati",
        paragraphs: [
          "I contenuti provengono da fonti pubbliche, soprattutto berufsberatung.ch (CSFO), gli uffici cantonali di orientamento e della formazione e i siti delle scuole. I testi sono riformulati, non copiati. L'app segnala cosa è verificato («Verificato») e cosa è ancora provvisorio («Provvisorio»). Nonostante la cura, i dati possono essere superati o incompleti: controllali alla fonte indicata."
        ]
      },
      {
        heading: "Responsabilità per contenuti e link",
        paragraphs: [
          "Puntiamo a informazioni corrette e aggiornate, ma senza garanzia. Dei contenuti dei siti esterni a cui rimandiamo rispondono esclusivamente i rispettivi gestori."
        ]
      },
      {
        heading: "Diritto d'autore",
        paragraphs: [
          "Grafica, testi e raccolta di Inspirella: © Inspirella. Loghi, nomi e immagini di scuole e organizzazioni appartengono ai rispettivi titolari. Dati cartografici: © Mapbox, © collaboratori di OpenStreetMap."
        ]
      },
      {
        heading: "Protezione dei dati",
        paragraphs: ["Come trattiamo i dati è descritto nell'informativa sulla privacy."]
      }
    ],
    back: "Indietro"
  }
};

export const PRIVACY: Record<LanguageCode, LegalDoc> = {
  en: {
    eyebrow: "Privacy",
    title: "Privacy notice",
    updated: "Last updated: 12 October 2026 · Plain-language summary, not a substitute for legal advice.",
    sections: [
      {
        heading: "Who is responsible",
        paragraphs: [`Inspirella is currently a private project run by Sofiia Bokata (Switzerland, canton of Bern), not a registered legal entity. For any privacy question, correction or deletion request, write to ${CONTACT_EMAIL}.`]
      },
      {
        heading: "Guest mode: nothing leaves your browser",
        paragraphs: ["If you use \"Try it without an account\", your profile and trackers are stored only in your browser's local storage. Nothing is sent to our servers, and clearing your browser data removes it completely."]
      },
      {
        heading: "What we collect with an account",
        bullets: [
          "**Account data:** your email address and a securely hashed password (handled by our authentication provider, Supabase - we never see your plain-text password).",
          "**Profile data you provide:** name, interface language, current education/career stage, and optional canton/city if you enter one.",
          "**Personalisation signals:** the interests, goals and target canton/language you select, used to compute your recommendations. Optional background answers (such as education, residence status, language levels) stay on your device unless you give explicit consent to store them.",
          "**Trackers:** the goals and tasks you create, so they follow you across devices.",
          "**Basic technical data:** standard server access logs (e.g. IP address, timestamp) generated automatically by our hosting infrastructure."
        ]
      },
      {
        heading: "Why we collect it",
        paragraphs: ["Solely to run the product: signing you in, remembering your profile and progress across devices, and computing the schools, professions and resources you see on your dashboard. We do not sell your data and we do not use it for advertising."]
      },
      {
        heading: "Who processes it",
        bullets: [
          "**Supabase** stores account and profile data (database and authentication).",
          "**Railway** hosts the website and **Cloudflare** delivers it and protects it from abuse; both process technical request data such as your IP address.",
          "**Mapbox** serves the interactive map; it may process technical request data (such as your IP address) when map tiles load, under Mapbox's own privacy terms.",
          "Fonts are served from our own site, not from third parties."
        ]
      },
      {
        heading: "Your rights",
        paragraphs: [`You can ask us to show you what we have, correct it, or delete your account and all associated data by writing to ${CONTACT_EMAIL}. You can also delete trackers or edit your profile directly in the app at any time.`]
      },
      {
        heading: "Cookies & local storage",
        paragraphs: ["We use your browser's local storage to remember your theme (dark/light) and, in guest mode, your profile and trackers. We do not use advertising or tracking cookies, and we do not run visitor analytics."]
      }
    ],
    closing: "This is an honest first version, written in plain language rather than formal legal text. As Inspirella grows we intend to have it reviewed by a lawyer familiar with Swiss (revDSG / nFADP) and EU (GDPR) data protection law.",
    back: "Back"
  },
  de: {
    eyebrow: "Datenschutz",
    title: "Datenschutzerklärung",
    updated: "Zuletzt aktualisiert: 12. Oktober 2026 · Zusammenfassung in einfacher Sprache, kein Ersatz für Rechtsberatung.",
    sections: [
      {
        heading: "Wer ist verantwortlich",
        paragraphs: [`Inspirella ist derzeit ein privates Projekt von Sofiia Bokata (Schweiz, Kanton Bern) und keine eingetragene juristische Person. Bei Fragen zum Datenschutz, Berichtigungs- oder Löschwünschen schreibe an ${CONTACT_EMAIL}.`]
      },
      {
        heading: "Gastmodus: nichts verlässt deinen Browser",
        paragraphs: ["Wenn du «Ohne Konto ausprobieren» nutzt, werden dein Profil und deine Tracker nur im lokalen Speicher deines Browsers abgelegt. Nichts wird an unsere Server gesendet; wenn du die Browserdaten löschst, ist alles weg."]
      },
      {
        heading: "Was wir mit einem Konto erfassen",
        bullets: [
          "**Kontodaten:** deine E-Mail-Adresse und ein sicher verschlüsseltes (gehashtes) Passwort. Das übernimmt unser Anmeldedienst Supabase; wir sehen dein Passwort nie im Klartext.",
          "**Profildaten, die du angibst:** Name, Sprache der Oberfläche, aktuelle Ausbildungs-/Berufsphase und optional Kanton/Ort.",
          "**Angaben zur Personalisierung:** die gewählten Interessen, Ziele und der Zielkanton bzw. die Sprache, damit wir deine Empfehlungen berechnen können. Freiwillige Hintergrundangaben (z. B. Ausbildung, Aufenthaltsstatus, Sprachniveaus) bleiben auf deinem Gerät, solange du nicht ausdrücklich der Speicherung zustimmst.",
          "**Tracker:** die Ziele und Aufgaben, die du anlegst, damit sie dir auf allen Geräten folgen.",
          "**Technische Basisdaten:** übliche Server-Zugriffsprotokolle (z. B. IP-Adresse, Zeitstempel), die unsere Hosting-Infrastruktur automatisch erzeugt."
        ]
      },
      {
        heading: "Wozu wir sie brauchen",
        paragraphs: ["Ausschliesslich, um das Produkt zu betreiben: dich anzumelden, Profil und Fortschritt geräteübergreifend zu merken und die Schulen, Berufe und Ressourcen zu berechnen, die du im Dashboard siehst. Wir verkaufen keine Daten und nutzen sie nicht für Werbung."]
      },
      {
        heading: "Wer die Daten verarbeitet",
        bullets: [
          "**Supabase** speichert Konto- und Profildaten (Datenbank und Anmeldung).",
          "**Railway** hostet die Website, **Cloudflare** liefert sie aus und schützt sie vor Missbrauch; beide verarbeiten technische Anfragedaten wie deine IP-Adresse.",
          "**Mapbox** liefert die interaktive Karte; beim Laden der Kartenkacheln können technische Anfragedaten (z. B. IP-Adresse) nach den eigenen Datenschutzbestimmungen von Mapbox verarbeitet werden.",
          "Schriften liefern wir von unserer eigenen Seite aus, nicht von Dritten."
        ]
      },
      {
        heading: "Deine Rechte",
        paragraphs: [`Du kannst uns bitten, dir mitzuteilen, welche Daten wir haben, sie zu berichtigen oder dein Konto samt allen Daten zu löschen: schreibe an ${CONTACT_EMAIL}. Tracker löschen und dein Profil bearbeiten kannst du jederzeit direkt in der App.`]
      },
      {
        heading: "Cookies & lokaler Speicher",
        paragraphs: ["Wir nutzen den lokalen Speicher deines Browsers, um dein Farbschema (hell/dunkel) und im Gastmodus dein Profil und deine Tracker zu merken. Wir setzen keine Werbe- oder Tracking-Cookies und betreiben keine Besucheranalyse."]
      }
    ],
    closing: "Das ist eine ehrliche erste Fassung in einfacher Sprache statt in juristischem Fachtext. Wenn Inspirella wächst, möchten wir sie von einer auf Schweizer (revDSG) und EU-Datenschutzrecht (DSGVO) spezialisierten Fachperson prüfen lassen.",
    back: "Zurück"
  },
  fr: {
    eyebrow: "Confidentialité",
    title: "Déclaration de confidentialité",
    updated: "Dernière mise à jour : 12 octobre 2026 · Résumé en langage simple, ne remplace pas un conseil juridique.",
    sections: [
      {
        heading: "Qui est responsable",
        paragraphs: [`Inspirella est actuellement un projet privé de Sofiia Bokata (Suisse, canton de Berne), et non une personne morale inscrite. Pour toute question sur la protection des données, ou pour demander une correction ou une suppression, écris à ${CONTACT_EMAIL}.`]
      },
      {
        heading: "Mode invité : rien ne quitte ton navigateur",
        paragraphs: ["Si tu utilises « Essayer sans compte », ton profil et tes suivis sont enregistrés uniquement dans le stockage local de ton navigateur. Rien n'est envoyé à nos serveurs ; si tu effaces les données du navigateur, tout disparaît."]
      },
      {
        heading: "Ce que nous collectons avec un compte",
        bullets: [
          "**Données du compte :** ton adresse e-mail et un mot de passe chiffré (haché) de façon sécurisée, géré par notre service d'authentification Supabase ; nous ne voyons jamais ton mot de passe en clair.",
          "**Données de profil que tu indiques :** nom, langue de l'interface, étape actuelle de formation/carrière et, si tu le souhaites, canton/ville.",
          "**Éléments de personnalisation :** les intérêts, objectifs et canton/langue cibles que tu choisis, utilisés pour calculer tes recommandations. Les réponses facultatives sur ton parcours (formation, statut de séjour, niveaux de langue) restent sur ton appareil tant que tu n'acceptes pas expressément leur enregistrement.",
          "**Suivis :** les objectifs et tâches que tu crées, pour qu'ils te suivent d'un appareil à l'autre.",
          "**Données techniques de base :** les journaux d'accès habituels des serveurs (p. ex. adresse IP, horodatage), générés automatiquement par notre hébergement."
        ]
      },
      {
        heading: "Pourquoi nous les collectons",
        paragraphs: ["Uniquement pour faire fonctionner le produit : te connecter, retenir ton profil et ta progression d'un appareil à l'autre, et calculer les écoles, métiers et ressources affichés sur ton tableau de bord. Nous ne vendons pas tes données et ne les utilisons pas pour la publicité."]
      },
      {
        heading: "Qui les traite",
        bullets: [
          "**Supabase** stocke les données de compte et de profil (base de données et authentification).",
          "**Railway** héberge le site et **Cloudflare** le diffuse et le protège contre les abus ; tous deux traitent des données techniques de requête comme ton adresse IP.",
          "**Mapbox** fournit la carte interactive ; au chargement des tuiles, des données techniques (p. ex. l'adresse IP) peuvent être traitées selon les conditions de confidentialité de Mapbox.",
          "Les polices sont servies depuis notre propre site, pas par des tiers."
        ]
      },
      {
        heading: "Tes droits",
        paragraphs: [`Tu peux nous demander de te montrer les données que nous avons, de les corriger ou de supprimer ton compte et toutes les données associées : écris à ${CONTACT_EMAIL}. Tu peux aussi supprimer des suivis ou modifier ton profil directement dans l'application à tout moment.`]
      },
      {
        heading: "Cookies et stockage local",
        paragraphs: ["Nous utilisons le stockage local de ton navigateur pour retenir ton thème (clair/sombre) et, en mode invité, ton profil et tes suivis. Nous n'utilisons ni cookies publicitaires ni cookies de suivi, et nous ne faisons pas d'analyse des visiteurs."]
      }
    ],
    closing: "Ceci est une première version honnête, rédigée en langage simple plutôt qu'en texte juridique formel. Quand Inspirella grandira, nous voulons la faire relire par une personne spécialisée en droit suisse (nLPD) et européen (RGPD) de la protection des données.",
    back: "Retour"
  },
  it: {
    eyebrow: "Privacy",
    title: "Informativa sulla privacy",
    updated: "Ultimo aggiornamento: 12 ottobre 2026 · Riepilogo in linguaggio semplice, non sostituisce una consulenza legale.",
    sections: [
      {
        heading: "Chi è responsabile",
        paragraphs: [`Inspirella è attualmente un progetto privato di Sofiia Bokata (Svizzera, Canton Berna) e non una persona giuridica iscritta. Per domande sulla privacy o richieste di correzione o cancellazione scrivi a ${CONTACT_EMAIL}.`]
      },
      {
        heading: "Modalità ospite: nulla lascia il tuo browser",
        paragraphs: ["Se usi «Prova senza account», il tuo profilo e i tuoi tracker restano solo nella memoria locale del browser. Nulla viene inviato ai nostri server; se cancelli i dati del browser, tutto sparisce."]
      },
      {
        heading: "Cosa raccogliamo con un account",
        bullets: [
          "**Dati dell'account:** il tuo indirizzo e-mail e una password cifrata (hash) in modo sicuro, gestita dal nostro servizio di autenticazione Supabase; non vediamo mai la tua password in chiaro.",
          "**Dati di profilo che indichi:** nome, lingua dell'interfaccia, fase attuale di formazione/carriera e, se vuoi, cantone/città.",
          "**Elementi di personalizzazione:** gli interessi, gli obiettivi e il cantone/la lingua di destinazione che scegli, usati per calcolare le raccomandazioni. Le risposte facoltative sul tuo percorso (formazione, statuto di soggiorno, livelli di lingua) restano sul tuo dispositivo finché non acconsenti espressamente al salvataggio.",
          "**Tracker:** gli obiettivi e i compiti che crei, perché ti seguano da un dispositivo all'altro.",
          "**Dati tecnici di base:** i normali registri di accesso del server (p. es. indirizzo IP, data e ora), generati automaticamente dal nostro hosting."
        ]
      },
      {
        heading: "Perché li raccogliamo",
        paragraphs: ["Solo per far funzionare il prodotto: farti accedere, ricordare profilo e progressi tra i dispositivi e calcolare le scuole, le professioni e le risorse che vedi nella dashboard. Non vendiamo i tuoi dati e non li usiamo per la pubblicità."]
      },
      {
        heading: "Chi li tratta",
        bullets: [
          "**Supabase** conserva i dati di account e profilo (database e autenticazione).",
          "**Railway** ospita il sito e **Cloudflare** lo distribuisce e lo protegge dagli abusi; entrambi trattano dati tecnici di richiesta come il tuo indirizzo IP.",
          "**Mapbox** fornisce la mappa interattiva; al caricamento dei riquadri possono essere trattati dati tecnici (p. es. l'indirizzo IP) secondo le condizioni di privacy di Mapbox.",
          "I caratteri tipografici sono forniti dal nostro sito, non da terzi."
        ]
      },
      {
        heading: "I tuoi diritti",
        paragraphs: [`Puoi chiederci di mostrarti i dati che abbiamo, di correggerli o di cancellare il tuo account e tutti i dati collegati: scrivi a ${CONTACT_EMAIL}. Puoi anche eliminare tracker o modificare il profilo direttamente nell'app in qualsiasi momento.`]
      },
      {
        heading: "Cookie e memoria locale",
        paragraphs: ["Usiamo la memoria locale del browser per ricordare il tema (chiaro/scuro) e, in modalità ospite, profilo e tracker. Non usiamo cookie pubblicitari o di tracciamento e non facciamo analisi dei visitatori."]
      }
    ],
    closing: "Questa è una prima versione onesta, scritta in linguaggio semplice e non in testo giuridico formale. Quando Inspirella crescerà, vogliamo farla rivedere da una persona esperta di diritto svizzero (nLPD) ed europeo (GDPR) sulla protezione dei dati.",
    back: "Indietro"
  }
};

/** Footer link labels. */
export const LEGAL_LINKS: Record<"impressum" | "privacy", Record<LanguageCode, string>> = {
  impressum: { de: "Impressum", en: "Legal notice", fr: "Mentions légales", it: "Note legali" },
  privacy: { de: "Datenschutz", en: "Privacy", fr: "Confidentialité", it: "Privacy" }
};
