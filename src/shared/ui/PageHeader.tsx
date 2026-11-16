import type { ReactNode } from "react";

export function PageHeader({ title, description, action }: { title: string; description: string; action?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="text-xl">{title}</h1>
        <p className="mt-1 text-secondary">{description}</p>
      </div>
      {action}
    </div>
  );
}
