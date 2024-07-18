import { EditorView, WidgetType } from "@codemirror/view";
import SymbolsPrettifier from "src/main";

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

    wrapper.append(this.symbol);
    return wrapper;
  }

  ignoreEvent(event: Event): boolean {
    return false;
  }
}
