import ARCHITECT from "../core/architect.js";


class _WallShortcuts {
	private static readonly WALL_TYPES = new Set(['walls', 'terrain', 'invisible', 'ethereal', 'doors', 'secret']);

	ready() {
		Hotkeys.registerGroup({
			name: `${ARCHITECT.MOD_NAME}.walls`,
			label: 'DF_ARCHITECT.WallShortcuts.Settings.Title',
			description: 'DF_ARCHITECT.WallShortcuts.Settings.Description'
		});

		var counter = 0;
		const tools = ui.controls.controls.find(x => x.name === 'walls').tools as SceneControlTool[];
		const filteredTools = tools.filter(x => _WallShortcuts.WALL_TYPES.has(x.name));
		for (let tool of filteredTools) {
			const currentTool = tool;
			Hotkeys.registerShortcut({
				name: `${ARCHITECT.MOD_NAME}.type-${tool.name}`,
				label: tool.title,
				group: `${ARCHITECT.MOD_NAME}.walls`,
				default: {
					key: `Digit${++counter}`,
					alt: false,
					ctrl: false,
					shift: true
				},
				onKeyDown: _ => {
					if (ui.controls.activeControl !== 'walls') return;
					(ui.controls as any)._onClickTool({ preventDefault: function () { }, currentTarget: { dataset: { tool: currentTool.name } } })
				}
			});
		}
	}
}

export const WallShortcuts = new _WallShortcuts();