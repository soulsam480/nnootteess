import { EditorView } from "@codemirror/view";
import { Extension } from "@codemirror/state";
import { HighlightStyle, syntaxHighlighting } from "@codemirror/language";
import { tags as t } from "@lezer/highlight";

// Reads live from --mdst-* custom properties, so this one extension
// tracks whatever [data-theme] is active — no separate dark/light
// theme objects to keep in sync.

const v = (name: string) => `var(--mdst-color-${name})`;
const mix = (name: string, pct: number) =>
  `color-mix(in srgb, var(--mdst-color-${name}) ${pct}%, transparent)`;

export const mdstTheme = EditorView.theme({
  "&": {
    color: v("fg"),
    backgroundColor: v("editor-bg"),
  },

  ".cm-content": {
    caretColor: v("focus"),
  },

  ".cm-cursor, .cm-dropCursor": { borderLeftColor: v("focus") },

  "&.cm-focused > .cm-scroller > .cm-selectionLayer .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection":
    {
      backgroundColor: mix("focus", 22),
    },

  ".cm-panels": {
    backgroundColor: v("panel-bg"),
    color: v("fg"),
    borderColor: v("border"),
  },
  ".cm-panels.cm-panels-top": { borderBottom: `var(--mdst-border-width) solid ${v("border")}` },
  ".cm-panels.cm-panels-bottom": { borderTop: `var(--mdst-border-width) solid ${v("border")}` },

  ".cm-searchMatch": {
    backgroundColor: mix("warning", 20),
    outline: `var(--mdst-border-width) solid ${v("warning")}`,
    borderRadius: "var(--mdst-radius)",
  },
  ".cm-searchMatch.cm-searchMatch-selected": {
    backgroundColor: mix("warning", 35),
  },

  ".cm-activeLine": { backgroundColor: mix("focus", 5) },
  ".cm-selectionMatch": { backgroundColor: mix("success", 12) },

  "&.cm-focused .cm-matchingBracket, &.cm-focused .cm-nonmatchingBracket": {
    backgroundColor: mix("focus", 15),
    borderRadius: "var(--mdst-radius)",
  },

  ".cm-gutters": {
    backgroundColor: v("editor-bg"),
    color: v("muted"),
    border: "none",
    borderRight: `var(--mdst-border-width) solid ${v("border")}`,
  },
  ".cm-activeLineGutter": {
    backgroundColor: v("subtle"),
  },

  ".cm-foldPlaceholder": {
    backgroundColor: "transparent",
    border: "none",
    color: v("muted"),
  },

  ".cm-tooltip": {
    border: `var(--mdst-border-width) solid ${v("border")}`,
    borderRadius: "var(--mdst-radius)",
    backgroundColor: v("tooltip-bg"),
  },
  ".cm-tooltip .cm-tooltip-arrow:before": {
    borderTopColor: "transparent",
    borderBottomColor: "transparent",
  },
  ".cm-tooltip .cm-tooltip-arrow:after": {
    borderTopColor: v("tooltip-bg"),
    borderBottomColor: v("tooltip-bg"),
  },
  ".cm-tooltip-autocomplete": {
    "& > ul > li[aria-selected]": {
      backgroundColor: v("subtle"),
      color: v("fg"),
    },
  },
});

export const mdstHighlightStyle = HighlightStyle.define([
  { tag: t.keyword, color: v("syntax-keyword") },
  { tag: [t.name, t.deleted, t.character, t.propertyName, t.macroName], color: v("error") },
  { tag: [t.function(t.variableName), t.labelName], color: v("syntax-function") },
  { tag: [t.color, t.constant(t.name), t.standard(t.name)], color: v("warning") },
  { tag: [t.definition(t.name), t.separator], color: v("fg") },
  {
    tag: [
      t.typeName,
      t.className,
      t.number,
      t.changed,
      t.annotation,
      t.modifier,
      t.self,
      t.namespace,
    ],
    color: v("syntax-type"),
  },
  {
    tag: [t.operator, t.operatorKeyword, t.url, t.escape, t.regexp, t.link, t.special(t.string)],
    color: v("syntax-operator"),
  },
  { tag: [t.meta, t.comment], color: v("muted"), fontStyle: "italic" },
  { tag: t.strong, fontWeight: "bold" },
  { tag: t.emphasis, fontStyle: "italic" },
  { tag: t.strikethrough, textDecoration: "line-through" },
  { tag: t.link, color: v("muted"), textDecoration: "underline" },
  { tag: t.heading, fontWeight: "bold", color: v("error") },
  { tag: [t.atom, t.bool, t.special(t.variableName)], color: v("warning") },
  { tag: [t.processingInstruction, t.string, t.inserted], color: v("success") },
  { tag: t.invalid, color: v("syntax-invalid") },
]);

export const mdstDark: Extension = [mdstTheme, syntaxHighlighting(mdstHighlightStyle)];
