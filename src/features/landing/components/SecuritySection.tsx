import { securityPoints } from "../data";

export function SecuritySection() {
  return (
    <section
      id="security"
      aria-labelledby="security-heading"
      className="mx-auto max-w-[1120px] scroll-mt-16 px-5 pb-16 sm:px-6 sm:pb-24"
    >
      <h2 id="security-heading" className="max-w-[540px] text-[28px]/[1.15] tracking-[-0.03em]">
        Your financial records, handled carefully.
      </h2>
      <dl className="mt-8 grid gap-x-8 gap-y-6 border-t border-line pt-8 sm:grid-cols-3">
        {securityPoints.map((point) => (
          <div key={point.title}>
            <dt className="font-semibold text-text">{point.title}</dt>
            <dd className="mt-1.5 text-secondary">{point.copy}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-10 max-w-[640px] text-xs/relaxed text-secondary">
        Tax deductibility is a suggestion based on Indian tax rules, not tax advice. Confirm with your accountant
        before you file.
      </p>
    </section>
  );
}
