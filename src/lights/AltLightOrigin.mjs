/// <reference path="../../fvtt-scripts/foundry.js" />
import ARCHITECT from "../core/architect.mjs";
import SETTINGS from "../core/settings.mjs";


export default class AltLightOrigin {
	/**@readonly*/static #LIGHTING_LAYER = 'lighting';
	/**@readonly*/static #KEYEVENT_UP = 'keyup';
	/**@readonly*/static #KEYEVENT_DOWN = 'keydown';
	/**@readonly*/static PREF_COLOUR1 = 'AltLightOrigin.Colour1';
	/**@readonly*/static PREF_COLOUR2 = 'AltLightOrigin.Colour2';
	static #showCrosshairs = false;
	static get showCrosshairs() { return this.#showCrosshairs; }
	static #alternateColour = false;
	static get alternateColour() { return this.#alternateColour; }

	/**@type {Set<AltLightControlIcon>}*/
	static #controls = new Set();
	/**@param {AltLightControlIcon} control*/
	static register(control) {
		this.#controls.add(control);
	}
	/**@param {AltLightControlIcon} control*/
	static deregister(control) {
		this.#controls.delete(control);
	}
	static init() {
		libWrapper.register(ARCHITECT.MOD_NAME, 'AmbientLight.prototype._draw', function () {
			this.field = this.addChild(new PIXI.Graphics());
			this.field.eventMode = "none";

			const size = Math.max(Math.round((canvas.dimensions.size * 0.5) / 20) * 20, 40);
			let icon = new AltLightControlIcon({ texture: CONFIG.controlIcons.light, size: size });
			icon.x -= (size * 0.5);
			icon.y -= (size * 0.5);
			this.controlIcon = this.addChild(icon);

			this.initializeLightSource();
		}, 'OVERRIDE');
	}
	static ready() {
		// @ts-ignore
		new window.Ardittristan.ColorSetting(ARCHITECT.MOD_NAME, AltLightOrigin.PREF_COLOUR1, {
			name: "DF_ARCHITECT.AltLightOrigin.Settings.Colour1_Name",
			hint: "DF_ARCHITECT.AltLightOrigin.Settings.Colour1_Hint",
			label: "DF_ARCHITECT.AltLightOrigin.Settings.Colour1_Name",
			restricted: true,
			defaultColor: "#ffffffff",
			scope: "world",
		});
		// @ts-ignore
		new window.Ardittristan.ColorSetting(ARCHITECT.MOD_NAME, AltLightOrigin.PREF_COLOUR2, {
			name: "DF_ARCHITECT.AltLightOrigin.Settings.Colour2_Name",
			hint: "DF_ARCHITECT.AltLightOrigin.Settings.Colour2_Hint",
			label: "DF_ARCHITECT.AltLightOrigin.Settings.Colour2_Name",
			restricted: true,
			defaultColor: "#ff5500ff",
			scope: "world",
		});

		Hooks.on('renderSceneControls', (/**@type {SceneControls}*/controls) => {
			if (controls.activeControl === AltLightOrigin.#LIGHTING_LAYER) {
				window.addEventListener(AltLightOrigin.#KEYEVENT_DOWN, this.#_keyEventHandler.bind(this));
				window.addEventListener(AltLightOrigin.#KEYEVENT_UP, this.#_keyEventHandler.bind(this));
			}
			else {
				window.removeEventListener(AltLightOrigin.#KEYEVENT_DOWN, this.#_keyEventHandler.bind(this));
				window.removeEventListener(AltLightOrigin.#KEYEVENT_UP, this.#_keyEventHandler.bind(this));
			}
		});
	}

	/**@param {KeyboardEvent} event*/
	static #_keyEventHandler(event) {
		if (event.repeat
			|| (event.code !== 'ShiftLeft'
				&& event.code !== 'ShiftRight'
				&& event.code !== 'AltLeft'
				&& event.code !== 'AltRight')) return;
		this.#showCrosshairs = event.shiftKey;
		this.#alternateColour = event.altKey;
		this.#controls.forEach(x => x.draw());
	}
}
class AltLightControlIcon extends ControlIcon {
	state = 0;
	/**@param { {texture:string,size?:number,borderColor?:number,tint?:number|null} } param0*/
	constructor({
		texture,
		size = 40,
		borderColor = 0xFF5500,
		tint = null
	}) {
		super({ texture, size, borderColor, tint });
		AltLightOrigin.register(this);
	}
	/** @override */
	async draw() {
		if (!AltLightOrigin.showCrosshairs) {
			this.icon.alpha = 1;
			if (!this.icon.texture) return this;
			if (this.state != 0) {
				this.state = 0;
				this.bg.clear().beginFill(0x000000, 0.4).lineStyle(2, 0x000000, 1.0).drawRoundedRect(...this.rect, 5).endFill();
			}
			return super.draw();
		}
		if (this.state == 1 && !AltLightOrigin.alternateColour && AltLightOrigin.showCrosshairs) return this;
		if (this.state == 2 && AltLightOrigin.alternateColour && AltLightOrigin.showCrosshairs) return this;

		this.icon.alpha = 0;
		// Draw border
		this.border.clear().lineStyle(2, this.borderColor, 1.0).drawRoundedRect(...this.rect, 5).endFill();
		this.border.visible = false;

		if (!AltLightOrigin.alternateColour && this.state != 1 || AltLightOrigin.alternateColour && this.state != 2) {
			this.state = AltLightOrigin.alternateColour ? 2 : 1;
			// Draw icon
			const colorstr = AltLightOrigin.alternateColour ? AltLightOrigin.PREF_COLOUR2 : AltLightOrigin.PREF_COLOUR1;
			var colour = this.#parseColour(SETTINGS.get(colorstr));
			if (isNaN(colour))
				colour = this.#parseColour(SETTINGS.default(colorstr));
			this.bg.clear()
				.lineStyle(1, colour, 1.0)
				.moveTo(this.rect[0] - 1, this.rect[1] - 1)
				.lineTo(this.rect[2] - 1, this.rect[3] - 1)
				.moveTo(this.rect[2] - 1, this.rect[1] - 1)
				.lineTo(this.rect[0] - 1, this.rect[3] - 1)
				.lineStyle(2, colour, 1.0)
				.drawEllipse(
					this.rect[0] + (this.rect[2] / 2),
					this.rect[1] + (this.rect[3] / 2),
					this.rect[2] / 2,
					this.rect[3] / 2
				)
				.endFill();
		}
		return this;
	}
	/**@param { {children?:boolean,texture?:boolean,baseTexture?:boolean} } [options]*/
	destroy(options) {
		AltLightOrigin.deregister(this);
		super.destroy(options);
	}

	/**
	 * @param {string} colorStr
	 * @returns {number}
	 */
	#parseColour(/**@type {string}*/colorStr) {
		if (colorStr.startsWith('#')) colorStr = colorStr.substr(1);
		if (colorStr.length === 8) colorStr = colorStr.substr(0, 6);
		return parseInt('0x' + colorStr);
	}
}
