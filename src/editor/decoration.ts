import type { Range } from "@codemirror/state";
import { Decoration, type EditorView } from "@codemirror/view";
import SymbolsPrettifier from "src/main";
import SymbolWidget from "./widget";
import { editorLivePreviewField } from "obsidian";

export default function symbols(view: EditorView, plugin: SymbolsPrettifier) {
	const symbolsField = view.state.field(plugin.symbolsPositionField);
	const cursor = view.state.selection.main.head;
	const decorations: Range<Decoration>[] = [];

	for (const { from, to } of view.visibleRanges) {
		symbolsField.between(from, to, (from, to, { symbol, prettified }) => {
			const isNearCursor = cursor >= from && cursor <= to;
			const widget = new SymbolWidget(
				isNearCursor ? symbol : prettified,
				plugin,
			);
			const spec = { widget, side: -1 };
			if (view.state.field(editorLivePreviewField)) {
				if (isNearCursor) {
					for (let i = 0; i < symbol.length; i++) {
						decorations.push(
							Decoration.replace({
								widget: new SymbolWidget(symbol[i], plugin),
								inclusive: true,
							}).range(from + i, from + i + 1),
						);
					}
				} else {
					decorations.push(Decoration.replace(spec).range(from, to));
				}
			}
		});
	}

	return Decoration.set(decorations, true);
}
