import { useState, useEffect } from "react";
import { ShieldCheck, Check, Plus, Mail, Phone, Globe, Briefcase } from "lucide-react";
import { Institution, LanguageCode, ProfessionInstitutionLink } from "../types";
import { TRANSLATIONS } from "../data";
import { DataRepository } from "../data/Repository";
import { localizedText } from "../lib/localized";
import { categoryLabel } from "../lib/categoryLabels";
import { isTrusted, isProvisional } from "../lib/quality";
import { AdmissionBox } from "./PathwayInfo";
import { admissionRoutesForInstitution } from "../lib/pathwayInfo";

// Focus flags (BM directions, FMS) for every institution: one fetch, shared by all cards.
let focusAreasCache: Promise<Map<string, { code: string; note?: string }[]>> | null = null;
const loadFocusAreas = () => (focusAreasCache ??= DataRepository.getInstitutionFocusAreas());

interface InstitutionDetailCardProps {
  institution: Institution;
  currentLanguage: LanguageCode;
  theme?: "dark" | "light";
  isInCompare: boolean;
  compareDisabled: boolean;
  onToggleCompare: () => void;
}

/**
 * The single "here's everything we know about this institution" card.
 * Used by both the 3D map (pin click) and the Resources & Careers institution
 * explorer (list selection) - previously each screen kept its own near-copy
 * of this markup, which had already drifted (map was missing the
 * profile/studentLife/languageEnvironment/housingNotes/applicationNotes
 * fields, and used a hardcoded "VERIFIED"/"PROVISIONAL DATA" badge instead of
 * translated isTrusted()/isProvisional() like every other screen). One
 * component now, so the two surfaces can't drift again.
 *
 * Every section below hides itself when the underlying field is absent -
 * most institutions today only have a handful of these fields filled in
 * (see Decisions.md, 2026-09-28), and an empty section would look broken.
 */
