import ARCHITECT from "../core/architect";
import SETTINGS from "../core/settings";
import CaptureGameScreen from "./CaptureGameScreen";

export default class ShowLayerControls {
	private static readonly PREF_WALLS = 'ShowLayerControls.WallsLayer';
	private static readonly PREF_LIGHT = 'ShowLayerControls.LightingLayer';
	private static readonly PREF_SOUND = 'ShowLayerControls.SoundsLayer';
	private static _ready = false;


	static init() {
		SETTINGS.register(this.PREF_WALLS, { config: false, scope: 'client', type: Boolean, default: false });
		SETTINGS.register(this.PREF_LIGHT, { config: false, scope: 'client', type: Boolean, default: false });
		SETTINGS.register(this.PREF_SOUND, { config: false, scope: 'client', type: Boolean, default: false });

		Hooks.on('getSceneControlButtons', (controls: SceneControl[]) => {
			const data: Partial<SceneControlTool> = { icon: 'fas fa-eye', name: 'flatten', toggle: true }
			controls.find(x => x.name === 'walls').tools.unshift({
				icon: 'fas fa-eye', name: 'flatten', toggle: true,
				active: SETTINGS.get(this.PREF_WALLS),
				title: 'DF_ARCHITECT.ShowLayerControls.Walls',
				onClick: this.toggleWalls.bind(this)
			});
			controls.find(x => x.name === 'lighting').tools.unshift({
				icon: 'fas fa-eye', name: 'flatten', toggle: true,
				active: SETTINGS.get(this.PREF_LIGHT),
				title: 'DF_ARCHITECT.ShowLayerControls.Lights',
				onClick: this.toggleLights.bind(this)
			});
			controls.find(x => x.name === 'sounds').tools.unshift({
				icon: 'fas fa-eye', name: 'flatten', toggle: true,
				active: SETTINGS.get(this.PREF_SOUND),
				title: 'DF_ARCHITECT.ShowLayerControls.Sounds',
				onClick: this.toggleSounds.bind(this)
			});
		});

		libWrapper.register(ARCHITECT.MOD_NAME, 'PlaceablesLayer.prototype.deactivate', function (this: PlaceablesLayer<any>, wrapped: Function) {
			if (!ShowLayerControls._ready) return wrapped();
			var toggled: boolean = false;
			switch (this.name) {
				case 'WallsLayer':
					toggled = SETTINGS.get(ShowLayerControls.PREF_WALLS);
					break;
				case 'LightingLayer':
					toggled = SETTINGS.get(ShowLayerControls.PREF_LIGHT);
					break;
				case 'SoundsLayer':
					toggled = SETTINGS.get(ShowLayerControls.PREF_SOUND);
					break;
			}
			// If we are not on one of our layers, or we are not keeping the controls on
			if (!toggled) return wrapped();
			CanvasLayer.prototype.deactivate.bind(this)();
			this.objects.visible = true;
			if (this.preview) this.preview.removeChildren();
			return this;
		}, 'MIXED');

		Hooks.on('updateWall', () => {
			const refreshLayer = (layer: any) => {
				layer._active = true;
				layer.objects.children.forEach((x: any) => { x.updateSource(); x.refresh() });
				layer._active = false;
			}
			if (SETTINGS.get(ShowLayerControls.PREF_LIGHT))
				refreshLayer(canvas.lighting);
			if (SETTINGS.get(ShowLayerControls.PREF_SOUND))
				refreshLayer(canvas.sounds);
		});
	}

	static ready() {
		this._ready = true;
		const walls = SETTINGS.get(ShowLayerControls.PREF_WALLS);
		const light = SETTINGS.get(ShowLayerControls.PREF_LIGHT);
		const sound = SETTINGS.get(ShowLayerControls.PREF_SOUND);
		if (walls) { canvas.walls.activate(); canvas.walls.deactivate(); }
		if (light) { canvas.lighting.activate(); canvas.lighting.deactivate(); }
		if (sound) { canvas.sounds.activate(); canvas.sounds.deactivate(); }
		if (walls || light || sound)
			setTimeout(() => canvas.tokens.activate(), 1);
	}

	private static toggleWalls(toggled: boolean) {
		SETTINGS.set(this.PREF_WALLS, toggled);
	}
	private static toggleLights(toggled: boolean) {
		SETTINGS.set(this.PREF_LIGHT, toggled);
	}
	private static toggleSounds(toggled: boolean) {
		SETTINGS.set(this.PREF_SOUND, toggled);
	}
}