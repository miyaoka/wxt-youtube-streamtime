/**
 * 指定されたノードがElement型かどうかを判定する
 * @param node 判定対象のノード
 * @returns ノードがElement型の場合true、それ以外の場合false
 */
export function isElement(node: Node | null | undefined): node is Element {
	return (
		node !== null && node !== undefined && node.nodeType === Node.ELEMENT_NODE
	);
}
