import ARCHITECT from "../core/architect.js";
import SETTINGS from "../core/settings.js";

interface LayerFilter {
	s: boolean;  // show layer
	h?: boolean; // show hidden elements
	c?: boolean; // show controls
}

// Declare OpenCV API
declare namespace cv {
	class Mat {
		delete(): void;
		isDeleted(): boolean;
		size(): { width: number, height: number };
	}
	class MatVector {
		push_back(mat: Mat): void;
		delete(): void;
		isDeleted(): boolean;
	}
	function imread(src: HTMLCanvasElement): Mat;
	function imshow(dst: HTMLCanvasElement, image: Mat): void;
	function hconcat(vector: MatVector, dst: Mat): void;
	function vconcat(vector: MatVector, dst: Mat): void;
}

export default class CaptureGameScreen {
	private static readonly SPLIT_DIM = 1024 * 4; // Maximum 64MiB Raw Image
	private static readonly WARNING_SIZE = CaptureGameScreen.SPLIT_DIM * CaptureGameScreen.SPLIT_DIM;
	static readonly PREF_ALLOW_PC = 'CaptureGameScreen.AllowPC';
	static readonly PREF_COMP = 'CaptureGameScreen.Compression';
	static readonly PREF_FRMT = 'CaptureGameScreen.Format';
	static readonly PREF_TRGT = 'CaptureGameScreen.Target';
	static readonly PREF_PADS = 'CaptureGameScreen.Padding';
	static readonly PREF_LYRS = 'CaptureGameScreen.Layers';
	static readonly PREF_FILE = 'CaptureGameScreen.FileSettings';
	static readonly PREF_BG_HIDE = 'CaptureGameScreen.BG.Hide';
	static readonly PREF_BG_COLO = 'CaptureGameScreen.BG.Colour';
	static readonly PREF_BG_ALPH = 'CaptureGameScreen.BG.Alpha';
	static readonly LayersWithInvisiblePlaceables = ['WallsLayer', 'LightingLayer', 'SoundsLayer', 'TemplateLayer', 'NotesLayer'];
	static readonly LayersWithHiddenPlaceables = ['BackgroundLayer', 'TokenLayer', 'DrawingsLayer', 'ForegroundLayer'];
	private static _layerFilters: { [key: string]: LayerFilter };
	private static _fileSettings: { name: string, date: boolean };
	private static _captureInProgress = false;
	private static _getLayerFilter(key: string): LayerFilter {
		if (!this._layerFilters[key])
			this._layerFilters[key] = { s: true };
		return this._layerFilters[key];
	}
	static init() {
		SETTINGS.register(this.PREF_ALLOW_PC, {
			name: 'DF_ARCHITECT.CaptureGameScreen.Setting.AllowPC_Name',
			hint: 'DF_ARCHITECT.CaptureGameScreen.Setting.AllowPC_Hint',
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
		SETTINGS.register(this.PREF_PADS, {
			scope: 'client',
			config: false,
			type: Boolean,
			default: false,
		});
		SETTINGS.register(this.PREF_LYRS, {
			scope: 'client',
			config: false,
			type: Object,
			default: {},
		});
		SETTINGS.register(this.PREF_FILE, {
			scope: 'client',
			config: false,
			type: Object,
			default: { name: '', date: true },
		});
		SETTINGS.register(this.PREF_BG_HIDE, {
			scope: 'client',
			config: false,
			type: Boolean,
			default: false,
		});
		SETTINGS.register(this.PREF_BG_COLO, {
			scope: 'client',
			config: false,
			type: String,
			default: '#999999',
		});
		SETTINGS.register(this.PREF_BG_ALPH, {
			scope: 'client',
			config: false,
			type: Number,
			default: 100,
		});

		this._layerFilters = SETTINGS.get(this.PREF_LYRS);
		this._fileSettings = SETTINGS.get(this.PREF_FILE);

		Hooks.on('renderSettings', (settings: Settings, html: JQuery<HTMLElement>, data: {}) => {
			if (!SETTINGS.get(this.PREF_ALLOW_PC) && !game.user.isGM) return;
			const captureButton = $(`<div><button data-action="screen-capture"><i class="fas fa-camera"></i>${'DF_ARCHITECT.CaptureGameScreen.ScreenCapture.Label'.localize()}</button></div>`);
			captureButton.find('button').on('click', CaptureGameScreen.promptForCapture.bind(CaptureGameScreen));
			html.find('#game-details').after(captureButton);
		});

		Handlebars.registerHelper('add', (lhs, rhs) => lhs + rhs);
	}

	static async promptForCapture() {
		const layerToConfig = (layer: CanvasLayer): any => {
			var label = ('LAYERS.' + layer.name).localize();
			if (label.startsWith('LAYERS.'))
				label = `"${layer.name}"`;
			return {
				label, name: layer.name,
				active: layer.name !== 'NotesLayer' ? layer._active : layer._active || game.settings.get("core", (<any>layer.constructor).TOGGLE_SETTING),
				hasControls: this.LayersWithInvisiblePlaceables.includes(layer.name),
				hasHidden: this.LayersWithHiddenPlaceables.includes(layer.name),
				filter: mergeObject({ s: true, h: false, c: false }, this._getLayerFilter(layer.name))
			}
		};
		const data = {
			isGM: game.user.isGM,
			compression: SETTINGS.get(this.PREF_COMP),
			png: SETTINGS.get(this.PREF_FRMT) === 'png',
			jpeg: SETTINGS.get(this.PREF_FRMT) === 'jpeg',
			webp: SETTINGS.get(this.PREF_FRMT) === 'webp',
			all: SETTINGS.get(this.PREF_TRGT) === 'all',
			pads: SETTINGS.get(this.PREF_PADS),
			layers: (<Canvas>canvas).layers.map(x => layerToConfig(x)),
			fileName: this._fileSettings.name,
			fileDate: this._fileSettings.date,
			bg: {
				hide: SETTINGS.get<boolean>(this.PREF_BG_HIDE),
				alph: SETTINGS.get<number>(this.PREF_BG_ALPH),
				colo: SETTINGS.get<string>(this.PREF_BG_COLO)
			}
		};

		// Initialize the Background
		canvas.background.bg.visible = !data.bg.hide;
		canvas.app.renderer.backgroundColor = parseInt(data.bg.colo.slice(1), 16);
		(<any>canvas.app.renderer).backgroundAlpha = data.bg.alph / 100.0;

		// Completely hide the placeables that are set as "Hidden"
		const hiddenItemsSnapshot: PlaceableObject[] = await this.beginCapture();
		var cleanupHandled = false;
		const dialog = new Dialog({
			title: 'DF_ARCHITECT.CaptureGameScreen.ScreenCapture.Label'.localize(),
			content: await renderTemplate(`modules/${ARCHITECT.MOD_NAME}/templates/capture-board.hbs`, data),
			default: 'save',
			buttons: {
				cancel: {
					icon: '<i class="fas fa-times"></i>',
					label: 'DF_ARCHITECT.General.Cancel'.localize(),
					callback: () => { cleanupHandled = true; this.endCapture(hiddenItemsSnapshot); }
				},
				save: {
					icon: '<i class="fas fa-camera"></i>',
					label: 'DF_ARCHITECT.CaptureGameScreen.ScreenCapture.ContinueButton'.localize(),
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
						this._fileSettings = {
							name: (<HTMLInputElement>html.find('#fileName')[0]).value.trim(),
							date: (<HTMLInputElement>html.find('#fileDate')[0]).checked
						};
						SETTINGS.set(this.PREF_FILE, this._fileSettings);
						await Promise.all([
							SETTINGS.set(this.PREF_COMP, compression),
							SETTINGS.set(this.PREF_FRMT, format),
							SETTINGS.set(this.PREF_TRGT, target),
							SETTINGS.set(this.PREF_PADS, keepPadding)]);
						await dialog.close();
						var imageData: string;
						try {
							switch (format) {
								case "png":
									imageData = await call('image/png', compression, keepPadding);
									break;
								case "jpeg":
									imageData = await call('image/jpeg', compression, keepPadding);
									break;
								case "webp":
									imageData = await call('image/webp', compression, keepPadding);
									break;
							}
						} catch (error) {
							console.warn(error);
							return;
						} finally {
							this.endCapture(hiddenItemsSnapshot);
						}
						const extension = imageData.match(/^data:image\/(.+);/)[1];
						const linkName = this._fileSettings?.name?.length === 0 ? 'screenshot' : this._fileSettings.name
						const link = document.createElement('a');
						link.href = imageData;
						if (this._fileSettings.date) {
							const linkDate = new Date().toISOString().replace(/(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2}).+/, '$1$2$3-$4$5$6');
							link.download = `${linkName}-${linkDate}.${extension}`;
						}
						else link.download = `${linkName}.${extension}`;
						link.click();
					}
				}
			},
			close: () => { if (!cleanupHandled) this.endCapture(hiddenItemsSnapshot); },
			render: (html: JQuery<HTMLElement>) => {
				const compression = html.find('#compression');
				const output = html.find('output');
				compression.on('change', () => output.html(<string>compression.val()));
				compression.on('input', () => compression.trigger('change'));
				html.find('#filter-reset').on('click', (e: Event) => {
					e.preventDefault();
					Object.entries(this._layerFilters).forEach((layerFilter) => {
						var [layer, filter] = layerFilter;
						if (!filter.s) {
							this.toggleLayer(layer, true);
							filter.s = true;
						}
						if (!!filter.h) {
							this.toggleHidden(layer, false);
							filter.h = false;
						}
						if (!!filter.c) {
							this.toggleControls(layer, false);
							filter.c = false;
						}
					});
					html.find('.dfarch-capture-form section>div>input').each((_, e: HTMLElement) => {
						const element = <HTMLInputElement>e;
						if (element.id.endsWith('-show')) element.checked = true;
						else element.checked = false;
					});
				})
				html.find('.dfarch-capture-form section>div>input').on('change', async (event: Event) => {
					const element = <HTMLInputElement>event.currentTarget;
					if (element.id.endsWith('-show')) {
						this._getLayerFilter(element.value).s = element.checked;
						this.toggleLayer(element.value, element.checked);
					}
					else if (element.id.endsWith('-hidden')) {
						this._getLayerFilter(element.value).h = element.checked;
						this.toggleHidden(element.value, element.checked);
					}
					else {
						this._getLayerFilter(element.value).c = element.checked;
						this.toggleControls(element.value, element.checked);
					}
					await SETTINGS.set(this.PREF_LYRS, this._layerFilters);
				});
				html.find('#bg-hide').on('change', (e: Event) => {
					const hide = (<HTMLInputElement>e.currentTarget).checked;
					canvas.background.bg.visible = !hide;
					SETTINGS.set(this.PREF_BG_HIDE, hide);
				});
				html.find('#bg-colo').on('change', (e: Event) => {
					const colour = (<HTMLInputElement>e.currentTarget).value;
					canvas.app.renderer.backgroundColor = parseInt(colour.slice(1), 16);
					SETTINGS.set(this.PREF_BG_COLO, colour);
				});
				const alphaRange = html.find('#bg-alph');
				const alphaOutput = html.find('#bg-alph-out')[0] as HTMLOutputElement;
				alphaRange.on('change', (e: Event) => {
					const element = <HTMLInputElement>e.currentTarget;
					alphaOutput.value = `${element.value}%`;
					const alpha = parseInt(element.value);
					if (isNaN(alpha)) return;
					(<any>canvas.app.renderer).backgroundAlpha = alpha / 100.0;
					SETTINGS.set(this.PREF_BG_ALPH, alpha);
				});
				alphaRange.on('input', () => alphaRange.trigger('change'));
				html.find('#bg-colo-reset').on('click', (e: Event) => {
					e.preventDefault();
					html.find('#bg-colo')
						.val(game.scenes.viewed.data.backgroundColor)
						.trigger('change');
				});
				Object.entries(this._layerFilters).forEach((layerFilter) => {
					var [layer, filter] = layerFilter;
					// If the layer no longer exists, remove it from list and return
					if ((<Canvas>canvas).getLayer(layer) === null) {
						delete this._layerFilters[layer];
						return
					}
					this.toggleLayer(layer, filter.s);
					if (!!filter.h) this.toggleHidden(layer, true);
					if (!!filter.c) this.toggleControls(layer, true);
				});
			}
		});
		dialog.render(true);
	}

