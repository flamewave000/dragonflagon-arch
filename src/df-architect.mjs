import DECLARATIONS from './core/declarations.mjs'; DECLARATIONS();
import SETTINGS from './core/settings.mjs';
import ARCHITECT from "./core/architect.mjs";
SETTINGS.init(ARCHITECT.MOD_NAME);

// import PIXIAppOverride from './general/PIXIAppOverride.mjs';
import LayerShortcuts from "./general/LayerShortcuts.mjs";
import AltGridSnap from './general/AltGridSnap.mjs';
import WallCtrlInvert from './walls/WallCtrlInvert.mjs';
import WallShortcuts from './walls/WallShortcuts.mjs';
// import WallJoinSplit from './walls/WallJoinSplit.mjs';
import AltLightOrigin from './lights/AltLightOrigin.mjs';
// import { QuickColourPicker } from './general/QuickColourPicker.mjs';
// import CaptureGameScreen from './general/CaptureGameScreen.mjs';
// import { LightTemplateManager, LightingLayerOverride } from './lights/LightTemplate.mjs';
import WallChangeType from './walls/WallChangeType.mjs';
// import WallAltDrop from './walls/WallAltDrop.mjs';
import AltLightInverted from './lights/AltLightInverted.mjs';
import WallDirections from './walls/WallDirections.mjs';
import DataMigration from './core/migration.mjs';
// import TileFlattener from './tiles/TileFlattener.mjs';
import LightCounter from './lights/LightCounter.mjs';
import WallsCounter from './walls/WallCounter.mjs';
import TileCounter from './tiles/TileCounter.mjs';
import SoundCounter from './sounds/SoundCounter.mjs';
import ShowLayerControls from './general/ShowLayerControls.mjs';
// import TileConfigExt from './tiles/TileConfigExt.mjs';
import CounterUI from './core/CounterUI.mjs';
// import WallGapFiller from './walls/WallGapFiller.mjs';

Hooks.once('init', function () {
	if (!game.modules.get('lib-wrapper')?.active) return;
	if (!game.modules.get('colorsettings')?.active) return;

	ARCHITECT.DrawArchitectGraphicToConsole();
	try { DataMigration.init() } catch (error) { console.error(error) }
	//! WARNING! ShowLayerControls needs to come before AltGridSnap
	try { ShowLayerControls.init() } catch (error) { console.error(error) }
	try { AltGridSnap.init() } catch (error) { console.error(error) }
	try { LayerShortcuts.init() } catch (error) { console.error(error) }
	try { WallShortcuts.init() } catch (error) { console.error(error) }
	try { WallCtrlInvert.init() } catch (error) { console.error(error) }
	// try { WallJoinSplit.init() } catch (error) { console.error(error) }
	// try { WallGapFiller.init() } catch (error) { console.error(error) }
	// try { WallAltDrop.init() } catch (error) { console.error(error) }
	try { WallDirections.init() } catch (error) { console.error(error) }
	try { AltLightOrigin.init() } catch (error) { console.error(error) }
	// try { CaptureGameScreen.init() } catch (error) { console.error(error) }
	// try { LightTemplateManager.init() } catch (error) { console.error(error) }
	// try { TileFlattener.init() } catch (error) { console.error(error) }
	// try { TileConfigExt.init() } catch (error) { console.error(error) }
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
	// PIXIAppOverride.setup();
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

	await DataMigration.ready();
	// try { PIXIAppOverride.ready() } catch (error) { console.error(error) }
	try { LayerShortcuts.ready() } catch (error) { console.error(error) }
	try { WallCtrlInvert.ready() } catch (error) { console.error(error) }
	try { WallChangeType.ready() } catch (error) { console.error(error) }
	// try { WallGapFiller.ready() } catch (error) { console.error(error) }
	// try { WallAltDrop.ready() } catch (error) { console.error(error) }
	try { WallDirections.ready() } catch (error) { console.error(error) }
	try { AltLightOrigin.ready() } catch (error) { console.error(error) }
	// try { QuickColourPicker.ready() } catch (error) { console.error(error) }
	try { AltLightInverted.ready() } catch (error) { console.error(error) }
	// try { LightTemplateManager.ready() } catch (error) { console.error(error) }
	// try { LightingLayerOverride.ready() } catch (error) { console.error(error) }
	try { ShowLayerControls.ready() } catch (error) { console.error(error) }
	//! WARNING: The *Counters need to go after ShowLayerControls so they don't
	//! accidentally pick up the layer activations during initialization
	try { LightCounter.ready() } catch (error) { console.error(error) }
	try { WallsCounter.ready() } catch (error) { console.error(error) }
	try { TileCounter.ready() } catch (error) { console.error(error) }
	try { SoundCounter.ready() } catch (error) { console.error(error) }
});