import ARCHITECT from "../core/architect";


export default class WallShortcuts {
	private static readonly WALL_TYPES = new Set(['walls', 'terrain', 'invisible', 'ethereal', 'doors', 'secret']);

	static init() {
		const wallTypes = [
			{ name: 'walls', title: 'Normal Walls' },
			{ name: 'terrain', title: 'Terrain Walls' },
			{ name: 'invisible', title: 'Invisible Walls' },
			{ name: 'ethereal', title: 'Ethereal Walls' },
			{ name: 'doors', title: 'Normal Doors' },
			{ name: 'secret', title: 'Secret Doors' }
		];
		var counter = 0;
		for (let tool of wallTypes) {
			const currentTool = tool;
			game.keybindings.register(ARCHITECT.MOD_NAME, `WallShortcuts-${tool.name}`, {
				restricted: true,
				name: tool.title,
				hint: 'DF_ARCHITECT.WallShortcuts.Settings.Description',
				editable: [{ key: `Digit${++counter}`, modifiers: [KeyboardManager.MODIFIER_KEYS.SHIFT] }],
				onDown: () => {
					if (ui.controls.activeControl !== 'walls') return false;
					(ui.controls as any)._onClickTool({ preventDefault: function () { }, currentTarget: { dataset: { tool: currentTool.name } } });
					if (canvas.walls.preview.children.length > 0 && canvas.walls.preview.children[0] instanceof Wall) {
						const data: { [key: string]: number } = <any>canvas.walls._getWallDataFromActiveTool(game.activeTool);
						for (const key of Object.keys(data)) {
							(canvas.walls.preview.children[0].document as any).data[key] = data[key];
						}
					}
					return true;
				}
			});
		}
	}
}
