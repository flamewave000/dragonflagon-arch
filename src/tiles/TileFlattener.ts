import ARCHITECT from "../core/architect.js";
import SETTINGS from "../core/settings.js";
import CaptureGameScreen from "../general/CaptureGameScreen.js";
import ArchiveFolderMenu from "./TileFlattenerFolder.js";

interface Margin {
	l: number;
	r: number;
	t: number;
	b: number;
}
interface ImageData { data: string, width: number, height: number }

export default class TileFlattener {

	private static readonly PREF_RENDER_LIGHT = "TileFlattener.RenderLighting";
	private static readonly PREF_RENDER_BACKG = "TileFlattener.RenderBackground";
	private static readonly PREF_RENDER_SLCTD = "TileFlattener.RenderSelectedOnly";
	private static readonly PREF_RENDER_HIDEN = "TileFlattener.RenderHiddenTiles";
	private static readonly PREF_MARGIN = "TileFlattener.Margin";
	static readonly PREF_FOLDER = "TileFlattener.Folder";
	static readonly PREF_FOLDER_SOURCE = "TileFlattener.FolderSource";

	private static get renderLights(): Boolean { return SETTINGS.get(this.PREF_RENDER_LIGHT); }
	private static set renderLights(value: Boolean) { SETTINGS.set(this.PREF_RENDER_LIGHT, value); }
	private static get renderBackground(): Boolean { return SETTINGS.get(this.PREF_RENDER_BACKG); }
	private static set renderBackground(value: Boolean) { SETTINGS.set(this.PREF_RENDER_BACKG, value); }
	private static get renderSelected(): Boolean { return SETTINGS.get(this.PREF_RENDER_SLCTD); }
	private static set renderSelected(value: Boolean) { SETTINGS.set(this.PREF_RENDER_SLCTD, value); }
	private static get renderHidden(): Boolean { return SETTINGS.get(this.PREF_RENDER_HIDEN); }
	private static set renderHidden(value: Boolean) { SETTINGS.set(this.PREF_RENDER_HIDEN, value); }
	private static get margin(): Margin { return SETTINGS.get(this.PREF_MARGIN); }
	private static set margin(value: Margin) { SETTINGS.set(this.PREF_MARGIN, value); }

	static init() {
		//#region Register Render Configuration Settings
		SETTINGS.register<Boolean>(this.PREF_RENDER_LIGHT, { scope: 'client', config: false, type: Boolean, default: false });
		SETTINGS.register<Boolean>(this.PREF_RENDER_BACKG, { scope: 'client', config: false, type: Boolean, default: true });
		SETTINGS.register<Boolean>(this.PREF_RENDER_SLCTD, { scope: 'client', config: false, type: Boolean, default: false });
		SETTINGS.register<Boolean>(this.PREF_RENDER_HIDEN, { scope: 'client', config: false, type: Boolean, default: true });
		SETTINGS.register<Margin>(this.PREF_MARGIN, { scope: 'client', config: false, type: SETTINGS.typeOf<Margin>(), default: { l: 0, r: 0, t: 0, b: 0 } });
		//#endregion

		SETTINGS.register<String>(this.PREF_FOLDER, { scope: 'world', config: false, type: String, default: 'assets' });
		SETTINGS.register<String>(this.PREF_FOLDER_SOURCE, { scope: 'world', config: false, type: String, default: 'data' });
		SETTINGS.registerMenu('TileFlattener.StorageLocation', {
			restricted: true,
			type: ArchiveFolderMenu,
			icon: 'fas fa-folder-open',
			label: 'DF_ARCHITECT.TileFlattener.ImageFolderTitle'
		});

		Hooks.on('getSceneControlButtons', (controls: SceneControl[]) => {
			const tiles = controls.find(x => x.name === 'tiles');
			tiles.tools.push({
				icon: 'fas fa-file-image',
				name: 'flatten',
				button: true,
				title: 'DF_ARCHITECT.TileFlattener.Label',
				onClick: this.promptForTileFlattening.bind(this)
			});
		});
	}

