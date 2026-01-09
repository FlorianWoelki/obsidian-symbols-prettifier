import { syntaxTree, tokenClassNodeProp } from "@codemirror/language";
import {
	EditorState,
	Range,
	RangeSet,
	RangeSetBuilder,
	RangeValue,
	StateField,
} from "@codemirror/state";
import SymbolsPrettifier, { characterMap, getCharacterRegex } from "src/main";

class SymbolsPosition extends RangeValue {
	constructor(
		public symbol: string,
		public prettified: string,
	) {
		super();
	}

	eq(other: RangeValue): boolean {
		return (
			other instanceof SymbolsPosition &&
			other.symbol === this.symbol &&
			other.prettified === this.prettified
		);
	}
}

export type SymbolsPositionField = StateField<RangeSet<SymbolsPosition>>;

const allowedTypes = [
	"link-alias",
	"comment",
	"header",
	"strong",
	"em",
	"strikethrough",
	"quote",
	"link",
	"list-1",
	"list-2",
	"list-3",
	"highlight",
	"hmd-footref2",
	"footref",
];
const excludedTypes = [
	"formatting",
	"comment-start",
	"comment-end",
	"inline-code",
];

function iterateSymbolsRanges(
	state: EditorState,
	from: number,
	to: number,
	addToRange: (from: number, to: number, value: SymbolsPosition) => void,
) {
	const saveToRange = (from: number, to: number): void => {
		const text = state.doc.sliceString(from, to);
		if (!text.trim()) {
			return;
		}

		for (const { 0: symbol, index: offset } of text.matchAll(
			getCharacterRegex(),
		)) {
			const prettified = characterMap[symbol]?.transform ?? symbol;
			addToRange(
				from + (offset ?? 0),
				from + (offset ?? 0) + symbol.length,
				new SymbolsPosition(symbol, prettified),
			);
		}
	};

	let prevTo = from;
	syntaxTree(state).iterate({
		from: from - 1,
		to: to + 1,
		enter: ({ type, from, to }) => {
			if (type.name === "Document") {
				return;
			}

			if (from !== prevTo) {
				saveToRange(prevTo, from);
			}

			prevTo = to;

			// Checks for the node type, if symbol can be applied.
			const nodeProps = type.prop(tokenClassNodeProp);
			if (!nodeProps) {
				return;
			}
			const props = new Set(nodeProps?.split(" "));
			if (
				excludedTypes.every((t) => !props.has(t)) &&
				allowedTypes.some((t) => props.has(t))
			) {
				saveToRange(from, to);
			}
		},
	});

	if (prevTo !== to) {
		saveToRange(prevTo, to);
	}
}

export function getSymbolsPositionField(plugin: SymbolsPrettifier) {
	return StateField.define<RangeSet<SymbolsPosition>>({
		create: (state) => {
			const rangeSet = new RangeSetBuilder<SymbolsPosition>();
			iterateSymbolsRanges(
				state,
				0,
				state.doc.length,
				rangeSet.add.bind(rangeSet),
			);
			return rangeSet.finish();
		},
		update: (value, transaction) => {
			if (!transaction.docChanged) {
				return value;
			}

			value = value.map(transaction.changes);
			const changedLines: [lineStart: number, lineEnd: number][] = [];
			transaction.changes.iterChangedRanges((_f, _t, from, to) => {
				changedLines.push([
					transaction.state.doc.lineAt(from).number,
					transaction.state.doc.lineAt(to).number,
				]);
			});

			const newRanges: Range<SymbolsPosition>[] = [];
			for (const [start, end] of changedLines) {
				const { from } = transaction.state.doc.line(start);
				const { to } = transaction.state.doc.line(end);

				value = value.update({
					filterFrom: from,
					filterTo: to,
					filter: () => false,
				});

				iterateSymbolsRanges(transaction.state, from, to, (from, to, value) => {
					newRanges.push(value.range(from, to));
				});
			}

			value = value.update({ add: newRanges });
			return value;
		},
	});
}
