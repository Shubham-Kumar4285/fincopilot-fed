import { FileText, Upload } from "lucide-react";

import { Button } from "@/shared/ui/Button";

export function EmptyDocuments() {
  return (
    <div className="flex min-h-[390px] flex-col items-center justify-center gap-2 rounded-card border border-line bg-surface p-8 text-center">
      <span className="mb-2 grid size-12 place-items-center rounded-full bg-muted text-secondary" aria-hidden>
        <FileText size={22} />
      </span>
      <h2 className="text-lg">Nothing here yet</h2>
      <p className="text-secondary">Upload your first invoice or receipt to get started.</p>
      <Button disabled className="mt-3">
        <Upload size={16} aria-hidden /> Upload document
      </Button>
      <span className="text-xs text-secondary">Document processing is coming soon.</span>
    </div>
  );
}
