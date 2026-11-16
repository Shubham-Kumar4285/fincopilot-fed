import type { ReactNode } from "react";

import { Wordmark } from "@/shared/ui/Wordmark";

interface AuthLayoutProps {
  title: string;
  subtitle: string;
  children: ReactNode;
}

export function AuthLayout({ title, subtitle, children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen bg-white sm:grid sm:grid-cols-2">
      <aside className="flex h-[132px] flex-col justify-between border-b border-line bg-muted px-5 py-[22px] sm:h-auto sm:border-r sm:border-b-0 sm:px-12 sm:py-10">
        <Wordmark />
        <p className="max-w-[340px] text-[13px]/[1.45] tracking-tight text-slate-600 sm:max-w-[410px] sm:text-xl/normal">
          Built for freelancers who would rather be doing the work than the bookkeeping.
        </p>
      </aside>
      <main className="grid min-h-[calc(100vh-132px)] items-start justify-items-center px-5 pt-10 pb-20 sm:min-h-screen sm:place-items-center sm:px-8 sm:py-16">
        <div className="flex w-full max-w-[360px] flex-col gap-4 justify-self-center">
          <div className="mb-2.5">
            <h1 className="text-2xl sm:text-[28px]">{title}</h1>
            <p className="mt-1.5 text-secondary">{subtitle}</p>
          </div>
          {children}
        </div>
      </main>
    </div>
  );
}

/** "No account? Sign up" style footer line under auth forms. */
export function AuthSwitch({ children }: { children: ReactNode }) {
  return (
    <p className="text-center text-[13px] text-secondary [&_a]:font-semibold [&_a]:text-accent-hover [&_a:hover]:underline">
      {children}
    </p>
  );
}
