import ARCHITECT from "../core/architect.js";
import SETTINGS from "../core/settings.js";
import CaptureGameScreen from "../general/CaptureGameScreen.js";

interface Margin {
	l: number;
	r: number;
	t: number;
	b: number;
}

export default class TileFlattener {

	private static readonly PREF_RENDER_LIGHT = "TileFlattener.RenderLighting";
	private static readonly PREF_RENDER_BACKG = "TileFlattener.RenderBackground";
	private static readonly PREF_RENDER_SLCTD = "TileFlattener.RenderSelectedOnly";
	private static readonly PREF_RENDER_HIDEN = "TileFlattener.RenderHiddenTiles";
	private static readonly PREF_MARGIN = "TileFlattener.Margin";

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
		SETTINGS.register<Boolean>(this.PREF_RENDER_BACKG, { scope: 'client', config: false, type: Boolean, default: false });
		SETTINGS.register<Boolean>(this.PREF_RENDER_SLCTD, { scope: 'client', config: false, type: Boolean, default: false });
		SETTINGS.register<Boolean>(this.PREF_RENDER_HIDEN, { scope: 'client', config: false, type: Boolean, default: false });
		SETTINGS.register<Margin>(this.PREF_MARGIN, { scope: 'client', config: false, type: SETTINGS.typeOf<Margin>(), default: { l: 0, r: 0, t: 0, b: 0 } });
		//#endregion

		Hooks.on('getSceneControlButtons', (controls: SceneControl[]) => {
			const tiles = controls.find(x => x.name === 'tiles');
			tiles.tools.push({
				icon: 'fas fa-file-image',
				name: 'flatten',
				title: 'DF_ARCHITECT.TileFlattener.Label',
				onClick: this.flattenTiles
			});
		});
	}

	private static async flattenTiles() {
		const data = {
			png: SETTINGS.get(CaptureGameScreen.PREF_FRMT) === 'png',
			jpeg: SETTINGS.get(CaptureGameScreen.PREF_FRMT) === 'jpeg',
			webp: SETTINGS.get(CaptureGameScreen.PREF_FRMT) === 'webp',
			compression: SETTINGS.get(CaptureGameScreen.PREF_COMP),
			margin: this.margin,
			lights: this.renderLights,
			hideBG: this.renderBackground,
			select: this.renderSelected,
			hidden: this.renderHidden
		};
		const dialog: Dialog = new Dialog({
			title: 'Flatten Tiles',
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
					callback: async (html: JQuery | HTMLElement) => {
						// Handle canvas capture
					}
				}
			},
			default: 'capture',
		});
		dialog.render(true);
	}
}