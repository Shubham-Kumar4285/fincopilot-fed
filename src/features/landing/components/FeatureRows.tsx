import { featureRows } from "../data";

export function FeatureRows() {
  return (
    <section className="mx-auto max-w-[1120px] border-t border-line px-5 pt-6 pb-16 sm:px-6 sm:pt-8 sm:pb-24" id="product">
      {featureRows.map((row) => (
        <div
          key={row.title}
          className="grid grid-cols-[36px_1fr] items-baseline gap-4 border-b border-line py-8 sm:grid-cols-[64px_1fr_1.4fr] sm:gap-8"
        >
          <span className="text-xs tabular-nums text-secondary">{row.index}</span>
          <h2 className="text-xl">{row.title}</h2>
          <p className="col-start-2 text-secondary sm:col-start-auto">{row.copy}</p>
        </div>
      ))}
    </section>
  );
}
