import ARCHITECT from "../core/architect.js";
import KEYMAP from "../_data/keymap.js";
import { HotSwap, LayerShortcuts } from "../general/LayerShortcuts.js";
import { WallCtrlInvert } from "../walls/WallCtrlInvert.js";
import { KeyMap } from '../core/hotkeys.js';
import { WallShortcuts } from "../walls/WallShortcuts.js";


interface RenderOptions {
	hotswap: HotSwap,
	wallCtrlInvert: KeyMap,
	walls: {
		name: string,
		label: string,
		map: KeyMap
	}[],
	layers: {
		name: string,
		label: string,
		map: KeyMap
	}[],
	keys: {
		key: string,
		label: string
	}[]
}
export default class HotkeyConfig extends FormApplication<RenderOptions> {
	private static readonly PREF_MENU = "HotkeySettingsMenu";
	static get defaultOptions(): FormApplication.Options {
		return mergeObject(super.defaultOptions, {
			title: 'DF_ARCHITECT.ModName',
			editable: true,
			resizable: true,
			submitOnChange: false,
			submitOnClose: false,
			closeOnSubmit: true,
			width: 525,
			id: 'DFArchHKMenu',
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
			wallCtrlInvert: WallCtrlInvert.hotkey,
			walls: WallShortcuts.getWallSettings(),
			layers: ui.controls.controls.map(x => {
				const result = {
					name: x.name,
					label: x.name.capitalize(),
					map: LayerShortcuts.getLayerSetting(x.name)
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
			wallCtrlInvert: KeyMap,
			layers: Indexable<KeyMap>
		};
		ui.controls.controls.forEach(layer => {
			LayerShortcuts.setLayerSetting(layer.name, data.layers[layer.name]);
		});
		LayerShortcuts.hotSwap = data.hotswap;
		WallCtrlInvert.hotkey = data.wallCtrlInvert;
		ARCHITECT.requestReload();
	}

	activateListeners(html: JQuery<HTMLElement>) {
		super.activateListeners(html);
		html.find('#reset').on('click', (e) => {
			e.preventDefault();
			for (let layer of ui.controls.controls) {
				const defValue: KeyMap = LayerShortcuts.getLayerDefault(layer.name);
				$(`#DFArchHKMenu select[name="layers.${layer.name}.key"]`).val(defValue.key);
				($(`#DFArchHKMenu input[name="layers.${layer.name}.alt"]`)[0] as HTMLInputElement).checked = defValue.alt;
				($(`#DFArchHKMenu input[name="layers.${layer.name}.ctrl"]`)[0] as HTMLInputElement).checked = defValue.ctrl;
				($(`#DFArchHKMenu input[name="layers.${layer.name}.shift"]`)[0] as HTMLInputElement).checked = defValue.shift;
			}
			{
				const defValue: HotSwap = LayerShortcuts.hotSwapDefault;
				$('#DFArchHKMenu select[name="hotswap.layer1"]').val(defValue.layer1);
				$('#DFArchHKMenu select[name="hotswap.layer2"]').val(defValue.layer2);
				$('#DFArchHKMenu select[name="hotswap.map.key"]').val(defValue.map.key);
				($('#DFArchHKMenu input[name="hotswap.map.alt"]')[0] as HTMLInputElement).checked = defValue.map.alt;
				($('#DFArchHKMenu input[name="hotswap.map.ctrl"]')[0] as HTMLInputElement).checked = defValue.map.ctrl;
				($('#DFArchHKMenu input[name="hotswap.map.shift"]')[0] as HTMLInputElement).checked = defValue.map.shift;
			}
			{
				const defValue: KeyMap = WallCtrlInvert.hotkeyDefault;
				$('#DFArchHKMenu select[name="wallCtrlInvert.key"]').val(defValue.key);
				($('#DFArchHKMenu input[name="wallCtrlInvert.alt"]')[0] as HTMLInputElement).checked = defValue.alt;
				($('#DFArchHKMenu input[name="wallCtrlInvert.ctrl"]')[0] as HTMLInputElement).checked = defValue.ctrl;
				($('#DFArchHKMenu input[name="wallCtrlInvert.shift"]')[0] as HTMLInputElement).checked = defValue.shift;
			}
		});
	}
}
