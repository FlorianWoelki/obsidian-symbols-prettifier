import { Plugin } from "obsidian";
import {
  type SymbolsPositionField,
  getSymbolsPositionField,
} from "./editor/state";
import { getSymbolsLivePreviewPlugin } from "./editor/plugin";
import { symbolsPostProcessor } from "./markdown/processor";

interface SimpleTransform {
  transform: string;
}

interface ComplexTransform extends SimpleTransform {
  classes: string;
  element: string;
}

interface CharacterMap {
  [key: string]: SimpleTransform | ComplexTransform;
}

export const characterMap: CharacterMap = {
  "->": { transform: "→" },
  "<-": { transform: "←" },
  "<->": { transform: "↔" },
  "<=>": { transform: "⇔" },
  "<=": { transform: "⇐" },
  "=>": { transform: "⇒" },
  "--": { transform: "–" },
  "!=": { transform: "≠" },
  "===": { transform: "≡" },
  "=<": { transform: "≤" },
  ">=": { transform: "≥" },
  "+-": { transform: "±" },
  "-+": { transform: "∓" },
};

export function getCharacterRegex(): RegExp {
  return new RegExp("(<->|->|<-|<=>|<=|=>|--|!=|===|=<|>=|\\+\\-|\\-\\+)", "g");
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
  }

  onunload() {
    console.log("unloading symbols prettifier");
  }
}
