import {
	Decoration,
	DecorationSet,
	EditorView,
	ViewPlugin,
	ViewUpdate,
} from "@codemirror/view";
import SymbolsPrettifier from "src/main";
import symbols from "./decoration";
import { editorLivePreviewField } from "obsidian";

export function getSymbolsLivePreviewPlugin(
	plugin: SymbolsPrettifier,
): ViewPlugin<SymbolsPrettifier> {
	class SymbolsPlugin {
		decorations: DecorationSet;
		plugin: SymbolsPrettifier;

		constructor(view: EditorView) {
			this.plugin = plugin;
			this.decorations = symbols(view, plugin);
		}

		update(update: ViewUpdate) {
			const previousMode = update.startState.field(editorLivePreviewField);
			const currentMode = update.state.field(editorLivePreviewField);

			if (
				update.docChanged ||
				update.viewportChanged ||
				update.selectionSet ||
				previousMode !== currentMode
			) {
				this.decorations = symbols(update.view, plugin);
			}
		}
	}

	return ViewPlugin.fromClass(SymbolsPlugin, {
		eventHandlers: {},
		decorations: (v) => v.decorations,
		provide: (plugin) =>
			EditorView.atomicRanges.of((view) => {
				const value = view.plugin(plugin);
				return value ? value.decorations : Decoration.none;
			}),
	});
}
