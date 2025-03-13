import ARCHITECT from "../core/architect.mjs";
import CounterUI from "../core/CounterUI.mjs";
import SETTINGS from "../core/settings.mjs";

export default class SoundCounter {
	static #counter = new CounterUI(0, 'Sounds');
	static ready() {
		libWrapper.register(ARCHITECT.MOD_NAME, 'SoundsLayer.prototype.activate', wrapped => {
			wrapped();
			this.updateCount();
			if (SETTINGS.get('General.ShowCounters'))
				this.#counter.render(true);
		}, 'WRAPPER');
		libWrapper.register(ARCHITECT.MOD_NAME, 'SoundsLayer.prototype.deactivate', wrapped => {
			wrapped();
			if (this.#counter.rendered)
				this.#counter.close();
		}, 'WRAPPER');
		Hooks.on('createAmbientSound', () => this.updateCount());
		Hooks.on('deleteAmbientSound', () => this.updateCount());
		Hooks.on('updateAmbientSound', () => this.updateCount());
	}

	static updateCount() {
		if (!SETTINGS.get('General.ShowCounters')) return;
		/**@type {AmbientSound[]}*/
		const objects = canvas.sounds.objects.children;
		this.#counter.count = objects.length;
		this.#counter.hint = `<pre style="margin:0">
      Normal Sounds: ${objects.filter(x => x.document.walls).length}
Unrestrained Sounds: ${objects.filter(x => !x.document.walls).length}
</pre>`;
	}
}