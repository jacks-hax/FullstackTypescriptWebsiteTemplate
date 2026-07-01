import INavNode from '@models/nav';

export default class NavUtils {
    public static findNode(id: string, nodes: Array<INavNode>): INavNode | null {
        const getNodeRecursive = (_nodes: Array<INavNode> = []): INavNode | null => {
            for (const node of _nodes) {
                if (node.Id === id) {
                    return node;
                }
                if (!!node.Children?.length) {
                    const childNode = getNodeRecursive(node.Children);
                    if (childNode) {
                        return childNode;
                    }
                }
            }
            return null;
        };
        return getNodeRecursive(nodes);
    }
}
