import { Check, FileText } from "lucide-react";
import { useEffect, useState } from "react";

import { Badge } from "@/shared/ui/Badge";
import { useReducedMotion } from "@/shared/hooks/use-reduced-motion";

import { LEDGER_CYCLE_MS, ledgerDocuments, settledLedgerRows } from "../data";

/**
 * Hero demo: a document is "read" and categorized, then the next one rotates in.
 * All motion is CSS (see styles/ledger.css, 8s keyframes). React only swaps the document
 * every cycle; changing `key` remounts the rows so the keyframes restart in sync.
 */
export function AnimatedLedger() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const reduceMotion = useReducedMotion();
  const doc = ledgerDocuments[index % ledgerDocuments.length] ?? ledgerDocuments[0];

  useEffect(() => {
    if (paused || reduceMotion) return;
    const timer = window.setInterval(
      () => { setIndex((current) => (current + 1) % ledgerDocuments.length); },
      LEDGER_CYCLE_MS,
    );
    return () => { window.clearInterval(timer); };
  }, [paused, reduceMotion]);

  const className = ["ledger-preview", "animated-ledger", paused && "is-paused", reduceMotion && "reduce-motion"]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      className={className}
      onMouseEnter={() => { setPaused(true); }}
      onMouseLeave={() => { setPaused(false); }}
      aria-label="Example of documents being read and categorized"
    >
      <div className="ledger-head">
        <div>
          <strong>March documents</strong>
          <span className="review-count">
            <span>5 of 12 reviewed</span>
            <span>6 of 12 reviewed</span>
          </span>
        </div>
        <span className="pause-hint">{paused ? "Paused" : "Hover to pause"}</span>
      </div>

      <div className="file-arrival" key={`file-${index}`}>
        <FileText size={14} />
        <span>{doc.file}</span>
        <Badge>Reading</Badge>
      </div>

      <div className="animated-table" key={`table-${index}`}>
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

      <div className="ledger-total">
        <span>Total this month</span>
        <strong className="money animated-total">
          {doc.totalSteps.map((total, stepIndex) => (
            <span className={`total-step-${stepIndex}`} key={total}>
              {total} INR
            </span>
          ))}
        </strong>
      </div>
    </div>
  );
}
