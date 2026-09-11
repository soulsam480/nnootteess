import { EditorView } from "@codemirror/view";
import { Extension } from "@codemirror/state";
import { HighlightStyle, syntaxHighlighting } from "@codemirror/language";
import { tags as t } from "@lezer/highlight";

// Built from this app's own --mdst-* design tokens (see :root in main.css),
// structured the same way as @codemirror/theme-one-dark so it's a drop-in
// replacement. Base colors are pulled 1:1 from the tokens; the extra syntax
// accents (violet/amber/cyan/blue) are new but chosen to sit naturally next
// to the existing palette (Tailwind slate + the app's blue/red/green/amber).

// ---- 1:1 from --mdst-* tokens ----
const fg = "#e2e8f0", // --mdst-color-fg
  bg = "#0f172a", // --mdst-color-bg
  border = "#334155", // --mdst-color-border
  muted = "#94a3b8", // --mdst-color-muted
  subtle = "#1e293b", // --mdst-color-subtle
  focus = "#3b82f6", // --mdst-color-focus
  error = "#f87171", // --mdst-color-error
  success = "#4ade80", // --mdst-color-success
  warning = "#f59e0b", // --mdst-color-warning (kept for constants/atoms)
  radius = "6px", // --mdst-radius
  borderWidth = "1px"; // --mdst-border-width

// ---- derived UI surfaces ----
const editorBackground = "#0c1322", // dimmer than app chrome (bg), gives the editor pane contrast
  darkBackground = "#0b1220", // panels / tooltips, between bg and editorBackground
  highlightBackground = subtle, // active line gutter, hovered menu item
  tooltipBackground = "#24334d", // slightly lighter than subtle
  selection = "#3b82f640", // focus blue at low alpha
  cursor = focus;

// ---- extra syntax accents, chosen to read naturally alongside the tokens ----
const violet = "#a78bfa", // keywords
  blue = "#60a5fa", // functions / labels (lighter than focus, keeps focus distinct)
  amber = "#fbbf24", // types / numbers / annotations
  cyan = "#22d3ee", // operators / regex / links
  invalid = "#fca5a5"; // errors (soft red, readable on dark bg)

/// The colors used in the theme, as CSS color strings.
export const color = {
  fg,
  bg,
  border,
  muted,
  subtle,
  focus,
  error,
  success,
  warning,
  editorBackground,
  darkBackground,
  highlightBackground,
  tooltipBackground,
  selection,
  cursor,
  violet,
  blue,
  amber,
  cyan,
  invalid,
};

/// The editor theme styles for mdst-dark.
export const mdstDarkTheme = EditorView.theme(
  {
    "&": {
      color: fg,
      backgroundColor: editorBackground,
    },

    ".cm-content": {
      caretColor: cursor,
    },

    ".cm-cursor, .cm-dropCursor": { borderLeftColor: cursor },

    "&.cm-focused > .cm-scroller > .cm-selectionLayer .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection":
      {
        backgroundColor: selection,
      },

    ".cm-panels": {
      backgroundColor: darkBackground,
      color: fg,
      borderColor: border,
    },
    ".cm-panels.cm-panels-top": { borderBottom: `${borderWidth} solid ${border}` },
    ".cm-panels.cm-panels-bottom": { borderTop: `${borderWidth} solid ${border}` },

    ".cm-searchMatch": {
      backgroundColor: "#3b82f633",
      outline: `${borderWidth} solid ${focus}`,
      borderRadius: radius,
    },
    ".cm-searchMatch.cm-searchMatch-selected": {
      backgroundColor: "#3b82f659",
    },

    ".cm-activeLine": { backgroundColor: "#3b82f60d" },
    ".cm-selectionMatch": { backgroundColor: "#4ade8026" },

    "&.cm-focused .cm-matchingBracket, &.cm-focused .cm-nonmatchingBracket": {
      backgroundColor: "#3b82f647",
      borderRadius: radius,
    },

    ".cm-gutters": {
      backgroundColor: editorBackground,
      color: muted,
      border: "none",
      borderRight: `${borderWidth} solid ${border}`,
    },
    ".cm-activeLineGutter": {
      backgroundColor: highlightBackground,
    },

    ".cm-foldPlaceholder": {
      backgroundColor: "transparent",
      border: "none",
      color: muted,
    },

    ".cm-tooltip": {
      border: `${borderWidth} solid ${border}`,
      borderRadius: radius,
      backgroundColor: tooltipBackground,
    },
    ".cm-tooltip .cm-tooltip-arrow:before": {
      borderTopColor: "transparent",
      borderBottomColor: "transparent",
    },
    ".cm-tooltip .cm-tooltip-arrow:after": {
      borderTopColor: tooltipBackground,
      borderBottomColor: tooltipBackground,
    },
    ".cm-tooltip-autocomplete": {
      "& > ul > li[aria-selected]": {
        backgroundColor: highlightBackground,
        color: fg,
      },
    },
  },
  { dark: true },
);

/// The highlighting style for code in the mdst-dark theme.
export const mdstDarkHighlightStyle = HighlightStyle.define([
  { tag: t.keyword, color: violet },
  { tag: [t.name, t.deleted, t.character, t.propertyName, t.macroName], color: error },
  { tag: [t.function(t.variableName), t.labelName], color: blue },
  { tag: [t.color, t.constant(t.name), t.standard(t.name)], color: warning },
  { tag: [t.definition(t.name), t.separator], color: fg },
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
    color: amber,
  },
  {
    tag: [t.operator, t.operatorKeyword, t.url, t.escape, t.regexp, t.link, t.special(t.string)],
    color: cyan,
  },
  { tag: [t.meta, t.comment], color: muted, fontStyle: "italic" },
  { tag: t.strong, fontWeight: "bold" },
  { tag: t.emphasis, fontStyle: "italic" },
  { tag: t.strikethrough, textDecoration: "line-through" },
  { tag: t.link, color: muted, textDecoration: "underline" },
  { tag: t.heading, fontWeight: "bold", color: error },
  { tag: [t.atom, t.bool, t.special(t.variableName)], color: warning },
  { tag: [t.processingInstruction, t.string, t.inserted], color: success },
  { tag: t.invalid, color: invalid },
]);

/// Extension to enable the mdst-dark theme (both the editor theme and
/// the highlight style).
export const mdstDark: Extension = [mdstDarkTheme, syntaxHighlighting(mdstDarkHighlightStyle)];
