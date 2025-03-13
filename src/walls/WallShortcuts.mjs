import ARCHITECT from "../core/architect.mjs";
import libWrapperShared from "../core/libWrapperShared.mjs";


export default class WallShortcuts {
	/**@readonly*/static WALL_TYPES = new Set(['walls', 'terrain', 'invisible', 'ethereal', 'doors', 'secret', 'window']);

	static init() {
		const wallTypes = [
			{ name: 'walls', title: 'Basic Walls' },
			{ name: 'terrain', title: 'Terrain Walls' },
			{ name: 'invisible', title: 'Invisible Walls' },
			{ name: 'ethereal', title: 'Ethereal Walls' },
			{ name: 'doors', title: 'Draw Doors' },
			{ name: 'secret', title: 'Secret Doors' },
			{ name: 'window', title: 'Window Walls' }
		];
		var counter = 0;
		for (let tool of wallTypes) {
			const currentTool = tool;
			game.keybindings.register(ARCHITECT.MOD_NAME, `WallShortcuts-${tool.name}`, {
				restricted: true,
				name: tool.title,
				hint: 'DF_ARCHITECT.WallShortcuts.Settings.Description',
				editable: [{ key: `Digit${++counter}`, modifiers: [KeyboardManager.MODIFIER_KEYS.SHIFT] }],
				onDown: () => {
					if (ui.controls.activeControl !== 'walls') return false;
					ui.controls._onClickTool({ preventDefault: function () { }, currentTarget: { dataset: { tool: currentTool.name } } });
					if (canvas.walls.preview.children.length > 0 && canvas.walls.preview.children[0] instanceof Wall) {
						/**@type { { [key: string]: number } }*/
						const data = canvas.walls._getWallDataFromActiveTool(game.activeTool);
						for (const key of Object.keys(data)) {
							canvas.walls.preview.children[0].document.data[key] = data[key];
						}
					}
					return true;
				}
			});
		}

		game.keybindings.register(ARCHITECT.MOD_NAME, 'WallShortcuts-ForceGridSnap', {
			restricted: true,
			name: 'DF_ARCHITECT.WallShortcuts.Settings.ToggleForceSnapName',
			hint: 'DF_ARCHITECT.WallShortcuts.Settings.ToggleForceSnapHint',
			editable: [{ key: 'F', modifiers: [] }],
			onDown: () => {
				if (!(canvas.activeLayer instanceof WallsLayer)) return;
				$('#controls li[data-tool="snap"]').trigger('click');
			}
		});

		libWrapper.register(ARCHITECT.MOD_NAME, 'WallsLayer.prototype._onDragLeftStart', this.#patchForceSnap, 'WRAPPER');
		libWrapperShared.register('WallsLayer.prototype._onDragLeftDrop', this.#patchForceSnap);
	}

	/**
	 * @param {Function} wrapper
	 * @param {*} event
	 * @returns {unknown}
	 */
	static #patchForceSnap(wrapper, event) {
		let forceSnap = canvas.walls._forceSnap;
		if (!forceSnap) return wrapper(event);
		if (event.data.originalEvent.shiftKey)
			canvas.walls._forceSnap = false;
		const result = wrapper(event);
		canvas.walls._forceSnap = forceSnap;
		return result;
	}
}
