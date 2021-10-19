import ARCHITECT from "../core/architect.js";
import SETTINGS from "../core/settings.js";


declare type MouseCallbacks = Record<MouseInteractionManager.EventNames, (event: PIXI.InteractionEvent | Event) => unknown>;

export default class WallCtrlInvert {
	static readonly PREF_ENABLED = 'WallCtrlInvert-Enabled';

	private static _originalCallbacks: MouseCallbacks = null;
	private static _overrideCallbacks: MouseCallbacks = {} as MouseCallbacks;

	static get enabled(): boolean { return SETTINGS.get(WallCtrlInvert.PREF_ENABLED) }
	static set enabled(value: boolean) { SETTINGS.set(WallCtrlInvert.PREF_ENABLED, value) }

	static init() {
		SETTINGS.register(WallCtrlInvert.PREF_ENABLED, {
			scope: 'world',
			config: false,
			type: Boolean,
			default: false,
			onChange: () => this._patchWallsLayer()
		});

		Hotkeys.registerShortcut({
			name: `${ARCHITECT.MOD_NAME}.ctrlInvert`,
			label: 'DF_ARCHITECT.WallCtrlInvert.Label',
			default: {
				key: Hotkeys.keys.KeyC,
				alt: true,
				ctrl: false,
				shift: false
			},
			onKeyDown: async _ => {
				await SETTINGS.set(WallCtrlInvert.PREF_ENABLED, !this.enabled)
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
				title: 'DF_ARCHITECT.WallCtrlInvert.Label',
				visible: isGM,
				toggle: true,
				active: this.enabled,
				onClick: (toggled: boolean) => { this.enabled = toggled }
			});
		});

		// When ever the scene changes, we need to repatch the walls layer
		Hooks.on("canvasReady", () => WallCtrlInvert._patchWallsLayer());
	}

	static ready() {
		this._patchWallsLayer();
	}

	private static _wrap(original: any) {
		const wrapper = function (this: any, event: PointerEvent | PIXI.InteractionEvent) {
			if (event)
				event = WallCtrlInvert._invertCtrl(event);
			return this._original(event);
		}
		wrapper._original = original;
		return wrapper.bind(wrapper);
	}

	/** Swaps between the Original Callback list and the Wrapped Callback list */
	private static _patchWallsLayer(enabledOverride?: boolean) {
		const mim = (canvas as Canvas).mouseInteractionManager;
		if (!this._originalCallbacks) {
			this._originalCallbacks = mim.callbacks as MouseCallbacks;
			for (let key of Object.keys(this._originalCallbacks)) {
				if ((<any>this._originalCallbacks)[key] == null)
					(<any>this._overrideCallbacks)[key] = null
				else
					(<any>this._overrideCallbacks)[key] = this._wrap((<any>this._originalCallbacks)[key]);
			}
		}
		if (enabledOverride ?? this.enabled)
			mim.callbacks = this._overrideCallbacks;
		else {
			mim.callbacks = this._originalCallbacks;
			this._originalCallbacks = null;
		}
	}

	/** Wraps the event with the {@link _PointerEvent} class for inverting the Ctrl Key, if it is an event that should be wrapped */
	private static _invertCtrl(event: PointerEvent | PIXI.InteractionEvent): PointerEvent | PIXI.InteractionEvent {
		if (ui.controls.activeControl !== 'walls' || ui.controls.activeTool === 'select')
			return event;
		if ("ctrlKey" in event && 'x' in event)
			return new _PointerEvent(event) as any as PointerEvent;
		else if ('data' in event && 'originalEvent' in event.data && (event.data.originalEvent as PointerEvent).button === 0)
			event.data.originalEvent = new _PointerEvent(event.data.originalEvent as PointerEvent) as any as PointerEvent;
		return event;
	}
}

/**
 * Special Wrapper class for the {@link PointerEvent}. It's sole purpose is to invert the `ctrlKey` property.
 */
class _PointerEvent {
	private _event: PointerEvent;
	constructor(event: PointerEvent) {
		this._event = event;
	}
	preventDefault() { this._event.preventDefault(); }
	getModifierState(keyArg: string): boolean { return this._event.getModifierState(keyArg); }
	get altitudeAngle(): any { return (this._event as any).altitudeAngle; }
	get altKey(): any { return (this._event as any).altKey; }
	get azimuthAngle(): any { return (this._event as any).azimuthAngle; }
	get bubbles(): any { return (this._event as any).bubbles; }
	get button(): any { return (this._event as any).button; }
	get buttons(): any { return (this._event as any).buttons; }
	get cancelable(): any { return (this._event as any).cancelable; }
	get cancelBubble(): any { return (this._event as any).cancelBubble; }
	get clientX(): any { return (this._event as any).clientX; }
	get clientY(): any { return (this._event as any).clientY; }
	get composed(): any { return (this._event as any).composed; }
	get ctrlKey(): any { return !(this._event as any).ctrlKey; }
	get currentTarget(): any { return (this._event as any).currentTarget; }
	get defaultPrevented(): any { return (this._event as any).defaultPrevented; }
	get detail(): any { return (this._event as any).detail; }
	get eventPhase(): any { return (this._event as any).eventPhase; }
	get fromElement(): any { return (this._event as any).fromElement; }
	get height(): any { return (this._event as any).height; }
	get isPrimary(): any { return (this._event as any).isPrimary; }
	get isTrusted(): any { return (this._event as any).isTrusted; }
	get layerX(): any { return (this._event as any).layerX; }
	get layerY(): any { return (this._event as any).layerY; }
	get metaKey(): any { return (this._event as any).metaKey; }
	get movementX(): any { return (this._event as any).movementX; }
	get movementY(): any { return (this._event as any).movementY; }
	get offsetX(): any { return (this._event as any).offsetX; }
	get offsetY(): any { return (this._event as any).offsetY; }
	get pageX(): any { return (this._event as any).pageX; }
	get pageY(): any { return (this._event as any).pageY; }
	get path(): any { return (this._event as any).path; }
	get pointerId(): any { return (this._event as any).pointerId; }
	get pointerType(): any { return (this._event as any).pointerType; }
	get pressure(): any { return (this._event as any).pressure; }
	get relatedTarget(): any { return (this._event as any).relatedTarget; }
	get returnValue(): any { return (this._event as any).returnValue; }
	get screenX(): any { return (this._event as any).screenX; }
	get screenY(): any { return (this._event as any).screenY; }
	get shiftKey(): any { return (this._event as any).shiftKey; }
	get sourceCapabilities(): any { return (this._event as any).sourceCapabilities; }
	get srcElement(): any { return (this._event as any).srcElement; }
	get tangentialPressure(): any { return (this._event as any).tangentialPressure; }
	get target(): any { return (this._event as any).target; }
	get tiltX(): any { return (this._event as any).tiltX; }
	get tiltY(): any { return (this._event as any).tiltY; }
	get timeStamp(): any { return (this._event as any).timeStamp; }
	get toElement(): any { return (this._event as any).toElement; }
	get twist(): any { return (this._event as any).twist; }
	get type(): any { return (this._event as any).type; }
	get view(): any { return (this._event as any).view; }
	get which(): any { return (this._event as any).which; }
	get width(): any { return (this._event as any).width; }
	get x(): any { return (this._event as any).x; }
	get y(): any { return (this._event as any).y; }
}
