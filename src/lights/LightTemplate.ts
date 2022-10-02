import { AmbientLightDataProperties } from "@league-of-foundry-developers/foundry-vtt-types/src/foundry/common/data/data.mjs/ambientLightData";
import { AmbientLightData, LightData, MacroData } from "@league-of-foundry-developers/foundry-vtt-types/src/foundry/common/data/module.mjs";
import ARCHITECT from "../core/architect";

declare global {
	// class MacroConfig extends BaseEntitySheet { }
	const LightTemplates: _LightTemplates;
}

declare class AdaptiveLightingShader {
	static SHADER_TECHNIQUES: { [key: string]: { id: number, label: string } }
}

class _LightTemplates {
	/**
	 * Activates the given Light Template provided by the Macro ID.
	 * @param macroId ID of Macro containing the light template.
	 */
	async activate(macroId: string) {
		if (!game.user.isGM) return;
		if (LightTemplateManager.currentActiveTemplate !== null) {
			this.deactivate();
		}

		// Activate the lighting layer if we are not on it already
		if (ui.controls.activeControl !== 'lighting') {
			$('li.scene-control[data-control="lighting"]').trigger('click');
		}

		LightTemplateManager.currentActiveTemplate = macroId;
		const lightData = LightTemplateManager.getCurrentTemplateData();
		lightData.config.bright = Math.roundDecimals(lightData.config.bright, 2);
		lightData.config.dim = Math.roundDecimals(lightData.config.dim, 2);
		// This is just to make the colour text more visible
		const tintColour = parseInt('0x1' + (lightData.config.color || '#000000').substring(1));
		const templateHtml = $(await renderTemplate(`modules/${ARCHITECT.MOD_NAME}/templates/cur-light-template.hbs`, {
			name: game.macros.get(macroId).name,
			data: lightData,
			colorIntensity: Math.sqrt(lightData.config.alpha).toNearest(0.05),
			// lightType: LightTemplateManager.lightTypes[lightData.t],
			animationType: lightData.config.animation.type === "" ? 'None' : CONFIG.Canvas.lightAnimations[lightData.config.animation.type].label,
			tintColorValue: lightData.config.color || 'transparent',
			tintColorLabel: lightData.config.color || '#------',
			// Determines if the tint colour is dark or light, the HBS template will change the text colour accordingly
			tintIsDark: ((((tintColour & 0xff0000) >> 16) + ((tintColour & 0xff00) >> 8) + (tintColour & 0xff)) / 3) < 128,
			coloration: Object.entries(AdaptiveLightingShader.SHADER_TECHNIQUES).find(x => x[1].id === lightData.config.coloration)[1].label.localize()
		}));
		const rect = $('nav#controls ol.active')[0].getBoundingClientRect();
		templateHtml.css('left', rect.right + 10 + 'px');
		templateHtml.css('top', rect.top + 'px');
		const buttons = templateHtml.find('a');
		buttons.first().on('click', () => game.macros.get(macroId).sheet.render(true));
		buttons.last().on('click', this.deactivate.bind(this));
		templateHtml.appendTo(document.body);
	}

	deactivate() {
		if (!game.user.isGM) return;
		// clear the status from previous selection
		$('#dfarch-cur-light-template').remove();
		LightTemplateManager.currentActiveTemplate = null;
	}
}

// @ts-ignore
window.LightTemplates = new _LightTemplates();

export class LightTemplateManager {
	static readonly FLAG_IS_TEMPLATE = 'isLightTemplate';

	static currentActiveTemplate: string | null = null;
	static getCurrentTemplateData(): Partial<AmbientLightData> | null {
		if (this.currentActiveTemplate === null) return null;
		return this.extractLightDataFromMacroCommand((game.macros.get(this.currentActiveTemplate) as any).command);
	}

	static init() {
		libWrapper.register(ARCHITECT.MOD_NAME, 'Hotbar.prototype._getEntryContextOptions', this._getEntryContextOptions.bind(this), 'OVERRIDE');
	}

