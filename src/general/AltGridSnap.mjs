/// <reference path="../../fvtt-scripts/foundry.js" />
/// <reference path="../global.d.ts" />
import ARCHITECT from "../core/architect.mjs";
import SETTINGS from "../core/settings.mjs";

export default class AltGridSnap {
	/**@readonly*/static PREF_ENABLED = 'AltGridSnap.Enabled';
	/**@readonly*/static PREF_TOGGLED = 'AltGridSnap.Toggled';
	/**@readonly*/static PREF_PLACE_ON_CONTROL_BAR = 'AltGridSnap.PlaceOnControlBar';

	static init() {
		SETTINGS.register(AltGridSnap.PREF_TOGGLED, {
			scope: 'client',
			config: false,
			type: Boolean,
			default: false,
			onChange: value => {
				if (SETTINGS.get(AltGridSnap.PREF_PLACE_ON_CONTROL_BAR)) {
					const button = $('ol#controls>li#df-arch-altSnap');
					if (value) button.addClass('active');
					else button.removeClass('active');
				} else {
					ui.controls.control.tools.find(t => t.name === 'altSnap').active = value;
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
			onChange: () => { this.#_patchSquareGrid(); ui.controls.initialize() }
		});
		SETTINGS.register(AltGridSnap.PREF_PLACE_ON_CONTROL_BAR, {
			scope: 'world',
			config: true,
			name: 'DF_ARCHITECT.AltGridSnap.Setting.PlaceOnControlBarName',
			hint: 'DF_ARCHITECT.AltGridSnap.Setting.PlaceOnControlBarHint',
			type: Boolean,
			default: false,
			onChange: () => { ui.controls.initialize(); ui.controls.render(true) }
		});

		game.keybindings.register(ARCHITECT.MOD_NAME, 'AltSnapGrid.Toggle', {
			restricted: true,
			name: 'DF_ARCHITECT.AltGridSnap.Hotkey_Toggle',
			editable: [{ key: 'KeyS', modifiers: [KeyboardManager.MODIFIER_KEYS.ALT] }],
			onDown: () => {
				if (this.enabled)
					this.toggled = !this.toggled;
				return this.enabled;
			}
		});

		if (this.enabled)
			this.#_patchSquareGrid();

		Hooks.on('getSceneControlButtons', (/**@type {SceneControl[]}*/ controls) => {
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
					onClick: toggled => this.toggled = toggled
				});
			}
		});
		Hooks.on('renderSceneControls',
			/**
			 * @param {SceneControls} _app
			 * @param {JQuery<HTMLElement>} html
			 * @param {any} [_data]
			 */
			(_app, html, _data) => {
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

	/**@type {boolean}*/
	static get enabled() {
		return SETTINGS.get(AltGridSnap.PREF_ENABLED);
	}
	/**@type {boolean}*/
	static get toggled() {
		return SETTINGS.get(AltGridSnap.PREF_TOGGLED);
	}
	static set toggled(value) {
		SETTINGS.set(AltGridSnap.PREF_TOGGLED, value);
	}

	static #_patchSquareGrid() {
		if (this.enabled)
			libWrapper.register(ARCHITECT.MOD_NAME, 'SquareGrid.prototype.getSnappedPoint', this.#_SquareGrid_getSnappedPoint, 'WRAPPER');
		else
			libWrapper.unregister(ARCHITECT.MOD_NAME, 'SquareGrid.prototype.getSnappedPoint');
	}

	/**
	 * @param {(...args: any) => any} wrapped
	 * @param {number} x
	 * @param {number} y
	 * @param {number|null} interval
	 * @returns { {x: number, y: number} }
	 */
	static #_SquareGrid_getSnappedPoint(wrapped, point, { mode, resolution = 1 }) {
		if (AltGridSnap.enabled && AltGridSnap.toggled) {
			const M = CONST.GRID_SNAPPING_MODES;
			let altGs = 0;
			if (mode & M.CENTER && (mode & M.VERTEX || mode & M.CORNER) && mode & M.SIDE_MIDPOINT)
				altGs = /**@type {Canvas}*/(canvas).dimensions.size / (4 * resolution);
			else
				altGs = /**@type {Canvas}*/(canvas).dimensions.size / (2 * resolution);
			const result = wrapped({ x: point.x - altGs, y: point.y - altGs }, { mode, resolution });
			return { x: result.x + altGs, y: result.y + altGs };
		}
		return wrapped(point, { mode, resolution });
	}
}
