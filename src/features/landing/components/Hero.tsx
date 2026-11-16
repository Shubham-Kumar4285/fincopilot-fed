import { Link } from "react-router-dom";

import { PATHS } from "@/shared/config/paths";
import { Button } from "@/shared/ui/Button";
import { buttonClasses } from "@/shared/ui/button-classes";

import { AnimatedLedger } from "./AnimatedLedger";

export function Hero() {
  const scrollToProduct = () => {
    document.getElementById("product")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <section className="mx-auto grid max-w-[1120px] items-start gap-10 px-5 py-14 sm:gap-12 sm:px-6 sm:pt-16 sm:pb-[88px] min-[900px]:grid-cols-[minmax(0,0.82fr)_minmax(590px,1.18fr)] min-[900px]:pt-[68px]">
      <div className="max-w-[560px]">
        <span className="block text-[11px] font-semibold tracking-[0.09em] text-secondary">
          BOOKKEEPING THAT KEEPS UP
        </span>
        <h1 className="mt-4 max-w-[540px] text-[40px]/[1.08] tracking-[-0.04em] min-[900px]:text-5xl/[1.08]">
          Your books, kept up as you work.
        </h1>
        <p className="mt-[22px] max-w-[530px] text-[15px]/[1.7] text-slate-600 sm:text-base/[1.7]">
          Upload an invoice or receipt, FinCopilot reads it, categorizes it, and flags what is tax-deductible. You
          review and confirm.
        </p>
        <div className="mt-7 flex flex-col gap-2 sm:flex-row">
          <Link to={PATHS.signup} className={buttonClasses("primary", false, "w-full sm:w-auto")}>
            Start free
          </Link>
          <Button variant="secondary" className="w-full sm:w-auto" onClick={scrollToProduct}>
            See how it works
          </Button>
        </div>
        <span className="mt-3 block text-xs text-secondary">Free for 10 documents a month.</span>
      </div>
      <AnimatedLedger />
    </section>
  );
}