	static ready() {
		if (!game.user.isGM) return;
		Hooks.on('renderAmbientLightConfig', this._renderLightConfig.bind(this));
		Hooks.on('renderMacroConfig', this._renderMacroConfig.bind(this));
		Hooks.on('renderSceneControls', (controls: SceneControls) => {
			if (game.user.isGM && controls.activeControl !== 'lighting')
				LightTemplates.deactivate();
		});
		Hooks.on('renderMacroDirectory', (app: MacroDirectory, html: JQuery<HTMLElement>, data: any) => {
			const createTemplateButton = $(`<button style="flex:unset"><i class="far fa-lightbulb"></i>
${'DF_ARCHITECT.LightTemplate.CreateTemplateButton.MacroDirectory'.localize()}</button>`);
			createTemplateButton.appendTo(html.find('div.header-actions.action-buttons'));
			createTemplateButton.on('click', async () => await this._createTemplate({
				"rotation": 0,
				"walls": true,
				"vision": false,
				"config": <any>{
					"alpha": 0.5,
					"angle": 0,
					"animation": <any>{
						"intensity": 5,
						"reverse": false,
						"speed": 5,
						"type": ''
					},
					"attenuation": 0.5,
					"bright": 15,
					"color": null,
					"coloration": 1,
					"contrast": 0,
					"darkness": <any>{
						"max": 1,
						"min": 0
					},
					"dim": 30,
					"luminosity": 0.5,
					"saturation": 0,
					"shadows": 0,
				},
				"flags": {}
			}));
		});
	}

	private static _renderLightConfig(app: AmbientLightConfig, html: JQuery<HTMLElement>, data: any) {
		let extraButton: JQuery<HTMLButtonElement>;
		// If we are rendering one of our template light configs
		if ((<any>app).df_light_template) {
			const template = app.object as any as TemplateLightDocument;
			// Remove the XY position fields
			html.find('input[name="x"]').parentsUntil('div.tab').remove();
			html.find('a.configure-sheet').remove();
			const header = $(`<header class="sheet-header">
			<img src="${template.macro.img}" data-edit="img" title="${'DF_ARCHITECT.LightTemplate.TemplateConfig.ImageTitle'.localize()}" height="64" width="64">
			<h1><input name="name" type="text" value="${template.macro.name}" placeholder=" Name"></h1>
		</header>`);
			header.find('img').on('click', (event, element) => {
				const fp = new FilePicker({
					type: "image",
					current: template.macro.data.img,
					callback: path => {
						(event.target as HTMLImageElement).src = path;
						template.macro.data.img = path;
					},
					top: app.position.top + 40,
					left: app.position.left + 10
				});
				fp.browse("");
			});
			html.find('nav.sheet-tabs').before(header);
			html.find('button[name="submit"]').html('<i class="far fa-save"></i> ' + 'DF_ARCHITECT.LightTemplate.TemplateConfig.SaveButton'.localize());
			extraButton = $(`<button type="button" class="execute">
	<i class="far fa-lightbulb"></i>
	${'DF_ARCHITECT.LightTemplate.TemplateConfig.UseButton'.localize()}
	</button>`);
			html.find('button[name="submit"]').before(extraButton);
			extraButton.on('click', () => LightTemplates.activate(template.macro.id));
			app.element[0].style.height = '';
			app.element[0].style.width = '';
			app.setPosition({ width: 480 });
		}
		// Otherwise we are rendering a regular light config
		else {
			// Add the "Create Template" button to the config
			extraButton = $(`<button type="button" name="save-template">
<i class="far fa-lightbulb"></i>
${'DF_ARCHITECT.LightTemplate.CreateTemplateButton.LightConfig'.localize()}
</button>`);
			html.find('footer.sheet-footer').prepend(extraButton);
			extraButton.on('click', (event) => {
				event.preventDefault();
				this._createTemplate(duplicate((<AmbientLightDocument>app.object).data) as Partial<AmbientLightData>);
			});
		}
		// Show/Hide the create template button depending on which tab is selected
		if (html.find('a.item[data-tab="advanced"]').hasClass('active'))
			extraButton.hide();
		html.find('a.item[data-tab="basic"]').on('click', () => extraButton.show());
		html.find('a.item[data-tab="animation"]').on('click', () => extraButton.show());
		html.find('a.item[data-tab="advanced"]').on('click', () => extraButton.hide());
	}

	private static async _renderMacroConfig(app: MacroConfig, html: JQuery<HTMLElement>, data: MacroConfig.Data<any>) {
		const macro = data.document;
		if (!macro.getFlag(ARCHITECT.MOD_NAME, this.FLAG_IS_TEMPLATE))
			return;
		html.remove();
		html.toggle
		setTimeout(() => app.close(), 10);
		const lightData = this.extractLightDataFromMacroCommand((macro as any).command);
		const config = new AmbientLightConfig(<any>new TemplateLightDocument(macro, lightData), { editable: true });
		// @ts-ignore
		config.df_light_template = true;
		config.render(true, { editable: true });
	}

