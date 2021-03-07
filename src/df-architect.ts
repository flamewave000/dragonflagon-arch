declare global {
	interface Map<K, V> {
		getOrDefault(key: K, defaultValue: () => V): V;
	}
	interface String {
		/** Localizes the string via the global `game.i18n.localize()` function. */
		localize(): string
	}
}
Map.prototype.getOrDefault = function (key: any, defaultValue: () => any) {
	var result = this.get(key);
	if (result === undefined) {
		result = defaultValue();
		this.set(key, result);
	}
	return result;
}
if (!String.prototype.localize) {
	String.prototype.localize = function () {
		return game.i18n.localize(this.valueOf());
	}
}

import ARCHITECT from "./architect.js";
import Hotkeys from "./Hotkeys.js";
import LayerShortcuts from "./LayerShortcuts.js";

Hooks.once('init', function () {
	ARCHITECT.DrawArchitectGraphicToConsole();
	Hotkeys.init();
	LayerShortcuts.init();
});

Hooks.once('ready', function () {
	LayerShortcuts.ready();
});