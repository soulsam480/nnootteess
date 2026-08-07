import "monaco-editor/language/json/monaco.contribution";
import * as monaco from "monaco-editor/editor/editor.api";

monaco.editor.defineTheme("nord", {
  base: "vs-dark",
  inherit: true,
  rules: [
    { token: "comment", foreground: "616e88", fontStyle: "italic" },
    { token: "keyword", foreground: "81a1c1" },
    { token: "keyword.control", foreground: "81a1c1" },
    { token: "string", foreground: "a3be8c" },
    { token: "string.escape", foreground: "ebcb8b" },
    { token: "number", foreground: "b48ead" },
    { token: "number.float", foreground: "b48ead" },
    { token: "regexp", foreground: "ebcb8b" },
    { token: "type", foreground: "8fbcbb" },
    { token: "class", foreground: "8fbcbb" },
    { token: "function", foreground: "88c0d0" },
    { token: "variable", foreground: "d8dee9" },
    { token: "variable.predefined", foreground: "d8dee9" },
    { token: "constant", foreground: "b48ead" },
    { token: "tag", foreground: "81a1c1" },
    { token: "attribute.name", foreground: "88c0d0" },
    { token: "attribute.value", foreground: "a3be8c" },
    { token: "delimiter", foreground: "eceff4" },
    { token: "delimiter.bracket", foreground: "eceff4" },
    { token: "operator", foreground: "81a1c1" },
  ],
  colors: {
    "editor.background": "#2e3440",
    "editor.foreground": "#d8dee9",
    "editorLineNumber.foreground": "#4c566a",
    "editorLineNumber.activeForeground": "#d8dee9",
    "editor.selectionBackground": "#434c5e",
    "editor.lineHighlightBackground": "#3b4252",
    "editorCursor.foreground": "#d8dee9",
    "editorWhitespace.foreground": "#4c566a",
    "editorIndentGuide.background": "#3b4252",
    "editorIndentGuide.activeBackground": "#434c5e",
    "editor.findMatchBackground": "#434c5e",
    "editor.findMatchHighlightBackground": "#3b4252",
    "editorBracketMatch.background": "#3b4252",
    "editorBracketMatch.border": "#81a1c1",
  },
});

export { monaco };
