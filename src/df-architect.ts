import DECLARATIONS from './core/_declarations.js'; DECLARATIONS();
import ARCHITECT from "./core/architect.js";
import HotkeyConfig from './forms/HotkeySettings.js';
import { HOTKEYS } from "./core/hotkeys.js";
import { LayerShortcuts } from "./general/LayerShortcuts.js";
import { AltGridSnap } from './general/AltGridSnap.js';
import { WallCtrlInvert } from './walls/WallCtrlInvert.js';
import { WallShortcuts } from './walls/WallShortcuts.js';


Hooks.once('init', function () {
	ARCHITECT.DrawArchitectGraphicToConsole();
	HOTKEYS.init();
	HotkeyConfig.init();
	AltGridSnap.init();
	WallCtrlInvert.init();
	WallShortcuts.init();
});

Hooks.once('setup', function () { });

Hooks.once('ready', function () {
	LayerShortcuts.ready();
	WallCtrlInvert.ready();
});