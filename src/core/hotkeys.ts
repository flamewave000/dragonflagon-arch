
interface HandlerEntry {
	id: string;
	handler: (id: string) => void;
}

export interface KeyMap {
	key: string;
	alt: boolean;
	ctrl: boolean;
	shift: boolean;
}

export class HOTKEYS {
	private static _id_iterator = 0;
	private static _handlers = new Map<number, Map<string, Array<HandlerEntry>>>();
	private static _handled = new Set<string>();

	private static _metaKey(event: KeyboardEvent): number {
		return (event.altKey ? 0x1 : 0) | (event.ctrlKey ? 0x2 : 0) | (event.shiftKey ? 0x4 : 0);
	}

	private static _isMeta(event: KeyboardEvent): boolean {
		return event.key === 'Shift'
			|| event.key === 'Ctrl'
			|| event.key === 'Alt';
	}

	private static _genId(meta: number, key: string): string {
		return `${++this._id_iterator}:${meta.toString(16)}:${key}`;
	}
	private static _parseId(id: string): { meta: number, key: string, id: number } {
		const first = id.indexOf(':');
		const second = id.indexOf(':', first + 1);
		const idNum = id.substr(0, first);
		const meta = id.substr(first + 1, second - (first + 1));
		const key = id.substr(second + 1, id.length - (second + 1));
		return {
			id: parseInt(idNum),
			meta: parseInt(meta, 16),
			key: key
		};
	}

	private static handleKeyDown(event: KeyboardEvent) {
		if (this._handled.has(event.code) || this._isMeta(event)) return;
		const metaKey = this._metaKey(event);
		const metaHandlers = this._handlers.get(metaKey);
		if (!metaHandlers) {
			this._handled.add(event.code);
			return;
		}
		const eventHandlers = metaHandlers.get(event.code);
		if (!eventHandlers) {
			this._handled.add(event.code);
			return;
		}
		event.preventDefault();
		eventHandlers.forEach(x => x.handler(x.id));
		this._handled.add(event.code);
	}

	private static handleKeyUp(event: KeyboardEvent) {
		if (!this._handled.has(event.code)) return;
		this._handled.delete(event.code);
	}

	static init() {
		window.addEventListener("keydown", this.handleKeyDown.bind(this));
		window.addEventListener("keyup", this.handleKeyUp.bind(this));
	}

	/**
	 * Register a Hotkey handler.
	 * @param key Keyboard key to be listened for.
	 * @param handler Callback to be executed when ever the hotkey is pressed.
	 * @param shift Require Shift Key modifier.
	 * @param alt Require Alt Key modifier.
	 * @param ctrl Require Ctrl Key modifier.
	 * @returns The ID for the registration. Used for De-Registration.
	 */
	static registerShortcut(key: string, handler: (id: string) => void, { shift, alt, ctrl }:
		{ shift?: boolean, alt?: boolean, ctrl?: boolean } = {}): string {
		const metaKey = (alt ? 0x1 : 0) | (ctrl ? 0x2 : 0) | (shift ? 0x4 : 0);
		const metaHandlers = this._handlers.getOrDefault(metaKey, () => new Map());
		const eventHandlers = metaHandlers.getOrDefault(key, () => new Array());
		const id = this._genId(metaKey, key);
		eventHandlers.push({ id: id, handler: handler })
		return id;
	}

	/**
	 * De-registers the keyboard shortcut previously registered via the ID number returned by the `Hotkeys.registerShortcut` function.
	 * @param id ID of the Hotkey to be de-registered.
	 * @returns true if a handler was found and removed; false if no handler was found for the given key.
	 */
	static deregisterShortcut(id: string): boolean {
		const data = this._parseId(id);
		const handlers = this._handlers.get(data.meta)?.get(data.key);
		if (handlers === undefined) return false;
		const idx = handlers.findIndex(x => x.id === id);
		if (idx < 0) return false;
		handlers.splice(idx, 1);
		return true;
	}
}