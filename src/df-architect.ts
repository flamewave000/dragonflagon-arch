import DECLARATIONS from './core/declarations.js'; DECLARATIONS();
import SETTINGS from './core/settings.js';
import ARCHITECT from "./core/architect.js";
SETTINGS.init(ARCHITECT.MOD_NAME);

import PIXIAppOverride from './general/PIXIAppOverride.js';
import { LayerShortcuts } from "./general/LayerShortcuts.js";
import { AltGridSnap } from './general/AltGridSnap.js';
import WallCtrlInvert from './walls/WallCtrlInvert.js';
import { WallShortcuts } from './walls/WallShortcuts.js';
import { WallJoinSplit } from './walls/WallJoinSplit.js';
import { AltLightOrigin } from './lights/AltLightOrigin.js';
import { QuickColourPicker } from './general/QuickColourPicker.js';
import CaptureGameScreen from './general/CaptureGameScreen.js';
import { LightTemplateManager, LightingLayerOverride } from './lights/LightTemplate.js';
import { WallChangeType } from './walls/WallChangeType.js';
import { WallAltDrop } from './walls/WallAltDrop.js';
import { AltLightNegativeRadius } from './lights/AltLightNegativeRadius.js';
import { WallDirections } from './walls/WallDirections.js';
import { DataMigration } from './core/migration.js';

Hooks.once('init', function () {
	if (!game.modules.get('lib-wrapper')?.active) return;
	if (!game.modules.get('colorsettings')?.active) return;
	if (!game.modules.get('lib-df-hotkeys')?.active) return;

	SETTINGS.registerMenu('hotkeys', {
		icon: 'fas fa-keyboard',
		label: 'Architect Hotkey Bindings',
		restricted: true,
		type: Hotkeys.createConfig('DF Architect Hotkeys', [
			`${ARCHITECT.MOD_NAME}\..+`,
			{ group: 'general', hotkeys: [`${ARCHITECT.MOD_NAME}\..+`] }
		]),
	});

	ARCHITECT.DrawArchitectGraphicToConsole();
	DataMigration.init();
	AltGridSnap.init();
	WallCtrlInvert.init();
	WallJoinSplit.init();
	WallAltDrop.init();
	WallDirections.init();
	AltLightOrigin.init();
	CaptureGameScreen.init();
	LightTemplateManager.init();
});

Hooks.once('setup', function () {
	if (!game.modules.get('lib-wrapper')?.active) return;
	if (!game.modules.get('colorsettings')?.active) return;
	if (!game.modules.get('lib-df-hotkeys')?.active) return;
	PIXIAppOverride.setup();
});

Hooks.once('ready', async function () {
	if (!game.modules.get('lib-wrapper')?.active) {
		console.error('Missing libWrapper module dependency');
		if (game.user.isGM)
			ui.notifications.error('DF_ARCHITECT.ErrorLibWrapperMissing'.localize());
		return;
	}
	if (!game.modules.get('colorsettings')?.active) {
		console.error('Missing colorsettings module dependency');
		if (game.user.isGM)
			ui.notifications.error('DF_ARCHITECT.ErrorColourSettingsMissing'.localize());
		return;
	}
	if (!game.modules.get('lib-df-hotkeys')?.active) {
		console.error('Missing Library: DF Hotkeys module dependency');
		if (game.user.isGM)
			ui.notifications.error('DF_ARCHITECT.ErrorLibDFHotkeysMissing'.localize());
		return;
	}

	await DataMigration.ready();
	LayerShortcuts.ready();
	WallShortcuts.ready();
	WallCtrlInvert.ready();
	WallChangeType.ready();
	WallAltDrop.ready();
	WallDirections.ready();
	AltLightOrigin.ready();
	QuickColourPicker.ready();
	AltLightNegativeRadius.ready();
	LightTemplateManager.ready();
	LightingLayerOverride.ready();
});