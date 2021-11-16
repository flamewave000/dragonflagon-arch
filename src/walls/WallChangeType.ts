import { WallData } from "@league-of-foundry-developers/foundry-vtt-types/src/foundry/common/data/module.mjs";
import ARCHITECT from "../core/architect";
import SETTINGS from "../core/settings";


class _WallChangeType {
	private static readonly META_KEY = 'WallChangeType.MetaKey';

	ready() {
		SETTINGS.register(_WallChangeType.META_KEY, {
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
		libWrapper.register(ARCHITECT.MOD_NAME, 'SceneControls.prototype._onClickTool', async (wrapper: Function, event: MouseEvent) => {
			wrapper(event);
			if (SETTINGS.get(_WallChangeType.META_KEY) === 'ctrl' && !event.ctrlKey) return;
			else if (SETTINGS.get(_WallChangeType.META_KEY) === 'alt' && !event.altKey) return;
			const wallData = canvas.walls['_getWallDataFromActiveTool'](game.activeTool) as Partial<WallData>;
			if (wallData.door === undefined)
				wallData.door = 0;
			else if (wallData.ds === undefined)
				wallData.ds = 0;
			if ((<Canvas>canvas).walls.controlled.length === 1) {
				await (<Canvas>canvas).walls.controlled[0].document.update(wallData);
				return;
			}
			const updateData = <WallData[]>(<Wall[]>canvas.walls.controlled).map(it => mergeObject(it.data as any, wallData, { inplace: false } as any));
			await canvas.scene.updateEmbeddedDocuments("Wall", <Record<string, unknown>[]><any>updateData);
		}, 'WRAPPER');
	}
}

export const WallChangeType = new _WallChangeType();