	/**
	 * Simple function used to generate a specialized Macro to be used for Light Templating.
	 * @param app LightConfig Application
	 */
	private static async _createTemplate(lightData: Partial<AmbientLightData>) {
		// Delete the obsolete fields
		delete lightData._id;
		delete lightData.x;
		delete lightData.y;
		delete lightData.hidden;
		if (lightData.config.angle == 0) lightData.config.angle = 360;
		// Create the Macro
		const macro = await Macro.create({
			name: 'Light Template ' + new Date().toISOString().replace(/(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2}).+/, '$4$5$6'),
			author: game.userId,
			img: `icons/svg/light.svg`,
			scope: "global",
			type: 'script',
			command: this.generateCommandData(lightData)
		});
		await macro.setFlag(ARCHITECT.MOD_NAME, this.FLAG_IS_TEMPLATE, true);
		macro.sheet.render(true);
	}

	/**
	 * Unfortunately, by the design of this core function, I must duplicate the
	 * Foundry Core code here in order to add a custom option.
	 */
	private static _getEntryContextOptions(): ContextMenuEntry[] {
		return [
			{
				name: "MACRO.Edit",
				icon: '<i class="fas fa-edit"></i>',
				condition: li => {
					if (li.hasClass('inactive')) return false;
					const macro = game.macros.get(li.data("macro-id"));
					// Modified Section
					return macro && !macro.getFlag(ARCHITECT.MOD_NAME, this.FLAG_IS_TEMPLATE) ? macro.isOwner : false;
					// End Modification
				},
				callback: li => {
					const macro = game.macros.get(li.data("macro-id"));
					macro.sheet.render(true);
				}
			},
			{
				name: "MACRO.Remove",
				icon: '<i class="fas fa-times"></i>',
				// Modified Section
				condition: li => {
					if (li.hasClass('inactive')) return false;
					return !game.macros.get(li.data("macro-id")).getFlag(ARCHITECT.MOD_NAME, this.FLAG_IS_TEMPLATE)
				},
				// End Modification
				callback: li => game.user.assignHotbarMacro(null, Number(li.data("slot")))
			},
			{
				name: "MACRO.Delete",
				icon: '<i class="fas fa-trash"></i>',
				condition: li => {
					if (li.hasClass('inactive')) return false;
					const macro = game.macros.get(li.data("macro-id"));
					// Modified Section
					return macro && !macro.getFlag(ARCHITECT.MOD_NAME, this.FLAG_IS_TEMPLATE) ? macro.isOwner : false;
					// End Modification
				},
				callback: li => {
					const macro = game.macros.get(li.data("macro-id"));
					return Dialog.confirm({
						title: `${game.i18n.localize("MACRO.Delete")} ${macro.name}`,
						content: `<h4>${game.i18n.localize("AreYouSure")}</h4><p>${game.i18n.localize("MACRO.DeleteWarning")}</p>`,
						// @ts-ignore
						yes: macro.delete.bind(macro)
					});
				}
			},
			// Modified Section
			{
				name: "DF_ARCHITECT.LightTemplate.ContextMenu.Edit",
				icon: '<i class="fas fa-edit"></i>',
				condition: li => {
					if (li.hasClass('inactive')) return false;
					const macro = game.macros.get(li.data("macro-id"));
					return macro && macro.getFlag(ARCHITECT.MOD_NAME, this.FLAG_IS_TEMPLATE) ? macro.isOwner : false;
				},
				callback: li => game.macros.get(li.data("macro-id")).sheet.render(true)
			},
			{
				name: "DF_ARCHITECT.LightTemplate.ContextMenu.Remove",
				icon: '<i class="fas fa-times"></i>',
				condition: li => {
					if (li.hasClass('inactive')) return false;
					return <boolean>game.macros.get(li.data("macro-id")).getFlag(ARCHITECT.MOD_NAME, this.FLAG_IS_TEMPLATE)
				},
				callback: li => game.user.assignHotbarMacro(null, li.data("slot"))
			},
			{
				name: "DF_ARCHITECT.LightTemplate.ContextMenu.Delete",
				icon: '<i class="fas fa-trash"></i>',
				condition: li => {
					if (li.hasClass('inactive')) return false;
					const macro = game.macros.get(li.data("macro-id"));
					// @ts-ignore
					return macro && macro.getFlag(ARCHITECT.MOD_NAME, this.FLAG_IS_TEMPLATE) ? macro.isOwner : false;
				},
				callback: li => {
					const macro = game.macros.get(li.data("macro-id"));
					return Dialog.confirm({
						title: `${game.i18n.localize("DF_ARCHITECT.LightTemplate.Delete.Title")} ${macro.name}`,
						content: game.i18n.localize("DF_ARCHITECT.LightTemplate.Delete.Confirm"),
						yes: () => macro.delete()
					});
				}
			},
			// End Modification
		];
	}

	static generateCommandData(lightData: Partial<AmbientLightData>) {
		return `const ld=${JSON.stringify(lightData, null, '')};\nLightTemplates.activate(this.id,ld);`;
	}
	static extractLightDataFromMacroCommand(commandString: string): Partial<AmbientLightData> {
		return JSON.parse(/const +ld *= *(.+);/.exec(commandString)[1]) as Partial<AmbientLightData>;
	}
}

