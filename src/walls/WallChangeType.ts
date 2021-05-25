import ARCHITECT from "../core/architect.js";
import SETTINGS from "../core/settings.js";


class _WallChangeType {
	private static readonly META_KEY = 'WallChangeType.MetaKey';

	ready() {
		SETTINGS.register(_WallChangeType.META_KEY, {
			name: 'DF_ARCHITECT.WallChangeType_Setting_MetaKeyName',
			hint: 'DF_ARCHITECT.WallChangeType_Setting_MetaKeyHint',
			config: true,
			scope: 'world',
			choices: {
				ctrl: 'DF_ARCHITECT.WallChangeType_Setting_MetaKey_OptionCtrl',
				alt: 'DF_ARCHITECT.WallChangeType_Setting_MetaKey_OptionAlt'
			},
			default: 'ctrl',
			type: String
		});
		libWrapper.register(ARCHITECT.MOD_NAME, 'SceneControls.prototype._onClickTool', async (wrapper: Function, event: MouseEvent) => {
			wrapper(event);
			if (SETTINGS.get(_WallChangeType.META_KEY) === 'ctrl' && !event.ctrlKey) return;
			else if (SETTINGS.get(_WallChangeType.META_KEY) === 'alt' && !event.altKey) return;
			const wallData = (<any>canvas.walls)._getWallDataFromActiveTool(game.activeTool) as Partial<Wall.Data>;
			if (wallData.door === undefined)
				wallData.door = 0;
			else if (wallData.ds === undefined)
				wallData.ds = 0;
			if (canvas.walls.controlled.length === 1) {
				await canvas.walls.controlled[0].update(wallData);
				return;
			}
			const updateData = (<Wall[]>canvas.walls.controlled).map(it => mergeObject(it.data, wallData, { inplace: false }));
			await canvas.scene.updateEmbeddedEntity("Wall", updateData);
		}, 'WRAPPER');
	}
}

export const WallChangeType = new _WallChangeType();