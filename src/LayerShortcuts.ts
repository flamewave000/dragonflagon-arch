import Hotkeys from "./Hotkeys.js";

export default class LayerShortcuts {
	static ready() {
		Hotkeys.registerShortcut('g', x => {
			console.log("I've been called!");
		}, {ctrl: true});
	}
}