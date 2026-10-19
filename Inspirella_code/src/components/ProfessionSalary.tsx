import { useEffect, useState } from "react";
import { Coins } from "lucide-react";
import { DataRepository } from "../data/Repository";
import type { ApprenticeWage, LanguageCode, Profession, SalaryBenchmark } from "../types";

/**
 * Pay information for one profession, from two official-style sources and nothing invented:
 *  - apprentice pay recommended by the professional associations (berufsberatung.ch), per apprenticeship year;
 *  - the BFS wage statistics for the occupation group the profession belongs to (median and middle half).
 * The group figure is explicitly labelled as a group figure, not as this profession's wage.
 */

const LOCALE: Record<LanguageCode, string> = { de: "de-CH", en: "en-CH", fr: "fr-CH", it: "it-CH", uk: "uk-UA" };

const UI: Record<LanguageCode, {
  title: string; apprentice: string; yearN: (n: number) => string; perMonth: string; apprenticeNote: string;
  group: string; median: string; middle: string; byAge: string; under30: string; mid: string; over50: string;
  groupNote: (group: string) => string; source: string; approx: string;
}> = {
  de: {
    title: "Lohn", apprentice: "Lehrlingslohn (Empfehlung)", yearN: n => `${n}. Lehrjahr`, perMonth: "pro Monat",
    apprenticeNote: "Empfehlung der Berufsverbände. Der Lohn hängt von Region und Lehrbetrieb ab.",
    group: "Typischer Lohn in diesem Berufsfeld", median: "Mittlerer Monatslohn", middle: "Die mittleren 50 % verdienen",
    byAge: "Nach Alter", under30: "bis 29 Jahre", mid: "30–49 Jahre", over50: "ab 50 Jahre",
    groupNote: g => `Zahlen für die ganze Berufsgruppe «${g}», nicht nur für diesen Beruf. Brutto, auf Vollzeit umgerechnet.`,
    source: "Quelle: Bundesamt für Statistik, Lohnstrukturerhebung", approx: "ungefähr"
  },
  en: {
    title: "Pay", apprentice: "Apprentice pay (recommendation)", yearN: n => `Year ${n}`, perMonth: "per month",
    apprenticeNote: "Recommended by the professional associations. Actual pay depends on the region and the training company.",
    group: "Typical pay in this line of work", median: "Median monthly pay", middle: "The middle half earns",
    byAge: "By age", under30: "up to 29", mid: "30–49", over50: "50 and over",
    groupNote: g => `Figures for the whole occupational group "${g}", not only this profession. Gross, converted to full time.`,
    source: "Source: Swiss Federal Statistical Office, wage structure survey", approx: "about"
  },
  fr: {
    title: "Salaire", apprentice: "Salaire d'apprentissage (recommandation)", yearN: n => `${n}e année`, perMonth: "par mois",
    apprenticeNote: "Recommandation des associations professionnelles. Le salaire réel dépend de la région et de l'entreprise formatrice.",
    group: "Salaire habituel dans ce domaine", median: "Salaire mensuel médian", middle: "La moitié centrale gagne",
    byAge: "Selon l'âge", under30: "jusqu'à 29 ans", mid: "30–49 ans", over50: "50 ans et plus",
    groupNote: g => `Chiffres pour tout le groupe de professions « ${g} », pas seulement pour ce métier. Brut, converti à plein temps.`,
    source: "Source : Office fédéral de la statistique, enquête sur la structure des salaires", approx: "environ"
  },
  it: {
    title: "Stipendio", apprentice: "Salario d'apprendistato (raccomandazione)", yearN: n => `${n}° anno`, perMonth: "al mese",
    apprenticeNote: "Raccomandazione delle associazioni professionali. Il salario effettivo dipende dalla regione e dall'azienda formatrice.",
    group: "Stipendio tipico in questo ambito", median: "Stipendio mensile mediano", middle: "La metà centrale guadagna",
    byAge: "Per età", under30: "fino a 29 anni", mid: "30–49 anni", over50: "dai 50 anni",
    groupNote: g => `Cifre per l'intero gruppo di professioni «${g}», non solo per questa professione. Lordo, convertito a tempo pieno.`,
    source: "Fonte: Ufficio federale di statistica, rilevazione della struttura dei salari", approx: "circa"
  },
  uk: {
    title: "Зарплата", apprentice: "Оплата під час навчання (рекомендація)", yearN: n => `${n}-й рік`, perMonth: "на місяць",
    apprenticeNote: "Рекомендація професійних об’єднань. Реальна оплата залежить від регіону й підприємства, де ти навчаєшся.",
    group: "Типова зарплата в цій сфері", median: "Медіанна зарплата за місяць", middle: "Середня половина працівників отримує",
    byAge: "За віком", under30: "до 29 років", mid: "30–49 років", over50: "від 50 років",
    groupNote: g => `Цифри стосуються всієї професійної групи «${g}», а не лише цієї професії. Брутто, перераховано на повну зайнятість.`,
    source: "Джерело: Федеральне статистичне управління Швейцарії, обстеження структури заробітної плати", approx: "приблизно"
  }
};

