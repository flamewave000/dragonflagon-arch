import { TileData } from "@league-of-foundry-developers/foundry-vtt-types/src/foundry/common/data/module.mjs";
import ARCHITECT from "../core/architect.mjs";
import SETTINGS from "../core/settings.mjs";
import CaptureGameScreen from "../general/CaptureGameScreen.mjs";
import ArchiveFolderMenu from "./TileFlattenerFolder.mjs";

interface Margin {
	l: number;
	r: number;
	t: number;
	b: number;
}
interface ImageData { data: string, width: number, height: number }

enum TileLayerRendered {
	Floor,
	Roof,
	Both
}

/**
 * This Declaration is for the Levels Module. This module performs placeable
 * cloning into its own PIXI Containers. This is used to disable those
 * containers for proper rendering.
 * 
 * https://foundryvtt.com/packages/levels
 */
declare const _levels: any;

export default class TileFlattener {

	private static readonly PREF_RENDER_LIGHT = "TileFlattener.RenderLighting";
	private static readonly PREF_RENDER_BACKG = "TileFlattener.RenderBackground";
	private static readonly PREF_RENDER_SLCTD = "TileFlattener.RenderSelectedOnly";
	private static readonly PREF_RENDER_HIDEN = "TileFlattener.RenderHiddenTiles";
	private static readonly PREF_RENDER_ANIMS = "TileFlattener.RenderAnimatedTiles";
	private static readonly PREF_MARGIN = "TileFlattener.Margin";
	private static readonly PREF_LAYERS = "TileFlattener.Layers";
	static readonly PREF_FOLDER = "TileFlattener.Folder";
	static readonly PREF_FOLDER_SOURCE = "TileFlattener.FolderSource";

	private static get renderLights(): boolean { return SETTINGS.get(this.PREF_RENDER_LIGHT); }
	private static get renderBackground(): boolean { return SETTINGS.get(this.PREF_RENDER_BACKG); }
	private static get renderSelected(): boolean { return SETTINGS.get(this.PREF_RENDER_SLCTD); }
	private static get renderHidden(): boolean { return SETTINGS.get(this.PREF_RENDER_HIDEN); }
	private static get renderAnimated(): boolean { return SETTINGS.get(this.PREF_RENDER_ANIMS); }
	private static get margin(): Margin { return SETTINGS.get(this.PREF_MARGIN); }
	private static get layers(): number { return SETTINGS.get(this.PREF_LAYERS); }
	private static get folder(): string { return SETTINGS.get(this.PREF_FOLDER); }
	private static get folderSource(): FilePicker.SourceType { return SETTINGS.get(this.PREF_FOLDER_SOURCE); }

