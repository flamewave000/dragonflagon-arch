export default class ARCHITECT {
	static MOD_NAME = 'df-architect'

	static requestReload() {
		const dialog: Dialog = new Dialog({
			title: 'DF_ARCHITECT.ReloadRequired_Title'.localize(),
			content: 'DF_ARCHITECT.ReloadRequired_Content'.localize(),
			default: 'yes',
			buttons: {
				no: {
					icon: '<i class="fas fa-times"><╱i>',
					label: 'DF_ARCHITECT.ReloadRequired_Negative'.localize(),
					callback: async () => await dialog.close()
				},
				yes: {
					icon: '<i class="fas fa-check"><╱i>',
					label: 'DF_ARCHITECT.ReloadRequired_Positive'.localize(),
					callback: () => window.location.reload()
				}
			}
		});
		dialog.render(true);
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