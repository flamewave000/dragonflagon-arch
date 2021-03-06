import ARCHITECT from "../core/architect.js";
import SETTINGS from "../core/settings.js";


declare type KeyboardCallbacks = Record<MouseInteractionManager.EventNames, (event: PIXI.InteractionEvent | Event) => unknown>;

class _WallCtrlInvert {
	static readonly PREF_ENABLED = 'WallCtrlInvert-Enabled';

	private _originalCallbacks: KeyboardCallbacks = null;
	private _overrideCallbacks: KeyboardCallbacks = {} as KeyboardCallbacks;

	get enabled(): boolean { return SETTINGS.get(_WallCtrlInvert.PREF_ENABLED) }
	set enabled(value: boolean) { SETTINGS.set(_WallCtrlInvert.PREF_ENABLED, value) }

	init() {
		SETTINGS.register(_WallCtrlInvert.PREF_ENABLED, {
			scope: 'world',
			config: false,
			type: Boolean,
			default: false,
			onChange: () => this._patchWallsLayer()
		});

		Hotkeys.registerShortcut({
			name: `${ARCHITECT.MOD_NAME}.ctrlInvert`,
			label: 'DF_ARCHITECT.WallCtrlInvert_Label',
			default: {
				key: Hotkeys.keys.KeyC,
				alt: true,
				ctrl: false,
				shift: false
			},
			onKeyDown: async _ => {
				await SETTINGS.set(_WallCtrlInvert.PREF_ENABLED, !this.enabled)
				this._patchWallsLayer();
				ui.controls.initialize();
			}
		});

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
				if ((<any>this._originalCallbacks)[key] == null)
					(<any>this._overrideCallbacks)[key] = null
				else
				(<any>this._overrideCallbacks)[key] = this.wrap((<any>this._originalCallbacks)[key]);
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
