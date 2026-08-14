import { EditorView } from "@codemirror/view";
import { HighlightStyle, syntaxHighlighting } from "@codemirror/language";
import { tags } from "@lezer/highlight";

import { json } from "@codemirror/lang-json";
import { javascript } from "@codemirror/lang-javascript";
import { css } from "@codemirror/lang-css";
import { html } from "@codemirror/lang-html";
import { markdown } from "@codemirror/lang-markdown";

import type { Extension } from "@codemirror/state";

const nordColors = {
  polarNight0: "#2e3440",
  polarNight1: "#3b4252",
  polarNight2: "#434c5e",
  polarNight3: "#4c566a",

  snowStorm0: "#d8dee9",
  snowStorm1: "#e5e9f0",
  snowStorm2: "#eceff4",

  frost0: "#8fbcbb",
  frost1: "#88c0d0",
  frost2: "#81a1c1",
  frost3: "#5e81ac",

  aurora0: "#bf616a",
  aurora1: "#d08770",
  aurora2: "#ebcb8b",
  aurora3: "#a3be8c",
  aurora4: "#b48ead",
};

export const nordTheme = EditorView.theme({
  "&": {
    color: nordColors.snowStorm0,
    backgroundColor: nordColors.polarNight0,
    fontSize: "14px",
  },

  ".cm-content": {
    caretColor: nordColors.snowStorm0,
    fontFamily:
      'ui-monospace, Menlo, Monaco, "Cascadia Code", "Cascadia Mono", "Segoe UI Mono", "Roboto Mono", "Oxygen Mono", "Ubuntu Monospace", "Source Code Pro", "Fira Mono", "Droid Sans Mono", "Courier New", monospace',
  },

  ".cm-cursor, .cm-dropCursor": {
    borderLeftColor: nordColors.snowStorm0,
  },

  ".cm-selectionBackground, ::selection": {
    backgroundColor: nordColors.polarNight2,
  },

  "&.cm-focused .cm-selectionBackground, &.cm-focused ::selection": {
    backgroundColor: nordColors.polarNight2,
  },

  ".cm-activeLine": {
    backgroundColor: nordColors.polarNight1,
  },

  ".cm-gutters": {
    backgroundColor: nordColors.polarNight0,
    color: nordColors.polarNight3,
    border: "none",
  },

  ".cm-activeLineGutter": {
    backgroundColor: nordColors.polarNight1,
    color: nordColors.snowStorm0,
  },

  ".cm-lineNumbers .cm-gutterElement": {
    padding: "0 10px 0 8px",
  },

  ".cm-foldGutter": {
    color: nordColors.polarNight3,
  },

  ".cm-matchingBracket": {
    backgroundColor: nordColors.polarNight1,
    outline: `1px solid ${nordColors.frost2}`,
  },

  ".cm-scroller": {
    overflow: "auto",
  },

  ".cm-tooltip": {
    backgroundColor: nordColors.polarNight1,
    border: `1px solid ${nordColors.polarNight3}`,
    color: nordColors.snowStorm0,
  },

  ".cm-tooltip-autocomplete": {
    "& > ul > li[aria-selected]": {
      backgroundColor: nordColors.polarNight2,
      color: nordColors.snowStorm0,
    },
  },
});

export const nordHighlighting = syntaxHighlighting(
  HighlightStyle.define([
    {
      tag: tags.comment,
      color: nordColors.polarNight3,
      fontStyle: "italic",
    },

    {
      tag: tags.string,
      color: nordColors.aurora3,
    },

    {
      tag: tags.special(tags.string),
      color: nordColors.aurora2,
    },

    {
      tag: tags.number,
      color: nordColors.aurora4,
    },

    {
      tag: tags.bool,
      color: nordColors.frost2,
    },

    {
      tag: tags.null,
      color: nordColors.aurora0,
    },

    {
      tag: tags.propertyName,
      color: nordColors.frost1,
    },

    {
      tag: tags.variableName,
      color: nordColors.snowStorm0,
    },

    {
      tag: tags.function(tags.variableName),
      color: nordColors.frost1,
    },

    {
      tag: tags.typeName,
      color: nordColors.frost0,
    },

    {
      tag: tags.className,
      color: nordColors.frost0,
    },

    {
      tag: tags.keyword,
      color: nordColors.frost2,
    },

    {
      tag: tags.operator,
      color: nordColors.frost2,
    },

    {
      tag: tags.punctuation,
      color: nordColors.snowStorm2,
    },

    {
      tag: tags.bracket,
      color: nordColors.snowStorm2,
    },

    {
      tag: tags.angleBracket,
      color: nordColors.frost2,
    },

    {
      tag: tags.tagName,
      color: nordColors.frost2,
    },

    {
      tag: tags.attributeName,
      color: nordColors.frost1,
    },

    {
      tag: tags.regexp,
      color: nordColors.aurora2,
    },
  ]),
);

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
