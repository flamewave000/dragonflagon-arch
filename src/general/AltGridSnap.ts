import ARCHITECT from "../architect.js";

declare global {
	interface SquareGrid {
		_DFArch_getSnappedPosition(x: number, y: number, interval: number | null): { x: number; y: number }
	}
}

export default class AltGridSnap {
	static readonly PREF_ENABLED = 'AltGridSnapEnabled';
	static readonly PREF_TOGGLED = 'AltGridSnapToggled';

	static init() {
		game.settings.register(ARCHITECT.MOD_NAME, this.PREF_ENABLED, {
			scope: 'world',
			config: true,
			name: 'DF_ARCHITECT.AltGridSnap_Setting_EnabledName',
			hint: 'DF_ARCHITECT.AltGridSnap_Setting_EnabledHint',
			type: Boolean,
			default: true,
			onChange: () => { ui.controls.initialize() }
		});
		game.settings.register(ARCHITECT.MOD_NAME, this.PREF_TOGGLED, {
			scope: 'client',
			config: false,
			type: Boolean,
			default: false
		});

		Hooks.on('getSceneControlButtons', (controls: SceneControl[]) => {
			if (!this.enabled) return;
			const isGM = game.user.isGM;
			const enabled = this.toggled;
			for (let control of controls) {
				control.tools.splice(0, 0, {
					icon: 'df df-alt-snap',
					name: 'altSnap',
					title: 'DF_ARCHITECT.AltGridSnap_Label',
					visible: isGM,
					toggle: true,
					active: enabled,
					onClick: (toggled: boolean) => { this.toggled = toggled }
				});
			}
		});

		SquareGrid.prototype._DFArch_getSnappedPosition = SquareGrid.prototype.getSnappedPosition;
		SquareGrid.prototype.getSnappedPosition = this._SquareGrid_getSnappedPosition;
	}

	static get enabled() {
		return game.settings.get(ARCHITECT.MOD_NAME, this.PREF_ENABLED);
	}
	static get toggled() {
		return game.settings.get(ARCHITECT.MOD_NAME, this.PREF_TOGGLED);
	}
	static set toggled(value: boolean) {
		game.settings.set(ARCHITECT.MOD_NAME, this.PREF_TOGGLED, value);
	}

	private static _SquareGrid_getSnappedPosition(this: SquareGrid, x: number, y: number, interval: number | null): { x: number; y: number } {
		if (!AltGridSnap.enabled || !AltGridSnap.toggled) return this._DFArch_getSnappedPosition(x, y, interval);
		if (!interval) interval = 1;
		const gs = (canvas as Canvas).dimensions.size;
		const altGs = gs / (interval * 2);
		x -= altGs;
		y -= altGs;
		let [x0, y0] = [(Math.round(x / gs) * gs), (Math.round(y / gs) * gs)];
		let dx = altGs;
		let dy = altGs;
		let delta = gs / interval;
		if (interval !== 1) {
			dx += Math.round((x - x0) / delta) * delta;
			dy += Math.round((y - y0) / delta) * delta;
		}
		return {
			x: x0 + dx,
			y: y0 + dy
		}
	}
}