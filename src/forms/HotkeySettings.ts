import ARCHITECT from "../core/architect.js";
import KEYMAP from "../_data/keymap.js";
import { HotSwap, KeyMap, LayerShortcuts } from "../general/LayerShortcuts.js";


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
export default class HotkeyConfig extends FormApplication<RenderOptions> {
	private static readonly PREF_MENU = "LayerShortcutsSettingsMenu";
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

	static init() {
		game.settings.registerMenu(ARCHITECT.MOD_NAME, this.PREF_MENU, {
			restricted: true,
			type: HotkeyConfig,
			icon: 'fas fa-keyboard',
			label: 'DF_ARCHITECT.Hotkeys_Settings_Title'
		});
	}

	getData(options?: Application.RenderOptions): RenderOptions {
		const result: RenderOptions = {
			hotswap: LayerShortcuts.hotSwap,
			layers: ui.controls.controls.map(x => {
				const result = {
					name: x.name,
					label: x.name.capitalize(),
					setting: LayerShortcuts.getLayerSetting(x.name)
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
			LayerShortcuts.setLayerSetting(layer.name, data.layers[layer.name]);
		});
		LayerShortcuts.hotSwap = data.hotswap;
		ARCHITECT.requestReload();
	}

	activateListeners(html: JQuery<HTMLElement>) {
		super.activateListeners(html);
		html.find('#reset').on('click', (e) => {
			e.preventDefault();
			for (let layer of ui.controls.controls) {
				const defValue: KeyMap = LayerShortcuts.getLayerDefault(layer.name);
				$(`#DFArchLSMenu select[name="layers.${layer.name}.key"]`).val(defValue.key);
				($(`#DFArchLSMenu input[name="layers.${layer.name}.alt"]`)[0] as HTMLInputElement).checked = defValue.alt;
				($(`#DFArchLSMenu input[name="layers.${layer.name}.ctrl"]`)[0] as HTMLInputElement).checked = defValue.ctrl;
				($(`#DFArchLSMenu input[name="layers.${layer.name}.shift"]`)[0] as HTMLInputElement).checked = defValue.shift;
			}
			const defValue: HotSwap = LayerShortcuts.hotSwapDefault;
			$(`#DFArchLSMenu select[name="hotswap.layer1"]`).val(defValue.layer1);
			$(`#DFArchLSMenu select[name="hotswap.layer2"]`).val(defValue.layer2);
			$(`#DFArchLSMenu select[name="hotswap.key"]`).val(defValue.map.key);
			($(`#DFArchLSMenu input[name="hotswap.alt"]`)[0] as HTMLInputElement).checked = defValue.map.alt;
			($(`#DFArchLSMenu input[name="hotswap.ctrl"]`)[0] as HTMLInputElement).checked = defValue.map.ctrl;
			($(`#DFArchLSMenu input[name="hotswap.shift"]`)[0] as HTMLInputElement).checked = defValue.map.shift;
		});
	}
}
