import ARCHITECT from "../core/architect.js";
import CounterUI from "../core/CounterUI.js";

export default class SoundCounter {
	private static _counter = new CounterUI(0, 'Sounds');
	static ready() {
		libWrapper.register(ARCHITECT.MOD_NAME, 'SoundsLayer.prototype.activate', (wrapped: Function) => {
			wrapped();
			this.updateCount();
			this._counter.render(true);
		}, 'WRAPPER');
		libWrapper.register(ARCHITECT.MOD_NAME, 'SoundsLayer.prototype.deactivate', (wrapped: Function) => {
			wrapped();
			if (this._counter.rendered)
				this._counter.close();
		}, 'WRAPPER');
		Hooks.on('createAmbientSound', () => this.updateCount());
		Hooks.on('deleteAmbientSound', () => this.updateCount());
		Hooks.on('updateAmbientSound', () => this.updateCount());
	}

	static updateCount() {
		const objects = canvas.sounds.objects.children as AmbientSound[];
		this._counter.count = objects.length;
		this._counter.hint = `Local Sounds: ${objects.filter(x => x.data.type === 'l').length}
Global Sounds: ${objects.filter(x => x.data.type === 'g').length}`;
	}
}