/**
 * Set of functions that override the Mouse Events for the LightingLayer in order to place templated lights.
 */
export class LightingLayerOverride {
	static ready() {
		libWrapper.register(ARCHITECT.MOD_NAME, 'LightingLayer.prototype._onDragLeftStart',
			this._onDragLeftStart.bind(canvas.lighting),
			'MIXED');
		libWrapper.register(ARCHITECT.MOD_NAME, 'LightingLayer.prototype._onClickLeft',
			this._onClickLeft.bind(canvas.lighting),
			'MIXED');
		libWrapper.register(ARCHITECT.MOD_NAME, 'LightingLayer.prototype._onClickRight',
			this._onClickRight.bind(canvas.lighting),
			'MIXED');
	}

	static _onClickLeft(this: LightingLayer, wrapper: Function, event: PIXI.InteractionEvent) {
		const templateData: Partial<AmbientLightData> | null = LightTemplateManager.getCurrentTemplateData();
		// If we do not have an active template/Ctrl not pressed, pass through to original function
		if (templateData === null || !event.data.originalEvent.ctrlKey)
			return wrapper(event);
		const origin: { x: number, y: number } = (<any>event.data).origin;
		canvas.scene.createEmbeddedDocuments(AmbientLight.embeddedName, [mergeObject(templateData, { x: origin.x, y: origin.y }) as any], {});
	}

	static _onClickRight(this: LightingLayer, wrapper: Function, event: PIXI.InteractionEvent) {
		const templateData = LightTemplateManager.getCurrentTemplateData();
		// If we do not have an active template/Ctrl not pressed, pass through to original function
		if (templateData === null || !event.data.originalEvent.ctrlKey)
			return wrapper(event);
		LightTemplates.deactivate();
	}

	static _onDragLeftStart(this: LightingLayer, wrapper: Function, event: PIXI.InteractionEvent) {
		const templateData = LightTemplateManager.getCurrentTemplateData();
		// If we do not have an active template, pass through to original function
		if (templateData === null)
			return wrapper(event);
		const origin: { x: number, y: number } = (<any>event.data).origin;
		// Create the preview source
		const doc = new AmbientLightDocument(mergeObject(templateData, { x: origin.x, y: origin.y, dim: 0, bright: 0 }), { parent: canvas.scene });
		const preview = new AmbientLight(doc);
		(<any>event.data).preview = this.preview.addChild(preview);
		canvas.effects.lightSources.set(preview.sourceId, preview.source);
		canvas.effects.deactivateAnimation();
		return preview.draw();
	}
}

class TemplateLightDocument implements AmbientLightDataProperties {
	apps: any = {};
	macro: Macro;

	_id: string;
	x: number;
	y: number;
	rotation: number;
	walls: boolean;
	vision: boolean;
	config: LightData;
	hidden: boolean;
	flags: Record<string, unknown>;

	get uuid() { return this.macro.id; }
	get id() { return this.macro.id; }
	get name() { return this.macro.name; }
	get object() { return this; }
	get isOwner() { return this.macro.isOwner; }
	constructor(macro: Macro, data: Partial<AmbientLightData>) {
		this._id = data._id;
		this.x = data.x;
		this.y = data.y;
		this.rotation = data.rotation;
		this.walls = data.walls;
		this.vision = data.vision;
		this.config = data.config;
		this.hidden = data.hidden;
		this.flags = data.flags;
		this.macro = macro;
	}
	updateSource() { }
	refresh() { }
	async update(data: Partial<AmbientLightData>) {
		const newData = foundry.utils.expandObject(data);
		const img = newData.img;
		const name = newData.name;
		delete newData.img;
		delete newData.name;
		await this.macro.update({ name, img, command: LightTemplateManager.generateCommandData(newData) })
	}
	testUserPermission(user: any, permission: any, { exact = false } = {}) {
		return this.macro.testUserPermission(user, permission, { exact });
	}
	prepareData() { }
	clone() { return this; }
	toObject() { return this; }

	_onUpdate(_change: any, { _render }: { _render: boolean }, _userId: string) { }

	static metadata = {
		label: 'Light Template'
	}
}