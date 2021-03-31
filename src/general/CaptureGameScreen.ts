import SETTINGS from "../core/settings.js";

export default class CaptureGameScreen {
	static readonly PREF_ALLOW_PC = 'CaptureGameScreen.AllowPC';
	static init() {
		SETTINGS.register(this.PREF_ALLOW_PC, {
			name: 'DF_ARCHITECT.CaptureGameScreen_Setting_AllowPC_Name',
			hint: 'DF_ARCHITECT.CaptureGameScreen_Setting_AllowPC_Hint',
			scope: 'world',
			config: true,
			type: Boolean,
			default: false,
		});
	}
	static ready() {
		if (!SETTINGS.get(this.PREF_ALLOW_PC) && !game.user.isGM) return;

		Hooks.on('renderSettings', function (settings: Settings, html: JQuery<HTMLElement>, data: {}) {
			const captureButton = $(`<div><button data-action="screen-capture"><i class="fas fa-camera"></i>${game.i18n.localize('DF_ARCHITECT.CaptureGameScreen_ScreenCapture_Label')}</button></div>`);
			captureButton.find('button').on('click', () => {
				const renderer = (<Canvas>canvas).app.renderer;
				const gl = renderer.context.renderer.gl;
				const pixels = new Uint8Array(renderer.width * renderer.height * 4);
				gl.readPixels(0, 0, renderer.width, renderer.height, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
				const imageData = renderer.context.renderer.extract.base64(null, 'image/png');
				// const image = new Image();
				// image.src = imageData;
				// const tab = window.open("");
				// tab.document.write(image.outerHTML);
				const link = document.createElement('a');
				link.href = imageData;
				link.download = `screenshot-${new Date().toISOString().replace(/(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2}).+/, '$1$2$3-$4$5$6')}.png`;
				link.click();
			});
			html.find('#game-details').after(captureButton);
		});
	}
}
