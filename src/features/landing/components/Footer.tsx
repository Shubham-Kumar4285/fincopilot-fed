import { Wordmark } from "@/shared/ui/Wordmark";

import { footerColumns } from "../data";

export function Footer() {
  return (
    <footer className="bg-slate-900 px-6 pt-14 pb-6 text-slate-300">
      <div className="mx-auto grid max-w-[1120px] grid-cols-2 gap-12 sm:grid-cols-[2fr_repeat(3,1fr)]">
        <div className="col-span-full flex flex-col items-start gap-2.5 sm:col-span-1">
          <Wordmark inverted />
          <p className="text-xs text-slate-400">Clear books for independent work.</p>
        </div>
        {footerColumns.map((column) => (
          <div key={column.heading} className="flex flex-col items-start gap-2.5">
            <strong className="text-xs text-white">{column.heading}</strong>
            {column.links.map((label) =>
              label === "Security" ? (
                <a key={label} href="#security" className="text-xs text-slate-300 underline-offset-4 hover:text-white hover:underline">
                  {label}
                </a>
              ) : (
                // Plain text until these pages exist; dead links are worse than no links.
                <span key={label} className="text-xs text-slate-400">
                  {label}
                </span>
              ),
            )}
          </div>
        ))}
      </div>
      <div className="mx-auto mt-12 max-w-[1120px] border-t border-slate-700 pt-5 text-xs text-slate-400">
        © {new Date().getFullYear()} FinCopilot. All rights reserved.
      </div>
    </footer>
  );
}
