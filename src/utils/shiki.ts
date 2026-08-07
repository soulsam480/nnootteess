import { createHighlighterCore } from "shiki/core";
import json from "@shikijs/langs/json";
import nord from "@shikijs/themes/nord";
import { createJavaScriptRegexEngine } from "shiki/engine/javascript";
import { monaco } from "@/utils/monaco";
import { shikiToMonaco } from "@shikijs/monaco";

let highlighter: Awaited<ReturnType<typeof createHighlighterCore>> | undefined;

async function registerHighlighter() {
  if (highlighter) {
    return;
  }

  highlighter = await createHighlighterCore({
    themes: [nord],
    langs: [json],
    engine: createJavaScriptRegexEngine(),
  });

  shikiToMonaco(highlighter, monaco);

  return highlighter;
}

export { highlighter, registerHighlighter };
