import * as monaco from "monaco-editor";
import * as prettier from "prettier/standalone";
import * as babel from "prettier/plugins/babel";

let hasProvided = false;

async function registerFormatter() {
  if (hasProvided) return;

  monaco.languages.registerDocumentFormattingEditProvider("json", {
    async provideDocumentFormattingEdits(model) {
      const text = await prettier.format(model.getValue(), {
        parser: "json",
        plugins: [babel],
      });

      return [
        {
          range: model.getFullModelRange(),
          text,
        },
      ];
    },
  });

  hasProvided = true;
}

export { registerFormatter };
