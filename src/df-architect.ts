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
import TileFlattener from './tiles/TileFlattener.js';
import LightCounter from './lights/LightCounter.js';
import WallsCounter from './walls/WallCounter.js';
import TileCounter from './tiles/TileCounter.js';
import SoundCounter from './sounds/SoundCounter.js';
import ShowLayerControls from './general/ShowLayerControls.js';
import TileConfigExt from './tiles/TileConfigExt.js';

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
	try { DataMigration.init() } catch (error) { console.error(error) }
	// WARNING! ShowLayerControls needs to come before AltGridSnap
	try { ShowLayerControls.init() } catch (error) { console.error(error) }
	try { AltGridSnap.init() } catch (error) { console.error(error) }
	try { WallCtrlInvert.init() } catch (error) { console.error(error) }
	try { WallJoinSplit.init() } catch (error) { console.error(error) }
	try { WallAltDrop.init() } catch (error) { console.error(error) }
	try { WallDirections.init() } catch (error) { console.error(error) }
	try { AltLightOrigin.init() } catch (error) { console.error(error) }
	try { CaptureGameScreen.init() } catch (error) { console.error(error) }
	try { LightTemplateManager.init() } catch (error) { console.error(error) }
	try { TileFlattener.init() } catch (error) { console.error(error) }
	try { TileConfigExt.init() } catch (error) { console.error(error) }
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
	try { LayerShortcuts.ready() } catch (error) { console.error(error) }
	try { WallShortcuts.ready() } catch (error) { console.error(error) }
	try { WallCtrlInvert.ready() } catch (error) { console.error(error) }
	try { WallChangeType.ready() } catch (error) { console.error(error) }
	try { WallAltDrop.ready() } catch (error) { console.error(error) }
	try { WallDirections.ready() } catch (error) { console.error(error) }
	try { AltLightOrigin.ready() } catch (error) { console.error(error) }
	try { QuickColourPicker.ready() } catch (error) { console.error(error) }
	try { AltLightNegativeRadius.ready() } catch (error) { console.error(error) }
	try { LightTemplateManager.ready() } catch (error) { console.error(error) }
	try { LightingLayerOverride.ready() } catch (error) { console.error(error) }
	try { ShowLayerControls.ready() } catch (error) { console.error(error) }
	// WARNING: The *Counters need to go after ShowLayerControls so they don't
	// accidentally pick up the layer activations during initialization
	try { LightCounter.ready() } catch (error) { console.error(error) }
	try { WallsCounter.ready() } catch (error) { console.error(error) }
	try { TileCounter.ready() } catch (error) { console.error(error) }
	try { SoundCounter.ready() } catch (error) { console.error(error) }
});