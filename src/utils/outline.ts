export interface Heading {
  level: 1 | 2 | 3 | 4 | 5 | 6;
  text: string;
  line: number;
}

const FRONTMATTER_START = /^---[ \t]*$/;
const FRONTMATTER_END = /^(?:---|\.\.\.)[ \t]*$/;
const FENCE_OPEN = /^( {0,3})(`{3,}|~{3,})(.*)$/;
const FENCE_CLOSE = /^( {0,3})(`{3,}|~{3,})[ \t]*$/;
const INDENTED_CODE = /^(?: {4}|\t)/;
const ATX = /^( {0,3})(#{1,6})(?:[ \t]+|$)(.*)$/;
const SETEXT = /^( {0,3})(=+|-+)[ \t]*$/;
const STRUCTURAL = /^\s*(?:>|[-*+][ \t]|\d+\.[ \t])/;

export function stripFences(markdown: string): string[] {
  const lines = markdown.split(/\r\n?|\n/);
  const visible = lines.map(() => "");
  let start = 0;

  if (FRONTMATTER_START.test(lines[0] ?? "")) {
    const end = lines.findIndex((line, index) => index > 0 && FRONTMATTER_END.test(line));
    if (end > 0) start = end + 1;
  }

  let fenceChar: "`" | "~" | null = null;
  let fenceLength = 0;

  for (let i = start; i < lines.length; i++) {
    const line = lines[i]!;

    if (fenceChar !== null) {
      const close = line.match(FENCE_CLOSE);
      if (close && close[2]![0] === fenceChar && close[2]!.length >= fenceLength) {
        fenceChar = null;
        fenceLength = 0;
      }
      continue;
    }

    const open = line.match(FENCE_OPEN);
    if (open) {
      fenceChar = open[2]![0] as "`" | "~";
      fenceLength = open[2]!.length;
      continue;
    }

    if (!INDENTED_CODE.test(line)) visible[i] = line;
  }

  return visible;
}

function maskInline(line: string, wasInComment: boolean) {
  let masked = line.replace(/(`+)([\s\S]*?)\1/g, (match) => " ".repeat(match.length));
  let inComment = wasInComment;

  if (inComment || masked.includes("%%")) {
    let result = "";
    let cursor = 0;

    while (cursor < masked.length) {
      const marker = masked.indexOf("%%", cursor);

      if (inComment) {
        if (marker === -1) {
          result += " ".repeat(masked.length - cursor);
          break;
        }
        result += " ".repeat(marker + 2 - cursor);
        inComment = false;
      } else {
        if (marker === -1) {
          result += masked.slice(cursor);
          break;
        }
        result += masked.slice(cursor, marker) + "  ";
        inComment = true;
      }
      cursor = marker + 2;
    }

    masked = result;
  }

  return { masked, inComment };
}

export function cleanHeadingText(input: string): string {
  return input
    .replace(/!?\[\[([^\]]+)\]\]/g, (_, target: string) => {
      const parts = target.split("|");
      const name = parts.length > 1 ? parts.slice(1).join("|") : parts[0]!;
      return name.split(/[/#]/).filter(Boolean).pop() ?? "";
    })
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, (_, label: string) => label)
    .replace(/(`+)([\s\S]*?)\1/g, "$2")
    .replace(/%%[\s\S]*(?:%%|$)/g, "")
    .replace(/\\([\\`*_{}[\]()#+\-.!|>])/g, "$1")
    .replace(/\*\*|__|~~|==|\*/g, "")
    .replace(/_+/g, (run, offset: number, full: string) => {
      const before = full[offset - 1];
      const after = full[offset + run.length];
      const surroundedByWord = /[\p{L}\p{N}]/u.test(before ?? "") && /[\p{L}\p{N}]/u.test(after ?? "");
      return surroundedByWord ? run : "";
    })
    .replace(/<[^>\n]+>/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function extractHeadings(markdown: string): Heading[] {
  const lines = stripFences(markdown);
  const headings: Heading[] = [];
  let inComment = false;
  let previous: { line: string; eligible: boolean } | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!;
    const maskedLine = maskInline(line, inComment);
    inComment = maskedLine.inComment;
    const masked = maskedLine.masked;

    const atx = masked.match(ATX);
    if (atx) {
      const hashes = atx[2]!;
      const raw = line.match(/^( {0,3})(#{1,6})[ \t]*(.*)$/)![3]!;
      headings.push({
        level: hashes.length as Heading["level"],
        text: cleanHeadingText(raw.replace(/[ \t]+#+[ \t]*$/, "")),
        line: i + 1,
      });
      previous = null;
      continue;
    }

    const setext = masked.match(SETEXT);
    if (setext && previous?.eligible) {
      headings.push({
        level: setext[2]![0] === "=" ? 1 : 2,
        text: cleanHeadingText(previous.line),
        line: i,
      });
    }

    const eligible =
      masked.trim().length > 0 &&
      !masked.includes("|") &&
      !STRUCTURAL.test(masked) &&
      !SETEXT.test(masked);

    previous = { line, eligible };
  }

  return headings;
}
