/// <reference path="../../fvtt-scripts/foundry.js" />
import ARCHITECT from "../core/architect.mjs";
import SETTINGS from "../core/settings.mjs";


export default class WallChangeType {
	/**@readonly*/ static #META_KEY = 'WallChangeType.MetaKey';

	static ready() {
		SETTINGS.register(WallChangeType.#META_KEY, {
			name: 'DF_ARCHITECT.WallChangeType.Setting.MetaKeyName',
			hint: 'DF_ARCHITECT.WallChangeType.Setting.MetaKeyHint',
			config: true,
			scope: 'world',
			choices: {
				ctrl: 'DF_ARCHITECT.WallChangeType.Setting.MetaKey_OptionCtrl',
				alt: 'DF_ARCHITECT.WallChangeType.Setting.MetaKey_OptionAlt'
			},
			default: 'ctrl',
			type: String
		});
		libWrapper.register(ARCHITECT.MOD_NAME, 'SceneControls.prototype._onClickTool', async (wrapper, /**@type {MouseEvent}*/ event) => {
			wrapper(event);
			if (SETTINGS.get(WallChangeType.#META_KEY) === 'ctrl' && !event.ctrlKey) return;
			else if (SETTINGS.get(WallChangeType.#META_KEY) === 'alt' && !event.altKey) return;
			/**@type {WallDocument}*/
			const wallData = canvas.walls['_getWallDataFromActiveTool'](game.activeTool);
			if (wallData.door === undefined)
				wallData.door = 0;
			else if (wallData.ds === undefined)
				wallData.ds = 0;
			if (canvas.walls.controlled.length === 1) {
				await canvas.walls.controlled[0].document.update(wallData);
				return;
			}
			const updateData = canvas.walls.controlled.map(it => foundry.utils.mergeObject({ _id: it.document._id }, wallData));
			await canvas.scene.updateEmbeddedDocuments("Wall", updateData);
			canvas.walls.controlled.forEach(x => x.refresh());
		}, 'WRAPPER');
	}
}
