import ARCHITECT from "../core/architect.js";
import CounterUI from "../core/CounterUI.js";

export default class TileCounter {
	private static _counter = new CounterUI(0, 'Tiles');
	static ready() {
		libWrapper.register(ARCHITECT.MOD_NAME, 'BackgroundLayer.prototype.activate', (wrapped: Function) => {
			wrapped();
			this.updateCount();
			this._counter.render(true);
		}, 'WRAPPER');
		libWrapper.register(ARCHITECT.MOD_NAME, 'BackgroundLayer.prototype.deactivate', (wrapped: Function) => {
			wrapped();
			if (this._counter.rendered && canvas.activeLayer.name !== 'ForegroundLayer')
				this._counter.close();
		}, 'WRAPPER');
		Hooks.on('createTile', this.updateCount.bind(this));
		Hooks.on('deleteTile', this.updateCount.bind(this));
		Hooks.on('updateTile', this.updateCount.bind(this));
	}

	static updateCount() {
		this._counter.count = canvas.background.objects.children.length + canvas.foreground.objects.children.length;
		this._counter.hint = `Floors: ${canvas.background.objects.children.length}
Roofs: ${canvas.foreground.objects.children.length}`;
	}
}