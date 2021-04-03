import ARCHITECT from "../core/architect.js";
import SETTINGS from "../core/settings.js";

declare global {
	interface SquareGrid {
		_DFArch_getSnappedPosition(x: number, y: number, interval: number | null): { x: number; y: number }
	}
}

class _AltGridSnap {
	static readonly PREF_ENABLED = 'AltGridSnapEnabled';
	static readonly PREF_TOGGLED = 'AltGridSnapToggled';

	init() {
		SETTINGS.register(_AltGridSnap.PREF_ENABLED, {
			scope: 'world',
			config: true,
			name: 'DF_ARCHITECT.AltGridSnap_Setting_EnabledName',
			hint: 'DF_ARCHITECT.AltGridSnap_Setting_EnabledHint',
			type: Boolean,
			default: true,
			onChange: () => { this._patchSquareGrid(); ui.controls.initialize() }
		});
		SETTINGS.register(_AltGridSnap.PREF_TOGGLED, {
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

	get enabled() {
		return SETTINGS.get(_AltGridSnap.PREF_ENABLED);
	}
	get toggled() {
		return SETTINGS.get(_AltGridSnap.PREF_TOGGLED);
	}
	set toggled(value: boolean) {
		SETTINGS.set(_AltGridSnap.PREF_TOGGLED, value);
	}

	private _patchSquareGrid() {
		if (this.enabled)
			libWrapper.register(ARCHITECT.MOD_NAME, 'SquareGrid.prototype.getSnappedPosition', this._SquareGrid_getSnappedPosition, 'WRAPPER');
		else
			libWrapper.unregister(ARCHITECT.MOD_NAME, 'SquareGrid.prototype.getSnappedPosition');
	}

	private _SquareGrid_getSnappedPosition(wrapped: Function, x: number, y: number, interval: number | null): { x: number; y: number } {
		if (AltGridSnap.enabled && AltGridSnap.toggled) {
			if (!interval) interval = 1;
			const altGs = (canvas as Canvas).dimensions.size / (interval * 2);
			const result = wrapped(x - altGs, y - altGs, interval);
			return { x: result.x + altGs, y: result.y + altGs };
		}
		return wrapped(x, y, interval);
	}
}
export const AltGridSnap = new _AltGridSnap();