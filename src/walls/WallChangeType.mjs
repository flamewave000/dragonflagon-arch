import { WallData } from "@league-of-foundry-developers/foundry-vtt-types/src/foundry/common/data/module.mjs";
import ARCHITECT from "../core/architect.mjs";
import SETTINGS from "../core/settings.mjs";


export default class WallChangeType {
	private static readonly META_KEY = 'WallChangeType.MetaKey';

	static ready() {
		SETTINGS.register<string>(WallChangeType.META_KEY, {
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
			if (SETTINGS.get(WallChangeType.META_KEY) === 'ctrl' && !event.ctrlKey) return;
			else if (SETTINGS.get(WallChangeType.META_KEY) === 'alt' && !event.altKey) return;
			const wallData = canvas.walls['_getWallDataFromActiveTool'](game.activeTool) as Partial<WallData>;
			if (wallData.door === undefined)
				wallData.door = 0;
			else if (wallData.ds === undefined)
				wallData.ds = 0;
			if ((<Canvas>canvas).walls.controlled.length === 1) {
				await (<Canvas>canvas).walls.controlled[0].document.update(wallData);
				return;
			}
			const updateData = canvas.walls.controlled.map(it => mergeObject({ _id: it.document._id }, wallData));
			await canvas.scene.updateEmbeddedDocuments("Wall", <any[]>updateData);
			canvas.walls.controlled.forEach(x => x.refresh());
		}, 'WRAPPER');
	}
}