	private static async promptForTileFlattening() {
		const data = {
			png: SETTINGS.get(CaptureGameScreen.PREF_FRMT) === 'png',
			jpeg: SETTINGS.get(CaptureGameScreen.PREF_FRMT) === 'jpeg',
			webp: SETTINGS.get(CaptureGameScreen.PREF_FRMT) === 'webp',
			compression: SETTINGS.get(CaptureGameScreen.PREF_COMP),
			margin: this.margin,
			lights: this.renderLights,
			showBG: this.renderBackground,
			select: this.renderSelected,
			hidden: this.renderHidden
		};
		const dialog: Dialog = new Dialog({
			title: 'DF_ARCHITECT.TileFlattener.CapturePromptTitle'.localize(),
			content: await renderTemplate(`modules/${ARCHITECT.MOD_NAME}/templates/tile-flatten.hbs`, data),
			buttons: {
				cancel: {
					icon: '<i class="fas fa-times"></i>',
					label: 'DF_ARCHITECT.General.Cancel'.localize(),
					callback: () => dialog.close()
				},
				capture: {
					icon: '<i class="fas fa-file-image"></i>',
					label: 'DF_ARCHITECT.TileFlattener.FlattenButton'.localize(),
					callback: this.flattenTiles.bind(this),
				}
			},
			render: this.setupBindings.bind(this),
			default: 'capture',
		});
		dialog.render(true);
	}

