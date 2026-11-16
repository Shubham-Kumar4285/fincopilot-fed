import { PATHS } from "@/app/paths";
import { Wordmark } from "@/shared/ui/Wordmark";

import { footerColumns } from "../data";

export function Footer() {
  return (
    <footer className="bg-slate-900 px-6 pt-14 pb-6 text-slate-300">
      <div className="mx-auto grid max-w-[1120px] grid-cols-2 gap-12 sm:grid-cols-[2fr_repeat(3,1fr)]">
        <div className="col-span-full flex flex-col items-start gap-2.5 sm:col-span-1">
          <Wordmark to={PATHS.landing} inverted />
          <p className="text-xs text-slate-400">Clear books for independent work.</p>
        </div>
        {footerColumns.map((column) => (
          <div key={column.heading} className="flex flex-col items-start gap-2.5">
            <strong className="text-xs text-white">{column.heading}</strong>
            {column.links.map((label) => (
              // Plain text until these pages exist; dead links are worse than no links.
              <span key={label} className="text-xs text-slate-400">
                {label}
              </span>
            ))}
          </div>
        ))}
      </div>
      <div className="mx-auto mt-12 max-w-[1120px] border-t border-slate-700 pt-5 text-[11px] text-slate-500">
        © {new Date().getFullYear()} FinCopilot Technologies Private Limited. All rights reserved.
      </div>
    </footer>
  );
}
