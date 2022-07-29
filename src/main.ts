import { Editor, MarkdownView, Plugin } from 'obsidian';

const characterMap: { [key: string]: string } = {
	'->': '→',
	'<-': '←',
};

export default class SymbolsPrettifier extends Plugin {
	onload() {
		console.log('loading symbols prettifier');

		this.registerCodeMirror;

		this.registerDomEvent(document, 'keypress', (event: KeyboardEvent) => {
			const view = this.app.workspace.getActiveViewOfType(MarkdownView);

			if (view) {
				const cursor = view.editor.getCursor();
				console.log(event.key);
				if (event.key === ' ') {
					const line = view.editor.getLine(cursor.line);
					const firstPreviousCharacter = line.charAt(cursor.ch - 1);
					const secondPreviousCharacter = line.charAt(cursor.ch - 2);
					const replaceCharacter =
						characterMap[
							secondPreviousCharacter + firstPreviousCharacter
						];
					if (replaceCharacter) {
						view.editor.replaceRange(
							replaceCharacter,
							{ line: cursor.line, ch: cursor.ch - 2 },
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
}