	static init() {
		//#region Register Render Configuration Settings
		SETTINGS.register<Boolean>(this.PREF_RENDER_LIGHT, { scope: 'client', config: false, type: Boolean, default: false });
		SETTINGS.register<Boolean>(this.PREF_RENDER_BACKG, { scope: 'client', config: false, type: Boolean, default: true });
		SETTINGS.register<Boolean>(this.PREF_RENDER_SLCTD, { scope: 'client', config: false, type: Boolean, default: false });
		SETTINGS.register<Boolean>(this.PREF_RENDER_HIDEN, { scope: 'client', config: false, type: Boolean, default: false });
		SETTINGS.register<Boolean>(this.PREF_RENDER_ANIMS, { scope: 'client', config: false, type: Boolean, default: false });
		SETTINGS.register<Number>(this.PREF_LAYERS, { scope: 'client', config: false, type: Number, default: 0 });
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
				//! TEMPORARY DISABLING OF TILE FLATTENER
				//! Get rid of this line
				onClick: () => ui.notifications.warn("Tile Flattener is temporarily unavailable until the Canvas Capture's layer filtering feature can be fixed")
				//! Reactivate this line
				// onClick: this.promptForTileFlattening.bind(this)
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
			hidden: this.renderHidden,
			layers: this.layers,
			hideAnimated: this.renderAnimated
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
		const quality = html.querySelector<HTMLInputElement>('#compression').valueAsNumber;
		const margin = {
			l: html.querySelector<HTMLInputElement>('#left').valueAsNumber,
			r: html.querySelector<HTMLInputElement>('#right').valueAsNumber,
			t: html.querySelector<HTMLInputElement>('#top').valueAsNumber,
			b: html.querySelector<HTMLInputElement>('#bottom').valueAsNumber
		}
		const lights = html.querySelector<HTMLInputElement>('#lights').checked;
		const showBG = html.querySelector<HTMLInputElement>('#showBG').checked;
		const hidden = html.querySelector<HTMLInputElement>('#hidden').checked;
		const animated = !html.querySelector<HTMLInputElement>('#animated').checked;
		const select = html.querySelector<HTMLInputElement>('#tiles').checked;
		const layers = html.querySelector<HTMLInputElement>('#floor').checked
			? TileLayerRendered.Floor : html.querySelector<HTMLInputElement>('#roof').checked
				? TileLayerRendered.Roof : TileLayerRendered.Both;
		// Save data as defaults for later
		await Promise.all([
			SETTINGS.set(this.PREF_RENDER_LIGHT, lights),
			SETTINGS.set(this.PREF_RENDER_BACKG, showBG),
			SETTINGS.set(this.PREF_RENDER_HIDEN, hidden),
			SETTINGS.set(this.PREF_RENDER_ANIMS, animated),
			SETTINGS.set(this.PREF_RENDER_SLCTD, select),
			SETTINGS.set(this.PREF_MARGIN, margin),
			SETTINGS.set(this.PREF_RENDER_LIGHT, lights),
			SETTINGS.set(this.PREF_LAYERS, layers),
			SETTINGS.set(CaptureGameScreen.PREF_FRMT, format),
			SETTINGS.set(CaptureGameScreen.PREF_COMP, quality),
		]);

		const tilesPreHidden = new Map<string, [Tile, boolean]>();
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
				tilesPreHidden.set(tile.data._id, [tile, tile.data.hidden]);
				tile.data.hidden = !controlledIDs.includes(tile.id);
				tile.refresh();
			}
		}
		// If we are not rendering animated tiles
		if (!animated) {
			// Collect and hide all the other tiles
			const allTiles = (canvas.background.tiles as Tile[]).concat(canvas.foreground.tiles);
			for (let tile of allTiles) {
				if (!tilesPreHidden.has(tile.data._id))
					tilesPreHidden.set(tile.data._id, [tile, tile.data.hidden]);
				// Only override the hidden if it is not already true
				if (!tile.data.hidden)
					tile.data.hidden = VideoHelper.hasVideoExtension(tile.data.img);
			}
		}

		// Pre-Hide all tiles on the background layer before canvas capture starts
		if (layers === TileLayerRendered.Roof) {
			for (let tile of canvas.background.tiles) {
				if (!tilesPreHidden.has(tile.data._id))
					tilesPreHidden.set(tile.data._id, [tile, tile.data.hidden]);
				tile.data.hidden = true;
			}
		}

		// Begin the Canvas Capture Process
		const session = CaptureGameScreen.beginCapture(false);

		// Disable ALL Other Layers
		for (let layer of Object.keys(CONFIG.Canvas.layers)) {
			if (["background", "foreground", "lighting"].includes(layer)) continue;
			try {
				CaptureGameScreen.toggleLayer(layer, false);
			} catch (error: any) {
				console.error(error);
			}
		}
		CaptureGameScreen.toggleLayer("lighting", lights);
		if (layers === TileLayerRendered.Floor)
			CaptureGameScreen.toggleLayer("foreground", false);
		// Update the Background Image if it exists
		if (!!canvas.background.bg)
			canvas.background.bg.visible = showBG;
		(<any>canvas.app.renderer).backgroundAlpha = 0;

		const waitForDOMUpdate = async () => new Promise<void>(res => setTimeout(res, 10));
		await waitForDOMUpdate();
		var image: ImageData;
		try {
			if (!session) {
				ui.notifications.warn('DF_ARCHITECT.CaptureGameScreen.ErrorCaptureInProgress'.localize());
				this.promptForTileFlattening();
				return;
			}
			CaptureGameScreen.toggleHidden("background", hidden && !select && layers !== TileLayerRendered.Roof);
			CaptureGameScreen.toggleHidden("foreground", hidden && !select && layers !== TileLayerRendered.Floor);
			await waitForDOMUpdate();

			if (typeof _levels !== 'undefined') {
				_levels.floorContainer.visible = false;
				_levels.overContainer.visible = false;
				_levels.fogContainer.visible = false;
				_levels.tokenRevealFogContainer.visible = false;
			}

			if (select) {
				const rect = {
					l: Number.MAX_VALUE,
					t: Number.MAX_VALUE,
					r: Number.MIN_VALUE,
					b: Number.MIN_VALUE,
				};
				for (let tile of controlledTiles) {
					const bounds: { minX: number, minY: number, maxX: number, maxY: number } = {
						minX: tile.center.x - (tile.width / 2),
						minY: tile.center.y - (tile.height / 2),
						maxX: tile.center.x + (tile.width / 2),
						maxY: tile.center.y + (tile.height / 2)
					}
					if (bounds.minX < rect.l) rect.l = bounds.minX;
					if (bounds.minY < rect.t) rect.t = bounds.minY;
					if (bounds.maxX > rect.r) rect.r = bounds.maxX;
					if (bounds.maxY > rect.b) rect.b = bounds.maxY;
				}
				image = await CaptureGameScreen.captureCanvas({
					format: 'image/' + format, quality,
					view: {
						x: -margin.l + rect.l,
						y: -margin.t + rect.t,
						w: margin.l + margin.r + rect.r - rect.l,
						h: margin.t + margin.b + rect.b - rect.t,
						s: 1
					}
				});
			} else {
				image = await CaptureGameScreen.captureCanvas({ format: 'image/' + format, quality });
			}
		} finally {
			if (typeof _levels !== 'undefined') {
				_levels.floorContainer.visible = true;
				_levels.overContainer.visible = true;
				_levels.fogContainer.visible = true;
				_levels.tokenRevealFogContainer.visible = true;
			}
			// Terminate the canvas capture
			CaptureGameScreen.endCapture(session);
			// Restore Background Image
			if (!!canvas.background.bg)
				canvas.background.bg.visible = true;
			(<any>canvas.app.renderer).backgroundAlpha = 1;
			// Restore the non-selected tiles
			for (let [_, [tile, hidden]] of tilesPreHidden) {
				tile.data.hidden = hidden;
				tile.refresh();
			}
			// Restore selection
			controlledTiles.forEach(x => x.control({ releaseOthers: false }));
		}
		// Save the image data to file
		CaptureGameScreen.saveImageData({
			image,
			defaultFileName: 'DF_ARCHITECT.TileFlattener.SaveImageDialog.FileNamePlaceholder'.localize(),
			dialogTitle: 'DF_ARCHITECT.TileFlattener.SaveImageDialog.Title'.localize(),
			folder: this.folder,
			folderSource: this.folderSource
		}).then(filePath => {
			// Prompt to ask what to do with it
			if (!!filePath) this.promptSceneReplacement(filePath, image.width, image.height, layers, lights);
		});
	}

	private static setupBindings(root: HTMLElement | JQuery<HTMLElement>) {
		const html = $(root);
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
		const compression = html.find('#compression');
		compression.on('input', () => compression.trigger('change'));
		compression.on('change', () => html.find('#compression-output').val(compression.val()));
	}

	private static async promptSceneReplacement(filePath: string, width: number, height: number, layersRendered: TileLayerRendered, bakedLighting: boolean) {
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
			render: (root: HTMLElement | JQuery<HTMLElement>) => {
				const html = $(root);
				html.find('#replace').on('click', async (e) => {
					e.preventDefault();
					dialog.close();
					await game.scenes.viewed.update({ img: filePath }, {});
				});
				html.find('#clone').on('click', async (e) => {
					e.preventDefault();
					// Create the new scene
					const newScene = await game.scenes.viewed.clone({
						name: game.scenes.viewed.name + ' (Copy)',
						img: filePath
					}, { save: true });
					// Get the tiles that were rendered
					var tiles: TileData[] = newScene.data.tiles.map(x => x.data);
					if (this.renderSelected) {
						tiles = canvas.background.controlled.map(x => x.data);
					} else {
						if (layersRendered === TileLayerRendered.Floor)
							tiles = tiles.filter(x => !x.overhead);
						else if (layersRendered === TileLayerRendered.Roof)
							tiles = tiles.filter(x => x.overhead);
						if (!this.renderHidden) {
							tiles = tiles.filter(x => !x.hidden);
						}
					}
					// Delete the rendered tiles
					await newScene.deleteEmbeddedDocuments('Tile', tiles.map(x => x._id));
					const thumbData = await (<any>newScene).createThumbnail();
					await newScene.update(<any>{ thumb: thumbData.thumb }, { diff: false });
					// If lighting was baked in, delete the scene's lights
					if (bakedLighting)
						await newScene.deleteEmbeddedDocuments('AmbientLight', newScene.data.lights.map(x => x.id));
					dialog.close();
				});
				html.find('#tile').on('click', async (e) => {
					e.preventDefault();
					const x = (game.scenes.viewed.data.width - width) / 2;
					const y = (game.scenes.viewed.data.height - height) / 2;
					await game.scenes.viewed.createEmbeddedDocuments(TileDocument.documentName, [{ img: filePath, x, y, z: 0, width, height }]);
					dialog.close();
				});
			}
		});
		dialog.render(true);
	}
}
