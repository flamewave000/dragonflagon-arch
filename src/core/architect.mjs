export default class ARCHITECT {
	static MOD_NAME = 'df-architect'

	static reportProgress(context: string, progress: number, total: number, keepAlive: boolean = false) {
		const loader = document.getElementById("loading");
		const pct = Math.round((progress / total) * 100);
		loader.querySelector<HTMLElement>("#context").textContent = context + ` (${progress}/${total})`;
		loader.querySelector<HTMLElement>("#loading-bar").style.width = `${pct}%`;
		loader.querySelector<HTMLElement>("#progress").textContent = `${pct}%`;
		loader.style.display = "block";
		if ((pct === 100) && !loader.hidden && !keepAlive) $(loader).fadeOut(2000);
	}
	static hideProgress(immediately = false) {
		immediately ? $('#loading').hide() : $('#loading').fadeOut(2000);
	}

	static requestReload() {
		const dialog: Dialog = new Dialog({
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

	static Base64ToBlob(b64Data: string, contentType: string, sliceSize = 512) {
		const byteCharacters = atob(b64Data);
		const byteArrays: Uint8Array[] = [];
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

	
	static getLayer<T extends CanvasLayer>(key: string): T {
		const layer = <T>(canvas as any as { [key: string]: CanvasLayer })[key];
		if(!layer)
			return <T>(<any>CONFIG.Canvas.layers[key].layerClass).instance;
		return layer;
	}

	private static readonly GR_BG_HI = '44';
	private static readonly GR_BG_LO = '08';
	private static readonly GR_BG_BDR = '36a';
	private static readonly GR_BG_TCT = '4d4';
	private static GRAPHIC: string[] = [
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
		const loEnd = parseInt(this.GR_BG_LO, 16);
		const hiEnd = parseInt(this.GR_BG_HI, 16);
		const bdr = `;color:#${this.GR_BG_BDR}`;
		const tct = `;color:#${this.GR_BG_TCT}`;
		for (let c = 0; c < this.GRAPHIC.length; c++) {
			var bg: number | string = Math.trunc((((this.GRAPHIC.length - 1) - c) / (this.GRAPHIC.length - 1)) * (hiEnd - loEnd)) + loEnd;
			bg = 'background:#' + (bg < 16 ? '0' + bg.toString(16) : bg.toString(16)).repeat(3);
			css.push(bg + bdr);
			css.push(bg + tct);
			css.push(bg + bdr);
		}
		console.log(ARCHITECT.GRAPHIC.join('\n'), ...css);
	}
};