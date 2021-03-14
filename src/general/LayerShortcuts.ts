import SETTINGS from "../core/settings.js";
import KEYMAP from "../_data/keymap.js";
import { HOTKEYS, KeyMap } from "../core/hotkeys.js";

export interface HotSwap {
	layer1: string;
	layer2: string;
	map: KeyMap;
}
class _LayerShortcuts {
	private static readonly PREF_LAYER_ = "LayerShortcutsSettingsLayer-";
	private static readonly PREF_LAYER_SWAP = "LayerShortcutsSettingsLayerSwap";

	get hotSwap(): HotSwap {
		return SETTINGS.get(_LayerShortcuts.PREF_LAYER_SWAP);
	}
	get hotSwapDefault(): HotSwap {
		return SETTINGS.default(_LayerShortcuts.PREF_LAYER_SWAP);
	}
	set hotSwap(value: HotSwap) {
		SETTINGS.set(_LayerShortcuts.PREF_LAYER_SWAP, value);
	}
	getLayerSetting(name: string): KeyMap {
		return SETTINGS.get(_LayerShortcuts.PREF_LAYER_ + name);
	}
	getLayerDefault(name: string): KeyMap {
		return SETTINGS.default(_LayerShortcuts.PREF_LAYER_ + name);
	}
	setLayerSetting(name: string, value: KeyMap): void {
		SETTINGS.set(_LayerShortcuts.PREF_LAYER_ + name, value);
	}

	ready() {
		// #region Register and bind the layer hot-swap Hotkey
		SETTINGS.register<HotSwap>(_LayerShortcuts.PREF_LAYER_SWAP, {
			scope: 'world',
			type: Object as any as ConstructorOf<HotSwap>,
			config: false,
			default: {
				layer1: 'walls',
				layer2: 'lighting',
				map: {
					key: KEYMAP.KeyQ.key,
					alt: true,
					ctrl: false,
					shift: false
				}
			}
		});
		const setting: HotSwap = this.hotSwap;
		HOTKEYS.registerShortcut(setting.map, x => {
			const layer = ui.controls.activeControl === setting.layer1 ? setting.layer2 : setting.layer1;
			(ui.controls as any)._onClickLayer({ preventDefault: () => { }, currentTarget: { dataset: { control: layer } } })
		});
		// #endregion

		// #region Register and bind the Hotkeys for the Scene Layers
		var count = 0;
		for (let layer of ui.controls.controls) {
			SETTINGS.register<KeyMap>(_LayerShortcuts.PREF_LAYER_ + layer.name, {
				scope: 'world',
				type: SETTINGS.typeOf<KeyMap>(),
				config: false,
				default: {
					key: `Digit${++count}`,
					alt: false,
					ctrl: true,
					shift: false
				} as KeyMap
			});
			const setting: KeyMap = this.getLayerSetting(layer.name);
			if (setting.key === '') continue;
			HOTKEYS.registerShortcut(setting, _ => {
				(ui.controls as any)._onClickLayer({ preventDefault: function () { }, currentTarget: { dataset: { control: layer.name } } })
			});
			// Break if we have run out of numbers (likely due to too many mods adding extra layers)
			if (count == 9) break;
		}
		// #endregion
	}
}
export const LayerShortcuts = new _LayerShortcuts();