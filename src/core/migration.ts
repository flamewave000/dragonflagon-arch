import CaptureGameScreen from "../general/CaptureGameScreen";
import { LightTemplateManager } from "../lights/LightTemplate";
import ARCHITECT from "./architect";
import SETTINGS from "./settings";

interface Version {
	arch: string,
	core: string
}

export default class DataMigration {
	private static readonly PREF_DATA_VERSION = 'data-version';
	private static previous: Version;
	private static current: Version;

	static init() {
		SETTINGS.register(this.PREF_DATA_VERSION, {
			scope: 'world',
			config: false,
			type: Object,
			default: { core: '0.0.0', arch: '0.0.0' }
		});
	}
	static async ready() {
		this.current = {
			core: game.version,
			arch: (game.modules.get('df-architect').data as any).version
		};
		this.previous = SETTINGS.get(this.PREF_DATA_VERSION);
		if (this.current.core === this.previous.core && this.current.arch === this.previous.arch) return;
		await this.performMigration();
		await SETTINGS.set(this.PREF_DATA_VERSION, this.current);
	}

	private static async performMigration() {
		ui.notifications.info(game.i18n.localize('DF Architect is migrating your saved data to the latest version, please wait and <b>do not</b> refresh the page...'), { permanent: true });
		await new Promise(async (resolve) => {
			// This is the start of the migration chain
			await this.migrateToCore_0_8_8();
			await this.migrateToCore_0_9_241();
			resolve(undefined);
		});
		ui.notifications.info(game.i18n.localize('DF Architect has finished migrating your data!'), { permanent: true });
	}

	// Example migration function
	// private async migrateToCore_0_X_X() {
	// 	if (this.previous.core < '0.X.X') {
	// 		// perform data migration for Core 0.x.x
	// 	}
	// 	while (this.previous.arch < 'X.X.X') {
	// 		switch (this.previous.arch) {
	// 			case 'x.x.x':
	// 				// Perform migration to x.x.x
	// 				// Update migration data state
	// 				this.previous.arch = 'x.x.x'
	// 				break;
	// 			default:
	// 			// Perform migration from an unknown
	// 		}
	// 	}
	// 	// Invoke next migration in chain
	// }

	private static async migrateToCore_0_8_8() {
		if (this.previous.core >= '0.8.8') return;
		for (let macroID of game.macros.keys()) {
			const macro = game.macros.get(macroID);
			if (!macro.getFlag(ARCHITECT.MOD_NAME, LightTemplateManager.FLAG_IS_TEMPLATE)) continue;
			var data = <any>LightTemplateManager.extractLightDataFromMacroCommand(macro.data.command);
			// Migrate to the new darkness threshold system
			data['darkness'] = {
				min: data.darknessThreshold,
				max: 1
			};
			const command = LightTemplateManager.generateCommandData(data);
			await (<any>macro.data).document.update({ command });
			console.log(macro.data.command);
		}
	}

	private static async migrateToCore_0_9_241() {
		if (this.previous.core >= '9.241') return;
		const layers: { [key: string]: any } = SETTINGS.get(CaptureGameScreen.PREF_LYRS);
		const newLayers = [
			'background',
			'controls',
			'drawings',
			'effects',
			'foreground',
			'grid',
			'lighting',
			'notes',
			'sight',
			'sounds',
			'templates',
			'tokens',
			'walls'];

		const layerMap = new Map([
			['BackgroundLayer', 'background'],
			['ControlsLayer', 'controls'],
			['DrawingsLayer', 'drawings'],
			['EffectsLayer', 'effects'],
			['ForegroundLayer', 'foreground'],
			['GridLayer', 'grid'],
			['LightingLayerPF2e', 'lighting'],
			['NotesLayer', 'notes'],
			['SightLayerPF2e', 'sight'],
			['SoundsLayer', 'sounds'],
			['TemplateLayerPF2e', 'templates'],
			['TokenLayer', 'tokens'],
			['WallsLayer', 'walls']]
		);
		if (layers['DarkvisionLayerPF2e'] !== undefined) delete layers['DarkvisionLayerPF2e'];
		for (const layer of Object.keys(layers)) {
			// Map the layer data to the new layer name
			if (layerMap.has(layer))
				layers[layerMap.get(layer)] = layers[layer];
			// Delete the old layer name if it is not in the new layer list
			if (!newLayers.includes(layer))
				delete layers[layer];
		}
		await SETTINGS.set(CaptureGameScreen.PREF_LYRS, layers);
	}
}