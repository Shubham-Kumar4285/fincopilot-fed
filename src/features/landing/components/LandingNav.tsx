import { Link } from "react-router-dom";

import { PATHS } from "@/app/paths";
import { buttonClasses } from "@/shared/ui/button-classes";
import { Wordmark } from "@/shared/ui/Wordmark";

const NAV_LINKS = [
  { label: "Product", href: "#product" },
  { label: "Pricing", href: "#pricing" },
  { label: "Security", href: "#security" },
] as const;

export function LandingNav() {
  return (
    <header className="sticky top-0 z-20 h-[58px] border-b border-line bg-surface sm:h-16">
      <div className="mx-auto flex h-full max-w-[1120px] items-center px-4 sm:px-6">
        <Wordmark to={PATHS.landing} />
        <nav className="ml-14 hidden gap-7 sm:flex" aria-label="Primary">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="relative text-[13px] text-slate-600 after:absolute after:inset-x-0 after:-bottom-[5px] after:h-px after:origin-right after:scale-x-0 after:bg-current after:transition-transform after:duration-180 after:ease-out hover:text-text hover:after:origin-left hover:after:scale-x-100 motion-reduce:after:transition-none"
            >
              {link.label}
            </a>
          ))}
        </nav>
        <div className="ml-auto flex gap-1">
          <Link to={PATHS.login} className={buttonClasses("ghost", false, "hidden sm:inline-flex")}>
            Log in
          </Link>
          <Link to={PATHS.signup} className={buttonClasses("primary")}>
            Start free
          </Link>
        </div>
      </div>
    </header>
  );
}