/** Short names of the ISCO-08 two-digit groups, per language. */
const GROUP_NAME: Record<string, Record<LanguageCode, string>> = {
  "11": { de: "Geschäftsführung und leitende Verwaltung", en: "Chief executives and senior officials", fr: "Direction générale et cadres supérieurs", it: "Direzione generale e alti dirigenti", uk: "Керівники підприємств і вища адміністрація" },
  "12": { de: "Führungskräfte im kaufmännischen Bereich", en: "Business and administration managers", fr: "Cadres commerciaux et administratifs", it: "Dirigenti commerciali e amministrativi", uk: "Керівники у сфері бізнесу й адміністрування" },
  "13": { de: "Führungskräfte in Produktion und Dienstleistungen", en: "Production and specialised services managers", fr: "Cadres de production et de services spécialisés", it: "Dirigenti di produzione e servizi specializzati", uk: "Керівники виробництва й спеціалізованих послуг" },
  "14": { de: "Führungskräfte in Gastgewerbe, Handel und Dienstleistungen", en: "Hospitality, retail and services managers", fr: "Cadres de l'hôtellerie, du commerce et des services", it: "Dirigenti di ospitalità, commercio e servizi", uk: "Керівники у готельній справі, торгівлі й послугах" },
  "21": { de: "Naturwissenschaftler, Mathematiker und Ingenieure", en: "Science and engineering professionals", fr: "Spécialistes des sciences et de l'ingénierie", it: "Specialisti in scienze e ingegneria", uk: "Фахівці природничих наук та інженерії" },
  "22": { de: "Spezialisten in Gesundheitsberufen", en: "Health professionals", fr: "Spécialistes de la santé", it: "Specialisti della salute", uk: "Фахівці у сфері охорони здоров’я" },
  "23": { de: "Lehrkräfte", en: "Teaching professionals", fr: "Enseignants", it: "Insegnanti", uk: "Викладачі й педагоги" },
  "24": { de: "Betriebswirte und vergleichbare Spezialisten", en: "Business and administration professionals", fr: "Spécialistes en gestion et administration", it: "Specialisti in economia e amministrazione", uk: "Фахівці з бізнесу й адміністрування" },
  "25": { de: "Spezialisten der Informations- und Kommunikationstechnologie", en: "ICT professionals", fr: "Spécialistes des technologies de l'information", it: "Specialisti ICT", uk: "Фахівці з інформаційних технологій" },
  "26": { de: "Juristen, Sozialwissenschaftler und Kulturberufe", en: "Legal, social and cultural professionals", fr: "Juristes, spécialistes des sciences sociales et culturelles", it: "Giuristi, specialisti sociali e culturali", uk: "Юристи, соціальні й культурні фахівці" },
  "31": { de: "Ingenieurtechnische und vergleichbare Fachkräfte", en: "Science and engineering associate professionals", fr: "Techniciens et professions intermédiaires de l'ingénierie", it: "Tecnici delle scienze e dell'ingegneria", uk: "Технічні фахівці й техніки" },
  "32": { de: "Assistenzberufe im Gesundheitswesen", en: "Health associate professionals", fr: "Professions intermédiaires de la santé", it: "Professioni tecniche della salute", uk: "Асистентські професії в охороні здоров’я" },
  "33": { de: "Kaufmännische Fachkräfte und Verwaltungsfachkräfte", en: "Business and administration associate professionals", fr: "Professions intermédiaires commerciales et administratives", it: "Professioni commerciali e amministrative", uk: "Комерційні й адміністративні фахівці" },
  "34": { de: "Juristische, soziale und kulturelle Fachkräfte", en: "Legal, social, cultural and related associate professionals", fr: "Professions intermédiaires juridiques, sociales et culturelles", it: "Professioni giuridiche, sociali e culturali", uk: "Юридичні, соціальні й культурні фахівці" },
  "35": { de: "Informations- und Kommunikationstechniker", en: "ICT technicians", fr: "Techniciens de l'information et de la communication", it: "Tecnici ICT", uk: "Техніки з інформаційних технологій" },
  "41": { de: "Allgemeine Büro- und Sekretariatskräfte", en: "General and keyboard clerks", fr: "Employés de bureau et secrétaires", it: "Impiegati d'ufficio e segretari", uk: "Офісні працівники й секретарі" },
  "42": { de: "Bürokräfte mit Kundenkontakt", en: "Customer services clerks", fr: "Employés en contact avec la clientèle", it: "Impiegati a contatto con la clientela", uk: "Працівники з обслуговування клієнтів" },
  "43": { de: "Bürokräfte im Finanz- und Rechnungswesen", en: "Numerical and material recording clerks", fr: "Employés de la comptabilité et de la logistique", it: "Impiegati di contabilità e logistica", uk: "Працівники з обліку та матеріального забезпечення" },
  "44": { de: "Sonstige Bürokräfte", en: "Other clerical support workers", fr: "Autres employés de bureau", it: "Altri impiegati", uk: "Інші офісні працівники" },
  "51": { de: "Personenbezogene Dienstleistungen", en: "Personal service workers", fr: "Services aux personnes", it: "Servizi alla persona", uk: "Персональні послуги" },
  "52": { de: "Verkaufskräfte", en: "Sales workers", fr: "Vendeurs", it: "Addetti alle vendite", uk: "Працівники торгівлі" },
  "53": { de: "Betreuungsberufe", en: "Personal care workers", fr: "Professions des soins aux personnes", it: "Addetti all'assistenza", uk: "Працівники з догляду" },
  "54": { de: "Schutzkräfte und Sicherheitsbedienstete", en: "Protective services workers", fr: "Services de protection et de sécurité", it: "Addetti ai servizi di protezione", uk: "Працівники служб захисту й безпеки" },
  "61": { de: "Fachkräfte in der Landwirtschaft", en: "Market-oriented skilled agricultural workers", fr: "Agriculteurs qualifiés", it: "Agricoltori qualificati", uk: "Кваліфіковані працівники сільського господарства" },
  "62": { de: "Fachkräfte in Forstwirtschaft, Fischerei und Jagd", en: "Skilled forestry, fishery and hunting workers", fr: "Sylviculteurs, pêcheurs et chasseurs qualifiés", it: "Operai specializzati di foreste, pesca e caccia", uk: "Кваліфіковані працівники лісового господарства, рибальства й полювання" },
  "71": { de: "Bau- und Ausbaufachkräfte", en: "Building and related trades workers", fr: "Métiers du bâtiment et de la construction", it: "Operai edili e dell'edilizia", uk: "Будівельні й оздоблювальні професії" },
  "72": { de: "Metallarbeiter, Mechaniker und verwandte Berufe", en: "Metal, machinery and related trades workers", fr: "Métiers de la métallurgie et de la mécanique", it: "Operai metalmeccanici", uk: "Металообробники, механіки й суміжні професії" },
  "73": { de: "Präzisionshandwerker, Drucker und Kunsthandwerker", en: "Handicraft and printing workers", fr: "Artisans de précision et imprimeurs", it: "Artigiani di precisione e stampatori", uk: "Майстри точної механіки, друкарі й ремісники" },
  "74": { de: "Elektriker und Elektroniker", en: "Electrical and electronics trades workers", fr: "Électriciens et électroniciens", it: "Elettricisti ed elettronici", uk: "Електрики й електронники" },
  "75": { de: "Nahrungsmittel-, Holz- und Bekleidungsberufe", en: "Food, wood, garment and related trades", fr: "Métiers de l'alimentation, du bois et de l'habillement", it: "Mestieri alimentari, del legno e dell'abbigliamento", uk: "Харчова, деревообробна й швейна справа" },
  "81": { de: "Bediener stationärer Anlagen und Maschinen", en: "Stationary plant and machine operators", fr: "Conducteurs d'installations et de machines fixes", it: "Conduttori di impianti e macchinari fissi", uk: "Оператори стаціонарних установок і машин" },
  "82": { de: "Montageberufe", en: "Assemblers", fr: "Assembleurs", it: "Addetti al montaggio", uk: "Складальники" },
  "83": { de: "Fahrzeugführer und Bediener mobiler Anlagen", en: "Drivers and mobile plant operators", fr: "Conducteurs de véhicules et d'engins mobiles", it: "Conducenti di veicoli e macchinari mobili", uk: "Водії й оператори мобільних установок" },
  "91": { de: "Reinigungspersonal und Hilfskräfte", en: "Cleaners and helpers", fr: "Personnel de nettoyage et aides", it: "Addetti alle pulizie e aiutanti", uk: "Прибиральники й допоміжні працівники" },
  "92": { de: "Hilfsarbeiter in Land- und Forstwirtschaft", en: "Agricultural, forestry and fishery labourers", fr: "Ouvriers non qualifiés de l'agriculture et de la sylviculture", it: "Manovali di agricoltura e foreste", uk: "Допоміжні працівники в сільському й лісовому господарстві" },
  "93": { de: "Hilfsarbeiter in Bau, Herstellung und Transport", en: "Labourers in mining, construction, manufacturing and transport", fr: "Manœuvres de la construction, de l'industrie et des transports", it: "Manovali di edilizia, industria e trasporti", uk: "Допоміжні працівники в будівництві, виробництві й транспорті" },
  "94": { de: "Hilfskräfte in der Nahrungsmittelzubereitung", en: "Food preparation assistants", fr: "Aides en préparation alimentaire", it: "Aiuti nella preparazione di alimenti", uk: "Допоміжні працівники в харчовій сфері" },
  "96": { de: "Abfallentsorgung und sonstige Hilfsarbeitskräfte", en: "Refuse workers and other elementary workers", fr: "Éboueurs et autres manœuvres", it: "Addetti ai rifiuti e altri manovali", uk: "Працівники з вивезення відходів та інші допоміжні" }
};

