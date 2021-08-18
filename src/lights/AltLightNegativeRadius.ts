import ARCHITECT from "../core/architect.js";

class _AltLightNegativeRadius {
	ready() {
		libWrapper.register(ARCHITECT.MOD_NAME, 'LightingLayer.prototype._onDragLeftMove',
			this._onDragLeftMove.bind((<LightingLayer>(<Canvas>canvas).getLayer('LightingLayer'))),
			'MIXED');
		Hooks.on('renderLightConfig', this._renderLightConfig.bind(this));
	}
	private _onDragLeftMove(this: LightingLayer, wrapper: Function, event: PIXI.InteractionEvent) {
		if (!event.data.originalEvent.altKey)
			return wrapper(event);
		const { destination, createState, preview, origin } = event.data as any as {
			destination: Point, createState: number, preview: AmbientLight, origin: Point
		};
		if (createState === 0) return;
		// Update the light radius
		const radius = Math.hypot(destination.x - origin.x, destination.y - origin.y);
		// Update the preview object data
		preview.data.dim = -(radius * (canvas.dimensions.distance / canvas.dimensions.size));
		preview.data.bright = preview.data.dim / 2;
		preview.refresh();
		// Refresh the layer display
		preview.updateSource();
		// Confirm the creation state
		(<any>event.data).createState = 2;
	}
	private _renderLightConfig(app: LightConfig, html: JQuery<HTMLElement>, data: any) {
		const button = $(`<button type="button" style="margin-bottom:0.25em" name="invert-radius">
<i class="fas fa-adjust"></i>
${'DF_ARCHITECT.AltLightNegativeRadius.InvertRadiusButton'.localize()}
</button>`);
		html.find('input[name="bright"]').parent().after(button);
		button.on('click', (event) => {
			event.preventDefault();
			const bright = html.find('input[name="bright"]');
			const dim = html.find('input[name="dim"]');
			bright.val((-parseFloat(<string>bright.val())));
			dim.val((-parseFloat(<string>dim.val())));
		});
	}
}

export const AltLightNegativeRadius = new _AltLightNegativeRadius();