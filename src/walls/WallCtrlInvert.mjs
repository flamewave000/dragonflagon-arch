import ARCHITECT from "../core/architect.mjs";
import SETTINGS from "../core/settings.mjs";
import libWrapperShared from "../core/libWrapperShared.mjs";

export default class WallCtrlInvert {
	/**@readonly*/static PREF_ENABLED = 'WallCtrlInvert-Enabled';
	static #invertKeyboardMap = false;
	static #onDragLeftDropRegistrationId = -1;
	/**@type {boolean}*/
	static get enabled() { return SETTINGS.get(WallCtrlInvert.PREF_ENABLED) }
	static set enabled(value) { SETTINGS.set(WallCtrlInvert.PREF_ENABLED, value) }

	static init() {
		SETTINGS.register(WallCtrlInvert.PREF_ENABLED, {
			scope: 'world',
			config: false,
			type: Boolean,
			default: false,
			onChange: toggled => {
				if (toggled) {
					libWrapper.register(ARCHITECT.MOD_NAME, 'KeyboardManager.prototype.isModifierActive', this.#isModifierActive, 'WRAPPER');
					this.#onDragLeftDropRegistrationId = libWrapperShared.register('WallsLayer.prototype._onDragLeftDrop', this.#onDragLeftDrop);
				} else {
					libWrapper.unregister(ARCHITECT.MOD_NAME, 'KeyboardManager.prototype.isModifierActive', false);
					libWrapperShared.unregister('WallsLayer.prototype._onDragLeftDrop', this.#onDragLeftDropRegistrationId);
				}
			}
		});

		game.keybindings.register(ARCHITECT.MOD_NAME, 'ctrlInvert', {
			restricted: true,
			name: 'DF_ARCHITECT.WallCtrlInvert.Name',
			editable: [{ key: 'KeyC', modifiers: [KeyboardManager.MODIFIER_KEYS.ALT] }],
			onDown: (async () => {
				await SETTINGS.set(WallCtrlInvert.PREF_ENABLED, !this.enabled)
				ui.controls.initialize();
				return true;
			})
		});

		Hooks.on('getSceneControlButtons', (/**@type {SceneControl[]}*/controls) => {
			const isGM = game.user.isGM;
			const wallsControls = controls.find(x => x.name === 'walls');
			wallsControls.tools.splice(wallsControls.tools.findIndex(x => x.name === 'snap'), 0, {
				icon: 'fas fa-link',
				name: 'ctrlInvert',
				title: 'DF_ARCHITECT.WallCtrlInvert.Title',
				visible: isGM,
				toggle: true,
				active: this.enabled,
				onClick: (toggled) => { this.enabled = toggled }
			});
		});
	}

	static ready() {
		if (!SETTINGS.get(WallCtrlInvert.PREF_ENABLED)) return;
		libWrapper.register(ARCHITECT.MOD_NAME, 'KeyboardManager.prototype.isModifierActive', this.#isModifierActive, 'WRAPPER');
		this.#onDragLeftDropRegistrationId = libWrapperShared.register('WallsLayer.prototype._onDragLeftDrop', this.#onDragLeftDrop);
	}

	/**
	 * @this {WallsLayer}
	 * @param {Function} wrapper
	 * @param {PIXI.InteractionEvent} event
	 * @returns {unknown}
	 */
	static #onDragLeftDrop(wrapper, event) {
		WallCtrlInvert.#invertKeyboardMap = true;
		const result = wrapper(event);
		WallCtrlInvert.#invertKeyboardMap = false;
		return result;
	}
	/**
	 * @this {WallsLayer}
	 * @param {Function} wrapper
	 * @param {...any} args
	 * @returns {unknown}
	 */
	static #isModifierActive(wrapper, ...args) {
		if (!WallCtrlInvert.#invertKeyboardMap)
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
