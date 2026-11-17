import { Check, FileText, Pause, Play } from "lucide-react";
import type { AnimationEvent } from "react";
import { useState } from "react";

import { Badge } from "@/shared/ui/Badge";
import { useReducedMotion } from "@/shared/hooks/use-reduced-motion";

import { ledgerDocuments, settledLedgerRows } from "../data";

/**
 * Hero demo: a document is "read" and categorized, then the next one rotates in.
 * All motion is CSS (see styles/ledger.css, 8s keyframes). The CSS cycle itself drives the swap:
 * when the row's keyframes loop, React advances the document and the `key` remount restarts every
 * keyframe together. Pausing the CSS therefore pauses the rotation too, so they can't drift.
 */
export function AnimatedLedger() {
  const [index, setIndex] = useState(0);
  // Hover pauses for a pointer; the button pauses for keyboard and touch (WCAG 2.2.2).
  const [hovered, setHovered] = useState(false);
  const [stopped, setStopped] = useState(false);
  const paused = hovered || stopped;
  const reduceMotion = useReducedMotion();
  const doc = ledgerDocuments[index % ledgerDocuments.length] ?? ledgerDocuments[0];

  const handleAnimationIteration = (event: AnimationEvent) => {
    if (event.animationName !== "resolving-row-enter") return;
    setIndex((current) => (current + 1) % ledgerDocuments.length);
  };

  const className = ["ledger-preview", "animated-ledger", paused && "is-paused", reduceMotion && "reduce-motion"]
    .filter(Boolean)
    .join(" ");

  return (
    <figure
      className={className}
      onMouseEnter={() => { setHovered(true); }}
      onMouseLeave={() => { setHovered(false); }}
      onAnimationIteration={handleAnimationIteration}
      aria-label="Example: an uploaded receipt is read, categorized and added to the month's ledger"
    >
      <div className="ledger-head">
        <div aria-hidden>
          <strong>March documents</strong>
          <span className="review-count">
            <span>5 of 12 reviewed</span>
            <span>6 of 12 reviewed</span>
          </span>
        </div>
        {!reduceMotion && (
          <button
            type="button"
            className="pause-hint"
            aria-pressed={stopped}
            onClick={() => { setStopped((current) => !current); }}
          >
            {stopped ? <Play size={11} aria-hidden /> : <Pause size={11} aria-hidden />}
            {stopped ? "Play" : paused ? "Paused" : "Pause"}
          </button>
        )}
      </div>

      <div className="file-arrival" key={`file-${index}`} aria-hidden>
        <FileText size={14} />
        <span>{doc.file}</span>
        <Badge>Reading</Badge>
      </div>

      <div className="animated-table" key={`table-${index}`} aria-hidden>
        <div className="ledger-grid ledger-column-head">
          <span>Vendor</span>
          <span>Date</span>
          <span>Category</span>
          <span>Status</span>
          <span>Amount</span>
        </div>

        <div className="ledger-grid resolving-row">
          <span className="resolving-cell field-vendor">
            <i className="skeleton-bar" />
            <strong>{doc.vendor}</strong>
          </span>
          <span className="resolving-cell field-date">
            <span>{doc.date}</span>
          </span>
          <span className="resolving-cell field-category">
            <i className="skeleton-bar" />
            <span>{doc.category}</span>
          </span>
          <span className="animated-status">
            <Badge tone="warning">Needs review</Badge>
            <Badge tone="success">
              <Check size={12} /> Categorized
            </Badge>
          </span>
          <span className="resolving-cell field-amount money">
            <i className="skeleton-bar" />
            <span>{doc.amount}</span>
          </span>
        </div>

        {settledLedgerRows.map((row, rowIndex) => (
          <div
            key={row.vendor}
            className={`ledger-grid settled-row ${rowIndex === settledLedgerRows.length - 1 ? "bottom-row" : ""}`}
          >
            <strong>{row.vendor}</strong>
            <span>{row.date}</span>
            <span>{row.category}</span>
            <span>
              <Badge tone={row.status === "Categorized" ? "success" : "warning"}>{row.status}</Badge>
            </span>
            <span className="money">{row.amount}</span>
          </div>
        ))}
      </div>

      <div className="ledger-total" aria-hidden>
        <span>Total this month</span>
        <strong className="money animated-total">
          {doc.totalSteps.map((total, stepIndex) => (
            <span className={`total-step-${stepIndex}`} key={total}>
              {total} INR
            </span>
          ))}
        </strong>
      </div>
    </figure>
  );
}
