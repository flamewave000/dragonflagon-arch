import ARCHITECT from "../architect.js";
import KEYMAP from "../_data/keymap.js";
import Hotkeys from "./Hotkeys.js";

interface KeyMap {
	key: string;
	alt: boolean;
	ctrl: boolean;
	shift: boolean;
}
export default class LayerShortcuts {
	static PREF_MENU = "LayerShortcutsSettingsMenu";
	static PREF_LAYER_ = "LayerShortcutsSettingsLayer-";

	static init() {
		game.settings.registerMenu(ARCHITECT.MOD_NAME, this.PREF_MENU, {
			restricted: true,
			type: LayerShortcutsSettings,
			icon: 'fas fa-keyboard',
			label: 'DF_ARCHITECT.LayerShortcuts_Settings_Title'
		});
	}

	static ready() {
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
			const binding = Hotkeys.registerShortcut(setting.key, x => {
				// console.log("I've been called! " + layer.name);
				(ui.controls as any)._onClickLayer({ preventDefault: function () { }, currentTarget: { dataset: { control: layer.name } } })
			}, setting);
		}
	}
}


interface RenderOptions {
	layers: {
		name: string,
		label: string,
		setting: KeyMap
	}[],
	keys: {
		key: string,
		value: string
	}[]
}
class LayerShortcutsSettings extends FormApplication<RenderOptions> {

	static get defaultOptions(): FormApplication.Options {
		return mergeObject(super.defaultOptions, {
			title: 'DF_ARCHITECT.ModName',
			editable: true,
			resizable: false,
			submitOnChange: false,
			submitOnClose: false,
			closeOnSubmit: true,
			width: 425,
			id: 'DFArchLSMenu',
			template: 'modules/df-architect/templates/LayerShortcutsSettings.hbs'
		});
	}

	getData(options?: Application.RenderOptions): RenderOptions {
		const result = {
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
		const data = expandObject(formData) as Indexable<KeyMap>;
		ui.controls.controls.forEach(layer => {
			game.settings.set(ARCHITECT.MOD_NAME, LayerShortcuts.PREF_LAYER_ + layer.name, data[layer.name]);
		});
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