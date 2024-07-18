import { Decoration, type EditorView } from "@codemirror/view";
import SymbolsPrettifier from "src/main";
import SymbolWidget from "./widget";
import { editorLivePreviewField } from "obsidian";

export default function symbols(view: EditorView, plugin: SymbolsPrettifier) {
  const ranges: [symbol: string, from: number, to: number][] = [];
  const symbolsField = view.state.field(plugin.symbolsPositionField);
  for (const { from, to } of view.visibleRanges) {
    symbolsField.between(from, to, (from, to, { symbol }) => {
      ranges.push([symbol, from, to]);
    });
  }

  return Decoration.set(
    ranges.map(([symbol, from, to]) => {
      const widget = new SymbolWidget(symbol, plugin);
      const spec = { widget, side: -1, from, to };
      if (view.state.field(editorLivePreviewField)) {
        return Decoration.replace(spec).range(from, to);
      } else {
        return Decoration.widget(spec).range(to);
      }
    }),
    true,
  );
}
