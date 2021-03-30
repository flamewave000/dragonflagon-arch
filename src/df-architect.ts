import DECLARATIONS from './core/declarations.js'; DECLARATIONS();
import SETTINGS from './core/settings.js';
import ARCHITECT from "./core/architect.js";
SETTINGS.init(ARCHITECT.MOD_NAME);

import { LayerShortcuts } from "./general/LayerShortcuts.js";
import { AltGridSnap } from './general/AltGridSnap.js';
import { WallCtrlInvert } from './walls/WallCtrlInvert.js';
import { WallShortcuts } from './walls/WallShortcuts.js';
import { WallJoinSplit } from './walls/WallJoinSplit.js';
import { AltLightOrigin } from './lights/AltLightOrigin.js';
import { QuickColourPicker } from './lights/QuickColourPicker.js';

Hooks.once('init', function () {
	if (!game.modules.get('lib-wrapper')?.active) return;

	ARCHITECT.DrawArchitectGraphicToConsole();
	AltGridSnap.init();
	WallCtrlInvert.init();
	WallJoinSplit.init();
	AltLightOrigin.init();
});

Hooks.once('setup', function () {
	if (!game.modules.get('lib-wrapper')?.active) return;
	QuickColourPicker.setup();
});

Hooks.once('ready', function () {
	if (!game.modules.get('lib-wrapper')?.active) {
		console.error('Missing libWrapper module dependency');
		if (game.user.isGM)
			ui.notifications.error(game.i18n.localize('DF_ARCHITECT.ErrorLibWrapperMissing'));
		return;
	}

	LayerShortcuts.ready();
	WallShortcuts.ready();
	WallCtrlInvert.ready();
	AltLightOrigin.ready();
	QuickColourPicker.ready();
});