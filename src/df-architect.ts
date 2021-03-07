import DECLARATIONS from './_declarations.js';DECLARATIONS();
import ARCHITECT from "./architect.js";
import Hotkeys from "./general/Hotkeys.js";
import LayerShortcuts from "./general/LayerShortcuts.js";


Hooks.once('init', function () {
	ARCHITECT.DrawArchitectGraphicToConsole();
	Hotkeys.init();
	LayerShortcuts.init();
});

Hooks.once('ready', function () {
	LayerShortcuts.ready();
});