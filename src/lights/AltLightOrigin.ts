import ARCHITECT from "../core/architect.js";
import SETTINGS from "../core/settings.js";


class _AltLightOrigin {
	private static readonly LIGHTING_LAYER = 'lighting';
	private static readonly KEYEVENT_UP = 'keyup';
	private static readonly KEYEVENT_DOWN = 'keydown';
	static readonly PREF_COLOUR1 = 'AltLightOrigin.Colour1';
	static readonly PREF_COLOUR2 = 'AltLightOrigin.Colour2';
	private _showCrosshairs = false;
	get showCrosshairs() { return this._showCrosshairs; }
	private _alternateColour = false;
	get alternateColour() { return this._alternateColour; }

	private _controls: Set<AltLightControlIcon> = new Set();
	register(control: AltLightControlIcon) {
		this._controls.add(control);
	}
	deregister(control: AltLightControlIcon) {
		this._controls.delete(control);
	}
	init() {
		libWrapper.register(ARCHITECT.MOD_NAME, 'AmbientLight.prototype._drawControlIcon', () => {
			const size = Math.max(Math.round(((<Canvas>canvas).dimensions.size * 0.5) / 20) * 20, 40);
			let icon = new AltLightControlIcon(this, { texture: CONFIG.controlIcons.light, size: size });
			icon.x -= (size * 0.5);
			icon.y -= (size * 0.5);
			return icon;
		}, 'OVERRIDE');
	}
	ready() {
		// @ts-ignore
		new window.Ardittristan.ColorSetting(ARCHITECT.MOD_NAME, _AltLightOrigin.PREF_COLOUR1, {
			name: "DF_ARCHITECT.AltLightOrigin_Settings_Colour1_Name",
			hint: "DF_ARCHITECT.AltLightOrigin_Settings_Colour1_Hint",
			label: "DF_ARCHITECT.AltLightOrigin_Settings_Colour1_Name",
			restricted: true,
			defaultColor: "#ffffffff",
			scope: "world",
		});
		// @ts-ignore
		new window.Ardittristan.ColorSetting(ARCHITECT.MOD_NAME, _AltLightOrigin.PREF_COLOUR2, {
			name: "DF_ARCHITECT.AltLightOrigin_Settings_Colour2_Name",
			hint: "DF_ARCHITECT.AltLightOrigin_Settings_Colour2_Hint",
			label: "DF_ARCHITECT.AltLightOrigin_Settings_Colour2_Name",
			restricted: true,
			defaultColor: "#ff5500ff",
			scope: "world",
		});

		Hooks.on('renderSceneControls', (controls: SceneControls) => {
			if (controls.activeControl === _AltLightOrigin.LIGHTING_LAYER) {
				window.addEventListener(_AltLightOrigin.KEYEVENT_DOWN, this._keyEventHandler.bind(this));
				window.addEventListener(_AltLightOrigin.KEYEVENT_UP, this._keyEventHandler.bind(this));
			}
			else {
				window.removeEventListener(_AltLightOrigin.KEYEVENT_DOWN, this._keyEventHandler.bind(this));
				window.removeEventListener(_AltLightOrigin.KEYEVENT_UP, this._keyEventHandler.bind(this));
			}
		});
	}

	private _keyEventHandler(event: KeyboardEvent) {
		if (event.repeat
			|| (event.code !== 'ShiftLeft'
				&& event.code !== 'ShiftRight'
				&& event.code !== 'AltLeft'
				&& event.code !== 'AltRight')) return;
		this._showCrosshairs = event.shiftKey;
		this._alternateColour = event.altKey;
		this._controls.forEach(x => x.draw());
	}
}
class AltLightControlIcon extends ControlIcon {
	altLightOrigin: _AltLightOrigin;
	constructor(altLightOrigin: _AltLightOrigin, {
		texture,
		size = 40,
		borderColor = 0xFF5500,
		tint = null
	}: {
		texture: string;
		size?: number;
		borderColor?: number;
		tint?: number | null;
	}) {
		super({ texture, size, borderColor, tint });
		this.altLightOrigin = altLightOrigin;
		altLightOrigin.register(this);
	}
	/** @override */
	async draw() {
		if (!this.altLightOrigin?.showCrosshairs) {
			this.icon.alpha = 1;
			if (!this.icon.texture) return this;
			return super.draw();
		}
		this.icon.alpha = 0;
		// Draw border
		this.border.clear().lineStyle(2, this.borderColor, 1.0).drawRoundedRect(...this.rect, 5).endFill();
		this.border.visible = false;
		const parseColour = (colorStr: string) => {
			if (colorStr.startsWith('#')) colorStr = colorStr.substr(1);
			if (colorStr.length === 8) colorStr = colorStr.substr(0, 6);
			return parseInt('0x' + colorStr);
		}

		// // Draw icon
		var colour = parseColour(SETTINGS.get<string>(this.altLightOrigin.alternateColour ? _AltLightOrigin.PREF_COLOUR2 : _AltLightOrigin.PREF_COLOUR1));
		if (isNaN(colour))
			colour = parseColour(SETTINGS.default(this.altLightOrigin.alternateColour ? _AltLightOrigin.PREF_COLOUR2 : _AltLightOrigin.PREF_COLOUR1));
		this.bg.clear()
			.lineStyle(1, colour, 1.0)
			.moveTo(this.rect[0]-1, this.rect[1]-1)
			.lineTo(this.rect[2]-1, this.rect[3]-1)
			.moveTo(this.rect[2]-1, this.rect[1]-1)
			.lineTo(this.rect[0]-1, this.rect[3]-1)
			.lineStyle(2, colour, 1.0)
			.drawEllipse(
				this.rect[0] + (this.rect[2] / 2),
				this.rect[1] + (this.rect[3] / 2),
				this.rect[2] / 2,
				this.rect[3] / 2
			)
			.endFill();
		return this;
	}
	destroy(options?: {
		children?: boolean;
		texture?: boolean;
		baseTexture?: boolean;
	}) {
		super.destroy(options);
		this.altLightOrigin.deregister(this);
	}
}

export const AltLightOrigin = new _AltLightOrigin();