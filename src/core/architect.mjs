/// <reference path="../../fvtt-scripts/foundry.js" />

export default class ARCHITECT {
	static MOD_NAME = 'df-architect'

	/**
	 * @param {string} context
	 * @param {number} progress
	 * @param {number} total
	 * @param {boolean} [keepAlive] default: false
	 */
	static reportProgress(context, progress, total, keepAlive = false) {
		const loader = document.getElementById("loading");
		const pct = Math.round((progress / total) * 100);
		loader.querySelector("#context").textContent = context + ` (${progress}/${total})`;
		loader.querySelector("#loading-bar").style.width = `${pct}%`;
		loader.querySelector("#progress").textContent = `${pct}%`;
		loader.style.display = "block";
		if ((pct === 100) && !loader.hidden && !keepAlive) $(loader).fadeOut(2000);
	}
	static hideProgress(immediately = false) {
		immediately ? $('#loading').hide() : $('#loading').fadeOut(2000);
	}

	static requestReload() {
		const dialog = new Dialog({
			title: 'DF_ARCHITECT.ReloadRequired.Title'.localize(),
			content: 'DF_ARCHITECT.ReloadRequired.Content'.localize(),
			default: 'yes',
			buttons: {
				no: {
					icon: '<i class="fas fa-times"><╱i>',
					label: 'DF_ARCHITECT.ReloadRequired.Negative'.localize(),
					callback: async () => await dialog.close()
				},
				yes: {
					icon: '<i class="fas fa-check"><╱i>',
					label: 'DF_ARCHITECT.ReloadRequired.Positive'.localize(),
					callback: () => window.location.reload()
				}
			}
		});
		dialog.render(true);
	}

	/**
	 * @param {string} b64Data
	 * @param {string} contentType
	 * @param {number} sliceSize Default: 512
	 * @returns {Blob}
	 */
	static Base64ToBlob(b64Data, contentType, sliceSize = 512) {
		const byteCharacters = atob(b64Data);
		/**@type {Uint8Array[]}*/
		const byteArrays = [];
		for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
			const slice = byteCharacters.slice(offset, offset + sliceSize);
			const byteNumbers = new Array<number>(slice.length);
			for (let i = 0; i < slice.length; i++) {
				byteNumbers[i] = slice.charCodeAt(i);
			}
			const byteArray = new Uint8Array(byteNumbers);
			byteArrays.push(byteArray);
		}
		return new Blob(byteArrays, { type: contentType });
	}

	/**
	 * @template {T extends CanvasLayer}
	 * @param {string} key
	 * @returns {T}
	 */
	static getLayer(key) {
		/**@type { { [key: string]: CanvasLayer } }*/
		const layer = canvas[key];
		if(!layer)
			return CONFIG.Canvas.layers[key].layerClass.instance;
		return layer;
	}

	/**@readonly*/static #GR_BG_HI = '44';
	/**@readonly*/static #GR_BG_LO = '08';
	/**@readonly*/static #GR_BG_BDR = '36a';
	/**@readonly*/static #GR_BG_TCT = '4d4';
	/**@type {string[]}*/static #GRAPHIC = [
		"%c                                                                      %c%c",
		"%c  ╭────────────────────────────────────────────────────────────────╮  %c%c",
		"%c  │ %c ______  ╭╮  ○    ◌   __  ○     ◌ __        ╭╮    ○   __       %c│  ",
		"%c  │ %c╱╲  _  ╲ ╰╯     ╭╮   ╱╲ ╲    ◌ __╱╲ ╲__  ○  ╰╯  ╭╮   ╱╲ ╲__  ◌ %c│  ",
		"%c  │ %c╲ ╲ ╲L╲ ╲  _ __ ╰╯___╲ ╲ ╲____╱╲_╲ ╲  _╲   ____ ╰╯___╲ ╲  _╲   %c│  ",
		"%c  │ %c ╲ ╲  __ ╲╱╲╵ __╲╱ ___╲ ╲  __ ╲╱╲ ╲ ╲ ╲╱  ╱ __ ╲ ╱ ___╲ ╲ ╲╱○  %c│  ",
		"%c  │ %c  ╲ ╲ ╲╱╲ ╲ ╲ ╲╱╱╲ ╲__╱╲ ╲ ╲ ╲ ╲ ╲ ╲ ╲ ╲_╱╲  __╱╱╲ ╲__╱╲ ╲ ╲_  %c│  ",
		"%c  │ %c ◌ ╲ ╲_╲ ╲_╲ ╲_╲╲ ╲____╲╲ ╲_╲ ╲_╲ ╲_╲ ╲__╲ ╲____╲ ╲____╲╲ ╲__╲ %c│  ",
		"%c  │ %c    ╲╱_╱╲╱_╱╲╱_╱ ╲╱____╱ ╲╱_╱╲╱_╱╲╱_╱╲╱__╱╲╱____╱╲╱____╱ ╲╱__╱ %c│  ",
		"%c  ╰────────────────────────────────────────────────────────────────╯  %c%c",
		"%c                                                                      %c%c"];
	static DrawArchitectGraphicToConsole() {
		const css = [];
		const loEnd = parseInt(this.#GR_BG_LO, 16);
		const hiEnd = parseInt(this.#GR_BG_HI, 16);
		const bdr = `;color:#${this.#GR_BG_BDR}`;
		const tct = `;color:#${this.#GR_BG_TCT}`;
		for (let c = 0; c < this.#GRAPHIC.length; c++) {
			/**@type {number | string}*/
			var bg = Math.trunc((((this.#GRAPHIC.length - 1) - c) / (this.#GRAPHIC.length - 1)) * (hiEnd - loEnd)) + loEnd;
			bg = 'background:#' + (bg < 16 ? '0' + bg.toString(16) : bg.toString(16)).repeat(3);
			css.push(bg + bdr);
			css.push(bg + tct);
			css.push(bg + bdr);
		}
		console.log(ARCHITECT.#GRAPHIC.join('\n'), ...css);
	}
};