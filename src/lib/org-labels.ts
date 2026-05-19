export type OrgValue = "Al-Irfan" | "CARE";

export const ORG_LABELS: Record<OrgValue, string> = {
  "Al-Irfan": "جمعية العرفان الخيرية",
  CARE: "منظمة CARE",
};

export const ORG_OPTIONS: { value: OrgValue; label: string }[] = [
  { value: "Al-Irfan", label: ORG_LABELS["Al-Irfan"] },
  { value: "CARE", label: ORG_LABELS.CARE },
];

export function orgLabel(v: string | null | undefined): string {
  if (!v) return "";
  // Handle legacy "Al_Irfan" just in case
  const key = (v === "Al_Irfan" ? "Al-Irfan" : v) as OrgValue;
  return ORG_LABELS[key] ?? v;
}
