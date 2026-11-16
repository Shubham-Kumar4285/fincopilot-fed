import type { ReactNode } from "react";

import { SoonBadge } from "@/shared/ui/SoonBadge";

import { ProfileSection } from "./ProfileSection";

/** A designed section whose backend isn't built yet: rendered disabled. */
export function SoonSection({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  return (
    <ProfileSection title={title} description={description} badge={<SoonBadge />}>
      <fieldset disabled className="flex flex-col gap-4 opacity-60">
        {children}
      </fieldset>
    </ProfileSection>
  );
}
