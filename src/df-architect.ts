declare global {
	interface Map<K, V> {
		getOrDefault(key: K, defaultValue: () => V): V;
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

import Hotkeys from "./Hotkeys.js";
import LayerShortcuts from "./LayerShortcuts.js";

Hooks.once('init', function() {
	Hotkeys.init();
});

Hooks.once('ready', function() {
	LayerShortcuts.ready();
});