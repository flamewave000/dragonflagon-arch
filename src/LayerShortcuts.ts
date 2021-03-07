import ARCHITECT from "./architect.js";
import Hotkeys from "./Hotkeys.js";

export default class LayerShortcuts {
	static PREF_MENU = "LayerShortcutsSettingsMenu";

	static init() {
		game.settings.registerMenu(ARCHITECT.MOD_NAME, this.PREF_MENU, {
			restricted: true,
			type: LayerShortcutsSettings,
			icon: 'fas fa-keyboard',
			label: 'DF_ARCHITECT.LayerShortcuts_Settings_Title'//.localize()
		});
	}

	static ready() {

		// ui.controls._onClickLayer({preventDefault: function(){}, currentTarget:{dataset:{control:'walls'}}})


		Hotkeys.registerShortcut('g', x => {
			console.log("I've been called!");
		}, { ctrl: true });
	}
}


interface RenderOptions {
}
class LayerShortcutsSettings extends FormApplication<RenderOptions, RenderOptions> {

	static get defaultOptions(): FormApplication.Options {
		return mergeObject(super.defaultOptions, {
			title: 'DF_ARCHITECT.ModName',
			editable: true,
			resizable: true,
			submitOnChange: false,
			submitOnClose: false,
			closeOnSubmit: true,
			id: 'DFArchLSMenu',
			template: 'modules/df-architect/templates/LayerShortcutsSettings.hbs'
		});
	}

	getData(options?: Application.RenderOptions): RenderOptions {
		return {
			layers: [],
			keyTypes: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z', '1', '2', '3', '4', '5', '6', '7', '8', '9', '0', ',', '.', '/', ';', "'", '[', ']', '\\', '-', '=', '`']
		};
	}

	async _updateObject(event: Event, formData?: object) {
		if (!formData) return;
		ARCHITECT.requestReload();
	}
}