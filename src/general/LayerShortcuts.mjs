import ARCHITECT from "../core/architect.mjs";
import SETTINGS from "../core/settings.mjs";

export default class LayerShortcuts {
	/**@readonly*/static #PREF_LAYER_SWAP_LAYER1 = "LayerShortcutsSettingsLayer-SwapLayer1";
	/**@readonly*/static #PREF_LAYER_SWAP_LAYER2 = "LayerShortcutsSettingsLayer-SwapLayer2";
	static init() {
		// #region Register and bind the layer hot-swap Hotkey
		game.keybindings.register(ARCHITECT.MOD_NAME, 'LayerShortcuts.QuickSwap', {
			restricted: true,
			name: 'DF_ARCHITECT.LayerShortcuts.Settings.QuickSwap.Title'.localize(),
			hint: 'DF_ARCHITECT.LayerShortcuts.Settings.QuickSwap.Info'.localize(),
			editable: [{ key: 'KeyQ', modifiers: [KeyboardManager.MODIFIER_KEYS.ALT] }],
			onDown: () => {
				const layer1 = SETTINGS.get(LayerShortcuts.#PREF_LAYER_SWAP_LAYER1);
				const layer2 = SETTINGS.get(LayerShortcuts.#PREF_LAYER_SWAP_LAYER2);
				const layer = ui.controls.activeControl === layer1 ? layer2 : layer1;
				ui.controls._onClickLayer({ preventDefault: () => { }, currentTarget: { dataset: { control: layer } } });
				return true;
			}
		});
		// #endregion

		// #region Register and bind the Hotkeys for the Scene Layers
		/**@type {string[][]}*/
		const layers = [
			['tokens', CONFIG.Canvas.layers['tokens'].layerClass.name],
			['templates', CONFIG.Canvas.layers['templates'].layerClass.name],
			['tiles', CONFIG.Canvas.layers['tiles'].layerClass.name],
			['drawings', CONFIG.Canvas.layers['drawings'].layerClass.name],
			['walls', CONFIG.Canvas.layers['walls'].layerClass.name],
			['lighting', CONFIG.Canvas.layers['lighting'].layerClass.name],
			['sounds', CONFIG.Canvas.layers['sounds'].layerClass.name],
			['regions', CONFIG.Canvas.layers['regions'].layerClass.name],
			['notes', CONFIG.Canvas.layers['notes'].layerClass.name]
		];
		var count = 0;
		for (let layer of layers) {
			game.keybindings.register(ARCHITECT.MOD_NAME, layer[0], {
				restricted: true,
				name: layer[1].replace('Layer', ' Layer'),
				hint: 'DF_ARCHITECT.LayerShortcuts.Settings.Description',
				editable: [{ key: `Digit${++count}`, modifiers: [KeyboardManager.MODIFIER_KEYS.CONTROL] }],
				onDown: () => {
					ARCHITECT.getLayer(layer[0])?.activate();
					return true;
				}
			});
		}
		// #endregion
	}

	static ready() {
		/**@type {() => Record<string, string>}*/
		const getLayers = () => {
			/**@type {Record<string, string>}*/
			const result = {};
			ui.controls.controls
				.map(x => [x.name, x.title])
				.forEach(x => {
					result[x[0]] = x[1];
				})
			return result;
		}

		SETTINGS.register(LayerShortcuts.#PREF_LAYER_SWAP_LAYER1, {
			name: 'DF_ARCHITECT.LayerShortcuts.Settings.QuickSwap.Layer1_Name',
			hint: 'DF_ARCHITECT.LayerShortcuts.Settings.QuickSwap.Layer1_Hint',
			choices: getLayers(),
			scope: 'world',
			type: String,
			config: true,
			default: 'walls'
		});
		SETTINGS.register(LayerShortcuts.#PREF_LAYER_SWAP_LAYER2, {
			name: 'DF_ARCHITECT.LayerShortcuts.Settings.QuickSwap.Layer2_Name',
			hint: 'DF_ARCHITECT.LayerShortcuts.Settings.QuickSwap.Layer2_Hint',
			choices: getLayers(),
			scope: 'world',
			type: String,
			config: true,
			default: 'lighting'
		});
	}
}
