import { Plugin } from "obsidian";
import {
  type SymbolsPositionField,
  getSymbolsPositionField,
} from "./editor/state";
import { getSymbolsLivePreviewPlugin } from "./editor/plugin";
import { symbolsPostProcessor } from "./markdown/processor";

interface HTMLObject {
  transform: string;
  classes: string;
  element: string;
}

interface CharacterMap {
  [key: string]: string | HTMLObject;
}

export const characterMap: CharacterMap = {
  "->": "→",
  "<-": "←",
  "<->": "↔",
  "<=>": "⇔",
  "<=": "⇐",
  "=>": "⇒",
  "--": "–",
  "!important": {
    transform: "!important",
    classes: "symbols-prettifier-important",
    element: '<span class="symbols-prettifier-important">!important</span>',
  },
  "?unclear": {
    transform: "?unclear",
    classes: "symbols-prettifier-unclear",
    element: '<span class="symbols-prettifier-unclear">?unclear</span>',
  },
};

export function getCharacterRegex(): RegExp {
  return new RegExp("(->|<-|<->|<=>|<=|=>|--)", "g");
}

export default class SymbolsPrettifier extends Plugin {
  symbolsPositionField: SymbolsPositionField = getSymbolsPositionField(this);

  onload() {
    console.log("loading symbols prettifier");

    this.registerEditorExtension([
      this.symbolsPositionField,
      getSymbolsLivePreviewPlugin(this),
    ]);

    this.registerMarkdownPostProcessor(symbolsPostProcessor(this));

    this.addCommand({
      id: "symbols-prettifier-add-important",
      name: "Add important symbol",
      editorCallback: (editor) => {
        const cursor = editor.getCursor();
        const symbol = characterMap["!important"];
        if (typeof symbol !== "string") {
          editor.replaceRange(symbol.element, cursor);
        }
      },
    });

    this.addCommand({
      id: "symbols-prettifier-add-unclear",
      name: "Add unclear symbol",
      editorCallback: (editor) => {
        const cursor = editor.getCursor();
        const symbol = characterMap["?unclear"];
        if (typeof symbol !== "string") {
          editor.replaceRange(symbol.element, cursor);
        }
      },
    });
  }

  onunload() {
    console.log("unloading symbols prettifier");
  }
}
