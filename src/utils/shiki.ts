import { createHighlighter, HighlighterGeneric } from "shiki";
import { Language, LANGUAGES } from "@/storage/notes";
import * as monaco from "monaco-editor";
import { shikiToMonaco } from "@shikijs/monaco";

let highlighter: HighlighterGeneric<Language, "nord"> | undefined;

async function registerHighlighter() {
  if (highlighter) {
    return;
  }

  highlighter = await createHighlighter({
    themes: ["nord"],
    langs: [...LANGUAGES],
  });

  shikiToMonaco(highlighter, monaco);

  return highlighter;
}

export { highlighter, registerHighlighter };
