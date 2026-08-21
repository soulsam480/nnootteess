import { json } from "@codemirror/lang-json";
import { javascript } from "@codemirror/lang-javascript";
import { css } from "@codemirror/lang-css";
import { html } from "@codemirror/lang-html";
import { markdown } from "@codemirror/lang-markdown";

import type { Extension } from "@codemirror/state";

export function getLanguageExtension(language: string): Extension {
  switch (language.toLowerCase()) {
    case "json":
      return json();

    case "javascript":
    case "js":
      return javascript();

    case "typescript":
    case "ts":
      return javascript({
        typescript: true,
      });

    case "jsx":
      return javascript({
        jsx: true,
      });

    case "tsx":
      return javascript({
        jsx: true,
        typescript: true,
      });

    case "css":
      return css();

    case "html":
      return html();

    case "markdown":
    case "md":
      return markdown();

    default:
      return [];
  }
}

export const LANG_TO_COLOR: Record<string, string> = {
  javascript: "#F7DF1E",
  js: "#F7DF1E",
  typescript: "#3178C6",
  ts: "#3178C6",
  jsx: "#F7DF1E",
  tsx: "#3178C6",
  css: "#1572B6",
  html: "#E0A458",
  json: "#4FB8AF",
  markdown: "#B084CC",
  md: "#B084CC",
};
