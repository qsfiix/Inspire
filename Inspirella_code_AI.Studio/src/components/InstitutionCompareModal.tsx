import { ReactNode } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, ExternalLink, ShieldCheck } from "lucide-react";
import { Institution, LanguageCode } from "../types";
import { TRANSLATIONS } from "../data";
import { localizedText } from "../lib/localized";

interface InstitutionCompareModalProps {
  institutions: Institution[];
  currentLanguage: LanguageCode;
  theme?: "dark" | "light";
  onClose: () => void;
  onRemove: (id: string) => void;
}

/**
 * Side-by-side comparison of 2-3 institutions the user picked from the map.
 *
 * Trust rule (same as everywhere else in the app): a field the source record
 * doesn't have is shown as "not recorded", never left blank or guessed - see
 * 02_Product/Requirements/Trust and Data Requirements.md.
 */
export default function InstitutionCompareModal({
  institutions,
  currentLanguage,
  theme = "dark",
  onClose,
  onRemove
}: InstitutionCompareModalProps) {
  const t = TRANSLATIONS[currentLanguage];
  const isDark = theme !== "light";
  const noData = <span className="italic opacity-40">{t.compareNoData}</span>;

  const rows: { label: string; render: (inst: Institution) => ReactNode }[] = [
    { label: t.compareFieldCanton, render: inst => inst.canton || noData },
    { label: t.compareFieldCategory, render: inst => (inst.category ? inst.category.replace(/_/g, " ") : noData) },
    { label: t.compareFieldEstablished, render: inst => inst.establishedYear || noData },
    {
      label: t.compareFieldStudents,
      render: inst =>
        inst.studentCount ? (inst.studentCount >= 1000 ? `${(inst.studentCount / 1000).toFixed(0)}k+` : inst.studentCount) : noData
    },
    { label: t.compareFieldLanguage, render: inst => inst.cantonalLanguage || noData },
    {
      label: t.compareFieldVerified,
      render: inst =>
        inst.status === "verified" || inst.status === "official" || inst.status === "published" || inst.verified === true ? (
          <span className="inline-flex items-center gap-1 text-emerald-500 font-bold">
            <ShieldCheck className="h-3.5 w-3.5" /> {t.qualityVerified}
          </span>
        ) : (
          noData
        )
    },
    { label: t.compareFieldRating, render: inst => (inst.rating ? `★ ${inst.rating.toFixed(1)}` : noData) },
    {
      label: t.compareFieldWebsite,
      render: inst =>
        inst.website ? (
          <a
            href={inst.website}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-violet-400 hover:text-violet-300 underline"
          >
            {t.visitWebsite} <ExternalLink className="h-3 w-3" />
          </a>
        ) : (
          noData
        )
    }
  ];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.98 }}
          onClick={e => e.stopPropagation()}
          className={`w-full max-w-3xl max-h-[85vh] overflow-y-auto rounded-2xl border shadow-2xl ${
            isDark ? "bg-zinc-950 border-white/10 text-white" : "bg-white border-purple-200 text-black"
          }`}
        >
          <div className={`sticky top-0 z-10 flex items-center justify-between p-4 border-b backdrop-blur-md ${
            isDark ? "bg-zinc-950/95 border-white/10" : "bg-white/95 border-purple-200"
          }`}>
            <h2 className="text-base font-bold tracking-tight">{t.compareModalTitle}</h2>
            <button
              onClick={onClose}
              className={`p-1.5 rounded-lg transition ${isDark ? "hover:bg-white/10" : "hover:bg-purple-100"}`}
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="overflow-x-auto p-4">
            <table className="w-full border-collapse text-left text-xs min-w-[480px]">
              <thead>
                <tr>
                  <th className="p-2 w-28 shrink-0"></th>
                  {institutions.map(inst => (
                    <th key={inst.id} className={`p-2 align-top border-b ${isDark ? "border-white/10" : "border-purple-200"}`}>
                      <div className="flex items-start justify-between gap-2">
                        <span className={`font-black text-[13px] leading-snug ${isDark ? "text-violet-200" : "text-violet-950"}`}>
                          {inst.title}
                        </span>
                        <button
                          onClick={() => onRemove(inst.id)}
                          className={`shrink-0 p-1 rounded transition ${isDark ? "hover:bg-white/10 text-zinc-400" : "hover:bg-purple-100 text-violet-900/70"}`}
                          aria-label={t.compareRemove}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map(row => (
                  <tr key={row.label} className={`border-b ${isDark ? "border-white/5" : "border-purple-100"}`}>
                    <td className={`p-2 font-mono uppercase text-[11px] tracking-wider align-top ${isDark ? "text-zinc-400" : "text-violet-950/60 font-bold"}`}>
                      {row.label}
                    </td>
                    {institutions.map(inst => (
                      <td key={inst.id} className={`p-2 align-top ${isDark ? "text-zinc-200" : "text-zinc-800"}`}>
                        {row.render(inst)}
                      </td>
                    ))}
                  </tr>
                ))}
                {institutions.some(inst => localizedText(inst.description, currentLanguage)) && (
                  <tr>
                    <td className={`p-2 font-mono uppercase text-[11px] tracking-wider align-top ${isDark ? "text-zinc-400" : "text-violet-950/60 font-bold"}`}>
                      {t.admissionInfo}
                    </td>
                    {institutions.map(inst => (
                      <td key={inst.id} className={`p-2 align-top text-xs leading-relaxed ${isDark ? "text-zinc-300" : "text-zinc-700"}`}>
                        {localizedText(inst.description, currentLanguage) || noData}
                      </td>
                    ))}
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
