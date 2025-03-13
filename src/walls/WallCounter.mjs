/// <reference path="../../fvtt-scripts/foundry.js" />
import ARCHITECT from "../core/architect.mjs";
import CounterUI from "../core/CounterUI.mjs";
import SETTINGS from "../core/settings.mjs";

export default class WallsCounter {
	static #counter = new CounterUI(0, 'Walls');
	static ready() {
		libWrapper.register(ARCHITECT.MOD_NAME, 'WallsLayer.prototype.activate', wrapped => {
			wrapped();
			this.updateCount();
			if (SETTINGS.get('General.ShowCounters'))
				this.#counter.render(true);
		}, 'WRAPPER');
		libWrapper.register(ARCHITECT.MOD_NAME, 'WallsLayer.prototype.deactivate', wrapped => {
			wrapped();
			if (this.#counter.rendered)
				this.#counter.close();
		}, 'WRAPPER');
		Hooks.on('createWall', () => this.updateCount());
		Hooks.on('deleteWall', () => this.updateCount());
		Hooks.on('updateWall', () => this.updateCount());
	}

	static updateCount() {
		if (!SETTINGS.get('General.ShowCounters')) return;
		/**@type {Wall[]}*/
		const objects = canvas.walls.objects.children;
		this.#counter.count = objects.length;
		var doors = 0;
		var secretDoors = 0;
		var moves = 0;

		/**
		 * @typedef {object} WALL_SENSE_TYPES
		 * @property {0} NONE
		 * @property {10} LIMITED
		 * @property {20} NORMAL
		 * @property {30} PROXIMITY
		 * @property {40} DISTANCE
		 */
		/**
		 * @typedef {object} Type
		 * @property {number} norm
		 * @property {number} lmtd
		 * @property {number} prox
		 * @property {number} dist
		 */
		/**@type {WALL_SENSE_TYPES}*/
		const STYPES = foundry.CONST.WALL_SENSE_TYPES;

		const types = {
			/**@type {Type}*/light: {},
			/**@type {Type}*/sight: {},
			/**@type {Type}*/sound: {},
		}
		for (let type of ['norm','lmtd','prox','dist']) {
			types.light[type] = 0;
			types.sight[type] = 0;
			types.sound[type] = 0;
		}

		const count = (value, type) => {
			switch (value) {
				case STYPES.NORMAL: type['norm'] += 1; break;
				case STYPES.LIMITED: type['lmtd'] += 1; break;
				case STYPES.PROXIMITY: type['prox'] += 1; break;
				case STYPES.DISTANCE: type['dist'] += 1; break;
			}
		}

		objects.forEach(x => {
			if (x.document.door == foundry.CONST.WALL_DOOR_TYPES.DOOR) doors++;
			if (x.document.door == foundry.CONST.WALL_DOOR_TYPES.SECRET) secretDoors++;
			if (x.document.move == foundry.CONST.WALL_MOVEMENT_TYPES.NORMAL) moves++;
			count(x.document.light, types.light);
			count(x.document.sight, types.sight);
			count(x.document.sound, types.sound);
		});
		this.#counter.hint = `<pre style="margin:0">
         Doors: ${doors}
  Secret Doors: ${secretDoors}
 Move Blocking: ${moves}

 Light Blocking: ${types.light.norm}
 Light Limiting: ${types.light.lmtd}
 Light Distance: ${types.light.dist}
Light Proximity: ${types.light.prox}

 Sight Blocking: ${types.sight.norm}
 Sight Limiting: ${types.sight.lmtd}
 Sight Distance: ${types.sight.dist}
Sight Proximity: ${types.sight.prox}

 Sound Blocking: ${types.sound.norm}
 Sound Limiting: ${types.sound.lmtd}
 Sound Distance: ${types.sound.dist}
Sound Proximity: ${types.sound.prox}
</pre>`;
	}
}