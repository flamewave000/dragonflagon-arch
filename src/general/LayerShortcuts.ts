import ARCHITECT from "../architect.js";
import KEYMAP from "../_data/keymap.js";
import Hotkeys from "./Hotkeys.js";

interface KeyMap {
	key: string;
	alt: boolean;
	ctrl: boolean;
	shift: boolean;
}
interface HotSwap {
	layer1: string;
	layer2: string;
	map: KeyMap;
}
export default class LayerShortcuts {
	static PREF_MENU = "LayerShortcutsSettingsMenu";
	static PREF_LAYER_ = "LayerShortcutsSettingsLayer-";
	static PREF_LAYER_SWAP = "LayerShortcutsSettingsLayerSwap";

	static init() {
		game.settings.registerMenu(ARCHITECT.MOD_NAME, this.PREF_MENU, {
			restricted: true,
			type: LayerShortcutsSettings,
			icon: 'fas fa-keyboard',
			label: 'DF_ARCHITECT.LayerShortcuts_Settings_Title'
		});
	}

	static ready() {
		// #region Register and bind the layer hot-swap Hotkey
		game.settings.register<HotSwap>(ARCHITECT.MOD_NAME, this.PREF_LAYER_SWAP, {
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
		const setting: HotSwap = game.settings.get(ARCHITECT.MOD_NAME, this.PREF_LAYER_SWAP);
		Hotkeys.registerShortcut(setting.map.key, x => {
			const layer = ui.controls.activeControl === setting.layer1 ? setting.layer2 : setting.layer1;
			(ui.controls as any)._onClickLayer({ preventDefault: () => { }, currentTarget: { dataset: { control: layer } } })
		}, setting.map);
		// #endregion

		// #region Register and bind the Hotkeys for the Scene Layers
		var count = 0;
		for (let layer of ui.controls.controls) {
			game.settings.register<KeyMap>(ARCHITECT.MOD_NAME, this.PREF_LAYER_ + layer.name, {
				scope: 'world',
				type: Object as any as ConstructorOf<KeyMap>,
				config: false,
				default: {
					key: `Digit${++count}`,
					alt: false,
					ctrl: true,
					shift: false
				} as KeyMap
			});
			const setting = game.settings.get(ARCHITECT.MOD_NAME, this.PREF_LAYER_ + layer.name);
			if (setting.key === '') continue;
			Hotkeys.registerShortcut(setting.key, x => {
				// console.log("I've been called! " + layer.name);
				(ui.controls as any)._onClickLayer({ preventDefault: function () { }, currentTarget: { dataset: { control: layer.name } } })
			}, setting);
			// Break if we have run out of numbers (likely due to too many mods adding extra layers)
			if (count == 9) break;
		}
		// #endregion
	}
}


interface RenderOptions {
	hotswap: HotSwap,
	layers: {
		name: string,
		label: string,
		setting: KeyMap
	}[],
	keys: {
		key: string,
		label: string
	}[]
}
class LayerShortcutsSettings extends FormApplication<RenderOptions> {

	static get defaultOptions(): FormApplication.Options {
		return mergeObject(super.defaultOptions, {
			title: 'DF_ARCHITECT.ModName',
			editable: true,
			resizable: true,
			submitOnChange: false,
			submitOnClose: false,
			closeOnSubmit: true,
			width: 525,
			id: 'DFArchLSMenu',
			template: 'modules/df-architect/templates/LayerShortcutsSettings.hbs'
		});
	}

	getData(options?: Application.RenderOptions): RenderOptions {
		const result: RenderOptions = {
			hotswap: game.settings.get(ARCHITECT.MOD_NAME, LayerShortcuts.PREF_LAYER_SWAP) as HotSwap,
			layers: ui.controls.controls.map(x => {
				const result = {
					name: x.name,
					label: x.name.capitalize(),
					setting: game.settings.get(ARCHITECT.MOD_NAME, LayerShortcuts.PREF_LAYER_ + x.name) as KeyMap
				};
				return result;
			}),
			keys: KEYMAP.entries
		};
		return result;
	}

	async _updateObject(event: Event, formData?: any) {
		if (!formData) return;
		const data = expandObject(formData) as {
			hotswap: HotSwap,
			layers: Indexable<KeyMap>
		};
		ui.controls.controls.forEach(layer => {
			game.settings.set(ARCHITECT.MOD_NAME, LayerShortcuts.PREF_LAYER_ + layer.name, data.layers[layer.name]);
		});
		game.settings.set(ARCHITECT.MOD_NAME, LayerShortcuts.PREF_LAYER_SWAP, data.hotswap)
		ARCHITECT.requestReload();
	}

	activateListeners(html: JQuery<HTMLElement>) {
		super.activateListeners(html);
		html.find('#reset').on('click', (e) => {
			e.preventDefault();
			for (let layer of ui.controls.controls) {
				const defValue: KeyMap = game.settings.settings.get(`${ARCHITECT.MOD_NAME}.${LayerShortcuts.PREF_LAYER_}${layer.name}`).default;
				$(`#DFArchLSMenu select[name="${layer.name}.key"]`).val(defValue.key);
				($(`#DFArchLSMenu input[name="${layer.name}.alt"]`)[0] as HTMLInputElement).checked = defValue.alt;
				($(`#DFArchLSMenu input[name="${layer.name}.ctrl"]`)[0] as HTMLInputElement).checked = defValue.ctrl;
				($(`#DFArchLSMenu input[name="${layer.name}.shift"]`)[0] as HTMLInputElement).checked = defValue.shift;
			}
		});
	}
}