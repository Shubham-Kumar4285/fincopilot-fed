import { Link } from "react-router-dom";

import { PATHS } from "@/shared/config/paths";
import { useReducedMotion } from "@/shared/hooks/use-reduced-motion";
import { Button } from "@/shared/ui/Button";
import { buttonClasses } from "@/shared/ui/button-classes";

import { AnimatedLedger } from "./AnimatedLedger";

export function Hero() {
  const reduceMotion = useReducedMotion();
  const scrollToProduct = () => {
    document
      .getElementById("product")
      ?.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
  };

  return (
    <section className="mx-auto grid max-w-[1120px] items-start gap-10 px-5 py-14 sm:gap-12 sm:px-6 sm:pt-16 sm:pb-[88px] min-[1024px]:grid-cols-[minmax(0,0.82fr)_minmax(0,1.18fr)] min-[1024px]:pt-[68px]">
      <div className="max-w-[560px]">
        <h1 className="max-w-[540px] text-[40px]/[1.08] tracking-[-0.04em] text-balance min-[1024px]:mt-9 min-[1024px]:text-5xl/[1.08]">
          Your books, kept up as you work.
        </h1>
        <p className="mt-[22px] max-w-[530px] text-[15px]/[1.7] text-slate-600 sm:text-base/[1.7]">
          Upload an invoice or receipt, FinCopilot reads it, categorizes it, and flags what is likely
          tax-deductible. You review and confirm.
        </p>
        <div className="mt-7 flex flex-col gap-2 sm:flex-row">
          <Link to={PATHS.signup} className={buttonClasses("primary", false, "w-full sm:w-auto")}>
            Start free
          </Link>
          <Button variant="secondary" className="w-full sm:w-auto" onClick={scrollToProduct}>
            See how it works
          </Button>
        </div>
        <span className="mt-3 block text-xs text-secondary">Free during early access. No card needed.</span>
      </div>
      <AnimatedLedger />
    </section>
  );
}
