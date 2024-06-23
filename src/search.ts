export class SearchCursor {
  public readonly regex: RegExp;
  private _from: number;
  private _to: number;
  private _caret: number;

  constructor(
    public text: string,
    regex: RegExp | string,
    private readonly _originalCaret: number,
  ) {
    if (regex instanceof RegExp) {
      this.regex = regex;
    } else {
      this.regex = new RegExp(regex as string);
    }
    this.reset();
  }

  public reset(): void {
    this._from = this._originalCaret;
    this._to = this._originalCaret;
    this._caret = this._originalCaret;
  }

  public findNext(): RegExpMatchArray | undefined {
    const text = this.text.slice(this._caret);
    const match = text.match(this.regex);
    console.log(text, match);
    if (match?.index == null) {
      return undefined;
    }
    this._from = this._caret + match.index;
    this._to = this._caret + match.index + match[0].length;
    this._caret = this._to;
    return match;
  }

  public to(): number {
    return this._to;
  }

  public from(): number {
    return this._from;
  }
}
