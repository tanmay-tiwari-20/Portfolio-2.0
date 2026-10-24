export function getSocialDisplayLabel(label: string, href: string) {
  const normalizedLabel = label.trim();
  let isXLink = false;

  try {
    isXLink = new URL(href).hostname.replace(/^www\./, "").toLowerCase() === "x.com";
  } catch {
    // Keep the saved label for links that do not contain a valid URL.
  }

  if (
    isXLink ||
    /^(?:x(?:\s*\/\s*twitter)?|twitter(?:\s*\/\s*x)?)$/i.test(normalizedLabel)
  ) {
    return "X";
  }

  return normalizedLabel;
}
