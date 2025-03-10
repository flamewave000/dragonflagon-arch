import ARCHITECT from "../core/architect.mjs";

interface Invert { inverted: boolean };

export default class AltLightInverted {
	static ready() {
		libWrapper.register(ARCHITECT.MOD_NAME, 'LightingLayer.prototype._onDragLeftMove',
			this._onDragLeftMove.bind(canvas.lighting), 'WRAPPER');
		Hooks.on('renderAmbientLightConfig', this._renderLightConfig.bind(this));
	}
	private static _onDragLeftMove(this: LightingLayer, wrapper: Function, event: PIXI.InteractionEvent) {
		const preview = (event.data as any).preview as AmbientLight;
		if (event.data.originalEvent.altKey) {
			if (!(preview.document.flags['df-architect'] as Invert)?.inverted) {
				preview.document.flags['df-architect'] = { inverted: true }
				preview.document.config.luminosity = -preview.document.config.luminosity;
			}
		} else {
			if ((preview.document.flags['df-architect'] as Invert)?.inverted) {
				delete preview.document.flags['df-architect'];
				preview.document.config.luminosity = -preview.document.config.luminosity;
			}
		}
		return wrapper(event);
	}
	private static _renderLightConfig(app: AmbientLightConfig, html: JQuery<HTMLElement>, data: any) {
		const button = $(`<button type="button" style="flex:0;padding-left:8.5px" name="invert-radius" title="${'DF_ARCHITECT.AltLightInverted.InvertLuminosityButton'.localize()}"><i class="fas fa-adjust"></i></button>`);
		html.find('input[name="config.luminosity"]').parent().before(button);
		button.on('click', (event: any) => {
			event.preventDefault();
			const luminosity = html.find('input[name="config.luminosity"]');
			luminosity.val((-parseFloat(<string>luminosity.val())));
			luminosity.trigger('change');
		});
	}
}
