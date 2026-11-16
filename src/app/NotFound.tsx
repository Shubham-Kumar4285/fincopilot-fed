import { Link } from "react-router-dom";

import { PATHS } from "@/shared/config/paths";
import { buttonClasses } from "@/shared/ui/button-classes";

export function NotFound() {
  return (
    <main className="grid min-h-screen place-items-center px-6">
      <div className="flex max-w-sm flex-col items-center gap-3 text-center">
        <h1 className="text-2xl">Page not found</h1>
        <p className="text-secondary">That page doesn't exist or has moved.</p>
        <Link to={PATHS.landing} className={buttonClasses("secondary")}>
          Go home
        </Link>
      </div>
    </main>
  );
}
