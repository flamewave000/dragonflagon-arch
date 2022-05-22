
export default class PIXIAppOverride {
	static setup() {
		Hooks.once('canvasConfig', (canvasConfig: {
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
		}) => {
			canvasConfig.preserveDrawingBuffer = true;
			canvasConfig.transparent = true;
		})
	}
	static ready() {
		if (!canvas.app) return;
		(<any>canvas.app.renderer).backgroundAlpha = 1.0;
	}
}