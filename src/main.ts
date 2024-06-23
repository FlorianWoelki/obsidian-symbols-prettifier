import { Editor, MarkdownView, Notice, Plugin } from "obsidian";
import { SearchCursor } from "src/search";

interface HTMLObject {
  transform: string;
  classes: string;
  element: string;
}

interface CharacterMap {
  [key: string]: string | HTMLObject;
}

const characterMap: CharacterMap = {
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

export default class SymbolsPrettifier extends Plugin {
  onload() {
    console.log("loading symbols prettifier");

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

    this.addCommand({
      id: "symbols-prettifier-format-symbols",
      name: "Prettify existing symbols in document",
      editorCallback: (editor) => {
        let value = editor.getValue();
        const codeBlocks = this.getCodeBlocks(value);
        let matchedChars: { from: number; to: number }[] = [];

        const matchChars = Object.entries(characterMap).reduce(
          (prev, [curr]) => {
            if (prev.length === 0) {
              return prev + this.escapeRegExp(curr);
            }
            return prev + "|" + this.escapeRegExp(curr);
          },
          "",
        );

        const searchCursor = new SearchCursor(
          value,
          new RegExp("(?<![\\w\\d])" + matchChars + "(?![\\w\\d])"),
          0,
        );
        while (searchCursor.findNext() !== undefined) {
          matchedChars.push({
            from: searchCursor.from(),
            to: searchCursor.to(),
          });
        }

        matchedChars = matchedChars.filter((matchedChar) => {
          return !codeBlocks.some(
            (cb) => cb.from <= matchedChar.from && cb.to >= matchedChar.to,
          );
        });

        let diff = 0;
        matchedChars.forEach((matchedChar) => {
          const symbol = value.substring(
            matchedChar.from - diff,
            matchedChar.to - diff,
          );

          const character = characterMap[symbol];
          if (typeof character === "string") {
            value =
              value.substring(0, matchedChar.from - diff) +
              character +
              value.substring(matchedChar.to - diff);
            diff += symbol.length - character.length;
          } else {
            value =
              value.substring(0, matchedChar.from - diff) +
              character.element +
              value.substring(matchedChar.to - diff);
            diff += symbol.length - character.element.length;
          }
        });

        editor.setValue(value);
      },
    });

    this.registerDomEvent(document, "keydown", (event: KeyboardEvent) => {
      const view = this.app.workspace.getActiveViewOfType(MarkdownView);

      if (view) {
        const cursor = view.editor.getCursor();
        if (event.key === " ") {
          const line = view.editor.getLine(cursor.line);
          let from = -1;
          let sequence = "";
          for (let i = cursor.ch - 1; i >= 0; i--) {
            if (line.charAt(i) === " ") {
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
            typeof replaceCharacter !== "function" &&
            !this.isCursorInUnwantedBlocks(view.editor)
          ) {
            if (typeof replaceCharacter === "string") {
              view.editor.replaceRange(
                replaceCharacter,
                { line: cursor.line, ch: from },
                { line: cursor.line, ch: cursor.ch },
              );
            } else {
              view.editor.replaceRange(
                `<span class="${replaceCharacter.classes}">${replaceCharacter.transform}</span>`,
                { line: cursor.line, ch: from },
                { line: cursor.line, ch: cursor.ch },
              );
            }
          }
        }
      }
    });
  }

  onunload() {
    console.log("unloading symbols prettifier");
  }

  private escapeRegExp(string: string): string {
    return string.replace(/[.*+?^!${}()|[\]\\]/g, "\\$&");
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

  private isCursorInUnwantedBlocks(editor: Editor): boolean {
    const unwantedBlocks = [/(?<!`)`[^`\n]+`(?!`)/, /```\w*\s*[\s\S]*?```/]; // inline code, full code

    return (
      unwantedBlocks.filter((unwantedBlock) => {
        const searchCursor = new SearchCursor(
          editor.getValue(),
          unwantedBlock,
          0,
        );
        while (searchCursor.findNext() !== undefined) {
          const offset = editor.posToOffset(editor.getCursor());
          if (searchCursor.from() <= offset && searchCursor.to() >= offset) {
            return true;
          }
        }

        return false;
      }).length !== 0
    );
  }
}
