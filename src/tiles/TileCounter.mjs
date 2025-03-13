/// <reference path="../../fvtt-scripts/foundry.js" />
import ARCHITECT from "../core/architect.mjs";
import CounterUI from "../core/CounterUI.mjs";
import SETTINGS from "../core/settings.mjs";

export default class TileCounter {
	static #counter = new CounterUI(0, 'Tiles');
	static ready() {
		libWrapper.register(ARCHITECT.MOD_NAME, 'TilesLayer.prototype.activate', wrapped => {
			wrapped();
			this.updateCount();
			if (SETTINGS.get('General.ShowCounters'))
				this.#counter.render(true);
		}, 'WRAPPER');
		libWrapper.register(ARCHITECT.MOD_NAME, 'TilesLayer.prototype.deactivate', wrapped => {
			wrapped();
			if (this.#counter.rendered && canvas.activeLayer?.name !== 'ForegroundLayer')
				this.#counter.close();
		}, 'WRAPPER');
		Hooks.on('createTile', this.updateCount.bind(this));
		Hooks.on('deleteTile', this.updateCount.bind(this));
		Hooks.on('updateTile', this.updateCount.bind(this));
	}

	static updateCount() {
		if (!SETTINGS.get('General.ShowCounters')) return;
		const children = /**@type {Tile[]}*/(canvas.tiles.objects.children).map(x => x.document.elevation >= x.document.parent?.foregroundElevation);
		this.#counter.count = children.length;
		this.#counter.hint = `<pre style="margin:0">
Floors: ${children.filter(x => !x).length}
 Roofs: ${children.filter(x => x).length}
</pre>`;
	}
}