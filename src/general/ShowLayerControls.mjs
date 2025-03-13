import ARCHITECT from "../core/architect.mjs";
import SETTINGS from "../core/settings.mjs";

export default class ShowLayerControls {
	/**@readonly*/static PREF_WALLS = 'ShowLayerControls.WallsLayer';
	/**@readonly*/static PREF_LIGHT = 'ShowLayerControls.LightingLayer';
	/**@readonly*/static PREF_SOUND = 'ShowLayerControls.SoundsLayer';
	/**@readonly*/static _ready = false;

	/**@type {boolean}*/
	static get showWalls() {
		return game.user.isGM && SETTINGS.get(ShowLayerControls.PREF_WALLS);
	}
	/**@type {boolean}*/
	static get showLights() {
		return game.user.isGM && SETTINGS.get(ShowLayerControls.PREF_LIGHT);
	}
	/**@type {boolean}*/
	static get showSounds() {
		return game.user.isGM && SETTINGS.get(ShowLayerControls.PREF_SOUND);
	}

	/**
	 * @param {string} layer
	 * @param {string} setting
	 * @param {boolean} toggled
	 */
	static async toggleLayer(layer, setting, toggled) {
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

		Hooks.on('getSceneControlButtons', (/**@type {SceneControl[]}*/controls) => {
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

		const redraw = async (/**@type {PlaceableObject}*/x) => {
			if (x instanceof AmbientSound)
				x.initializeSoundSource();
			else if (x instanceof AmbientLight)
				x.initializeLightSource();
			else {
				x.updateSource();
				x.refresh();
				return;
			}
			x.renderFlags.redraw = true;
			await x.draw();
			await x.applyRenderFlags();
			x.controlIcon.visible = true;
		}

		Hooks.on('updateWall', () => {
			if (!game.user.isGM) return;
			const refreshLayer = (layer) => {
				layer._active = true;
				layer.objects.children.forEach(redraw);
				layer._active = false;
			}
			if (this.showLights)
				refreshLayer(canvas.lighting);
			if (this.showSounds)
				refreshLayer(canvas.sounds);
		});

		Hooks.on('deleteWall', () => {
			if (!game.user.isGM) return;
			const refreshLayer = layer => {
				layer._active = true;
				layer.objects.children.forEach(redraw);
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

	/**
	 * @this {PlaceablesLayer}
	 * @param {Function} wrapped
	 * @returns {PlaceablesLayer}
	 */
	static PlaceablesLayer_deactivate(wrapped) {
		if (!ShowLayerControls._ready) return wrapped();
		var toggled = false;
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

		if (this.name !== 'LightingLayer' && this.name !== 'SoundsLayer')
			return this;

		/**@type {PlaceableObject[]}*/(this.objects.children).forEach(async x => {
				x.renderFlags.redraw = true;
				await x.draw();
				await x.applyRenderFlags();
				x.controlIcon.visible = true;
			});
		return this;
	}
}