interface Props {
  profession: Profession;
  language: LanguageCode;
  isDark: boolean;
}

export default function ProfessionSalary({ profession, language, isDark }: Props) {
  const ui = UI[language] ?? UI.en;
  const [benchmarks, setBenchmarks] = useState<SalaryBenchmark[]>([]);
  const [wages, setWages] = useState<ApprenticeWage[]>([]);

  const isApprenticeship = profession.professionType?.startsWith("apprenticeship") === true;
  const group = profession.iscoGroup && profession.iscoConfidence !== "low" ? profession.iscoGroup : undefined;

  useEffect(() => {
    let active = true;
    if (group) DataRepository.getSalaryBenchmarks().then(rows => active && setBenchmarks(rows)).catch(() => undefined);
    return () => { active = false; };
  }, [group]);

  useEffect(() => {
    let active = true;
    setWages([]);
    if (isApprenticeship) DataRepository.getApprenticeWages(profession.id).then(rows => active && setWages(rows)).catch(() => undefined);
    return () => { active = false; };
  }, [profession.id, isApprenticeship]);

  const rows = group ? benchmarks.filter(b => b.group === group) : [];
  const total = rows.find(b => b.age === "total");
  if (wages.length === 0 && !total) return null;

  const fmt = (n: number) => new Intl.NumberFormat(LOCALE[language] ?? "de-CH", { maximumFractionDigits: 0 }).format(n);
  const range = (min: number, max: number) => (min === max ? `CHF ${fmt(min)}` : `CHF ${fmt(min)}–${fmt(max)}`);
  const approx = profession.iscoConfidence === "medium" ? `${ui.approx} ` : "";
  const groupName = group ? GROUP_NAME[group]?.[language] ?? total?.groupName ?? "" : "";
  const byAge = (["bis29", "30-49", "ab50"] as const).map(age => ({ age, row: rows.find(b => b.age === age) })).filter(x => x.row);
  const ageLabel = { "bis29": ui.under30, "30-49": ui.mid, "ab50": ui.over50 } as const;
  const muted = isDark ? "text-zinc-400" : "text-violet-950/70";
  const strong = isDark ? "text-white" : "text-violet-950";

  return (
    <div className="card-premium space-y-3 p-3.5 text-left">
      <span className="flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-wider text-violet-400">
        <Coins className="h-3.5 w-3.5 shrink-0" /> {ui.title}
      </span>

      {wages.length > 0 && (
        <div className="space-y-1.5">
          <div className={`text-xs font-bold ${strong}`}>{ui.apprentice}</div>
          <ul className="grid grid-cols-1 gap-1 sm:grid-cols-2">
            {wages.map(w => (
              <li key={w.year} className={`flex items-baseline justify-between gap-2 rounded-lg border px-2.5 py-1.5 text-xs ${isDark ? "border-white/10 bg-white/[0.03]" : "border-purple-200 bg-white"}`}>
                <span className={muted}>{ui.yearN(w.year)}</span>
                <span className={`font-bold ${strong}`}>{range(w.min, w.max)}</span>
              </li>
            ))}
          </ul>
          <p className={`text-[11px] ${muted}`}>{ui.perMonth}. {ui.apprenticeNote}</p>
        </div>
      )}

      {total && (
        <div className="space-y-1.5">
          <div className={`text-xs font-bold ${strong}`}>{ui.group}</div>
          <div className={`text-xs ${muted}`}>
            {ui.median}: <span className={`text-sm font-extrabold ${strong}`}>{approx}CHF {fmt(total.median)}</span>
            {total.p25 !== undefined && total.p75 !== undefined && (
              <> · {ui.middle} {range(total.p25, total.p75)}</>
            )}
          </div>
          {byAge.length > 0 && (
            <div className={`flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] ${muted}`}>
              <span>{ui.byAge}:</span>
              {byAge.map(({ age, row }) => (
                <span key={age}>{ageLabel[age]}: <span className={`font-bold ${strong}`}>CHF {fmt(row!.median)}</span></span>
              ))}
            </div>
          )}
          <p className={`text-[11px] ${muted}`}>
            {ui.groupNote(groupName)} {ui.source} {total.year}.
            {total.sourceUrl && (
              <> <a href={total.sourceUrl} target="_blank" rel="noopener noreferrer" className="underline">BFS</a></>
            )}
          </p>
        </div>
      )}
    </div>
  );
}
