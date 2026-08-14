import * as prettier from "prettier/standalone";
import * as babel from "prettier/plugins/babel";
import * as estree from "prettier/plugins/estree";
import * as typescript from "prettier/plugins/typescript";

const plugins = [babel, estree, typescript];

const parsers = {
  json: "json",
  javascript: "babel",
  typescript: "typescript",
} as const;

export async function formatCode(value: string, language: keyof typeof parsers): Promise<string> {
  return prettier.format(value, {
    parser: parsers[language],
    plugins,
  });
}
