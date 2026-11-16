import type { ReactNode } from "react";

interface ProfileSectionProps {
  title: string;
  description: string;
  badge?: ReactNode;
  children: ReactNode;
}

export function ProfileSection({ title, description, badge, children }: ProfileSectionProps) {
  return (
    <section className="mb-5 rounded-card border border-line bg-surface">
      <div className="border-b border-line px-6 py-4">
        <h2 className="flex items-center gap-2 text-[15px]">
          {title}
          {badge}
        </h2>
        <p className="mt-0.5 text-[13px] text-secondary">{description}</p>
      </div>
      <div className="flex flex-col gap-4 px-6 py-5">{children}</div>
    </section>
  );
}
