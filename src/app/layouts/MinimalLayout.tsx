import { LogOut } from "lucide-react";
import { Outlet, useNavigate } from "react-router-dom";

import { useLogoutMutation, useSessionQuery } from "@/features/auth";
import { PATHS } from "@/shared/config/paths";
import { Button } from "@/shared/ui/Button";
import { Wordmark } from "@/shared/ui/Wordmark";

/** Wordmark top bar for onboarding and invite pages (Figma: MinimalTop). */
export function MinimalLayout() {
  const session = useSessionQuery();
  const logout = useLogoutMutation();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-canvas">
      <header className="flex h-16 items-center justify-between border-b border-line bg-surface px-4 sm:px-8">
        <Wordmark />
        {session.data === true && (
          <Button
            variant="ghost"
            loading={logout.isPending}
            onClick={() => {
              logout.mutate(undefined, { onSettled: () => void navigate(PATHS.login, { replace: true }) });
            }}
          >
            <LogOut size={16} aria-hidden /> Log out
          </Button>
        )}
      </header>
      <Outlet />
    </div>
  );
}