	private static async flattenTiles(html: JQuery | HTMLElement) {
		// Collect data from form
		html = html instanceof HTMLElement ? html : html[0];
		const format = html.querySelector<HTMLSelectElement>('#format').value;
		const compression = html.querySelector<HTMLInputElement>('#compression').valueAsNumber;
		const margin = {
			l: html.querySelector<HTMLInputElement>('#left').valueAsNumber,
			r: html.querySelector<HTMLInputElement>('#right').valueAsNumber,
			t: html.querySelector<HTMLInputElement>('#top').valueAsNumber,
			b: html.querySelector<HTMLInputElement>('#bottom').valueAsNumber
		}
		const lights = html.querySelector<HTMLInputElement>('#lights').checked;
		const showBG = html.querySelector<HTMLInputElement>('#showBG').checked;
		const hidden = html.querySelector<HTMLInputElement>('#hidden').checked;
		const select = html.querySelector<HTMLInputElement>('#tiles').checked;
		// Save data as defaults for later
		await Promise.all([
			SETTINGS.set(this.PREF_RENDER_LIGHT, lights),
			SETTINGS.set(this.PREF_RENDER_BACKG, showBG),
			SETTINGS.set(this.PREF_RENDER_HIDEN, hidden),
			SETTINGS.set(this.PREF_RENDER_SLCTD, select),
			SETTINGS.set(this.PREF_MARGIN, margin),
			SETTINGS.set(this.PREF_RENDER_LIGHT, lights),
			SETTINGS.set(CaptureGameScreen.PREF_FRMT, format),
			SETTINGS.set(CaptureGameScreen.PREF_COMP, compression),
		]);

		const tilesPreHidden: [Tile, boolean][] = [];
		var controlledTiles: Tile[];
		// Collect all of the selected tiles
		controlledTiles = (canvas.background.controlled as Tile[]).concat(canvas.foreground.controlled);
		// If we are rendering only selected items
		if (select) {
			if (controlledTiles.length === 0) {
				ui.notifications.error('You must have tiles selected for the current configuration. Did you maybe mean to select Entire Canvas?'.localize());
				this.promptForTileFlattening();
				return;
			}
			// Collect and hide all the other tiles
			const allTiles = (canvas.background.tiles as Tile[]).concat(canvas.foreground.tiles);
			const controlledIDs = controlledTiles.map(x => x.id);
			for (let tile of allTiles) {
				tilesPreHidden.push([tile, tile.data.hidden]);
				tile.data.hidden = !controlledIDs.includes(tile.id);
			}
		}
		canvas.background.selectObjects();
		canvas.foreground.selectObjects();

		// Disable ALL Other Layers
		for (let layer of canvas.layers) {
			if (["BackgroundLayer", "ForegroundLayer", "LightingLayer"].includes(layer.name)) continue;
			CaptureGameScreen.toggleLayer(layer.name, false)
		}
		CaptureGameScreen.toggleLayer("LightingLayer", lights);
		// Update the Background Image
		canvas.background.bg.visible = showBG;
		(<any>canvas.app.renderer).backgroundAlpha = 0;

		// Activate the Foreground layer so it draws properly
		const previouslyActive = canvas.activeLayer;
		canvas.foreground.activate();

		// Begin the Canvas Capture Process
		const hiddenItemsSnapshot = CaptureGameScreen.beginCapture();
		CaptureGameScreen.toggleHidden("BackgroundLayer", hidden && !select);
		CaptureGameScreen.toggleHidden("ForegroundLayer", hidden && !select);
		try {
			var image: ImageData;
			if (select) {
				const rect = {
					l: Number.MAX_VALUE,
					t: Number.MAX_VALUE,
					r: Number.MIN_VALUE,
					b: Number.MIN_VALUE,
				};
				for (let tile of controlledTiles) {
					if (tile.x < rect.l) rect.l = tile.x;
					if (tile.y < rect.t) rect.t = tile.y;
					if (tile.x + tile.width > rect.r) rect.r = tile.x + tile.width;
					if (tile.y + tile.height > rect.b) rect.b = tile.y + tile.height;
				}
				image = await CaptureGameScreen.captureCanvas('image/' + format, compression, false,
					{
						x: -margin.l + rect.l,
						y: -margin.t + rect.t,
						w: margin.l + margin.r + rect.r - rect.l,
						h: margin.t + margin.b + rect.b - rect.t,
						s: 1
					});
			} else {
				image = await CaptureGameScreen.captureCanvas('image/' + format, compression);
			}
			this.saveImageData(image, format);
		} finally {
			// Terminate the canvas capture
			CaptureGameScreen.endCapture(hiddenItemsSnapshot);
			// Restore Background Image
			canvas.background.bg.visible = true;
			(<any>canvas.app.renderer).backgroundAlpha = 1;
			// Restore the non-selected tiles
			for (let [tile, hidden] of tilesPreHidden) {
				tile.data.hidden = hidden;
			}
			// Restore Active Layer
			previouslyActive.activate();
			// Restore selection
			controlledTiles.forEach(x => x.control({ releaseOthers: false }));
		}
	}

	private static setupBindings(html: JQuery) {
		const margins = html.find('table');
		const hidden = html.find('#hidden');
		const canvas = html.find('#canvas');
		const tiles = html.find('#tiles');
		const update = () => {
			if ((canvas[0] as HTMLInputElement).checked) {
				margins.find('input').prop('disabled', true);
				hidden.prop('disabled', false);
			} else {
				margins.find('input').prop('disabled', false);
				hidden.prop('disabled', true);
			}
		};
		canvas.on('change', update);
		tiles.on('change', update);
	}

