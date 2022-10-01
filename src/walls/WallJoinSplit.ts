import { WallData } from "@league-of-foundry-developers/foundry-vtt-types/src/foundry/common/data/module.mjs";
import SETTINGS from "../core/settings";

export default class WallJoinSplit {
	static readonly PREF_ENABLED = 'WallJoinSplit-Enabled';
	static get enabled(): boolean { return SETTINGS.get(WallJoinSplit.PREF_ENABLED) }
	static set enabled(value: boolean) { SETTINGS.set(WallJoinSplit.PREF_ENABLED, value) }
	static init() {
		Hooks.on('getSceneControlButtons', (controls: SceneControl[]) => {
			const isGM = game.user.isGM;
			const wallsControls = controls.find(x => x.name === 'walls');
			wallsControls.tools.splice(wallsControls.tools.findIndex(x => x.name === 'clone') + 1, 0, {
				icon: 'df df-alt-split',
				name: 'split',
				title: 'DF_ARCHITECT.WallJoinSplit.Split_Label',
				button: true,
				visible: isGM,
				onClick: this._splitWalls.bind(this)
			}, {
				icon: 'df df-alt-join',
				name: 'join',
				title: 'DF_ARCHITECT.WallJoinSplit.Join_Label',
				button: true,
				visible: isGM,
				onClick: this._joinWalls.bind(this)
			});
		});
	}

	private static async _splitWalls() {
		const layer = canvas.walls;
		const walls = layer.controlled;
		const newWalls: WallData[] = [];
		for (let wall of walls) {
			const [x1, y1, x2, y2] = wall.data.c;
			var midX = (x1 + x2) / 2;
			var midY = (y1 + y2) / 2;
			//@ts-expect-error
			[midX, midY] = layer._getWallEndpointCoordinates(new PIXI.Point(midX, midY), {snap:false});
			const wall1 = duplicate(wall.data) as WallData;
			wall1.c = [x1, y1, midX, midY];
			delete wall1._id;
			const wall2 = duplicate(wall.data) as WallData;
			wall2.c = [midX, midY, x2, y2];
			delete wall2._id;
			newWalls.push(wall1, wall2)
		}
		await game.scenes.viewed.deleteEmbeddedDocuments('Wall', walls.map(x => x.id));
		// await layer.deleteMany(walls.map(x => x.id));
		const wallObjects = (await game.scenes.viewed.createEmbeddedDocuments('Wall', <any>newWalls));
		for (let o of wallObjects) {
			const wall = layer.get(o.id);
			if (!wall.visible || !wall.can(game.user, "control")) continue;
			wall.control({ releaseOthers: false });
		}
	}
	private static async _joinWalls() {
		const points = new Map<string, Wall[]>();
		const layer = canvas.walls;
		const walls = layer.controlled;
		for (let wall of walls) {
			const [x1, y1, x2, y2] = wall.data.c;
			//@ts-expect-error
			points.getOrDefault(JSON.stringify(layer._getWallEndpointCoordinates(new PIXI.Point(x1, y1), {snap:false})), []).push(wall);
			//@ts-expect-error
			points.getOrDefault(JSON.stringify(layer._getWallEndpointCoordinates(new PIXI.Point(x2, y2), {snap:false})), []).push(wall);
		}
		if ([...points.values()].reduce((r, x) => x.length != 2 ? r + 1 : r, 0) > 2) {
			ui.notifications.error('Selected walls are disjointed. Make sure they are a single line of connected walls.');
			return;
		}
		const endpoints = [...points.entries()].filter(x => x[1].length == 1);
		const wallData = duplicate(endpoints[0][1][0].data) as WallData;
		delete wallData._id;
		wallData.c = endpoints.reduce((r, x) => r.concat(JSON.parse(x[0])), [] as number[]) as [number, number, number, number];
		await game.scenes.viewed.deleteEmbeddedDocuments('Wall', walls.map(x => x.id));
		const result = <WallDocument[]><any[]>await game.scenes.viewed.createEmbeddedDocuments('Wall', <any[]>[wallData]);
		for (let wall of result) wall.object.control();
	}
}
