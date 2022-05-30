import ARCHITECT from "../core/architect";
import SETTINGS from "../core/settings";

declare global {
	interface SquareGrid {
		_DFArch_getSnappedPosition(x: number, y: number, interval: number | null): { x: number; y: number }
	}
}

export default class AltGridSnap {
	static readonly PREF_ENABLED = 'AltGridSnap.Enabled';
	static readonly PREF_TOGGLED = 'AltGridSnap.Toggled';
	static readonly PREF_PLACE_ON_CONTROL_BAR = 'AltGridSnap.PlaceOnControlBar';

	static init() {
		SETTINGS.register(AltGridSnap.PREF_TOGGLED, {
			scope: 'client',
			config: false,
			type: Boolean,
			default: false,
			onChange: (value: Boolean) => {
				if (SETTINGS.get(AltGridSnap.PREF_PLACE_ON_CONTROL_BAR)) {
					const button = $('ol#controls>li#df-arch-altSnap');
					if (value) button.addClass('active');
					else button.removeClass('active');
				} else {
					ui.controls.control.tools.find(t => t.name === 'altSnap').active = <boolean>value;
					ui.controls.render();
				}
			}
		});
		SETTINGS.register(AltGridSnap.PREF_ENABLED, {
			scope: 'world',
			config: true,
			name: 'DF_ARCHITECT.AltGridSnap.Setting.EnabledName',
			hint: 'DF_ARCHITECT.AltGridSnap.Setting.EnabledHint',
			type: Boolean,
			default: false,
			onChange: () => { this._patchSquareGrid(); ui.controls.initialize() }
		});
		SETTINGS.register(AltGridSnap.PREF_PLACE_ON_CONTROL_BAR, {
			scope: 'client',
			config: true,
			name: 'DF_ARCHITECT.AltGridSnap.Setting.PlaceOnControlBarName',
			hint: 'DF_ARCHITECT.AltGridSnap.Setting.PlaceOnControlBarHint',
			type: Boolean,
			default: false,
			onChange: () => { ui.controls.initialize(); ui.controls.render(true) }
		});

		game.keybindings.register(ARCHITECT.MOD_NAME, 'AltSnapGrid.Toggle', {
			name: 'DF_ARCHITECT.AltGridSnap.Hotkey_Toggle',
			editable: [{ key: 'KeyS', modifiers: [KeyboardManager.MODIFIER_KEYS.ALT] }],
			onDown: () => {
				if (this.enabled)
					this.toggled = !this.toggled;
				return this.enabled;
			}
		});

		if (this.enabled)
			this._patchSquareGrid();

		Hooks.on('getSceneControlButtons', (controls: SceneControl[]) => {
			if (!this.enabled) return;
			if (SETTINGS.get(AltGridSnap.PREF_PLACE_ON_CONTROL_BAR)) return;
			const isGM = game.user.isGM;
			const enabled = this.toggled;
			for (let control of controls) {
				control.tools.splice(0, 0, {
					icon: 'df df-alt-snap',
					name: 'altSnap',
					title: 'DF_ARCHITECT.AltGridSnap.Label',
					visible: isGM,
					toggle: true,
					active: enabled,
					onClick: (toggled: boolean) => this.toggled = toggled
				});
			}
		});
		Hooks.on('renderSceneControls', (app: SceneControls, html: JQuery<HTMLElement>, data: any) => {
			if (!SETTINGS.get(AltGridSnap.PREF_PLACE_ON_CONTROL_BAR)) return;
			const button = $(`
<li class="scene-control toggle" id="df-arch-altSnap" style="line-height:0" title="${'DF_ARCHITECT.AltGridSnap.Label'.localize()}">
	<i class="df df-alt-snap"></i>
</li>`);
			button.on('click', () => {
				if (button.hasClass('active')) {
					this.toggled = false;
					button.removeClass('active');
				} else {
					this.toggled = true;
					button.addClass('active');
				}
			});
			if (this.toggled) button.addClass('active');
			html.find('.main-controls').append(button);
		});
	}

	static get enabled(): boolean {
		return SETTINGS.get(AltGridSnap.PREF_ENABLED);
	}
	static get toggled(): boolean {
		return SETTINGS.get(AltGridSnap.PREF_TOGGLED);
	}
	static set toggled(value: boolean) {
		SETTINGS.set(AltGridSnap.PREF_TOGGLED, value);
	}

	private static _patchSquareGrid() {
		if (this.enabled)
			libWrapper.register(ARCHITECT.MOD_NAME, 'SquareGrid.prototype.getSnappedPosition', this._SquareGrid_getSnappedPosition, 'WRAPPER');
		else
			libWrapper.unregister(ARCHITECT.MOD_NAME, 'SquareGrid.prototype.getSnappedPosition');
	}

	private static _SquareGrid_getSnappedPosition(wrapped: Function, x: number, y: number, interval: number | null): { x: number; y: number } {
		if (AltGridSnap.enabled && AltGridSnap.toggled) {
			if (!interval) interval = 1;
			const altGs = (canvas as Canvas).dimensions.size / (interval * 2);
			const result = wrapped(x - altGs, y - altGs, interval);
			return { x: result.x + altGs, y: result.y + altGs };
		}
		return wrapped(x, y, interval);
	}
}
