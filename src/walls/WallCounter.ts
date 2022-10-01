import { WallData } from "@league-of-foundry-developers/foundry-vtt-types/src/foundry/common/data/data.mjs";
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
		var secretDoors = 0;
		var moves = 0;
		var lightBlock = 0;
		var lightLimit = 0;
		var sightBlock = 0;
		var sightLimit = 0;
		var soundBlock = 0;
		var soundLimit = 0;
		objects.forEach(x => {
			const data = x.document as WallData;
			if (data.door == foundry.CONST.WALL_DOOR_TYPES.DOOR) doors++;
			if (data.door == foundry.CONST.WALL_DOOR_TYPES.SECRET) secretDoors++;
			if (data.move == foundry.CONST.WALL_MOVEMENT_TYPES.NORMAL) moves++;
			if (data.light == foundry.CONST.WALL_SENSE_TYPES.NORMAL) lightBlock++;
			if (data.light == foundry.CONST.WALL_SENSE_TYPES.LIMITED) lightLimit++;
			if (data.sight == foundry.CONST.WALL_SENSE_TYPES.NORMAL) sightBlock++;
			if (data.sight == foundry.CONST.WALL_SENSE_TYPES.LIMITED) sightLimit++;
			if (data.sound == foundry.CONST.WALL_SENSE_TYPES.NORMAL) soundBlock++;
			if (data.sound == foundry.CONST.WALL_SENSE_TYPES.LIMITED) soundLimit++;
		});
		this._counter.hint = `Doors: ${doors}
Secret Doors: ${secretDoors}
Move Blocking: ${moves}
Light Blocking: ${lightBlock}
Light Limiting: ${lightLimit}
Sight Blocking: ${sightBlock}
Sight Limiting: ${sightLimit}
Sound Blocking: ${soundBlock}
Sound Limiting: ${soundLimit}`;
	}
}