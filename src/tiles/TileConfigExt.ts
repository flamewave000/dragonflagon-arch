import { TileData } from "@league-of-foundry-developers/foundry-vtt-types/src/foundry/common/data/module.mjs";
import SETTINGS from "../core/settings.js";

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
	private static readonly PREF_SHOW_CONTROLS = 'TileConfigExt.ShowControls';
	private static _previewImageHTML = `<section class="df-arch-tile-config">
	<img id="img-preview" style="display: none;">
	<video id="anim-preview" style="display: none;" autoplay muted loop></video>
	<output id="img-data" />
</section>`;

	static init() {
		SETTINGS.register(this.PREF_SHOW_CONTROLS, {
			name: 'DF_ARCHITECT.TileConfigExt.SettingControlsName',
			hint: 'DF_ARCHITECT.TileConfigExt.SettingControlsHint',
			config: true,
			scope: 'world',
			type: Boolean,
			default: true
		});
		Hooks.on('renderTileConfig', this.updateTileConfig.bind(this));
	}

	private static updateTileConfig(config: TileConfig, html: JQuery<HTMLElement>, data: TileData) {
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
		const imgPreview = config.element.find('#img-preview')[0] as HTMLImageElement;
		const animPreview = config.element.find('#anim-preview')[0] as HTMLVideoElement;
		const info = config.element.find('#img-data')[0] as HTMLOutputElement;
		const source = config.element.find('input[name="img"]').val() as string;
		if (VideoHelper.hasVideoExtension(source)) {
			$(imgPreview).hide();
			$(animPreview).show();
			animPreview.controls = SETTINGS.get(this.PREF_SHOW_CONTROLS);
			animPreview.addEventListener('loadedmetadata', () => {
				const [num, den] = reduce(animPreview.videoWidth, animPreview.videoHeight);
				(<any>config).ratio = { num, den };
				info.innerHTML = `<b>${labelDimens}</b><br>${animPreview.videoWidth}px x ${animPreview.videoHeight}px<br><br><b>${labelAspect}</b><br>${num}:${den}`;
			});
			animPreview.src = source;
			animPreview.load();
		} else {
			$(imgPreview).show();
			$(animPreview).hide();
			imgPreview.src = source;
			const image = new Image();
			image.onload = () => {
				const [num, den] = reduce(image.width, image.height);
				(<any>config).ratio = { num, den };
				info.innerHTML = `<b>${labelDimens}</b><br>${image.width}px x ${image.height}px<br><br><b>${labelAspect}</b><br>${num}:${den}`;
			};
			image.src = imgPreview.src;
		}
	}
}