	private static async saveImageData(image: ImageData, format: string) {
		const linkDate = new Date().toISOString().replace(/(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2}).+/, '$1$2$3-$4$5$6');
		const dialog: Dialog = new Dialog({
			title: 'DF_ARCHITECT.TileFlattener.CapturePromptTitle'.localize(),
			content: await renderTemplate(`modules/${ARCHITECT.MOD_NAME}/templates/tile-flatten-save.hbs`, {
				placeholder: 'DF_ARCHITECT.TileFlattener.SaveImageDialog.FileNamePlaceholder'.localize() + linkDate,
				format, image: image.data
			}),
			buttons: {
				cancel: {
					icon: '<i class="fas fa-times"></i>',
					label: 'DF_ARCHITECT.General.Cancel'.localize(),
					callback: () => dialog.close()
				},
				local: {
					icon: '<i class="fas fa-download"></i>',
					label: 'DF_ARCHITECT.TileFlattener.SaveImageDialog.SaveLocal'.localize(),
					callback: (html) => {
						html = html instanceof HTMLElement ? $(html) : html;
						const fileName = html.find('#filename')[0] as HTMLInputElement;
						const link = document.createElement('a') as HTMLAnchorElement;
						link.href = image.data;
						link.download = fileName.value || fileName.placeholder;
						link.click();
					}
				},
				server: {
					icon: '<i class="fas fa-upload"></i>',
					label: 'DF_ARCHITECT.TileFlattener.SaveImageDialog.SaveServer'.localize(),
					callback: async (html) => {
						html = html instanceof HTMLElement ? $(html) : html;
						const fileNameElement = html.find('#filename')[0] as HTMLInputElement;
						const fileName = fileNameElement.value || fileNameElement.placeholder;
						const folder = SETTINGS.get<string>(this.PREF_FOLDER);
						const folderSource = SETTINGS.get<string>(this.PREF_FOLDER_SOURCE);
						const parts = image.data.match(/^data:(.+);base64,(.+)/);
						const data = ARCHITECT.Base64ToBlob(parts[2], parts[1]);
						const file = new File([data], fileName, {});
						await FilePicker.upload(folderSource, folder, file);
						this.promptSceneReplacement(folder + '/' + fileName, image.width, image.height);
					}
				},
			},
			default: 'server'
		}, { width: 500 });
		dialog.render(true);
	}

	private static async promptSceneReplacement(filePath: string, width: number, height: number) {
		const dialog: Dialog = new Dialog({
			title: 'DF_ARCHITECT.TileFlattener.SceneReplaceDialog.Title'.localize(),
			content: await renderTemplate(`modules/${ARCHITECT.MOD_NAME}/templates/tile-flatten-scene.hbs`, {}),
			buttons: {
				cancel: {
					icon: '<i class="fas fa-times"></i>',
					label: 'DF_ARCHITECT.TileFlattener.SceneReplaceDialog.DoNothing'.localize(),
					callback: () => dialog.close()
				}
			},
			default: 'cancel',
			render: (html: JQuery) => {
				html.find('#replace').on('click', async (e) => {
					e.preventDefault();
					dialog.close();
					await game.scenes.viewed.update({ img: filePath }, {});
				});
				html.find('#clone').on('click', async (e) => {
					e.preventDefault();
					const data: DeepPartial<Scene.Data> = {};
					const ignored = new Set([
						"active",
						"drawings",
						"flags",
						"img",
						"lights",
						"name",
						"navName",
						"navOrder",
						"navigation",
						"notes",
						"permission",
						"sounds",
						"templates",
						"thumb",
						"tiles",
						"tokens",
						"walls",
						"_id",
					]);
					for (let prop of Object.keys(game.scenes.viewed.data)) {
						if (ignored.has(prop)) continue;
						(data as Record<string, any>)[prop] = (game.scenes.viewed.data as Record<string, any>)[prop];
					}
					data.img = filePath;
					const result = await Scene.createDialog();
					if (!result) return;
					else dialog.close();
					await result.update(data);
					const thumbData = await (<any>result).createThumbnail();
					await result.update(<any>{ thumb: thumbData.thumb }, { diff: false });
				});
				html.find('#tile').on('click', async (e) => {
					e.preventDefault();
					const x = (game.scenes.viewed.data.width - width) / 2;
					const y = (game.scenes.viewed.data.height - height) / 2;
					await Tile.create(<any>{ img: filePath, x, y, z: 0, width, height });
					dialog.close();
				});
			}
		});
		dialog.render(true);
	}
}
