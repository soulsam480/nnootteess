import { describe, expect, test } from "bun:test";
import { cleanHeadingText, extractHeadings } from "@/utils/outline";

describe("extractHeadings", () => {
  test("extracts ATX headings of levels 1 through 6", () => {
    const headings = extractHeadings("# One\n## Two\n### Three\n#### Four\n##### Five\n###### Six\n");

    expect(headings).toEqual([
      { level: 1, text: "One", line: 1 },
      { level: 2, text: "Two", line: 2 },
      { level: 3, text: "Three", line: 3 },
      { level: 4, text: "Four", line: 4 },
      { level: 5, text: "Five", line: 5 },
      { level: 6, text: "Six", line: 6 },
    ]);
  });

  test("rejects #hashtag without whitespace after the hashes", () => {
    expect(extractHeadings("#hashtag\n##hashtag\n# Real\n")).toEqual([
      { level: 1, text: "Real", line: 3 },
    ]);
  });

  test("strips a trailing closing hash sequence", () => {
    expect(extractHeadings("# Title #\n## Section ##\n### Deep ###\n")).toEqual([
      { level: 1, text: "Title", line: 1 },
      { level: 2, text: "Section", line: 2 },
      { level: 3, text: "Deep", line: 3 },
    ]);
  });

  test("extracts setext headings with === and ---", () => {
    expect(extractHeadings("Title\n===\nSubtitle\n---\n")).toEqual([
      { level: 1, text: "Title", line: 1 },
      { level: 2, text: "Subtitle", line: 3 },
    ]);
  });

  test("treats --- as a thematic break, not a heading underline", () => {
    const markdown = "---\ntitle: demo\n---\n# Real\n\nSome text\n\n---\n## After\n";

    expect(extractHeadings(markdown)).toEqual([
      { level: 1, text: "Real", line: 4 },
      { level: 2, text: "After", line: 9 },
    ]);
  });

  test("accepts ... as the frontmatter closing delimiter", () => {
    expect(extractHeadings("---\ntitle: demo\n...\n# Real\n")).toEqual([
      { level: 1, text: "Real", line: 4 },
    ]);
  });

  test("ignores backtick and tilde fences with info strings", () => {
    const markdown = "```md\n# fake\n```\n~~~ts\n# also fake\n~~~\n# Real\n";

    expect(extractHeadings(markdown)).toEqual([{ level: 1, text: "Real", line: 7 }]);
  });

  test("a longer fence is not closed by a shorter one", () => {
    const markdown = "````md\n```\n# fake\n```\n````\n# Real\n";

    expect(extractHeadings(markdown)).toEqual([{ level: 1, text: "Real", line: 6 }]);
  });

  test("ignores four-space indented code", () => {
    expect(extractHeadings("    # fake\n    Subtitle\n    ---\n# Real\n")).toEqual([
      { level: 1, text: "Real", line: 4 },
    ]);
  });

  test("ignores an inline-code-only line", () => {
    expect(extractHeadings("`# nope`\n# `Real` heading\n")).toEqual([
      { level: 1, text: "Real heading", line: 2 },
    ]);
  });

  test("cleans links, wiki-links, emphasis, code spans and html", () => {
    const markdown =
      "## **Team** [[Goals|aim]]\n### [Google](https://google.com) and *docs* and `code`\n#### <b>Bold</b> [[path/to/target]]\n";

    expect(extractHeadings(markdown)).toEqual([
      { level: 2, text: "Team aim", line: 1 },
      { level: 3, text: "Google and docs and code", line: 2 },
      { level: 4, text: "Bold target", line: 3 },
    ]);
  });

  test("keeps duplicate texts as separate rows with distinct lines", () => {
    expect(extractHeadings("## Intro\n## Intro\n")).toEqual([
      { level: 2, text: "Intro", line: 1 },
      { level: 2, text: "Intro", line: 2 },
    ]);
  });

  test("returns an empty array when there are no headings", () => {
    expect(extractHeadings("Just text\n\n- a list\n")).toEqual([]);
    expect(extractHeadings("")).toEqual([]);
  });

  test("handles CRLF line endings", () => {
    expect(extractHeadings("# One\r\n## Two\r\n")).toEqual([
      { level: 1, text: "One", line: 1 },
      { level: 2, text: "Two", line: 2 },
    ]);
  });

  test("ignores block comment ranges", () => {
    expect(extractHeadings("%%\n# hidden\n%%\n# Real\n")).toEqual([
      { level: 1, text: "Real", line: 4 },
    ]);
  });

  test("does not turn table rows or callouts into headings", () => {
    const markdown = "| # Fake | B |\n| --- | --- |\n> # Quote\n# Real\n";

    expect(extractHeadings(markdown)).toEqual([{ level: 1, text: "Real", line: 4 }]);
  });

  test("does not treat a pipe-containing paragraph as a setext heading", () => {
    expect(extractHeadings("A | B\n---\n# Real\n")).toEqual([
      { level: 1, text: "Real", line: 3 },
    ]);
  });

  test("matches the design fixture with 1-based source line numbers", () => {
    const sample =
      `---\ntitle: demo\n---\n# Intro\n## **Team** [[Goals|aim]]\n` +
      "```md\n# not a heading\n```\nSubtitle\n---\n## Intro\n";

    expect(extractHeadings(sample)).toEqual([
      { level: 1, text: "Intro", line: 4 },
      { level: 2, text: "Team aim", line: 5 },
      { level: 2, text: "Subtitle", line: 9 },
      { level: 2, text: "Intro", line: 11 },
    ]);
  });
});

describe("cleanHeadingText", () => {
  test("keeps underscores inside words", () => {
    expect(cleanHeadingText("snake_case _italic_")).toBe("snake_case italic");
  });
});
