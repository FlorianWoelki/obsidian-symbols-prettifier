import { Editor, MarkdownView, Notice, Plugin } from 'obsidian';
import { SearchCursor } from 'src/search';

interface HTMLObject {
	transform: string;
	classes: string;
}

interface CharacterMap {
	[key: string]: string | HTMLObject;
}

const characterMap: CharacterMap = {
	'->': '→',
	'<-': '←',
	'<->': '↔',
	'<=>': '⇔',
	'<=': '⇐',
	'=>': '⇒',
	'--': '–',
	'!important': {
		transform: '!important',
		classes: 'symbols-prettifier-important',
	},
	'!unclear': {
		transform: '!unclear',
		classes: 'symbols-prettifier-unclear',
	},
};

export default class SymbolsPrettifier extends Plugin {
	onload() {
		console.log('loading symbols prettifier');

		this.addCommand({
			id: 'symbols-prettifier-add-important',
			name: 'Add important symbol',
			callback: () => {
				const view =
					this.app.workspace.getActiveViewOfType(MarkdownView);
				if (view) {
					const cursor = view.editor.getCursor();
					view.editor.replaceRange(
						'<span class="symbols-prettifier-important">!important</span>',
						cursor
					);
				}
			},
		});

		this.addCommand({
			id: 'symbols-prettifier-add-unclear',
			name: 'Add unclear symbol',
			callback: () => {
				const view =
					this.app.workspace.getActiveViewOfType(MarkdownView);
				if (view) {
					const cursor = view.editor.getCursor();
					view.editor.replaceRange(
						'<span class="symbols-prettifier-unclear">!unclear</span>',
						cursor
					);
				}
			},
		});

		this.addCommand({
			id: 'symbols-prettifier-format-symbols',
			name: 'Prettify existing symbols in document',
			callback: () => {
				const view =
					this.app.workspace.getActiveViewOfType(MarkdownView);
				if (view) {
					let value = view.editor.getValue();
					const codeBlocks = this.getCodeBlocks(value);
					let matchedChars: { from: number; to: number }[] = [];

					const matchChars = Object.entries(characterMap).reduce(
						(prev, [curr]) => {
							if (prev.length === 0) {
								return prev + curr;
							}
							return prev + '|' + curr;
						},
						''
					);

					const searchCursor = new SearchCursor(
						value,
						new RegExp(
							'(?<![\\w\\d])' + matchChars + '(?![\\w\\d])'
						),
						0
					);
					while (searchCursor.findNext() !== undefined) {
						matchedChars.push({
							from: searchCursor.from(),
							to: searchCursor.to(),
						});
					}

					matchedChars = matchedChars.filter((matchedChar) => {
						return !codeBlocks.some(
							(cb) =>
								cb.from <= matchedChar.from &&
								cb.to >= matchedChar.to
						);
					});

					let diff: number = 0;
					matchedChars.forEach((matchedChar) => {
						const symbol = value.substring(
							matchedChar.from - diff,
							matchedChar.to - diff
						);
						value =
							value.substring(0, matchedChar.from - diff) +
							characterMap[symbol] +
							value.substring(matchedChar.to - diff);

						const character = characterMap[symbol];
						if (typeof character === 'string') {
							diff += symbol.length - character.length;
						}
					});

					view.editor.setValue(value);
				}
			},
		});

		this.registerDomEvent(document, 'keydown', (event: KeyboardEvent) => {
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
						if (typeof replaceCharacter === 'string') {
							view.editor.replaceRange(
								replaceCharacter,
								{ line: cursor.line, ch: from },
								{ line: cursor.line, ch: cursor.ch }
							);
						} else {
							view.editor.replaceRange(
								`<span class="${replaceCharacter.classes}">${replaceCharacter.transform}</span>`,
								{ line: cursor.line, ch: from },
								{ line: cursor.line, ch: cursor.ch }
							);
						}
					}
				}
			}
		});
	}

	onunload() {
		console.log('unloading symbols prettifier');
	}

	private getCodeBlocks(input: string) {
		const result: { from: number; to: number }[] = [];

		const codeBlock = /```\w*[^`]+```/;
		const searchCursor = new SearchCursor(input, codeBlock, 0);

		while (searchCursor.findNext() !== undefined) {
			result.push({ from: searchCursor.from(), to: searchCursor.to() });
		}

		return result;
	}

	private isCursorInCodeBlock(editor: Editor): boolean {
		const codeBlock = /```\w*[^`]+```/;
		const searchCursor = new SearchCursor(editor.getValue(), codeBlock, 0);

		let cursor: RegExpMatchArray | undefined;
		while ((cursor = searchCursor.findNext()) !== undefined) {
			const offset = editor.posToOffset(editor.getCursor());
			if (searchCursor.from() <= offset && searchCursor.to() >= offset) {
				return true;
			}
		}

		return false;
	}
}
