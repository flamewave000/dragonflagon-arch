
import SETTINGS from '../core/settings.js';
import CaptureGameScreen from './CaptureGameScreen.js'

class _PIXIAppOverride extends PIXI.Application {
	constructor(options?: {
		autoStart?: boolean;
		width?: number;
		height?: number;
		view?: HTMLCanvasElement;
		transparent?: boolean;
		autoDensity?: boolean;
		antialias?: boolean;
		preserveDrawingBuffer?: boolean;
		resolution?: number;
		forceCanvas?: boolean;
		backgroundColor?: number;
		backgroundAlpha?: number;
		clearBeforeRender?: boolean;
		powerPreference?: string;
		sharedTicker?: boolean;
		sharedLoader?: boolean;
		resizeTo?: Window | HTMLElement;
	}) {
		const allow = game.user.isGM || SETTINGS.get(CaptureGameScreen.PREF_ALLOW_PC);
		// Only enable the `preserveDrawingBuffer` if we are the GM
		if (allow) {
			super(mergeObject(options, { preserveDrawingBuffer: true, transparent: true }));
			(<any>this.renderer).backgroundAlpha = 1.0;
		}
		else
			super(options);
	}
}


export default class PIXIAppOverride {
	static setup() {
		PIXI.Application = _PIXIAppOverride;
	}
}