export default class ARCHITECT {
	static MOD_NAME = 'df-architect'

	static requestReload() {
		const dialog: Dialog = new Dialog({
			title: 'DF_ARCHITECT.ReloadRequired_Title'.localize(),
			content: 'DF_ARCHITECT.ReloadRequired_Content'.localize(),
			default: 'yes',
			buttons: {
				no: {
					icon: '<i class="fas fa-times"></i>',
					label: 'DF_ARCHITECT.ReloadRequired_Negative'.localize(),
					callback: async () => await dialog.close()
				},
				yes: {
					icon: '<i class="fas fa-check"></i>',
					label: 'DF_ARCHITECT.ReloadRequired_Positive'.localize(),
					callback: () => window.location.reload()
				}
			}
		});
		dialog.render(true);
	}

	private static readonly GR_BG_HI = '35';
	private static readonly GR_BG_LO = '08';
	private static readonly GR_BG_BDR = '36a';
	private static readonly GR_BG_TCT = '4d4';
	private static GRAPHIC: string[] = [
		"%c ┌──────────────────────────────────────────────────────────────┐ ",
		"%c │%c ______               __          __                  __      %c│ ",
		"%c │%c/\\  _  \\             /\\ \\      __/\\ \\__              /\\ \\__   %c│ ",
		"%c │%c\\ \\ \\L\\ \\  _ __   ___\\ \\ \\___ /\\_\\ \\ ,_\\    __    ___\\ \\ ,_\\  %c│ ",
		"%c │%c \\ \\  __ \\/\\`'__\\/'___\\ \\  _ `\\/\\ \\ \\ \\/  /'__`\\ /'___\\ \\ \\/  %c│ ",
		"%c │%c  \\ \\ \\/\\ \\ \\ \\//\\ \\__/\\ \\ \\ \\ \\ \\ \\ \\ \\_/\\  __//\\ \\__/\\ \\ \\_ %c│ ",
		"%c │%c   \\ \\_\\ \\_\\ \\_\\\\ \\____\\\\ \\_\\ \\_\\ \\_\\ \\__\\ \\____\\ \\____\\\\ \\__\\%c│ ",
		"%c │%c    \\/_/\\/_/\\/_/ \\/____/ \\/_/\\/_/\\/_/\\/__/\\/____/\\/____/ \\/__/%c│ ",
		"%c ╘══════════════════════════════════════════════════════════════╛ "];

	static DrawArchitectGraphicToConsole() {
		const css = [`background:#${this.GR_BG_HI.repeat(3)};color:#${this.GR_BG_BDR}`];
		const loEnd = parseInt(this.GR_BG_LO, 16);
		const hiEnd = parseInt(this.GR_BG_HI, 16);
		for (let c = 0, size = this.GRAPHIC.length - 2; c < size; c++) {
			var bg = (Math.trunc(((hiEnd - loEnd) / (size + 2)) * ((size + 2) - (c + 1))) + loEnd).toString(16);
			bg = bg.repeat(3);
			css.push(...[`background:#${bg};color:#${this.GR_BG_BDR}`, `background:#${bg};color:#${this.GR_BG_TCT}`, `background:#${bg};color:#${this.GR_BG_BDR}`]);
		}
		css.push(`background:#${this.GR_BG_LO.repeat(3)};color:#${this.GR_BG_BDR}`);
		console.log(ARCHITECT.GRAPHIC.join('\n'), ...css);
	}
};