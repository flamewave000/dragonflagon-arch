import ARCHITECT from "../core/architect.js";
import SETTINGS from "../core/settings.js";

declare global {
	interface SquareGrid {
		_DFArch_getSnappedPosition(x: number, y: number, interval: number | null): { x: number; y: number }
	}
}

class _AltGridSnap {
	static readonly PREF_ENABLED = 'AltGridSnap.Enabled';
	static readonly PREF_TOGGLED = 'AltGridSnap.Toggled';
	static readonly PREF_PLACE_ON_CONTROL_BAR = 'AltGridSnap.PlaceOnControlBar';

	init() {
		SETTINGS.register(_AltGridSnap.PREF_TOGGLED, {
			scope: 'client',
			config: false,
			type: Boolean,
			default: false,
			onChange: (value: Boolean) => {
				if (!SETTINGS.get(_AltGridSnap.PREF_PLACE_ON_CONTROL_BAR)) return;
				const button = $('ol#controls>li#df-arch-altSnap');
				if (value) button.addClass('active');
				else button.removeClass('active');
			}
		});
		SETTINGS.register(_AltGridSnap.PREF_ENABLED, {
			scope: 'world',
			config: true,
			name: 'DF_ARCHITECT.AltGridSnap_Setting_EnabledName',
			hint: 'DF_ARCHITECT.AltGridSnap_Setting_EnabledHint',
			type: Boolean,
			default: false,
			onChange: () => { this._patchSquareGrid(); ui.controls.initialize() }
		});
		SETTINGS.register(_AltGridSnap.PREF_PLACE_ON_CONTROL_BAR, {
			scope: 'client',
			config: true,
			name: 'DF_ARCHITECT.AltGridSnap_Setting_PlaceOnControlBarName',
			hint: 'DF_ARCHITECT.AltGridSnap_Setting_PlaceOnControlBarHint',
			type: Boolean,
			default: false,
			onChange: () => { ui.controls.initialize(); ui.controls.render(true) }
		});

		Hotkeys.registerShortcut({
			name: ARCHITECT.MOD_NAME + '.AltSnapGrid.Toggle',
			label: 'DF_ARCHITECT.AltGridSnap_Hotkey_Toggle',
			default: { key: Hotkeys.keys.KeyS, alt: true, ctrl: false, shift: false },
			onKeyDown: () => {
				if (this.enabled)
					this.toggled = !this.toggled;
			}
		});

		if (this.enabled)
			this._patchSquareGrid();

		Hooks.on('getSceneControlButtons', (controls: SceneControl[]) => {
			if (!this.enabled) return;
			if (SETTINGS.get(_AltGridSnap.PREF_PLACE_ON_CONTROL_BAR)) return;
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
		Hooks.on('renderSceneControls', (app: SceneControls, html: JQuery<HTMLElement>, data: any) => {
			if (!SETTINGS.get(_AltGridSnap.PREF_PLACE_ON_CONTROL_BAR)) return;
			const button = $(`
<li class="control-tool toggle" id="df-arch-altSnap" style="line-height:0" title="${'DF_ARCHITECT.AltGridSnap_Label'.localize()}">
	<i class="df df-alt-snap"></i>
</li>`);
			button.on('click', () => this.toggled = !button.hasClass('active'))
			if (this.toggled) button.addClass('active');
			html.append(button);
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