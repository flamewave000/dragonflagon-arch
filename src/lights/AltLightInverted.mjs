import ARCHITECT from "../core/architect.mjs";

export default class AltLightInverted {
	static ready() {
		libWrapper.register(ARCHITECT.MOD_NAME, 'LightingLayer.prototype._onDragLeftMove',
			this.#_onDragLeftMove.bind(canvas.lighting), 'WRAPPER');
		Hooks.on('renderAmbientLightConfig', this.#_renderLightConfig.bind(this));
	}
	/**
	 * @this {LightingLayer}
	 * @param {(...args)=>any} wrapper
	 * @param {PIXI.InteractionEvent} event
	 * @returns 
	 */
	static #_onDragLeftMove(wrapper, event) {
		/**@type {AmbientLight}*/
		const preview = event.interactionData.preview;
		if (event.data.originalEvent.altKey) {
			if (!preview.document.flags['df-architect']?.inverted) {
				preview.document.flags['df-architect'] = { inverted: true };
				preview.document.config.negative = !preview.document.config.negative;
			}
		} else {
			if (preview.document.flags['df-architect']?.inverted) {
				delete preview.document.flags['df-architect'];
				preview.document.config.negative = !preview.document.config.negative;
			}
		}
		return wrapper(event);
	}
	/**
	 * 
	 * @param {foundry.applications.sheets.AmbientLightConfig} _app
	 * @param {HTMLElement} html
	 * @param {*} _data
	 */
	static #_renderLightConfig(_app, html, _data) {
		const button = $(`<button type="button" style="flex:0;padding-left:8.5px" name="invert-radius" title="${'DF_ARCHITECT.AltLightInverted.InvertLuminosityButton'.localize()}"><i class="fas fa-adjust"></i></button>`);
		$(html).find('range-picker[name="config.luminosity"]').parent().before(button);
		button.on('click', event => {
			event.preventDefault();
			const luminosity = $(html).find('input[name="config.luminosity"]');
			luminosity.val((-parseFloat(luminosity.val())));
			luminosity.trigger('change');
		});
	}
}
