import SETTINGS from "../core/settings.mjs";

export default class WallJoinSplit {
	/**@readonly*/static PREF_ENABLED = 'WallJoinSplit-Enabled';
	/**@type {boolean}*/
	static get enabled() { return SETTINGS.get(WallJoinSplit.PREF_ENABLED) }
	static set enabled(value) { SETTINGS.set(WallJoinSplit.PREF_ENABLED, value) }
	static init() {
		Hooks.on('getSceneControlButtons', (/**@type {SceneControl[]}*/ controls) => {
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

	static async _splitWalls() {
		const layer = canvas.walls;
		const walls = layer.controlled;
		/**@type {WallDocument[]}*/
		const newWalls = [];
		for (let wall of walls) {
			const [x1, y1, x2, y2] = wall.document.c;
			var midX = (x1 + x2) / 2;
			var midY = (y1 + y2) / 2;
			[midX, midY] = layer._getWallEndpointCoordinates(new PIXI.Point(midX, midY), {snap:false});
			/**@type {WallDocument}*/
			const wall1 = foundry.utils.duplicate(wall.document._source);
			wall1.c = [x1, y1, midX, midY];
			delete wall1._id;
			/**@type {WallDocument}*/
			const wall2 = foundry.utils.duplicate(wall.document._source);
			wall2.c = [midX, midY, x2, y2];
			delete wall2._id;
			newWalls.push(wall1, wall2)
		}
		await game.scenes.viewed.deleteEmbeddedDocuments('Wall', walls.map(x => x.id));
		// await layer.deleteMany(walls.map(x => x.id));
		const wallObjects = (await game.scenes.viewed.createEmbeddedDocuments('Wall', newWalls));
		for (let o of wallObjects) {
			const wall = layer.get(o.id);
			if (!wall.visible || !wall.can(game.user, "control")) continue;
			wall.control({ releaseOthers: false });
		}
	}
	static async _joinWalls() {
		/**@type {Map<string, Wall[]>}*/
		const points = new Map();
		const layer = canvas.walls;
		const walls = layer.controlled;
		for (let wall of walls) {
			const [x1, y1, x2, y2] = wall.document.c;
			points.getOrDefault(JSON.stringify(layer._getWallEndpointCoordinates(new PIXI.Point(x1, y1), {snap:false})), []).push(wall);
			points.getOrDefault(JSON.stringify(layer._getWallEndpointCoordinates(new PIXI.Point(x2, y2), {snap:false})), []).push(wall);
		}
		if ([...points.values()].reduce((r, x) => x.length != 2 ? r + 1 : r, 0) > 2) {
			ui.notifications.error('Selected walls are disjointed. Make sure they are a single line of connected walls.');
			return;
		}
		const endpoints = [...points.entries()].filter(x => x[1].length == 1);
		/**@type {WallDocument}*/
		const wallData = foundry.utils.duplicate(endpoints[0][1][0].document._source);
		delete wallData._id;
		/**@type {[number, number, number, number]}*/
		wallData.c = endpoints.reduce((r, x) => r.concat(JSON.parse(x[0])), []);
		await game.scenes.viewed.deleteEmbeddedDocuments('Wall', walls.map(x => x.id));
		/**@type {WallDocument[]}*/
		const result = await game.scenes.viewed.createEmbeddedDocuments('Wall', [wallData]);
		for (let wall of result) wall.object.control();
	}
}
