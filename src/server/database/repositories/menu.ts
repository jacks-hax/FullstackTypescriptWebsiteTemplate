import Database from '@database/database';
import INavNode from '@models/nav';
import Constants from '@constants/server';

export default class MenuRepository {
    public static async getHeaderMenuItems(): Promise<Array<INavNode>> {
        return MenuRepository.getMenuItems(Constants.MENU_ITEM_LOCATION.HEADER);
    }

    public static async getFooterMenuItems(): Promise<Array<INavNode>> {
        return MenuRepository.getMenuItems(Constants.MENU_ITEM_LOCATION.FOOTER);
    }

    private static createNavNodeTree(nodes: Array<INavNode>): Array<INavNode> {
        const nodesById: Record<string, INavNode> = {};
        for (const node of nodes) {
            node.Children = [];
            nodesById[node.Id!] = node;
        }
        for (const node of nodes) {
            if (node.ParentId && nodesById[node.ParentId]) {
                nodesById[node.ParentId].Children?.push(node);
            }
        }
        return Object.values(nodesById);
    }

    private static async getMenuItems(location: string): Promise<Array<INavNode>> {
        const items = (await Database.query('SELECT * FROM MenuItem WHERE Location = ?', [
            location
        ])) as Array<INavNode>;
        return MenuRepository.createNavNodeTree(items);
    }
}