	private static async loadOpenCV(): Promise<void> {
		var openCVScript = document.getElementById("opencv") as HTMLScriptElement;
		// Resolve immediately if element exists
		if (!!openCVScript) return Promise.resolve()
		// If the OpenCV library has not yet been loaded, lets load it now and wait for it before continuing
		return new Promise<void>(res => {
			openCVScript = document.createElement('script') as HTMLScriptElement;
			openCVScript.id = 'opencv';
			openCVScript.async = true
			openCVScript.onload = () => res(undefined);
			openCVScript.src = `/modules/${ARCHITECT.MOD_NAME}/src/opencv.js`;
			document.body.append(openCVScript);
		});
	}

	/**
	 * Begins the process of capturing the canvas.
	 * @returns The HiddenPlaceablesSnapshot
	 * @throws If `beginCapture()` has been invoked and `endCapture()` has not been subsequently invoked yet.
	 */
	static async beginCapture(): Promise<PlaceableObject[]> {
		if (this._captureInProgress) throw Error('Capture In Progress');
		// Collect Hidden Items
		const hiddenItemsSnapshot: PlaceableObject[] = [];
		for (let layerName of this.LayersWithHiddenPlaceables) {
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
		return hiddenItemsSnapshot;
	}

	// Reset the canvas layers to their proper activation states
	static endCapture(hiddenItemsSnapshot: PlaceableObject[]) {
		// Cleanup Background
		canvas.background.bg.visible = true;
		canvas.app.renderer.backgroundColor = parseInt(game.scenes.viewed.data.backgroundColor.slice(1), 16);
		(<any>canvas.app.renderer).backgroundAlpha = 1.0;

		// Correct Hidden Items
		hiddenItemsSnapshot.forEach(x => {
			(<any>x.data).hidden = true;
			x.renderable = true;
			delete x.data.flags.df_arch_hidden;
		});
		// Correct Layers
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
		// Correct Active Layer
		const controlName = ui.controls.activeControl;
		const control = ui.controls.controls.find(c => c.name === controlName);
		if (control && control.layer) canvas[control.layer].activate();
	}

	static toggleLayer(layerName: string, show: boolean) {
		(<Canvas>canvas).getLayer(layerName).renderable = show;
	}
	static toggleHidden(layerName: string, show: boolean) {
		const layer = <PlaceablesLayer>canvas.getLayer(layerName);
		(layer.objects.children as PlaceableObject[]).forEach(x => {
			if (!x.data.flags.df_arch_hidden) return;
			x.renderable = show;
		});
	}
	static toggleControls(layerName: string, show: boolean) {
		const layer = <PlaceablesLayer>canvas.getLayer(layerName);
		this._getLayerFilter(layerName).c = show;
		// The Template Layer has specialized activation to always show template frame.
		if (layer.name === 'TemplateLayer') {
			if (show) {
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
			if (show) {
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
			if (show) {
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

	static async captureView(format: string, compression: number): Promise<string> {
		canvas = <Canvas>canvas;
		return await CaptureGameScreen.captureCanvas(format, compression, false, {
			x: canvas.stage.pivot.x,
			y: canvas.stage.pivot.y,
			w: canvas.app.renderer.width,
			h: canvas.app.renderer.height,
			s: canvas.stage.scale.x
		});
	}

	static async captureCanvas(format: string, compression: number, keepPadding: boolean = false, view?: { x: number, y: number, w: number, h: number, s: number }): Promise<string> {
		const afterDOMUpdate = (block: () => void) => setTimeout(block, 10);
		const waitForDOMUpdate = async () => new Promise<void>(res => afterDOMUpdate(res));
		const DELETE_RESOURCES = (resources: any | any[]) => {
			// If a single resource was given
			if (!(resources instanceof Array)) {
				// Delete it if it is alive
				if (!resources.isDeleted())
					resources.delete();
				return;
			}
			// Iterate over all resources given
			for (let res of resources) {
				// If item is an Array, recurse!
				if (res instanceof Array) DELETE_RESOURCES(res);
				// If the item is already dead, ignore!
				else if (res.isDeleted()) continue;
				// Delete the alive resource
				else res.delete();
			}
		}

		const targetImage = new Image();
		const targetCanvas = document.createElement('canvas') as HTMLCanvasElement;
		const targetContext = targetCanvas.getContext('2d');
		targetContext.imageSmoothingEnabled = false;
		const GetImageMat = (imageData: string) => new Promise<cv.Mat>((resolve, reject) => {
			targetImage.onload = () => {
				targetCanvas.width = targetImage.width;
				targetCanvas.height = targetImage.height;
				targetContext.drawImage(targetImage, 0, 0);
				resolve(cv.imread(targetCanvas));
			};
			targetImage.src = imageData;
		});
		const GetImageData = (image: cv.Mat) => {
			cv.imshow(targetCanvas, image);
			return targetCanvas.toDataURL(format, compression);
		}

		return new Promise(async (resolveCapture, rejectCapture) => {
			// Make sure OpenCV has fully loaded. If it is loaded, this will resolve immediately
			await CaptureGameScreen.loadOpenCV();
			// Save the previous orientation of the canvas stage
			const origX = canvas.stage.pivot.x;
			const origY = canvas.stage.pivot.y;
			const origS = canvas.stage.scale.x;
			const origW = canvas.app.renderer.width;
			const origH = canvas.app.renderer.height;
			// Create an overlay element to be temporarily displayed
			const overlayElement = $(`<div id="dfarch-temp-overlay"><h1>${'DF_ARCHITECT.CaptureGameScreen.ScreenCapture.Rendering'.localize()}...</h1><div class="dfarch-dual-ring"></div></div>`);
			overlayElement.appendTo(document.body);
			// Calculate dimension adjustments for offseting coordinates relative to the body
			const body = $(document.body);

			var padW = canvas.scene.data.padding * canvas.scene.data.width;
			var padH = canvas.scene.data.padding * canvas.scene.data.height;
			// If we are slightly off, round to nearest grid size.
			if ((padW % canvas.grid.size) !== 0)
				padW = (Math.trunc(padW / canvas.grid.size) + 1) * canvas.grid.size;
			if ((padH % canvas.grid.size) !== 0)
				padH = (Math.trunc(padH / canvas.grid.size) + 1) * canvas.grid.size;

			// Initialize the capture view if none was supplied
			if (view === undefined) {
				view = {
					x: 0, y: 0,
					w: (keepPadding ? padW * 2 : 0) + canvas.scene.data.width,
					h: (keepPadding ? padH * 2 : 0) + canvas.scene.data.height,
					s: 1
				}
			} else {
				// Adjust provided capture view for padding
				view.x -= padW;
				view.y -= padH;
			}
			// Calculate the width and height offsets needed for coordinate correction
			const widthAdjust = (body.width() - view.w) / 2;
			const heightAdjust = (body.height() - view.h) / 2;

			// Calculate the splits
			const split = [
				Math.ceil(view.w / CaptureGameScreen.SPLIT_DIM),
				Math.ceil(view.h / CaptureGameScreen.SPLIT_DIM)
			];

			// Calculate the width and height chunk data
			const widthChunk = Math.ceil(view.w / split[0]);
			const widthExtra = view.w - (widthChunk * (split[0] - 1));
			const heightChunk = Math.ceil(view.h / split[1]);
			const heightExtra = view.h - (heightChunk * (split[1] - 1));

			// Display warning if splitting is required
			if ((view.w * view.h) > CaptureGameScreen.WARNING_SIZE) {
				const confirmed = await Dialog.confirm({
					title: 'DF_ARCHITECT.CaptureGameScreen.ScreenCapture.WarningConfirmTitle'.localize(),
					content: 'DF_ARCHITECT.CaptureGameScreen.ScreenCapture.WarningConfirmContent'.localize(),
					defaultYes: true,
				});
				if (!confirmed) {
					overlayElement.remove();
					rejectCapture("User Cancelled");
					return;
				}
			}

			// Game Board Canvas Element
			const boardCanvasElement = $('canvas#board');
			// Array of images in the form of Base64 encoded strings
			const images: string[] = [];
			try {
				const widthSplitMultiplier = view.s != 1 ? Math.floor(split[0] / 2) : split[0] / 2;
				const heightSplitMultiplier = view.s != 1 ? Math.floor(split[1] / 2) : split[1] / 2;
				// Iterate over each ROW of Sectors
				for (let cy = 0; cy < split[1]; cy++) {
					const indexH = cy;
					// Iterate over each Sector in the current ROW
					for (let cx = 0; cx < split[0]; cx++) {
						const indexW = cx;
						ARCHITECT.reportProgress('DF_ARCHITECT.CaptureGameScreen.ScreenCapture.Rendering'.localize(), indexH * split[0] + indexW, split[0] * split[1]);
						canvas = <Canvas>canvas;
						var width = 0;
						var height = 0;
						// Calculate the base XY coordinates
						var x = view.x + widthAdjust + (keepPadding ? 0 : padW) + (widthChunk * (indexW + widthSplitMultiplier));
						var y = view.y + heightAdjust + (keepPadding ? 0 : padH) + (heightChunk * (indexH + heightSplitMultiplier));
						// Calculate the Width and X Offset for the current Sector
						if (split[0] > 1 && indexW == split[0] - 1) {
							width = widthExtra;
							x -= (widthChunk - widthExtra) / 2;
						} else width = widthChunk;
						// Calculate the Height and Y Offset for the current Sector
						if (split[1] > 1 && indexH == split[1] - 1) {
							height = heightExtra;
							y -= (heightChunk - heightExtra) / 2;
						} else height = heightChunk;
						// Update the orientation of the canvas stage
						canvas.app.renderer.resize(width, height);
						canvas.stage.scale.set(view.s);
						canvas.stage.pivot.set(x, y);
						// Update the canvas element dimensions
						boardCanvasElement.css('width', width + 'px');
						boardCanvasElement.css('height', height + 'px');
						// Wait for DOM to Update
						await waitForDOMUpdate();
						// Render a single image for the given Sector
						images.push(canvas.app.renderer.context.renderer.extract.base64(null, format, compression));
					}
				}
			}
			catch (error) {
				ARCHITECT.hideProgress();
				rejectCapture(error);
				return;
			}

			ARCHITECT.reportProgress('DF_ARCHITECT.CaptureGameScreen.ScreenCapture.Rendering'.localize(), split[0] * split[1], split[0] * split[1], true);
			// Reset the canvas dimensions
			boardCanvasElement.css('width', origW + 'px');
			boardCanvasElement.css('height', origH + 'px');
			// Reset the orientation of the canvas stage
			canvas.app.renderer.resize(origW, origH);
			canvas.stage.scale.set(origS);
			canvas.stage.pivot.set(origX, origY);
			overlayElement.find('h1').text('DF_ARCHITECT.CaptureGameScreen.ScreenCapture.Stitching'.localize() + '...');
			// Remove the overlay after the canvas has had a chance to re-render
			afterDOMUpdate(() => overlayElement.remove());

			// If there is only 1 image exists, so return it immediately
			if (images.length == 1) {
				ARCHITECT.hideProgress();
				resolveCapture(images[0]);
				return;
			}
			// Begin Stitching the individual Rows
			const finalMats: cv.Mat[] = [];
			const finalVec = new cv.MatVector();
			try {
				// Loop over each ROW
				for (let cy = 0; cy < split[1]; cy++) {
					ARCHITECT.reportProgress('DF_ARCHITECT.CaptureGameScreen.ScreenCapture.Stitching'.localize(), cy, split[1]);
					await waitForDOMUpdate();
					// If there is only 1 Sector per ROW
					if (split[0] === 1) {
						finalMats.push(await GetImageMat(images[cy]));
						finalVec.push_back(finalMats[cy]);
						console.log(finalMats[cy].size());
						// Continue to next image
						continue;
					}
					const rowVector = new cv.MatVector();
					const rowMats: cv.Mat[] = [];
					var renderTarget: cv.Mat;
					// Generate the image for the whole ROW
					// We do this in an await/timeout to allow for updating UI Progress Bar
					try {
						// Convert image datas to Mats
						for (let cx = 0; cx < split[0]; cx++) {
							// Extract the Mat for the current Image
							renderTarget = await GetImageMat(images[(cy * split[0]) + cx]);
							// Append Mat onto rowMat array for cleanup
							rowMats.push(renderTarget);
							// Append Mat to MetVector for stitching
							rowVector.push_back(renderTarget);
						}
						// Generate a render target for stitching result
						renderTarget = new cv.Mat();
						// Stitch the row's Mats together and render to Render Target
						cv.hconcat(rowVector, renderTarget);
						console.log(renderTarget.size());
						// Add the new Mat to the Array and Final Vector
						finalMats.push(renderTarget);
						finalVec.push_back(renderTarget);
					}
					finally {
						// Delete the Row's Mats and Vector as the final step
						DELETE_RESOURCES([rowVector, rowMats]);
					}
				}
			} catch (error) {
				console.error('Failed to complete image stitching!', error);
				DELETE_RESOURCES([finalVec, finalMats]);
				ui.notifications.error("DF_ARCHITECT.CaptureGameScreen.ScreenCapture.ErrorStitchingFailure".localize(), { permanent: true });
				ARCHITECT.hideProgress();
				rejectCapture(error);
				return;
			}
			ARCHITECT.reportProgress('DF_ARCHITECT.CaptureGameScreen.ScreenCapture.Stitching'.localize(), split[1], split[1]);
			// Jump on a timeout to let the UI progress update to get through.
			await waitForDOMUpdate();
			var finalImage: cv.Mat;
			try {
				if (finalMats.length == 1) {
					resolveCapture(GetImageData(finalMats[0]));
					DELETE_RESOURCES([finalVec, finalMats]);
					return;
				}
				finalImage = new cv.Mat();
				// Concatenate the row images into a single final image
				let error = cv.vconcat(finalVec, finalImage);
				console.log(error);
				console.log((<any>finalImage).size());
				// Delete the final vector and mats
				DELETE_RESOURCES([finalVec, finalMats]);
				// Retrieve the rendered image data and return it.
				resolveCapture(GetImageData(finalImage));
			} catch (error) {
				console.error('Failed to complete image stitching!', error);
				ui.notifications.error("DF_ARCHITECT.CaptureGameScreen.ScreenCapture.ErrorStitchingFailure".localize(), { permanent: true });
				rejectCapture(error);
			}
			finally {
				ARCHITECT.hideProgress();
				DELETE_RESOURCES([finalVec, finalMats, finalImage]);
			}
		});
	}
}

(<any>window).CanvasCapture = {
	LayersWithInvisiblePlaceables: CaptureGameScreen.LayersWithInvisiblePlaceables,
	LayersWithHiddenPlaceables: CaptureGameScreen.LayersWithHiddenPlaceables,
	beginCapture: CaptureGameScreen.beginCapture,
	endCapture: CaptureGameScreen.endCapture,
	captureCanvas: CaptureGameScreen.captureCanvas,
	captureView: CaptureGameScreen.captureView,
	toggleLayer: CaptureGameScreen.toggleLayer,
	toggleHidden: CaptureGameScreen.toggleHidden,
	toggleControls: CaptureGameScreen.toggleControls
};