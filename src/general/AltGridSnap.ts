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
			onChange: () => { this._patchSquareGrid(); ui.controls.initialize() }
		});
		game.settings.register(ARCHITECT.MOD_NAME, this.PREF_TOGGLED, {
			scope: 'client',
			config: false,
			type: Boolean,
			default: false
		});

		this._patchSquareGrid();

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

	private static _patchSquareGrid() {
		if(this.enabled) {
			if(!SquareGrid.prototype._DFArch_getSnappedPosition) return;
			SquareGrid.prototype.getSnappedPosition = SquareGrid.prototype._DFArch_getSnappedPosition;
			delete SquareGrid.prototype._DFArch_getSnappedPosition;
		}
		else if (!SquareGrid.prototype._DFArch_getSnappedPosition) {
			SquareGrid.prototype._DFArch_getSnappedPosition = SquareGrid.prototype.getSnappedPosition;
			SquareGrid.prototype.getSnappedPosition = this._SquareGrid_getSnappedPosition;
		}
	}

	private static _SquareGrid_getSnappedPosition(this: SquareGrid, x: number, y: number, interval: number | null): { x: number; y: number } {
		if (!AltGridSnap.enabled || !AltGridSnap.toggled) {
			const altGs = (canvas as Canvas).dimensions.size / (interval * 2);
			const result = this._DFArch_getSnappedPosition(x - altGs, y - altGs, interval);
			return { x: result.x + altGs, y: result.y + altGs };
		}
		return this._DFArch_getSnappedPosition(x, y, interval);
	}
}