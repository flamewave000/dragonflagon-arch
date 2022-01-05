import ARCHITECT from "../core/architect";
import SETTINGS from "../core/settings";
import WallAltDrop from "./WallAltDrop";

export default class WallCtrlInvert {
	static readonly PREF_ENABLED = 'WallCtrlInvert-Enabled';
	private static _invertKeyboardMap = false;
	static get enabled(): boolean { return SETTINGS.get(WallCtrlInvert.PREF_ENABLED) }
	static set enabled(value: boolean) { SETTINGS.set(WallCtrlInvert.PREF_ENABLED, value) }

	static init() {
		SETTINGS.register(WallCtrlInvert.PREF_ENABLED, {
			scope: 'world',
			config: false,
			type: Boolean,
			default: false,
			onChange: toggled => {
				if (toggled) {
					libWrapper.register(ARCHITECT.MOD_NAME, 'KeyboardManager.prototype.isModifierActive', this._isModifierActive, 'WRAPPER');
					libWrapper.register(ARCHITECT.MOD_NAME, 'WallsLayer.prototype._onDragLeftDrop', this._onDragLeftDrop, 'WRAPPER');
				} else {
					libWrapper.unregister(ARCHITECT.MOD_NAME, 'KeyboardManager.prototype.isModifierActive', false);
					libWrapper.unregister(ARCHITECT.MOD_NAME, 'WallsLayer.prototype._onDragLeftDrop', false);
				}
			}
		});

		game.keybindings.register(ARCHITECT.MOD_NAME, 'ctrlInvert', {
			restricted: true,
			name: 'DF_ARCHITECT.WallCtrlInvert.Name',
			editable: [{ key: 'KeyC', modifiers: [KeyboardManager.MODIFIER_KEYS.ALT] }],
			onDown: <any>(async () => {
				await SETTINGS.set(WallCtrlInvert.PREF_ENABLED, !this.enabled)
				ui.controls.initialize();
			})
		});

		Hooks.on('getSceneControlButtons', (controls: SceneControl[]) => {
			const isGM = game.user.isGM;
			const wallsControls = controls.find(x => x.name === 'walls');
			wallsControls.tools.splice(wallsControls.tools.findIndex(x => x.name === 'snap'), 0, {
				icon: 'fas fa-link',
				name: 'ctrlInvert',
				title: 'DF_ARCHITECT.WallCtrlInvert.Title',
				visible: isGM,
				toggle: true,
				active: this.enabled,
				onClick: (toggled: boolean) => { this.enabled = toggled }
			});
		});
	}

	static ready() {
		if (!SETTINGS.get(WallCtrlInvert.PREF_ENABLED)) return;
		libWrapper.register(ARCHITECT.MOD_NAME, 'KeyboardManager.prototype.isModifierActive', this._isModifierActive, 'WRAPPER');
		libWrapper.register(ARCHITECT.MOD_NAME, 'WallsLayer.prototype._onDragLeftDrop', this._onDragLeftDrop, 'WRAPPER');
	}

	private static _onDragLeftDrop(this: WallsLayer, wrapper: (arg: any) => void, event: PIXI.InteractionEvent) {
		WallCtrlInvert._invertKeyboardMap = true;
		const result = WallAltDrop.WallsLayer_handleDragDrop.bind(this)(wrapper, event);
		WallCtrlInvert._invertKeyboardMap = false;
		return result;
	}
	private static _isModifierActive(this: WallsLayer, wrapper: any, ...args: any) {
		if (!WallCtrlInvert._invertKeyboardMap)
			return wrapper(...args);
		const clone = new Set(game.keyboard.downKeys);
		if (KeyboardManager.MODIFIER_CODES[KeyboardManager.MODIFIER_KEYS.CONTROL].some(k => game.keyboard.downKeys.has(k)))
			KeyboardManager.MODIFIER_CODES[KeyboardManager.MODIFIER_KEYS.CONTROL].forEach(x => game.keyboard.downKeys.delete(x));
		else
			game.keyboard.downKeys.add(KeyboardManager.MODIFIER_CODES[KeyboardManager.MODIFIER_KEYS.CONTROL][0]);
		const result = wrapper(...args);
		game.keyboard.downKeys = clone;
		return result;
	}
}
