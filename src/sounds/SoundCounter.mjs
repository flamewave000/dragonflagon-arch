import ARCHITECT from "../core/architect.mjs";
import CounterUI from "../core/CounterUI.mjs";
import SETTINGS from "../core/settings.mjs";

export default class SoundCounter {
	private static _counter = new CounterUI(0, 'Sounds');
	static ready() {
		libWrapper.register(ARCHITECT.MOD_NAME, 'SoundsLayer.prototype.activate', (wrapped: Function) => {
			wrapped();
			this.updateCount();
			if (SETTINGS.get('General.ShowCounters'))
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
		if (!SETTINGS.get('General.ShowCounters')) return;
		const objects = canvas.sounds.objects.children as AmbientSound[];
		this._counter.count = objects.length;
		this._counter.hint = `<pre style="margin:0">
      Normal Sounds: ${objects.filter(x => x.document.walls).length}
Unrestrained Sounds: ${objects.filter(x => !x.document.walls).length}
</pre>`;
	}
}