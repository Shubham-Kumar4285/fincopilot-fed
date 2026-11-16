/** Country (ISO 3166-1 alpha-2) and currency (ISO 4217) choices offered in forms. */
export const COUNTRY_OPTIONS = [
  { value: "IN", label: "India" },
  { value: "SG", label: "Singapore" },
  { value: "AE", label: "United Arab Emirates" },
  { value: "US", label: "United States" },
  { value: "GB", label: "United Kingdom" },
] as const;

export const CURRENCY_OPTIONS = [
  { value: "INR", label: "INR — Indian Rupee" },
  { value: "USD", label: "USD — US Dollar" },
  { value: "SGD", label: "SGD — Singapore Dollar" },
  { value: "AED", label: "AED — UAE Dirham" },
  { value: "GBP", label: "GBP — British Pound" },
] as const;

export function optionLabel(options: readonly { value: string; label: string }[], value: string | null | undefined) {
  return options.find((option) => option.value === value)?.label ?? value ?? "—";
}
