const NAMESPACE_MAP: Record<string, string> = {
  core: ".mdplus-content",
};

export function preprocessMds(raw: string): string {
  return raw.replace(
    /([^{}]*?)(\{)/g,
    (_match, selectorPart: string, brace: string) => {
      let transformed = selectorPart;
      for (const [ns, replacement] of Object.entries(NAMESPACE_MAP)) {
        const pattern = new RegExp(`\\b${ns}\\b`, "g");
        transformed = transformed.replace(pattern, replacement);
      }
      return transformed + brace;
    }
  );
}
