// import { AmbientLightData } from "@league-of-foundry-developers/foundry-vtt-types/src/foundry/common/data/data.mjs";
// import CaptureGameScreen from "../general/CaptureGameScreen";
// import { LightTemplateManager } from "../lights/LightTemplate";
// import ARCHITECT from "./architect";
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
			arch: (game.modules.get('df-architect') as any).version
		};
		this.previous = SETTINGS.get(this.PREF_DATA_VERSION);
		if (this.current.core === this.previous.core && this.current.arch === this.previous.arch) return;
		await this.performMigration();
		await SETTINGS.set(this.PREF_DATA_VERSION, this.current);
	}

	private static async performMigration() {
		var migrating = false;
		const migrationOccurring = () => {
			if (migrating) return;
			migrating = true;
			ui.notifications.info(game.i18n.localize('DF Architect is migrating your saved data to the latest version, please wait and <b>do not</b> refresh the page...'), { permanent: true });
		};

		// This is the start of the migration chain
		// await this.migrateToCore_0_9_241(migrationOccurring);
		// await this.migrateLightTemplates_3_2_x(migrationOccurring);

		if (migrating)
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

	// private static async migrateToCore_0_9_241(notifyMigration: () => void) {
	// 	if (this.previous.core >= '9.241') return;
	// 	notifyMigration();
	// 	const layers: { [key: string]: any } = SETTINGS.get(CaptureGameScreen.PREF_LYRS);
	// 	const newLayers = [
	// 		'background',
	// 		'controls',
	// 		'drawings',
	// 		'effects',
	// 		'foreground',
	// 		'grid',
	// 		'lighting',
	// 		'notes',
	// 		'sight',
	// 		'sounds',
	// 		'templates',
	// 		'tokens',
	// 		'walls'];

	// 	const layerMap = new Map([
	// 		['BackgroundLayer', 'background'],
	// 		['ControlsLayer', 'controls'],
	// 		['DrawingsLayer', 'drawings'],
	// 		['EffectsLayer', 'effects'],
	// 		['ForegroundLayer', 'foreground'],
	// 		['GridLayer', 'grid'],
	// 		['LightingLayerPF2e', 'lighting'],
	// 		['NotesLayer', 'notes'],
	// 		['SightLayerPF2e', 'sight'],
	// 		['SoundsLayer', 'sounds'],
	// 		['TemplateLayerPF2e', 'templates'],
	// 		['TokenLayer', 'tokens'],
	// 		['WallsLayer', 'walls']]
	// 	);
	// 	if (layers['DarkvisionLayerPF2e'] !== undefined) delete layers['DarkvisionLayerPF2e'];
	// 	for (const layer of Object.keys(layers)) {
	// 		// Map the layer data to the new layer name
	// 		if (layerMap.has(layer))
	// 			layers[layerMap.get(layer)] = layers[layer];
	// 		// Delete the old layer name if it is not in the new layer list
	// 		if (!newLayers.includes(layer))
	// 			delete layers[layer];
	// 	}
	// 	await SETTINGS.set(CaptureGameScreen.PREF_LYRS, layers);
	// }

	// private static async migrateLightTemplates_3_2_x(notifyMigration: () => void) {
	// 	if (this.previous.arch >= '3.2.0') return;
	// 	notifyMigration();

	// 	const oldImage = "modules/df-architect/templates/lightbulb.svg";
	// 	const newImage = "icons/svg/light.svg";
	// 	for (const macro of game.macros) {
	// 		// Ignore regular macros
	// 		if (!macro.getFlag(ARCHITECT.MOD_NAME, LightTemplateManager.FLAG_IS_TEMPLATE)) continue;
	// 		const oldLightData = LightTemplateManager.extractLightDataFromMacroCommand(macro.data.command) as {
	// 			t: string,
	// 			dim: number,
	// 			angle: number,
	// 			bright: number,
	// 			rotation: number,
	// 			tintColor: string,
	// 			tintAlpha: number,
	// 			darkness: {
	// 				min: number,
	// 				max: number
	// 			},
	// 			lightAnimation: {
	// 				type: string,
	// 				intensity: number,
	// 				speed: number
	// 			},
	// 			config?: any
	// 		};
	// 		// Ignore macros that may have already been converted
	// 		if (!!oldLightData.config) continue;
	// 		// Change the default image in light template macros (if still referencing the old one) to the Foundry light image
	// 		const img = macro.data.img === oldImage ? newImage : macro.data.img;
	// 		const newLightData: AmbientLightData = <any>{
	// 			rotation: oldLightData.rotation,
	// 			walls: oldLightData.t !== 'u',
	// 			vision: oldLightData.t !== 'l',
	// 			config: <any>{
	// 				alpha: oldLightData.tintAlpha,
	// 				angle: oldLightData.angle,
	// 				bright: Math.abs(oldLightData.bright),
	// 				dim: Math.abs(oldLightData.dim),
	// 				coloration: 1,
	// 				gradual: true,
	// 				// Convert the negative radius to negative luminosity for creating patches of "darkness"
	// 				luminosity: oldLightData.bright < 0 || oldLightData.dim < 0 ? -0.5 : 0.5,
	// 				saturation: 0,
	// 				contrast: 0,
	// 				shadows: 0,
	// 				animation: <any>{
	// 					type: oldLightData.lightAnimation.type ?? '',
	// 					speed: oldLightData.lightAnimation.speed,
	// 					intensity: oldLightData.lightAnimation.intensity,
	// 					reverse: false
	// 				},
	// 				darkness: <any>oldLightData.darkness
	// 			}
	// 		}
	// 		macro.update({ img, command: LightTemplateManager.generateCommandData(newLightData) })
	// 	}

	// }
}