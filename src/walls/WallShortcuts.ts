import { HOTKEYS, KeyMap } from "../core/hotkeys.js";
import SETTINGS from "../core/settings.js";


class _WallShortcuts {
	private static readonly PREF_WALL_ = 'WallShortcuts-';
	static readonly TOOLS = ['walls', 'terrain', 'invisible', 'ethereal', 'doors', 'secret'];
	private static readonly PREFS = _WallShortcuts.TOOLS.map(x => _WallShortcuts.PREF_WALL_ + x);

	getPref(index_or_name: number | string): KeyMap {
		return typeof (index_or_name) === 'number'
			? SETTINGS.get(_WallShortcuts.PREFS[index_or_name])
			: SETTINGS.get(_WallShortcuts.PREF_WALL_ + index_or_name);
	}
	async setPref(index_or_name: number | string, value: KeyMap): Promise<KeyMap> {
		return typeof (index_or_name) === 'number'
			? await SETTINGS.set(_WallShortcuts.PREFS[index_or_name], value)
			: await SETTINGS.set(_WallShortcuts.PREF_WALL_ + index_or_name, value);
	}

	getWallSettings(): { name: string, label: string, map: KeyMap }[] {
		return _WallShortcuts.PREFS.map((el, idx) => {
			const tool: ControlTool = (ui.controls.controls.find(x => x.name === 'walls')
				.tools as ControlTool[]).find(x => x.name === _WallShortcuts.TOOLS[idx]);
			return {
				name: _WallShortcuts.TOOLS[idx],
				label: tool.title.localize(),
				map: this.getPref(idx)
			};
		});
	}

	init() {
		var counter = 0;
		for (let pref of _WallShortcuts.PREFS) {
			const index = counter;
			SETTINGS.register<KeyMap>(pref, {
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

			const setting = this.getPref(index);
			HOTKEYS.registerShortcut(setting, async x => {
				if (ui.controls.activeControl !== 'walls') return;
				const toolName = _WallShortcuts.TOOLS[index];
				(ui.controls as any)._onClickTool({ preventDefault: function () { }, currentTarget: { dataset: { tool: toolName } } })
			});
		}
	}
}

export const WallShortcuts = new _WallShortcuts();