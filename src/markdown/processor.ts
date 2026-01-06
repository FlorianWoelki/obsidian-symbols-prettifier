import SymbolsPrettifier, { characterMap, getCharacterRegex } from "src/main";

export function symbolsPostProcessor(
	plugin: SymbolsPrettifier,
): (el: HTMLElement) => void {
	return (el: HTMLElement) => {
		const walker = document.createTreeWalker(el, NodeFilter.SHOW_ALL, {
			acceptNode: (node) => {
				switch (node.nodeName) {
					case "CODE":
					case "MJX-CONTAINER":
						return NodeFilter.FILTER_REJECT;
					case "#text": {
						if (node.nodeValue && getCharacterRegex().test(node.nodeValue)) {
							return NodeFilter.FILTER_ACCEPT;
						} else {
							return NodeFilter.FILTER_REJECT;
						}
					}
					default:
						return NodeFilter.FILTER_SKIP;
				}
			},
		});

		let currentNode: Node | null = walker.currentNode;
		while (currentNode) {
			if (currentNode.nodeType === 3) {
				const textNode = currentNode as Text;
				for (const { text: pattern } of [
					...textNode.wholeText.matchAll(getCharacterRegex()),
				]
					.sort((a, b) => (b.index as number) - (a.index as number))
					.map((arr) => ({ text: arr[0], index: arr.index }))) {
					const symbol = characterMap[pattern]?.transform;
					if (!symbol) {
						continue;
					}

					if (textNode.textContent) {
						textNode.textContent = textNode.textContent.replace(
							pattern,
							symbol,
						);
					}
				}
			}

			currentNode = walker.nextNode();
		}
	};
}
