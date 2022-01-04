import ARCHITECT from "../core/architect";
import CounterUI from "../core/CounterUI";
import SETTINGS from "../core/settings";

export default class WallsCounter {
	private static _counter = new CounterUI(0, 'Walls');
	static ready() {
		libWrapper.register(ARCHITECT.MOD_NAME, 'WallsLayer.prototype.activate', (wrapped: Function) => {
			wrapped();
			this.updateCount();
			if (SETTINGS.get('General.ShowCounters'))
				this._counter.render(true);
		}, 'WRAPPER');
		libWrapper.register(ARCHITECT.MOD_NAME, 'WallsLayer.prototype.deactivate', (wrapped: Function) => {
			wrapped();
			if (this._counter.rendered)
				this._counter.close();
		}, 'WRAPPER');
		Hooks.on('createWall', () => this.updateCount());
		Hooks.on('deleteWall', () => this.updateCount());
		Hooks.on('updateWall', () => this.updateCount());
	}

	static updateCount() {
		if (!SETTINGS.get('General.ShowCounters')) return;
		const objects = canvas.walls.objects.children as Wall[];
		this._counter.count = objects.length;
		var doors = 0;
		var moves = 0;
		var light = 0;
		var sight = 0;
		var sound = 0;
		objects.forEach(x => {
			if (x.data.door) doors++;
			if (x.data.move) moves++;
			if (x.data.light > 0) light++;
			if (x.data.sight > 0) sight++;
			if (x.data.sound > 0) sound++;
		});
		this._counter.hint = `Doors: ${doors}
Move Blocking: ${moves}
Light Blocking: ${light}
Sight Blocking: ${sight}
Sound Blocking: ${sound}`;
	}
}