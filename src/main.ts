import { Editor, MarkdownView, Plugin } from 'obsidian';

const characterMap: { [key: string]: string } = {
	'->': '→',
	'<-': '←',
	'<->': '↔',
	'<=>': '⇔',
	'<=': '⇐',
	'=>': '⇒',
	'--': '–',
};

export default class SymbolsPrettifier extends Plugin {
	onload() {
		console.log('loading symbols prettifier');

		this.registerDomEvent(document, 'keypress', (event: KeyboardEvent) => {
			const view = this.app.workspace.getActiveViewOfType(MarkdownView);

			if (view) {
				const cursor = view.editor.getCursor();
				if (event.key === ' ') {
					const line = view.editor.getLine(cursor.line);
					let from = -1;
					let sequence = '';
					for (let i = cursor.ch - 1; i >= 0; i--) {
						if (line.charAt(i) === ' ') {
							const excludeWhitespace = i + 1;
							from = excludeWhitespace;
							sequence = line.slice(excludeWhitespace, cursor.ch);
							break;
						} else if (i === 0) {
							from = i;
							sequence = line.slice(i, cursor.ch);
							break;
						}
					}
					const replaceCharacter = characterMap[sequence];
					if (
						replaceCharacter &&
						from !== -1 &&
						!this.isCursorInCodeBlock(view.editor)
					) {
						view.editor.replaceRange(
							replaceCharacter,
							{ line: cursor.line, ch: from },
							{ line: cursor.line, ch: cursor.ch }
						);
					}
				}
			}
		});
	}

	onunload() {
		console.log('unloading symbols prettifier');
	}

	private isCursorInCodeBlock(editor: Editor): boolean {
		// @ts-expect-error, not typed
		const codeMirror = editor.cm;
		const selection = editor.getCursor();

		const codeBlock = /```\w*[^`]+```*/;
		const cursor = codeMirror.cm.getSearchCursor(codeBlock, {
			ch: 0,
			line: 0,
		});

		while (cursor.findNext()) {
			if (
				selection.line >= cursor.from().line &&
				selection.line <= cursor.to().line
			) {
				return true;
			}
		}

		return false;
	}
}
