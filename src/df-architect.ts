import DECLARATIONS from './core/_declarations.js'; DECLARATIONS();
import ARCHITECT from "./core/architect.js";
import HOTKEYS from "./core/hotkeys.js";
import { LayerShortcuts } from "./general/LayerShortcuts.js";
import { AltGridSnap } from './general/AltGridSnap.js';


Hooks.once('init', function () {
	ARCHITECT.DrawArchitectGraphicToConsole();
	HOTKEYS.init();
	AltGridSnap.init();
});

Hooks.once('setup', function () {
});

Hooks.once('ready', function () {
	LayerShortcuts.ready();
});