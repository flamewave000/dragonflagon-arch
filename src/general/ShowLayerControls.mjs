import ARCHITECT from "../core/architect.mjs";
import SETTINGS from "../core/settings.mjs";

export default class ShowLayerControls {
	private static readonly PREF_WALLS = 'ShowLayerControls.WallsLayer';
	private static readonly PREF_LIGHT = 'ShowLayerControls.LightingLayer';
	private static readonly PREF_SOUND = 'ShowLayerControls.SoundsLayer';
	private static _ready = false;

	private static get showWalls(): boolean {
		return game.user.isGM && SETTINGS.get(ShowLayerControls.PREF_WALLS);
	}
	private static get showLights(): boolean {
		return game.user.isGM && SETTINGS.get(ShowLayerControls.PREF_LIGHT);
	}
	private static get showSounds(): boolean {
		return game.user.isGM && SETTINGS.get(ShowLayerControls.PREF_SOUND);
	}

	private static async toggleLayer(layer: string, setting: string, toggled: boolean) {
		await SETTINGS.set(setting, toggled);
		const control = ui.controls.controls.find(x => x.layer == layer);
		if (toggled)
			control.icon += ' df-arch-layervisible';
		else if (control.icon.indexOf(' df-arch-layervisible') > 0)
			control.icon = control.icon.substring(0, control.icon.indexOf(' df-arch-layervisible'));
		setTimeout(() => ui.controls.render(), 100);
	}

	static init() {
		SETTINGS.register(this.PREF_WALLS, { config: false, scope: 'client', type: Boolean, default: false });
		SETTINGS.register(this.PREF_LIGHT, { config: false, scope: 'client', type: Boolean, default: false });
		SETTINGS.register(this.PREF_SOUND, { config: false, scope: 'client', type: Boolean, default: false });

		Hooks.on('getSceneControlButtons', (controls: SceneControl[]) => {
			if (!game.user.isGM) return;

			const walls = controls.find(x => x.name === 'walls');
			const lighting = controls.find(x => x.name === 'lighting');
			const sounds = controls.find(x => x.name === 'sounds');

			if (this.showWalls)
				walls.icon += ' df-arch-layervisible';
			walls.tools.unshift({
				icon: 'fas fa-eye', name: 'flatten', toggle: true,
				active: SETTINGS.get(this.PREF_WALLS),
				title: 'DF_ARCHITECT.ShowLayerControls.Walls',
				onClick: toggled => this.toggleLayer('walls', ShowLayerControls.PREF_WALLS, toggled)
			});
			if (this.showLights)
				lighting.icon += ' df-arch-layervisible';
			lighting.tools.unshift({
				icon: 'fas fa-eye', name: 'flatten', toggle: true,
				active: SETTINGS.get(this.PREF_LIGHT),
				title: 'DF_ARCHITECT.ShowLayerControls.Lights',
				onClick: toggled => this.toggleLayer('lighting', ShowLayerControls.PREF_LIGHT, toggled)
			});
			if (this.showSounds)
				sounds.icon += ' df-arch-layervisible';
			sounds.tools.unshift({
				icon: 'fas fa-eye', name: 'flatten', toggle: true,
				active: SETTINGS.get(this.PREF_SOUND),
				title: 'DF_ARCHITECT.ShowLayerControls.Sounds',
				onClick: toggled => this.toggleLayer('sounds', ShowLayerControls.PREF_SOUND, toggled)
			});
		});

		Hooks.on('updateWall', () => {
			if (!game.user.isGM) return;
			const refreshLayer = (layer: any) => {
				layer._active = true;
				layer.objects.children.forEach((x: any) => { x.updateSource(); x.refresh() });
				layer._active = false;
			}
			if (this.showLights)
				refreshLayer(canvas.lighting);
			if (this.showSounds)
				refreshLayer(canvas.sounds);
		});

		Hooks.on('deleteWall', () => {
			if (!game.user.isGM) return;
			const refreshLayer = (layer: any) => {
				layer._active = true;
				layer.objects.children.forEach((x: any) => { x.updateSource(); x.refresh() });
				layer._active = false;
			}
			if (this.showLights)
				refreshLayer(canvas.lighting);
			if (this.showSounds)
				refreshLayer(canvas.sounds);
		});
	}

	static ready() {
		this._ready = true;
		const walls = this.showWalls;
		const light = this.showLights;
		const sound = this.showSounds;
		if (walls) { canvas.walls.activate(); canvas.walls.deactivate(); }
		if (light) { canvas.lighting.activate(); canvas.lighting.deactivate(); }
		if (sound) { canvas.sounds.activate(); canvas.sounds.deactivate(); }
		if (walls || light || sound)
			setTimeout(() => canvas.tokens.activate(), 1);

		if (!game.user.isGM) return;
		libWrapper.register(ARCHITECT.MOD_NAME, 'PlaceablesLayer.prototype.deactivate', this.PlaceablesLayer_deactivate, 'MIXED');
	}

	private static AmbientLight_refresh(this: AmbientLight) {
		/*****************************************************************************************/
		/************* CODE COPIED FROM foundry.js AmbientLight.prototype._refresh() *************/
		/*****************************************************************************************/
		// const active = this.layer.active; //! DF: Disabled Active Check

		// Update position and FOV
		const { x, y } = this.document;
		this.position.set(x, y);
		(this as any).field.position.set(-x, -y);

		// Draw the light preview field
		const l = (this as any).field.clear();

		//! DF: Disabled Active Check
		if (/*active &&*/ this.source.los) l.lineStyle(2, 0xEEEEEE, 0.4).drawShape(this.source.los);

		// Update control icon appearance
		this.refreshControl();
		/*****************************************************************************************/
		/************************************* CODE COPY END *************************************/
		/*****************************************************************************************/

		this.controlIcon.visible = true;
	}

	private static PlaceablesLayer_deactivate(this: PlaceablesLayer<any>, wrapped: Function) {
		if (!ShowLayerControls._ready) return wrapped();
		var toggled: boolean = false;
		switch (this.name) {
			case 'WallsLayer':
				toggled = ShowLayerControls.showWalls;
				break;
			case 'LightingLayer':
				toggled = ShowLayerControls.showLights;
				break;
			case 'SoundsLayer':
				toggled = ShowLayerControls.showSounds;
				break;
		}
		// If we are not on one of our layers, or we are not keeping the controls on
		if (!toggled) return wrapped();
		InteractionLayer.prototype.deactivate.bind(this)();
		this.objects.visible = true;
		if (this.preview) this.preview.removeChildren();

		switch (this.name) {
			case 'LightingLayer':
				(this.objects.children as AmbientLight[]).forEach(x => ShowLayerControls.AmbientLight_refresh.apply(x));
			case 'SoundsLayer':
				(this.objects.children as (AmbientLight | AmbientSound)[]).forEach(x => x.controlIcon.visible = true);
				break;
		}

		return this;
	}
}