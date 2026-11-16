export interface LedgerDocument {
  file: string;
  vendor: string;
  date: string;
  category: string;
  amount: string;
  /** Four count-up steps shown in the footer total, ending on the new total. */
  totalSteps: [string, string, string, string];
}

export const LEDGER_CYCLE_MS = 8000;

export const ledgerDocuments: [LedgerDocument, ...LedgerDocument[]] = [
  {
    file: "aws-invoice-mar.pdf",
    vendor: "AWS",
    date: "06 Mar 2025",
    category: "Hosting",
    amount: "8,934.20 INR",
    totalSteps: ["28,298.00", "31,276.07", "34,254.13", "37,232.20"],
  },
  {
    file: "zoho-subscription-mar.pdf",
    vendor: "Zoho",
    date: "04 Mar 2025",
    category: "Software",
    amount: "2,478.00 INR",
    totalSteps: ["37,232.20", "38,058.20", "38,884.20", "39,710.20"],
  },
  {
    file: "indian-oil-receipt.pdf",
    vendor: "Indian Oil",
    date: "02 Mar 2025",
    category: "Travel",
    amount: "3,200.00 INR",
    totalSteps: ["39,710.20", "40,776.87", "41,843.53", "42,910.20"],
  },
  {
    file: "wework-invoice-mar.pdf",
    vendor: "WeWork",
    date: "01 Mar 2025",
    category: "Coworking",
    amount: "18,500.00 INR",
    totalSteps: ["42,910.20", "49,076.87", "55,243.53", "61,410.20"],
  },
];

export type SettledRow = {
  vendor: string;
  date: string;
  category: string;
  status: "Categorized" | "Needs review";
  amount: string;
};

export const settledLedgerRows: SettledRow[] = [
  { vendor: "Figma", date: "08 Mar 2025", category: "Software", status: "Categorized", amount: "4,120.00 INR" },
  { vendor: "Razorpay", date: "28 Feb 2025", category: "Bank fees", status: "Categorized", amount: "1,486.00 INR" },
  { vendor: "Adobe", date: "26 Feb 2025", category: "Software", status: "Categorized", amount: "4,956.00 INR" },
  { vendor: "IndiGo", date: "21 Feb 2025", category: "Travel", status: "Needs review", amount: "12,840.00 INR" },
];

export const featureRows = [
  { index: "01", title: "Read documents", copy: "Drop in a PDF or photo. Key fields are extracted without manual entry." },
  { index: "02", title: "Categorize and tax-flag", copy: "Every expense gets a suggested category and a clear tax treatment." },
  { index: "03", title: "Ask your books", copy: "Get plain-language answers grounded in your own invoices and expenses." },
] as const;

export const footerColumns = [
  { heading: "Product", links: ["Documents", "Categories", "Reports"] },
  { heading: "Company", links: ["About", "Security", "Contact"] },
  { heading: "Legal", links: ["Privacy", "Terms", "Data policy"] },
] as const;
