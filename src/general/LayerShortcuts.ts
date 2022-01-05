import ARCHITECT from "../core/architect";
import SETTINGS from "../core/settings";

export default class LayerShortcuts {
	private static readonly PREF_LAYER_SWAP_LAYER1 = "LayerShortcutsSettingsLayer-SwapLayer1";
	private static readonly PREF_LAYER_SWAP_LAYER2 = "LayerShortcutsSettingsLayer-SwapLayer2";
	static init() {
		// #region Register and bind the layer hot-swap Hotkey
		game.keybindings.register(ARCHITECT.MOD_NAME, 'AltSnapGrid.Toggle', {
			restricted: true,
			name: 'DF_ARCHITECT.LayerShortcuts.Settings.QuickSwap.Title'.localize(),
			hint: 'DF_ARCHITECT.LayerShortcuts.Settings.QuickSwap.Info'.localize(),
			editable: [{ key: 'KeyQ', modifiers: [KeyboardManager.MODIFIER_KEYS.ALT] }],
			onDown: () => {
				const layer1 = SETTINGS.get(LayerShortcuts.PREF_LAYER_SWAP_LAYER1);
				const layer2 = SETTINGS.get(LayerShortcuts.PREF_LAYER_SWAP_LAYER2);
				const layer = ui.controls.activeControl === layer1 ? layer2 : layer1;
				(ui.controls as any)._onClickLayer({ preventDefault: () => { }, currentTarget: { dataset: { control: layer } } })
			}
		});
		// #endregion

		// #region Register and bind the Hotkeys for the Scene Layers
		const layers: string[][] = [
			['tokens', CONFIG.Canvas.layers['tokens'].layerClass.name],
			['templates', CONFIG.Canvas.layers['templates'].layerClass.name],
			['background', CONFIG.Canvas.layers['background'].layerClass.name],
			['drawings', CONFIG.Canvas.layers['drawings'].layerClass.name],
			['walls', CONFIG.Canvas.layers['walls'].layerClass.name],
			['lighting', CONFIG.Canvas.layers['lighting'].layerClass.name],
			['sounds', CONFIG.Canvas.layers['sounds'].layerClass.name],
			['notes', CONFIG.Canvas.layers['notes'].layerClass.name]
		];
		var count = 0;
		for (let layer of layers) {
			game.keybindings.register(ARCHITECT.MOD_NAME, layer[0], {
				restricted: true,
				name: layer[1].replace('Layer', ' Layer'),
				hint: 'DF_ARCHITECT.LayerShortcuts.Settings.Description',
				editable: [{ key: `Digit${++count}`, modifiers: [KeyboardManager.MODIFIER_KEYS.CONTROL] }],
				onDown: () =>
					(ui.controls as any)._onClickLayer({ preventDefault: () => { }, currentTarget: { dataset: { control: layer[0] } } })
			});
		}
		// #endregion
	}

	static ready() {
		const getLayers: () => Record<string, string> = () => {
			const result: Record<string, string> = {};
			ui.controls.controls
				.map(x => [x.name, x.title])
				.forEach(x => {
					result[x[0]] = x[1];
				})
			return result;
		}

		SETTINGS.register<String>(LayerShortcuts.PREF_LAYER_SWAP_LAYER1, {
			name: 'DF_ARCHITECT.LayerShortcuts.Settings.QuickSwap.Layer1_Name',
			hint: 'DF_ARCHITECT.LayerShortcuts.Settings.QuickSwap.Layer1_Hint',
			choices: getLayers(),
			scope: 'world',
			type: String,
			config: true,
			default: 'walls'
		});
		SETTINGS.register<String>(LayerShortcuts.PREF_LAYER_SWAP_LAYER2, {
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
