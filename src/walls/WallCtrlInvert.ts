import { KeyMap, HOTKEYS } from "../core/hotkeys.js";
import SETTINGS from "../core/settings.js";
import KEYMAP from "../_data/keymap.js";


interface KeyboardCallbacks {
	[key: string]: any
	clickLeft(event: PIXI.InteractionEvent): void
	clickLeft2(event: PIXI.InteractionEvent): void
	clickRight(event: PIXI.InteractionEvent): void
	dragLeftStart(event: PIXI.InteractionEvent): void
	dragLeftMove(event: PIXI.InteractionEvent): void
	dragLeftDrop(event: PIXI.InteractionEvent): void
	dragLeftCancel(event: PIXI.InteractionEvent): void
	dragRightMove(event: PIXI.InteractionEvent): void
	dragRightDrop(event: PIXI.InteractionEvent): void
}

class _WallCtrlInvert {
	static readonly PREF_ENABLED = 'WallCtrlInvert-Enabled';
	static readonly PREF_HOTKEY = 'WallCtrlInvert-Hotkey';

	private _originalCallbacks: KeyboardCallbacks = null;
	private _overrideCallbacks: KeyboardCallbacks = {} as KeyboardCallbacks;

	get enabled(): boolean { return SETTINGS.get(_WallCtrlInvert.PREF_ENABLED) }
	set enabled(value: boolean) { SETTINGS.set(_WallCtrlInvert.PREF_ENABLED, value) }
	get hotkey(): KeyMap { return SETTINGS.get(_WallCtrlInvert.PREF_HOTKEY); }
	set hotkey(value: KeyMap) { SETTINGS.set(_WallCtrlInvert.PREF_HOTKEY, value); }
	get hotkeyDefault(): KeyMap { return SETTINGS.default(_WallCtrlInvert.PREF_HOTKEY); }

	init() {
		SETTINGS.register(_WallCtrlInvert.PREF_ENABLED, {
			scope: 'world',
			config: false,
			type: Boolean,
			default: false,
			onChange: () => this._patchWallsLayer()
		});
		SETTINGS.register<KeyMap>(_WallCtrlInvert.PREF_HOTKEY, {
			scope: 'world',
			type: SETTINGS.typeOf<KeyMap>(),
			config: false,
			default: {
				key: KEYMAP.KeyC.key,
				alt: true,
				ctrl: false,
				shift: false
			}
		});

		const setting: KeyMap = this.hotkey;
		HOTKEYS.registerShortcut(setting.key, async x => {
			await SETTINGS.set(_WallCtrlInvert.PREF_ENABLED, !this.enabled)
			this._patchWallsLayer();
			ui.controls.initialize();
		}, setting);

		Hooks.on('getSceneControlButtons', (controls: SceneControl[]) => {
			const isGM = game.user.isGM;
			const wallsControls = controls.find(x => x.name === 'walls');
			wallsControls.tools.splice(wallsControls.tools.findIndex(x => x.name === 'snap'), 0, {
				icon: 'fas fa-link',
				name: 'ctrlInvert',
				title: 'DF_ARCHITECT.WallCtrlInvert_Label',
				visible: isGM,
				toggle: true,
				active: this.enabled,
				onClick: (toggled: boolean) => { this.enabled = toggled }
			});
		});
	}

	ready() {
		this._patchWallsLayer();
	}

	private wrap(original: any) {
		const wrapper = function (this: any, event: KeyboardEvent | PIXI.InteractionEvent) {
			if (event)
				event = _WallCtrlInvert._invertCtrl(event);
			return this._original(event);
		}
		wrapper._original = original;
		return wrapper.bind(wrapper);
	}

	private _patchWallsLayer() {
		const mim = (canvas as Canvas).mouseInteractionManager;
		if (!this._originalCallbacks) {
			this._originalCallbacks = mim.callbacks as KeyboardCallbacks;
			for (let key of Object.keys(this._originalCallbacks)) {
				if (this._originalCallbacks[key] == null)
					this._overrideCallbacks[key] = null
				else
					this._overrideCallbacks[key] = this.wrap(this._originalCallbacks[key]);
			}
		}
		mim.callbacks = this.enabled ? this._overrideCallbacks : this._originalCallbacks;
	}

	private static _invertCtrl(event: KeyboardEvent | PIXI.InteractionEvent): KeyboardEvent | PIXI.InteractionEvent {
		if (ui.controls.activeControl !== 'walls' || ui.controls.activeTool === 'select')
			return event;
		if ("ctrlKey" in event)
			return event instanceof _KeyboardEvent ? event : new _KeyboardEvent(event) as any as KeyboardEvent;
		else {
			const data: { originalEvent: KeyboardEvent } = (event as any).data;
			if (!(data.originalEvent instanceof _KeyboardEvent))
				data.originalEvent = new _KeyboardEvent(data.originalEvent) as any as KeyboardEvent;
			return event;
		}
	}
}
export const WallCtrlInvert = new _WallCtrlInvert();

class _KeyboardEvent {
	private _event: KeyboardEvent;
	constructor(event: KeyboardEvent) {
		this._event = event;
	}
	get altKey(): boolean { return this._event.altKey; }
	get code(): string { return this._event.code; }
	get ctrlKey(): boolean { return !this._event.ctrlKey; }
	get isComposing(): boolean { return this._event.isComposing; }
	get key(): string { return this._event.key; }
	get location(): number { return this._event.location; }
	get metaKey(): boolean { return this._event.metaKey; }
	get repeat(): boolean { return this._event.repeat; }
	get shiftKey(): boolean { return this._event.shiftKey; }
	getModifierState(keyArg: string): boolean { return this._event.getModifierState(keyArg); }
	preventDefault() { this._event.preventDefault(); }
	get DOM_KEY_LOCATION_LEFT(): number { return this._event.DOM_KEY_LOCATION_LEFT; }
	get DOM_KEY_LOCATION_NUMPAD(): number { return this._event.DOM_KEY_LOCATION_NUMPAD; }
	get DOM_KEY_LOCATION_RIGHT(): number { return this._event.DOM_KEY_LOCATION_RIGHT; }
	get DOM_KEY_LOCATION_STANDARD(): number { return this._event.DOM_KEY_LOCATION_STANDARD; }
}
