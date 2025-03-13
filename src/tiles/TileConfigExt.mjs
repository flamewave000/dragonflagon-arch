/// <reference path="../../fvtt-scripts/foundry.js" />
import SETTINGS from "../core/settings.mjs";

/**
 * Reduce a fraction to minimum denominator
 * @param {number} numerator
 * @param {number} denominator
 * @returns {[number, number]}
 */
function reduce(numerator, denominator) {
	var a = numerator;
	var b = denominator;
	var c;
	while (b) {
		c = a % b; a = b; b = c;
	}
	return [numerator / a, denominator / a];
}

export default class TileConfigExt {
	/**@readonly*/static #PREF_SHOW_CONTROLS = 'TileConfigExt.ShowControls';
	static #previewImageHTML = `<section class="df-arch-tile-config">
	<img id="img-preview" style="display: none;">
	<video id="anim-preview" style="display: none;" autoplay muted loop></video>
	<output id="img-data" />
</section>`;

	static init() {
		SETTINGS.register(this.#PREF_SHOW_CONTROLS, {
			name: 'DF_ARCHITECT.TileConfigExt.SettingControlsName',
			hint: 'DF_ARCHITECT.TileConfigExt.SettingControlsHint',
			config: true,
			scope: 'world',
			type: Boolean,
			default: true
		});
		Hooks.on('renderTileConfig', this.#updateTileConfig.bind(this));
	}

	/**
	 * @param {TileConfig} config
	 * @param {JQuery<HTMLElement>} html
	 * @param {TileDocument} data
	 */
	static #updateTileConfig(config, html, data) {
		// Update the image preview
		const imgInput = html.find('file-picker[name="texture.src"]');
		imgInput.parent().parent().before($(this.#previewImageHTML));
		imgInput.on('change', () => this.#updateImagePreview(config));
		this.#updateImagePreview(config);
		// Add the ratio scale buttons
		const horTitle = 'Scale the width to the aspect ratio relative to the current height'.localize();
		const verTitle = 'Scale the height to the aspect ratio relative to the current width'.localize();
		const width = html.find('input[name="width"]');
		const height = html.find('input[name="height"]');
		width.after($(`<button class="df-arch-scale" data-tooltip="${horTitle}"><i class="fas fa-arrows-alt-h"></i></button>`)
			.on('click', e => {
				e.preventDefault();
				const ratio = config.ratio.num / config.ratio.den;
				width.val(Math.round(parseInt(height.val()) * ratio))
					.trigger('change');
			}));
		height.after($(`<button class="df-arch-scale" data-tooltip="${verTitle}"><i class="fas fa-arrows-alt-v"></i></button>`)
			.on('click', e => {
				e.preventDefault();
				const ratio = config.ratio.num / config.ratio.den;
				height.val(Math.round(parseInt(width.val()) / ratio))
					.trigger('change');
			}));
		config.setPosition({ left: config.position.left, top: config.position.top });
	}

	/**@param {TileConfig} config*/
	static #updateImagePreview(config) {
		if (config.element.find('file-picker[name="texture.src"]').val() === "") return;
		const labelDimens = 'DF_ARCHITECT.TileConfigExt.LabelDimens'.localize();
		const labelAspect = 'DF_ARCHITECT.TileConfigExt.LabelAspect'.localize();
		/**@type  {HTMLImageElement}*/const imgPreview = config.element.find('#img-preview')[0];
		/**@type  {HTMLVideoElement}*/const animPreview = config.element.find('#anim-preview')[0];
		/**@type {HTMLOutputElement}*/const info = config.element.find('#img-data')[0];
		/**@type            {string}*/const source = config.element.find('file-picker[name="texture.src"]').val();
		if (VideoHelper.hasVideoExtension(source)) {
			$(imgPreview).hide();
			$(animPreview).show();
			animPreview.controls = SETTINGS.get(this.#PREF_SHOW_CONTROLS);
			animPreview.addEventListener('loadedmetadata', () => {
				const [num, den] = reduce(animPreview.videoWidth, animPreview.videoHeight);
				config.ratio = { num, den };
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
				config.ratio = { num, den };
				info.innerHTML = `<b>${labelDimens}</b><br>${image.width}px x ${image.height}px<br><br><b>${labelAspect}</b><br>${num}:${den}`;
				requestAnimationFrame(() => config.setPosition({}));
			};
			image.src = imgPreview.src;
		}
	}
}