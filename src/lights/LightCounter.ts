import ARCHITECT from "../core/architect.js";
import CounterUI from "../core/CounterUI.js";

export default class LightCounter {
	private static _counter = new CounterUI(0, 'Lights');
	static init() {
		libWrapper.register(ARCHITECT.MOD_NAME, 'LightingLayer.prototype.activate', (wrapped: Function) => {
			wrapped();
			this.updateCount();
			this._counter.render(true);
		}, 'WRAPPER');
		libWrapper.register(ARCHITECT.MOD_NAME, 'LightingLayer.prototype.deactivate', (wrapped: Function) => {
			wrapped();
			if (this._counter.rendered)
				this._counter.close();
		}, 'WRAPPER');
		Hooks.on('createAmbientLight', () => this.updateCount());
		Hooks.on('deleteAmbientLight', () => this.updateCount());
	}

	static updateCount() {
		const objects = canvas.lighting.objects.children as AmbientLight[];
		this._counter.count = objects.length;
		var local = 0;
		var global = 0;
		var universal = 0;
		objects.forEach(x => {
			if (x.data.t === 'l') local++;
			if (x.data.t === 'g') global++;
			if (x.data.t === 'u') universal++;
		});
		this._counter.hint = `Local: ${local}
Global: ${global}
Universal: ${universal}`;
	}
}