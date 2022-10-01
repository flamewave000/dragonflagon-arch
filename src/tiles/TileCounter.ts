import ARCHITECT from "../core/architect";
import CounterUI from "../core/CounterUI";
import SETTINGS from "../core/settings";

export default class TileCounter {
	private static _counter = new CounterUI(0, 'Tiles');
	static ready() {
		libWrapper.register(ARCHITECT.MOD_NAME, 'TilesLayer.prototype.activate', (wrapped: Function) => {
			wrapped();
			this.updateCount();
			if (SETTINGS.get('General.ShowCounters'))
				this._counter.render(true);
		}, 'WRAPPER');
		libWrapper.register(ARCHITECT.MOD_NAME, 'TilesLayer.prototype.deactivate', (wrapped: Function) => {
			wrapped();
			if (this._counter.rendered && canvas.activeLayer?.name !== 'ForegroundLayer')
				this._counter.close();
		}, 'WRAPPER');
		Hooks.on('createTile', this.updateCount.bind(this));
		Hooks.on('deleteTile', this.updateCount.bind(this));
		Hooks.on('updateTile', this.updateCount.bind(this));
	}

	static updateCount() {
		if (!SETTINGS.get('General.ShowCounters')) return;
		const children = canvas.tiles.objects.children.map(x => (x as any).document.overhead);
		this._counter.count = children.length;
		this._counter.hint = `Floors: ${children.filter(x => !x).length}
Roofs: ${children.filter(x => x).length}`;
	}
}