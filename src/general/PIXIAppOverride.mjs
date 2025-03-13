
export default class PIXIAppOverride {
	static setup() {
		Hooks.once('canvasConfig', (canvasConfig) => {
			canvasConfig.preserveDrawingBuffer = true;
			canvasConfig.transparent = true;
		})
	}
	static ready() {
		if (!canvas.app) return;
		canvas.app.renderer.backgroundAlpha = 1.0;
	}
}