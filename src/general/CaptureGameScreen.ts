import ARCHITECT from "../core/architect.js";
import SETTINGS from "../core/settings.js";

export default class CaptureGameScreen {
	private static readonly WARNING_SIZE = 5120 * 5120;
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

		Handlebars.registerHelper('add', (lhs, rhs) => lhs + rhs);
	}

	// Reset the canvas layers to their proper activation states
	private static cleanupLayers(hiddenItemsSnapshot: PlaceableObject[]) {
		hiddenItemsSnapshot.forEach(x => {
			(<any>x.data).hidden = true;
			x.renderable = true;
			delete x.data.flags.df_arch_hidden;
		});
		for (let layer of (<Canvas>canvas).layers) {
			layer.renderable = true;
			layer.deactivate();
			if (layer.name === 'NotesLayer') {
				const isToggled = <boolean>game.settings.get("core", (<any>layer.constructor).TOGGLE_SETTING);
				if ((<PlaceablesLayer>layer).objects) {
					(<PlaceablesLayer>layer).objects.visible = isToggled;
					(<PlaceablesLayer>layer).placeables.forEach(p => p.controlIcon.visible = isToggled);
				}
				layer.interactiveChildren = isToggled;
			}
		}
		const controlName = ui.controls.activeControl;
		const control = ui.controls.controls.find(c => c.name === controlName);
		if (control && control.layer) canvas[control.layer].activate();
	}

	static async promptForCapture() {
		const layersWithInvisiblePlaceables = ['WallsLayer', 'LightingLayer', 'SoundsLayer', 'TemplateLayer', 'NotesLayer'];
		const layersWithHiddenPlaceables = ['BackgroundLayer', 'TokenLayer', 'DrawingsLayer', 'ForegroundLayer'];
		const layerToConfig = (layer: CanvasLayer): any => {
			var label = ('LAYERS.' + layer.name).localize();
			if (label.startsWith('LAYERS.'))
				label = `"${layer.name}"`;
			return {
				label, name: layer.name,
				active: layer.name !== 'NotesLayer' ? layer._active : layer._active || game.settings.get("core", (<any>layer.constructor).TOGGLE_SETTING),
				visible: layer.renderable,
				hasControls: layersWithInvisiblePlaceables.includes(layer.name),
				hasHidden: layersWithHiddenPlaceables.includes(layer.name)
			}
		};
		const data = {
			isGM: game.user.isGM,
			compression: SETTINGS.get(this.PREF_COMP),
			png: SETTINGS.get(this.PREF_FRMT) === 'png',
			jpeg: SETTINGS.get(this.PREF_FRMT) === 'jpeg',
			webp: SETTINGS.get(this.PREF_FRMT) === 'webp',
			all: SETTINGS.get(this.PREF_TRGT) === 'all',
			layers: (<Canvas>canvas).layers.map(x => layerToConfig(x))
		};

		// Completely hide the placeables that are set as "Hidden"
		const hiddenItemsSnapshot: PlaceableObject[] = [];
		for (let layerName of layersWithHiddenPlaceables) {
			const layer = (<Canvas>canvas).getLayer(layerName) as PlaceablesLayer;
			(layer.objects.children as PlaceableObject[]).forEach(x => {
				if ((<any>x.data).hidden === undefined || !(<any>x.data).hidden) return;
				x.renderable = false;
				(<any>x.data).hidden = false;
				x.data.flags.df_arch_hidden = true;
				hiddenItemsSnapshot.push(x);
				x.refresh();
			});
		}
		var cleanupHandled = false;
		const dialog = new Dialog({
			title: 'DF_ARCHITECT.CaptureGameScreen_ScreenCapture_Label'.localize(),
			content: await renderTemplate(`modules/${ARCHITECT.MOD_NAME}/templates/capture-board.hbs`, data),
			default: 'save',
			buttons: {
				cancel: {
					icon: '<i class="fas fa-times"></i>',
					label: 'DF_ARCHITECT.CaptureGameScreen_ScreenCapture_CancelButton'.localize(),
					callback: () => { cleanupHandled = true; this.cleanupLayers(hiddenItemsSnapshot); }
				},
				save: {
					icon: '<i class="fas fa-camera"></i>',
					label: 'DF_ARCHITECT.CaptureGameScreen_ScreenCapture_ContinueButton'.localize(),
					callback: async (html: JQuery | HTMLElement) => {
						cleanupHandled = true;
						html = $(html);
						var target: string = '';
						html.find('input[name="target"]').each((_, element) => {
							if ((<HTMLInputElement>element).checked)
								target = $(element).val() as string;
						});
						const keepPadding = (<HTMLInputElement>html.find('input[name="padding"]')[0]).checked;
						const compression: number = parseFloat(html.find('#compression').val() as string);
						const call = target === 'all' ? this.captureCanvas : this.captureView;
						const format: string = html.find('#format').val() as string;
						const split: [number, number] = [parseInt(<string>html.find('#split-h').val()), parseInt(<string>html.find('#split-v').val())];
						SETTINGS.set(this.PREF_COMP, compression);
						SETTINGS.set(this.PREF_FRMT, format);
						SETTINGS.set(this.PREF_TRGT, target);
						await dialog.close();
						switch (format) {
							case "png":
								await call('image/png', 'png', compression, keepPadding, split);
								break;
							case "jpeg":
								await call('image/jpeg', 'jpg', compression, keepPadding, split);
								break;
							case "webp":
								await call('image/webp', 'webp', compression, keepPadding, split);
								break;
						}
						this.cleanupLayers(hiddenItemsSnapshot);
					}
				}
			},
			close: () => { if (!cleanupHandled) this.cleanupLayers(hiddenItemsSnapshot); },
			render: (html: JQuery<HTMLElement>) => {
				const compression = html.find('#compression');
				const output = html.find('output');
				compression.on('change', () => output.html(<string>compression.val()));
				html.find('.dfarch-capture-form section>div>input').on('change', (event: Event) => {
					const element = <HTMLInputElement>event.currentTarget;
					canvas = <Canvas>canvas;
					const layer = <PlaceablesLayer>canvas.getLayer(element.value);
					if (element.id.endsWith('-show')) {
						(<Canvas>canvas).getLayer(element.value).renderable = element.checked;
						return;
					}
					else if (element.id.endsWith('-hidden')) {
						(layer.objects.children as PlaceableObject[]).forEach(x => {
							if (!x.data.flags.df_arch_hidden) return;
							x.renderable = element.checked;
						});
					}
					else {
						// The Template Layer has specialized activation to always show template frame.
						if (layer.name === 'TemplateLayer') {
							if (element.checked) {
								if (layer.objects) {
									layer.placeables.forEach(p => {
										try {
											p.controlIcon.visible = true;
											(<MeasuredTemplate>p).ruler.visible = true;
										} catch (err) {
											console.error(err);
										}
									});
								}
							} else {
								if (layer.objects) {
									layer.objects.visible = true;
									layer.placeables.forEach(p => {
										try {
											p.controlIcon.visible = false;
											(<MeasuredTemplate>p).ruler.visible = false;
										} catch (err) {
											console.error(err);
										}
									});
								}
							}
						}
						// The Notes Layer has specialized activation when the note pins are toggled on.
						else if (layer.name === 'NotesLayer') {
							if (element.checked) {
								if (layer.objects) {
									layer._active = true;
									layer.objects.visible = true;
									layer.placeables.forEach(p => p.controlIcon.visible = true);
								}
							} else {
								if (layer.objects) {
									layer._active = false;
									layer.objects.visible = false;
									layer.placeables.forEach(p => p.controlIcon.visible = false);
								}
							}
						}
						// All the other Placeable layers act with the same default behaviour
						else {
							if (element.checked) {
								layer._active = true;
								layer.objects.visible = true;
								layer.placeables.forEach(l => l.refresh());
							} else {
								layer._active = false;
								layer.objects.visible = false;
								layer.releaseAll();
								layer.placeables.forEach(l => l.refresh());
								if (layer.preview) layer.preview.removeChildren();
							}
						}
					}
				});
			}
		});
		dialog.render(true);
	}

	static async captureView(format: string, extension: string, compression: number): Promise<void> {
		return new Promise((res, _) => {
			canvas = <Canvas>canvas;
			// Create an overlay element to be temporarily displayed
			const element = $(`<div id="dfarch-temp-overlay"><h1>${'Capturing Canvas...'.localize()}</h1></div>`);
			element.appendTo(document.body);
			const imageData = canvas.app.renderer.context.renderer.extract.base64(null, format, compression);
			// Create a virtual link to virtually click for the download
			const link = document.createElement('a');
			link.href = imageData;
			link.download = `screenshot-${new Date().toISOString().replace(/(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2}).+/, '$1$2$3-$4$5$6')}.${extension}`;
			link.click();
			// Remove the overlay after the canvas has had a chance to re-render
			setTimeout(() => { element.remove(); res(); }, 100);
		});
	}

	static async captureCanvas(format: string, extension: string, compression: number, keepPadding: boolean = false, split: [number, number] = [1, 1]): Promise<void> {
		if (isNaN(split[0])) split[0] = 1;
		if (isNaN(split[1])) split[1] = 1;
		return new Promise(async (res, _) => {
			canvas = <Canvas>canvas;
			// Save the previous orientation of the canvas stage
			const origX = canvas.stage.pivot.x;
			const origY = canvas.stage.pivot.y;
			const origS = canvas.stage.scale.x;
			const origW = canvas.app.renderer.width;
			const origH = canvas.app.renderer.height;
			// Create an overlay element to be temporarily displayed
			const element = $(`<div id="dfarch-temp-overlay"><h1>Capturing Canvas...</h1><div class="dfarch-dual-ring"></div></div>`);
			element.appendTo(document.body);
			// Calculate dimension adjustments for offseting coordinates relative to the body
			const body = $(document.body);

			var padW = 0;
			var padH = 0;
			padW = canvas.scene.data.padding * canvas.scene.data.width;
			padH = canvas.scene.data.padding * canvas.scene.data.height;
			// If we are slightly off, round to nearest grid size.
			if ((padW % canvas.grid.size) !== 0)
				padW = (Math.trunc(padW / canvas.grid.size) + 1) * canvas.grid.size;
			if ((padH % canvas.grid.size) !== 0)
				padH = (Math.trunc(padH / canvas.grid.size) + 1) * canvas.grid.size;

			const canvasW = (keepPadding ? padW * 2 : 0) + canvas.scene.data.width;
			const canvasH = (keepPadding ? padH * 2 : 0) + canvas.scene.data.height;

			const widthAdjust = (body.width() - canvasW) / 2;
			const heightAdjust = (body.height() - canvasH) / 2;

			const widthChunk = Math.ceil(canvasW / split[0]);
			const widthExtra = canvasW - (widthChunk * (split[0] - 1));
			const heightChunk = Math.ceil(canvasH / split[1]);
			const heightExtra = canvasH - (heightChunk * (split[1] - 1));

			const pixelCount = (keepPadding ? padW + widthChunk : widthChunk) * (keepPadding ? padH + heightChunk : heightChunk);
			if (pixelCount > CaptureGameScreen.WARNING_SIZE) {
				const confirmed = await Dialog.confirm({
					title: 'DF_ARCHITECT.CaptureGameScreen_ScreenCapture_WarningConfirmTitle'.localize(),
					content: 'DF_ARCHITECT.CaptureGameScreen_ScreenCapture_WarningConfirmContent'.localize(),
					defaultYes: true,
				});
				if (!confirmed) {
					element.remove();
					res();
					return;
				}
			}

			const canvasElement = $('canvas#board');
			// Create a virtual link to virtually click for the download
			const link = document.createElement('a');
			const linkDate = new Date().toISOString().replace(/(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2}).+/, '$1$2$3-$4$5$6');
			const images: string[] = [];
			for (let cy = 0; cy < split[1]; cy++) {
				const indexH = cy;
				for (let cx = 0; cx < split[0]; cx++) {
					const indexW = cx;
					await new Promise((resolve, reject) => {
						canvas = <Canvas>canvas;
						var width = 0;
						var height = 0;
						var x = widthAdjust + (keepPadding ? 0 : padW) + (widthChunk * (indexW + (split[0] / 2)));
						var y = heightAdjust + (keepPadding ? 0 : padH) + (heightChunk * (indexH + (split[1] / 2)));
						if (split[0] > 1 && indexW == split[0] - 1) {
							width = widthExtra;
							x -= (widthChunk - widthExtra) / 2;
						} else width = widthChunk;
						if (split[1] > 1 && indexH == split[1] - 1) {
							height = heightExtra;
							y -= (heightChunk - heightExtra) / 2;
						} else height = heightChunk;
						// Update the orientation of the canvas stage
						canvas.app.renderer.resize(width, height);
						canvas.stage.scale.set(1);
						canvas.stage.pivot.set(x, y);
						// Update the canvas element dimensions
						canvasElement.css('width', width + 'px');
						canvasElement.css('height', height + 'px');
						setTimeout(() => {
							// Collect the Image Data
							try {
								images.push((<Canvas>canvas).app.renderer.context.renderer.extract.base64(null, format, compression));
								resolve(undefined);
							} catch (e) {
								reject(e);
							}
						}, 100);
					});
				}
			}
			// Reset the canvas dimensions
			canvasElement.css('width', origW + 'px');
			canvasElement.css('height', origH + 'px');
			// Reset the orientation of the canvas stage
			canvas.app.renderer.resize(origW, origH);
			canvas.stage.scale.set(origS);
			canvas.stage.pivot.set(origX, origY);
			// Remove the overlay after the canvas has had a chance to re-render
			setTimeout(() => {
				// Serve up the images as downloads
				for (let c = 0; c < images.length; c++) {
					link.href = images[c];
					link.download = `screenshot${images.length > 1 ? '_' + (c + 1) : ''}-${linkDate}.${extension}`;
					link.click();
				}
				element.remove();
				res();
			}, 100);
		});
	}
}
