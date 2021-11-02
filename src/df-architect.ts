
declare global {
	interface LenientGlobalVariableTypes {
		game: never; // the type doesn't matter
		canvas: never;
	}
}

import DECLARATIONS from './core/declarations'; DECLARATIONS();
import SETTINGS from './core/settings';
import ARCHITECT from "./core/architect";
SETTINGS.init(ARCHITECT.MOD_NAME);

import PIXIAppOverride from './general/PIXIAppOverride';
import { LayerShortcuts } from "./general/LayerShortcuts";
import { AltGridSnap } from './general/AltGridSnap';
import WallCtrlInvert from './walls/WallCtrlInvert';
import { WallShortcuts } from './walls/WallShortcuts';
import { WallJoinSplit } from './walls/WallJoinSplit';
import { AltLightOrigin } from './lights/AltLightOrigin';
import { QuickColourPicker } from './general/QuickColourPicker';
import CaptureGameScreen from './general/CaptureGameScreen';
import { LightTemplateManager, LightingLayerOverride } from './lights/LightTemplate';
import { WallChangeType } from './walls/WallChangeType';
import { WallAltDrop } from './walls/WallAltDrop';
import { AltLightNegativeRadius } from './lights/AltLightNegativeRadius';
import { WallDirections } from './walls/WallDirections';
import { DataMigration } from './core/migration';
import TileFlattener from './tiles/TileFlattener';
import LightCounter from './lights/LightCounter';
import WallsCounter from './walls/WallCounter';
import TileCounter from './tiles/TileCounter';
import SoundCounter from './sounds/SoundCounter';
import ShowLayerControls from './general/ShowLayerControls';
import TileConfigExt from './tiles/TileConfigExt';
import CounterUI from './core/CounterUI';

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
	try { CounterUI.init() } catch (error) { console.error(error) }

	SETTINGS.register('General.ShowCounters', {
		name: 'DF_ARCHITECT.General.ShowCounterName'.localize(),
		hint: 'DF_ARCHITECT.General.ShowCounterHint'.localize(),
		config: true,
		scope: 'world',
		type: Boolean,
		default: true
	})
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
	try { PIXIAppOverride.ready() } catch (error) { console.error(error) }
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