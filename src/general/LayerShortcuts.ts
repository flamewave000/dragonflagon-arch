import ARCHITECT from "../core/architect";
import SETTINGS from "../core/settings";

class _LayerShortcuts {
	private static readonly PREF_LAYER_ = "LayerShortcutsSettingsLayer-";
	private static readonly PREF_LAYER_SWAP_LAYER1 = "LayerShortcutsSettingsLayer-SwapLayer1";
	private static readonly PREF_LAYER_SWAP_LAYER2 = "LayerShortcutsSettingsLayer-SwapLayer2";
	ready() {
		// Do not register shortcuts if we are not a GM
		if (!game.user.isGM) return;

		// #region Register and bind the layer hot-swap Hotkey
		const getLayers: () => Record<string, string> = () => {
			const result: Record<string, string> = {};
			ui.controls.controls
				.map(x => [x.name, x.title])
				.forEach(x => {
					result[x[0]] = x[1];
				})
			return result;
		}

		SETTINGS.register<String>(_LayerShortcuts.PREF_LAYER_SWAP_LAYER1, {
			name: 'DF_ARCHITECT.LayerShortcuts.Settings.QuickSwap.Layer1_Name',
			hint: 'DF_ARCHITECT.LayerShortcuts.Settings.QuickSwap.Layer1_Hint',
			choices: getLayers(),
			scope: 'world',
			type: String,
			config: true,
			default: 'walls'
		});
		SETTINGS.register<String>(_LayerShortcuts.PREF_LAYER_SWAP_LAYER2, {
			name: 'DF_ARCHITECT.LayerShortcuts.Settings.QuickSwap.Layer2_Name',
			hint: 'DF_ARCHITECT.LayerShortcuts.Settings.QuickSwap.Layer2_Hint',
			choices: getLayers(),
			scope: 'world',
			type: String,
			config: true,
			default: 'lighting'
		});
		Hotkeys.registerGroup({
			name: `${ARCHITECT.MOD_NAME}.layers`,
			label: 'DF_ARCHITECT.LayerShortcuts.Settings.Title',
			description: 'DF_ARCHITECT.LayerShortcuts.Settings.Description'
		});
		Hotkeys.registerShortcut({
			name: `${ARCHITECT.MOD_NAME}.layerHotSwap`,
			label: 'DF_ARCHITECT.LayerShortcuts.Settings.QuickSwap.Title',
			group: `${ARCHITECT.MOD_NAME}.layers`,
			default: {
				key: Hotkeys.keys.KeyQ,
				alt: true,
				ctrl: false,
				shift: false
			},
			onKeyDown: _ => {
				const layer1 = SETTINGS.get(_LayerShortcuts.PREF_LAYER_SWAP_LAYER1);
				const layer2 = SETTINGS.get(_LayerShortcuts.PREF_LAYER_SWAP_LAYER2);
				const layer = ui.controls.activeControl === layer1 ? layer2 : layer1;
				(ui.controls as any)._onClickLayer({ preventDefault: () => { }, currentTarget: { dataset: { control: layer } } })
			}
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
			const prefName = _LayerShortcuts.PREF_LAYER_ + layer.name;
			Hotkeys.registerShortcut({
				name: `${ARCHITECT.MOD_NAME}.layer-${layer.name}`,
				label: layer.title,
				group: `${ARCHITECT.MOD_NAME}.layers`,
				get: () => SETTINGS.get(prefName),
				set: value => SETTINGS.set(prefName, value),
				default: () => SETTINGS.default(prefName),
				onKeyDown: _ =>
					(ui.controls as any)._onClickLayer({ preventDefault: function () { }, currentTarget: { dataset: { control: layer.name } } })
			});
			// Break if we have run out of numbers (likely due to too many mods adding extra layers)
			if (count == 9) break;
		}
		// #endregion
	}
}
export const LayerShortcuts = new _LayerShortcuts();