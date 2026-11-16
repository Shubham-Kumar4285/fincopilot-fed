import { Check } from "lucide-react";
import { Link } from "react-router-dom";

import { PATHS } from "@/shared/config/paths";
import { cn } from "@/shared/lib/cn";
import { SoonBadge } from "@/shared/ui/SoonBadge";

interface Step {
  title: string;
  description: string;
  done: boolean;
  action?: { label: string; to: string };
  soon?: boolean;
}

export function SetupChecklist({ orgName, hasTeammates }: { orgName: string; hasTeammates: boolean }) {
  const steps: Step[] = [
    { title: "Workspace created", description: "Your defaults are saved.", done: true },
    {
      title: "Invite a teammate",
      description: "Add an accountant or collaborator.",
      done: hasTeammates,
      action: { label: "Invite", to: PATHS.settingsMembers },
    },
    { title: "Upload a document", description: "Available soon.", done: false, soon: true },
  ];
  const doneCount = steps.filter((step) => step.done).length;

  return (
    <section className="self-start rounded-card border border-line bg-surface p-5">
      <h2 className="text-[15px]">Set up your workspace</h2>
      <p className="mt-0.5 text-[13px] text-secondary">A few steps to get {orgName} ready.</p>

      <div className="mt-4 flex items-center gap-3 text-xs">
        <strong>
          {doneCount} of {steps.length}
        </strong>
        <span
          className="h-1.5 flex-1 overflow-hidden rounded-full bg-line"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={steps.length}
          aria-valuenow={doneCount}
          aria-label="Setup progress"
        >
          <i className="block h-full bg-accent" style={{ width: `${(doneCount / steps.length) * 100}%` }} />
        </span>
      </div>

      <ul className="mt-4 flex flex-col">
        {steps.map((step, index) => (
          <li key={step.title} className="flex items-center gap-3 border-t border-line py-3">
            <span
              className={cn(
                "grid size-6 shrink-0 place-items-center rounded-full text-[11px] font-semibold",
                step.done ? "bg-accent text-white" : "border border-line-strong text-secondary",
              )}
              aria-hidden
            >
              {step.done ? <Check size={14} /> : index + 1}
            </span>
            <div className="flex flex-1 flex-col">
              <strong className={cn("text-[13px]", step.done && "text-secondary line-through")}>{step.title}</strong>
              <small className="text-xs text-secondary">{step.description}</small>
            </div>
            {step.soon && <SoonBadge />}
            {!step.done && step.action && (
              <Link to={step.action.to} className="text-xs font-semibold text-accent-hover hover:underline">
                {step.action.label}
              </Link>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
