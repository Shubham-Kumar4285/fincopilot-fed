import { LoaderCircle } from "lucide-react";
import { isRouteErrorResponse, useRouteError } from "react-router-dom";

import { PATHS } from "./paths";

/** Suspense / loading fallback for lazy routes. */
export function RouteFallback() {
  return (
    <div className="grid min-h-screen place-items-center text-secondary" role="status">
      <LoaderCircle className="animate-spin-fast" size={20} aria-hidden />
      <span className="sr-only">Loading</span>
    </div>
  );
}

/** Root error boundary: a recoverable screen instead of a blank page. */
export function RouteError() {
  const error = useRouteError();
  const notFound = isRouteErrorResponse(error) && error.status === 404;

  return (
    <main className="grid min-h-screen place-items-center px-6">
      <div className="flex max-w-sm flex-col items-center gap-3 text-center">
        <h1 className="text-2xl">{notFound ? "Page not found" : "Something went wrong"}</h1>
        <p className="text-secondary">
          {notFound ? "That page doesn't exist." : "Reload the page to try again. If it keeps happening, contact support."}
        </p>
        <div className="mt-2 flex gap-2">
          {!notFound && (
            <button
              type="button"
              className="h-9 rounded-control bg-accent px-3.5 text-[13px] font-semibold text-white hover:bg-accent-hover"
              onClick={() => {
                window.location.reload();
              }}
            >
              Reload
            </button>
          )}
          <a className="inline-flex h-9 items-center px-3.5 text-[13px] font-semibold text-accent-hover hover:underline" href={PATHS.landing}>
            Go home
          </a>
        </div>
      </div>
    </main>
  );
}
