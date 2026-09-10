import { Language } from "@/storage/notes";

const parsers: Record<Language, string> = {
  json: "json",
  javascript: "babel",
  typescript: "typescript",
  jsx: "babel",
  tsx: "typescript",
  css: "postcss",
  html: "html",
  markdown: "markdown",
} as const;

export async function formatCode(value: string, language: keyof typeof parsers): Promise<string> {
  const [prettier, ...plugins] = await Promise.all([
    import("prettier/standalone"),
    import("prettier/plugins/babel"),
    import("prettier/plugins/estree"),
    import("prettier/plugins/typescript"),
    import("prettier/plugins/markdown"),
    import("prettier/plugins/html"),
    import("prettier/plugins/postcss"),
  ]);

  return prettier.format(value, {
    parser: parsers[language],
    plugins,
  });
}
