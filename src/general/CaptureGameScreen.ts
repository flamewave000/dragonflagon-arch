import ARCHITECT from "../core/architect.js";
import SETTINGS from "../core/settings.js";

export default class CaptureGameScreen {
	static readonly PREF_ALLOW_PC = 'CaptureGameScreen.AllowPC';
	static readonly PREF_COMP = 'CaptureGameScreen.Compression';
	static readonly PREF_FRMT = 'CaptureGameScreen.Format';
	static readonly PREF_TRGT = 'CaptureGameScreen.Target';
	static init() {
		SETTINGS.register(this.PREF_ALLOW_PC, {
			name: 'DF_ARCHITECT.CaptureGameScreen_Setting_AllowPC_Name',
			hint: 'DF_ARCHITECT.CaptureGameScreen_Setting_AllowPC_Hint',
			scope: 'world',
			config: true,
			type: Boolean,
			default: false,
		});
		SETTINGS.register(this.PREF_COMP, {
			scope: 'client',
			config: false,
			type: Number,
			default: 0.95,
		});
		SETTINGS.register(this.PREF_FRMT, {
			scope: 'client',
			config: false,
			type: String,
			default: 'png',
		});
		SETTINGS.register(this.PREF_TRGT, {
			scope: 'client',
			config: false,
			type: String,
			default: 'all',
		});

		Hooks.on('renderSettings', (settings: Settings, html: JQuery<HTMLElement>, data: {}) => {
			if (!SETTINGS.get(this.PREF_ALLOW_PC) && !game.user.isGM) return;
			const captureButton = $(`<div><button data-action="screen-capture"><i class="fas fa-camera"></i>${'DF_ARCHITECT.CaptureGameScreen_ScreenCapture_Label'.localize()}</button></div>`);
			captureButton.find('button').on('click', CaptureGameScreen.promptForCapture.bind(CaptureGameScreen));
			html.find('#game-details').after(captureButton);
		});
	}

	static async promptForCapture() {

		const data = {
			compression: SETTINGS.get(this.PREF_COMP),
			png: SETTINGS.get(this.PREF_FRMT) === 'png',
			jpeg: SETTINGS.get(this.PREF_FRMT) === 'jpeg',
			webp: SETTINGS.get(this.PREF_FRMT) === 'webp',
			all: SETTINGS.get(this.PREF_TRGT) === 'all',
		};

		const dialog = new Dialog({
			title: 'DF_ARCHITECT.CaptureGameScreen_ScreenCapture_Label'.localize(),
			content: await renderTemplate(`modules/${ARCHITECT.MOD_NAME}/templates/capture-board.hbs`, data),
			default: 'save',
			buttons: {
				cancel: {
					icon: '<i class="fas fa-times"></i>',
					label: 'DF_ARCHITECT.CaptureGameScreen_ScreenCapture_CancelButton'.localize()
				},
				save: {
					icon: '<i class="fas fa-camera"></i>',
					label: 'DF_ARCHITECT.CaptureGameScreen_ScreenCapture_ContinueButton'.localize(),
					callback: async (html: JQuery | HTMLElement) => {
						html = $(html);
						var target: string = '';
						html.find('input[name="target"]').each((_, element) => {
							if ((<HTMLInputElement>element).checked)
								target = $(element).val() as string;
						});
						const compression: number = parseFloat(html.find('#compression').val() as string);
						const call = target === 'all' ? this.captureCanvas : this.captureView;
						const format: string = html.find('#format').val() as string;
						SETTINGS.set(this.PREF_COMP, compression);
						SETTINGS.set(this.PREF_FRMT, format);
						SETTINGS.set(this.PREF_TRGT, target);
						await dialog.close();
						switch (format) {
							case "png":
								call('image/png', 'png', compression);
								break;
							case "jpeg":
								call('image/jpeg', 'jpg', compression);
								break;
							case "webp":
								call('image/webp', 'webp', compression);
								break;
						}
					}
				}
			},
			render: (html: JQuery<HTMLElement>) => {
				const compression = html.find('#compression');
				const output = html.find('output');
				compression.on('change', () => output.html(compression.val() as string));
			}
		});
		dialog.render(true);
	}

	static captureView(format: string, extension: string, compression: number) {
		canvas = <Canvas>canvas;
		// Create an overlay element to be temporarily displayed
		const element = $(`<div id="dfarch-temp-overlay"><h1>${'Capturing Canvas...'.localize()}</h1></div>`);
		element.appendTo(document.body);
		const imageData = canvas.app.renderer.context.renderer.extract.base64(null, format, compression);
		setTimeout(() => element.remove(), 100);
		// Create a virtual link to virtually click for the download
		const link = document.createElement('a');
		link.href = imageData;
		link.download = `screenshot-${new Date().toISOString().replace(/(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2}).+/, '$1$2$3-$4$5$6')}.${extension}`;
		link.click();
	}

	static captureCanvas(format: string, extension: string, compression: number) {
		canvas = <Canvas>canvas;
		// Save the previous orientation of the canvas stage
		const origX = canvas.stage.pivot.x;
		const origY = canvas.stage.pivot.y;
		const origS = canvas.stage.scale.x;
		const origW = canvas.app.renderer.width;
		const origH = canvas.app.renderer.height;
		// Create an overlay element to be temporarily displayed
		const element = $(`<div id="dfarch-temp-overlay"><h1>Capturing Canvas...</h1></div>`);
		element.appendTo(document.body);
		// Calculate dimension adjustments for offseting coordinates relative to the body
		const body = $(document.body);
		const widthAdjust = (body.width() - canvas.scene.data.width) / 2;
		const heightAdjust = (body.height() - canvas.scene.data.height) / 2;
		// Update the orientation of the canvas stage
		canvas.app.renderer.resize(canvas.scene.data.width, canvas.scene.data.height);
		canvas.stage.scale.set(1);
		canvas.stage.pivot.set((canvas.app.stage.width / 2) + widthAdjust, (canvas.app.stage.height / 2) + heightAdjust);
		// Update the canvas element dimensions
		const canvasElement = $('canvas#board');
		canvasElement.css('width', canvas.scene.data.width + 'px');
		canvasElement.css('height', canvas.scene.data.height + 'px');
		setTimeout(() => {
			canvas = <Canvas>canvas;
			// Collect the Image Data
			const imageData = canvas.app.renderer.context.renderer.extract.base64(null, format, compression);
			// Reset the canvas dimensions
			canvasElement.css('width', origW + 'px');
			canvasElement.css('height', origH + 'px');
			// Reset the orientation of the canvas stage
			canvas.app.renderer.resize(origW, origH);
			canvas.stage.scale.set(origS);
			canvas.stage.pivot.set(origX, origY);
			// Remove the overlay after the canvas has had a chance to re-render
			setTimeout(() => element.remove(), 100);
			// Create a virtual link to virtually click for the download
			const link = document.createElement('a');
			link.href = imageData;
			link.download = `screenshot-${new Date().toISOString().replace(/(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2}).+/, '$1$2$3-$4$5$6')}.${extension}`;
			link.click();
		}, 100);
	}
}