export default function InstitutionDetailCard({
  institution,
  currentLanguage,
  theme = "dark",
  isInCompare,
  compareDisabled,
  onToggleCompare
}: InstitutionDetailCardProps) {
  const t = TRANSLATIONS[currentLanguage];
  const isDark = theme !== "light";

  // Curated institution -> profession pathways (see profession_institutions).
  // Fetched once per mount, catalog-wide, same reasoning as the reverse
  // (profession -> institution) lookup in ProfessionsExplorer - this is
  // small reference data, not worth re-fetching per selection.
  const [professionLinks, setProfessionLinks] = useState<ProfessionInstitutionLink[]>([]);
  useEffect(() => {
    let active = true;
    DataRepository.getProfessionInstitutionLinks().then(links => {
      if (active) setProfessionLinks(links);
    });
    return () => { active = false; };
  }, []);
  const institutionProfessions = professionLinks.filter(link => link.institutionId === institution.id);

  const [focusCodes, setFocusCodes] = useState<string[]>([]);
  useEffect(() => {
    let active = true;
    loadFocusAreas().then(map => {
      if (active) setFocusCodes((map.get(institution.id) ?? []).map(f => f.code));
    });
    return () => { active = false; };
  }, [institution.id]);
  const admissionRoutes = admissionRoutesForInstitution(institution.subgroup, focusCodes);

  return (
    <div className="flex flex-col justify-between h-full space-y-4">
      <div className="space-y-4 text-left">
        {/* Real photo only - no generic stock fallback (see Trust and Data Requirements.md) */}
        {institution.imageUrl && (
          <div>
            <div className="relative h-32 w-full rounded-xl overflow-hidden border border-white/10 bg-white/5 shadow-inner">
              <img
                src={institution.imageUrl}
                alt={institution.title}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover opacity-80 hover:opacity-100 transition duration-300"
              />
            </div>
            {institution.imageAttribution && (
              <p className={`mt-1 text-[11px] leading-snug ${isDark ? "text-zinc-400" : "text-violet-950/70"}`}>
                {institution.imageAttribution}
              </p>
            )}
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-3 border-purple-200/10">
          <div>
            <h3 className={`text-base font-extrabold flex items-center gap-1.5 leading-tight ${isDark ? "text-white" : "text-violet-950 font-black"}`}>
              {institution.title}
              {isTrusted(institution) && <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0" />}
              {isProvisional(institution) && (
                <span className="ml-2 inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[11px] font-mono font-bold bg-amber-500/15 text-amber-500 border border-amber-500/25">
                  {t.qualityProvisional}
                </span>
              )}
            </h3>
            <div className="flex flex-wrap items-center gap-1.5 mt-1">
              {institution.category && (
                <span className={`inline-block text-[11px] font-mono px-1.5 py-0.5 rounded ${
                  isDark ? "bg-violet-950/40 text-violet-300" : "bg-purple-100 text-violet-950 font-bold"
                }`}>
                  {categoryLabel(institution.category, currentLanguage)}
                </span>
              )}
              <span className={`text-[11px] font-mono ${isDark ? "text-zinc-400" : "text-violet-950/70 font-semibold"}`}>
                {institution.canton ? `Canton ${institution.canton}` : t.mapCantonUnknown}
              </span>
            </div>
          </div>

          {typeof institution.rating === "number" && (
            <span className="inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[11px] font-mono font-bold bg-amber-500/15 text-amber-500 border border-amber-500/25">
              ★ {institution.rating.toFixed(1)}
            </span>
          )}
        </div>

        {localizedText(institution.description, currentLanguage) && (
          <p className={`text-xs leading-relaxed ${isDark ? "text-zinc-300" : "text-violet-950 font-semibold"}`}>
            {localizedText(institution.description, currentLanguage)}
          </p>
        )}

        {/* Rich German texts reach other languages via the nightly DeepL run
            (Supabase function translate-missing) - say so, honestly. */}
        {currentLanguage !== "de" && institution.profile?.[currentLanguage] && (
          <p className={`text-[11px] italic ${isDark ? "text-zinc-400" : "text-violet-950/70"}`}>{t.autoTranslatedNote}</p>
        )}
        {localizedText(institution.profile, currentLanguage) && (
          <div className="card-premium p-3.5">
            <span className="block text-[11px] font-mono uppercase tracking-wider text-violet-400 mb-1">{t.institutionProfileLabel}</span>
            <p className={`text-xs leading-relaxed ${isDark ? "text-zinc-200" : "text-violet-950 font-semibold"}`}>
              {localizedText(institution.profile, currentLanguage)}
            </p>
          </div>
        )}

        {(institution.establishedYear || institution.studentCount || institution.cantonalLanguage) && (
          <div className="grid grid-cols-3 gap-1.5">
            {institution.establishedYear && (
              <div className="card-premium p-2 text-center">
                <span className="block text-[10px] font-mono uppercase tracking-wider text-violet-400">Established</span>
                <span className={`text-xs font-extrabold font-mono ${isDark ? "text-zinc-200" : "text-violet-950"}`}>{institution.establishedYear}</span>
              </div>
            )}
            {institution.studentCount && (
              <div className="card-premium p-2 text-center">
                <span className="block text-[10px] font-mono uppercase tracking-wider text-violet-400">Students</span>
                <span className={`text-xs font-extrabold font-mono ${isDark ? "text-zinc-200" : "text-violet-950"}`}>
                  {institution.studentCount >= 1000 ? `${(institution.studentCount / 1000).toFixed(0)}k+` : institution.studentCount}
                </span>
              </div>
            )}
            {institution.cantonalLanguage && (
              <div className="card-premium p-2 text-center">
                <span className="block text-[10px] font-mono uppercase tracking-wider text-violet-400">Language</span>
                <span className={`text-[11px] font-extrabold font-mono truncate block ${isDark ? "text-zinc-200" : "text-violet-950"}`}>{institution.cantonalLanguage}</span>
              </div>
            )}
          </div>
        )}

        {localizedText(institution.studentLife, currentLanguage) && (
          <div className="card-premium p-3.5">
            <span className="block text-[11px] font-mono uppercase tracking-wider text-violet-400 mb-1">{t.studentLifeLabel}</span>
            <p className={`text-xs leading-relaxed ${isDark ? "text-zinc-200" : "text-violet-950 font-semibold"}`}>
              {localizedText(institution.studentLife, currentLanguage)}
            </p>
          </div>
        )}

        {(localizedText(institution.languageEnvironment, currentLanguage) || localizedText(institution.housingNotes, currentLanguage)) && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {localizedText(institution.languageEnvironment, currentLanguage) && (
              <div className="card-premium p-3">
                <span className="block text-[11px] font-mono uppercase tracking-wider text-violet-400 mb-1">{t.languageEnvironmentLabel}</span>
                <p className={`text-xs leading-relaxed font-semibold ${isDark ? "text-zinc-200" : "text-violet-950"}`}>
                  {localizedText(institution.languageEnvironment, currentLanguage)}
                </p>
              </div>
            )}
            {localizedText(institution.housingNotes, currentLanguage) && (
              <div className="card-premium p-3">
                <span className="block text-[11px] font-mono uppercase tracking-wider text-violet-400 mb-1">{t.housingNotesLabel}</span>
                <p className={`text-xs leading-relaxed font-semibold ${isDark ? "text-zinc-200" : "text-violet-950"}`}>
                  {localizedText(institution.housingNotes, currentLanguage)}
                </p>
              </div>
            )}
          </div>
        )}

        {localizedText(institution.admissionRequirements, currentLanguage) && (
          <div className="card-premium-accent p-3.5">
            <span className="block text-[11px] font-mono uppercase tracking-wider text-violet-400 mb-1">{t.admissionInfo}</span>
            <p className={`text-xs leading-relaxed ${isDark ? "text-zinc-200" : "text-violet-950 font-semibold"}`}>
              {localizedText(institution.admissionRequirements, currentLanguage)}
            </p>
            <p className={`mt-2 text-[11px] leading-relaxed ${isDark ? "text-zinc-400" : "text-violet-950/70 font-semibold"}`}>
              {t.verifyWithInstitution}
            </p>
          </div>
        )}

        {localizedText(institution.applicationNotes, currentLanguage) && (
          <div className="card-premium-accent p-3.5">
            <span className="block text-[11px] font-mono uppercase tracking-wider text-violet-400 mb-1">{t.applicationNotesLabel}</span>
            <p className={`text-xs leading-relaxed ${isDark ? "text-zinc-200" : "text-violet-950 font-semibold"}`}>
              {localizedText(institution.applicationNotes, currentLanguage)}
            </p>
          </div>
        )}

        {/* How to get in: the canton's rules for the routes this school offers (Gymnasium, FMS, BM). */}
        <AdmissionBox canton={institution.canton} routes={admissionRoutes} language={currentLanguage} isDark={isDark} />

        {/* Institution -> profession pathways, reverse of "Where to study
            this" on the profession card. Honest empty: most institutions
            don't have one yet, so this simply doesn't render rather than
            claiming full coverage. */}
        {institutionProfessions.length > 0 && (
          <div className="space-y-1.5 text-left">
            <span className="block text-[11px] font-mono uppercase tracking-wider text-violet-400">
              {t.institutionProfessionsLabel}
            </span>
            <div className="space-y-1">
              {institutionProfessions.map(link => (
                <div
                  key={link.id}
                  className={`flex items-center gap-2 text-xs px-2.5 py-1.5 rounded-lg ${
                    isDark ? "bg-white/5 border border-white/5 text-zinc-200" : "bg-purple-50 text-violet-950 font-semibold border border-purple-200/40"
                  }`}
                >
                  <Briefcase className="h-3 w-3 text-violet-400 shrink-0" />
                  <span className="flex-1 min-w-0 truncate">
                    {link.professionTitle || link.professionId}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {institution.tags && institution.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {institution.tags.map((tag, idx) => (
              <span key={idx} className={`text-[11px] font-mono font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded border ${
                isDark ? "bg-zinc-900 text-zinc-400 border-violet-900/30" : "bg-purple-100/60 text-violet-950 border-purple-200/50"
              }`}>
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-2.5">
        <button
          onClick={onToggleCompare}
          disabled={!isInCompare && compareDisabled}
          title={!isInCompare && compareDisabled ? t.compareFull : undefined}
          className={`w-full flex items-center justify-center gap-1.5 rounded-lg border py-2 text-xs font-bold tracking-wide transition disabled:opacity-40 disabled:cursor-not-allowed ${
            isInCompare
              ? "bg-violet-600/20 border-violet-500/40 text-violet-300"
              : isDark ? "bg-white/5 border-white/10 text-zinc-300 hover:bg-white/10" : "bg-purple-50 border-purple-200 text-violet-950 hover:bg-purple-100"
          }`}
        >
          {isInCompare ? (<><Check className="h-3.5 w-3.5" /> {t.compareRemove}</>) : (<><Plus className="h-3.5 w-3.5" /> {t.compareAdd}</>)}
        </button>

        {(institution.email || institution.phone) && (
          <div className="flex items-center gap-2 text-xs">
            {institution.email && (
              <a href={`mailto:${institution.email}`} className={`inline-flex items-center gap-1 ${isDark ? "text-zinc-300 hover:text-violet-300" : "text-violet-950 hover:text-violet-600 font-semibold"}`}>
                <Mail className="h-3 w-3 text-violet-500" /> {institution.email}
              </a>
            )}
            {institution.phone && (
              <span className={`inline-flex items-center gap-1 ${isDark ? "text-zinc-300" : "text-violet-950 font-semibold"}`}>
                <Phone className="h-3 w-3 text-violet-500" /> {institution.phone}
              </span>
            )}
          </div>
        )}

        {institution.website && (
          <a
            href={institution.website}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary flex h-9 w-full items-center justify-center gap-2 text-xs tracking-wider"
          >
            <Globe className="h-3.5 w-3.5" /> {t.visitWebsite}
          </a>
        )}
      </div>
    </div>
  );
}
