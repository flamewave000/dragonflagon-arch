import ARCHITECT from "../core/architect.js";
import SETTINGS from "../core/settings.js";


class _WallShortcuts {
	private static readonly PREF_WALL_ = 'WallShortcuts-';
	private static readonly WALL_TYPES = new Set(['walls', 'terrain', 'invisible', 'ethereal', 'doors', 'secret']);

	ready() {
		Hotkeys.registerGroup({
			name: `${ARCHITECT.MOD_NAME}.walls`,
			label: 'DF_ARCHITECT.WallShortcuts_Settings_Title',
			description: 'DF_ARCHITECT.WallShortcuts_Settings_Description'
		});

		var counter = 0;
		const tools = ui.controls.controls.find(x => x.name === 'walls').tools as ControlTool[];
		const filteredTools = tools.filter(x => _WallShortcuts.WALL_TYPES.has(x.name));
		for (let tool of filteredTools) {
			SETTINGS.register<KeyMap>(_WallShortcuts.PREF_WALL_ + tool.name, {
				scope: 'world',
				type: SETTINGS.typeOf<KeyMap>(),
				config: false,
				default: {
					key: `Digit${++counter}`,
					alt: false,
					ctrl: false,
					shift: true
				}
			});

			const currentTool = tool;
			Hotkeys.registerShortcut({
				name: `${ARCHITECT.MOD_NAME}.type-${tool.name}`,
				label: tool.title,
				group: `${ARCHITECT.MOD_NAME}.walls`,
				get: () => SETTINGS.get(_WallShortcuts.PREF_WALL_ + currentTool.name),
				set: value => SETTINGS.set(_WallShortcuts.PREF_WALL_ + currentTool.name, value),
				default: () => SETTINGS.default(_WallShortcuts.PREF_WALL_ + currentTool.name),
				handle: _ => {
					if (ui.controls.activeControl !== 'walls') return;
					(ui.controls as any)._onClickTool({ preventDefault: function () { }, currentTarget: { dataset: { tool: currentTool.name } } })
				}
			});
		}
	}
}

export const WallShortcuts = new _WallShortcuts();