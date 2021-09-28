import ARCHITECT from "../core/architect.js";

function reduce(numerator: number, denominator: number) {
	var a = numerator;
	var b = denominator;
	var c;
	while (b) {
		c = a % b; a = b; b = c;
	}
	return [numerator / a, denominator / a];
}

export default class TileConfigExt {
	private static _previewImageHTML = `<section class="df-arch-tile-config"><img id="img-preview"><output id="img-data" /></section>`;

	static init() {
		Hooks.on('renderTileConfig', this.updateTileConfig.bind(this));
	}

	private static updateTileConfig(config: TileConfig, html: JQuery<HTMLElement>, data: Tile.Data) {
		// Update the image preview
		const imgInput = html.find('input[name="img"]');
		imgInput.parent().parent().before($(this._previewImageHTML));
		imgInput.on('change', () => this.updateImagePreview(config));
		this.updateImagePreview(config);
		// Add the ratio scale buttons
		const horTitle = 'Scale the width to the aspect ratio relative to the current height'.localize();
		const verTitle = 'Scale the height to the aspect ratio relative to the current width'.localize();
		const width = html.find('input[name="width"]');
		const height = html.find('input[name="height"]');
		width.after($(`<button class="df-arch-scale" title="${horTitle}"><i class="fas fa-arrows-alt-h"></i></button>`)
			.on('click', e => {
				e.preventDefault();
				const ratio = (<any>config).ratio.num / (<any>config).ratio.den;
				width.val(Math.round(parseInt(height.val() as string) * ratio))
					.trigger('change');
			}));
		height.after($(`<button class="df-arch-scale" title="${verTitle}"><i class="fas fa-arrows-alt-v"></i></button>`)
			.on('click', e => {
				e.preventDefault();
				const ratio = (<any>config).ratio.num / (<any>config).ratio.den;
				height.val(Math.round(parseInt(width.val() as string) / ratio))
					.trigger('change');
			}));
		config.setPosition({ left: (<Application.Position>config.position).left, top: (<Application.Position>config.position).top });
	}

	private static updateImagePreview(config: TileConfig) {
		if (config.element.find('input[name="img"]').val() === "") return;
		const labelDimens = 'DF_ARCHITECT.TileConfigExt.LabelDimens'.localize();
		const labelAspect = 'DF_ARCHITECT.TileConfigExt.LabelAspect'.localize();
		const preview = config.element.find('#img-preview')[0] as HTMLImageElement;
		const info = config.element.find('#img-data')[0] as HTMLOutputElement;
		preview.src = config.element.find('input[name="img"]').val() as string;
		const image = new Image();
		image.onload = () => {
			const [num, den] = reduce(image.width, image.height);
			(<any>config).ratio = { num, den };
			info.innerHTML = `<b>${labelDimens}</b><br>${image.width}px x ${image.height}px<br><br><b>${labelAspect}</b><br>${num}:${den}`;
		};
		image.src = preview.src;
	}
}