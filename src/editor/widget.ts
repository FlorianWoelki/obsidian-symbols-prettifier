import { EditorView, WidgetType } from "@codemirror/view";
import SymbolsPrettifier, { characterMap } from "src/main";

export default class SymbolWidget extends WidgetType {
  constructor(
    public symbol: string,
    public plugin: SymbolsPrettifier,
  ) {
    super();
  }

  eq(other: WidgetType): boolean {
    return other instanceof SymbolWidget && other.symbol === this.symbol;
  }

  toDOM(view: EditorView): HTMLElement {
    const wrapper = createSpan({
      cls: "cm-sp-icon",
    });

    const symbol = characterMap[this.symbol];
    if (symbol && typeof symbol === "string") {
      wrapper.append(symbol);
    }

    return wrapper;
  }

  ignoreEvent(event: Event): boolean {
    return false;
  }
}
