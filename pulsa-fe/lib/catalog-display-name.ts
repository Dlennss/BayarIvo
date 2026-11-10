// Supplier labels are hidden only in the UI; source names and SKUs stay intact.
export function catalogDisplayName(name: string): string {
  const cleaned = name.replace(/\b(?:pulsa\s*24\s*jam|p24|h2hr?|h2r)\b/gi, "");
  if (cleaned === name) return name;
  return cleaned
    .replace(/\(\s*\)|\[\s*\]/g, "")
    .replace(/\s+/g, " ")
    .replace(/^[\s/|:,-]+|[\s/|:,-]+$/g, "") || "Bayarivo";
}
