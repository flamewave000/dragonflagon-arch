import DECLARATIONS from './core/_declarations.js'; DECLARATIONS();
import SETTINGS from './core/settings.js';
import ARCHITECT from "./core/architect.js";
SETTINGS.init(ARCHITECT.MOD_NAME);

import { LayerShortcuts } from "./general/LayerShortcuts.js";
import { AltGridSnap } from './general/AltGridSnap.js';
import { WallCtrlInvert } from './walls/WallCtrlInvert.js';
import { WallShortcuts } from './walls/WallShortcuts.js';

Hooks.once('init', function () {
	ARCHITECT.DrawArchitectGraphicToConsole();
	AltGridSnap.init();
	WallCtrlInvert.init();
});

Hooks.once('setup', function () { });

Hooks.once('ready', function () {
	LayerShortcuts.ready();
	WallShortcuts.ready();
	WallCtrlInvert.ready();
});