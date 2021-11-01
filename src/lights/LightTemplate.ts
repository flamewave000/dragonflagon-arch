import { AnimationData } from "@league-of-foundry-developers/foundry-vtt-types/src/foundry/common/data/data.mjs/animationData";
import { DarknessActivation } from "@league-of-foundry-developers/foundry-vtt-types/src/foundry/common/data/data.mjs/darknessActivation";
import { AmbientLightData, MacroData } from "@league-of-foundry-developers/foundry-vtt-types/src/foundry/common/data/module.mjs";
import ARCHITECT from "../core/architect";
import { QuickColourPicker } from "../general/QuickColourPicker";

declare global {
	// class MacroConfig extends BaseEntitySheet { }
	const LightTemplates: _LightTemplates;
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
		// This is just to make the colour text more visible
		const tintColour = parseInt('0x1' + (lightData.tintColor || '#000000').substr(1));
		const templateHtml = $(await renderTemplate(`modules/${ARCHITECT.MOD_NAME}/templates/cur-light-template.hbs`, {
			name: game.macros.get(macroId).name,
			data: lightData,
			colorIntensity: Math.sqrt(lightData.tintAlpha).toNearest(0.05),
			lightType: LightTemplateManager.lightTypes[lightData.t],
			animationType: lightData.lightAnimation.type === "" ? 'None' : CONFIG.Canvas.lightAnimations[lightData.lightAnimation.type].label,
			tintColorValue: lightData.tintColor || 'transparent',
			tintColorLabel: lightData.tintColor || '#------',
			// Determines if the tint colour is dark or light, the HBS template will change the text colour accordingly
			tintIsDark: ((((tintColour & 0xff0000) >> 16) + ((tintColour & 0xff00) >> 8) + (tintColour & 0xff)) / 3) < 128
		}));
		const rect = $('#controls .active .control-tools')[0].getBoundingClientRect();
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
		return this.extractLightDataFromMacroCommand(game.macros.get(this.currentActiveTemplate).data.command);
	}

	static get lightTypes(): { [key: string]: string } {
		return Object.entries(CONST.SOURCE_TYPES).reduce((obj: { [key: string]: string }, e) => {
			obj[e[1]] = `LIGHT.Type${e[0].titleCase()}`;
			return obj;
		}, {});
	}

	static init() {
		libWrapper.register(ARCHITECT.MOD_NAME, 'Hotbar.prototype._contextMenu', this._contextMenu.bind(this), 'OVERRIDE');
	}

	static ready() {
		if (!game.user.isGM) return;
		Hooks.on('renderLightConfig', this._renderLightConfig.bind(this));
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
				t: 'l',
				dim: 30,
				angle: 360,
				bright: 15,
				rotation: 0,
				tintColor: "",
				tintAlpha: Math.pow(0.7, 2).toNearest(0.01),
				darknessThreshold: 0,
				darkness: { min: 0, max: 1 } as DarknessActivation,
				lightAnimation: {
					intensity: 5,
					speed: 5,
				} as AnimationData,
			}));
		});
	}

	private static _renderLightConfig(app: LightConfig, html: JQuery<HTMLElement>, data: any) {
		const button = $(`<button type="button" style="margin-bottom:0.25em" name="save-template">
<i class="far fa-lightbulb"></i>
${'DF_ARCHITECT.LightTemplate.CreateTemplateButton.LightConfig'.localize()}
</button>`);
		html.find('button[name="submit"]').before(button);
		button.on('click', (event) => {
			event.preventDefault();
			this._createTemplate(duplicate((<AmbientLightDocument>app.object).data) as Partial<AmbientLightData>);
		});
	}

	private static async _renderMacroConfig(app: MacroConfig, html: JQuery<HTMLElement>, data: Macro) {
		const macro = new Macro(data.data as MacroData);
		if (!macro.getFlag(ARCHITECT.MOD_NAME, this.FLAG_IS_TEMPLATE))
			return;
		html.find('div.form-group').remove();
		html.find('footer').remove();

		// Generate the same kind of lighting configuration data as LightConfig does
		const animationTypes: { [key: string]: string } = { "": "None" };
		for (let [k, v] of Object.entries(CONFIG.Canvas.lightAnimations)) {
			animationTypes[k] = v.label;
		}

		const lightData = this.extractLightDataFromMacroCommand((data.data as MacroData).command);
		const htmlData = {
			object: duplicate(lightData),
			lightTypes: this.lightTypes,
			lightAnimations: animationTypes,
			colorIntensity: Math.sqrt(lightData.tintAlpha).toNearest(0.05)
		}

		// Render the form html
		const content = $(await renderTemplate(`modules/${ARCHITECT.MOD_NAME}/templates/light-template.hbs`, htmlData));
		content.find('button.execute').on('click', () => LightTemplates.activate(macro.id));
		html.find('header.sheet-header').after(content);


		html.find('button.eyedropper').on('click', async (event: JQuery.ClickEvent) => {
			event.preventDefault();
			const colour = await QuickColourPicker.requestColourPick(app);
			if (colour === false) return;
			app.element.find('input[name="tintColor"]').val(colour);
			app.element.find('input[data-edit="tintColor"]').val(colour);
		});

		// @ts-ignore
		// Replace the MacroConfig's update function with our own
		app._updateObject = async (_: Event, formData: any) => {
			formData.tintAlpha = Math.pow(formData.tintAlpha, 2).toNearest(0.01);
			formData.flags = lightData.flags;
			formData = expandObject(formData);
			const name = formData.name;
			const img = formData.img;
			delete formData.name;
			delete formData.img;
			await macro.update({
				command: this.generateCommandData(formData),
				name: name,
				img: img
			});
			// If we are editing the currently selected light template, update the UI
			if (this.currentActiveTemplate === macro.id)
				await LightTemplates.activate(macro.id);
		}

		// Resizes the config menu to accommodate the new elements.
		app.element[0].style.height = '';
		app.element[0].style.width = '';
		app.setPosition({ width: 480 });
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
		// Create the Macro
		const macro = await Macro.create({
			name: 'Light Template ' + new Date().toISOString().replace(/(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2}).+/, '$4$5$6'),
			author: game.userId,
			img: `modules/${ARCHITECT.MOD_NAME}/templates/lightbulb.svg`,
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
	private static _contextMenu(html: JQuery<HTMLElement>) {
		new ContextMenu(html, ".macro", [
			{
				name: "MACRO.Edit",
				icon: '<i class="fas fa-edit"></i>',
				condition: li => {
					const macro = game.macros.get(li.data("macro-id"));
					// Modified Section
					return macro && !macro.getFlag(ARCHITECT.MOD_NAME, this.FLAG_IS_TEMPLATE) ? macro.owner : false;
					// End Modification
				},
				callback: li => game.macros.get(li.data("macro-id")).sheet.render(true)
			},
			{
				name: "MACRO.Remove", icon: '<i class="fas fa-times"></i>',
				// Modified Section
				condition: li => !game.macros.get(li.data("macro-id")).getFlag(ARCHITECT.MOD_NAME, this.FLAG_IS_TEMPLATE),
				// End Modification
				callback: li => game.user.assignHotbarMacro(null, li.data("slot"))
			},
			{
				name: "MACRO.Delete", icon: '<i class="fas fa-trash"></i>',
				condition: li => {
					const macro = game.macros.get(li.data("macro-id"));
					// @ts-ignore
					// Modified Section
					return macro && !macro.getFlag(ARCHITECT.MOD_NAME, this.FLAG_IS_TEMPLATE) ? macro.isOwner : false;
					// End Modification
				},
				callback: li => {
					const macro = game.macros.get(li.data("macro-id"));
					return Dialog.confirm({
						title: `${game.i18n.localize("MACRO.Delete")} ${macro.name}`,
						content: game.i18n.localize("MACRO.DeleteWarning"),
						yes: () => macro.delete()
					});
				}
			},
			// Modified Section
			{
				name: "DF_ARCHITECT.LightTemplate.ContextMenu.Edit",
				icon: '<i class="fas fa-edit"></i>',
				condition: li => {
					const macro = game.macros.get(li.data("macro-id"));
					return macro && macro.getFlag(ARCHITECT.MOD_NAME, this.FLAG_IS_TEMPLATE) ? macro.owner : false;
				},
				callback: li => game.macros.get(li.data("macro-id")).sheet.render(true)
			},
			{
				name: "DF_ARCHITECT.LightTemplate.ContextMenu.Remove",
				icon: '<i class="fas fa-times"></i>',
				condition: li => <boolean>game.macros.get(li.data("macro-id")).getFlag(ARCHITECT.MOD_NAME, this.FLAG_IS_TEMPLATE),
				callback: li => game.user.assignHotbarMacro(null, li.data("slot"))
			},
			{
				name: "DF_ARCHITECT.LightTemplate.ContextMenu.Delete",
				icon: '<i class="fas fa-trash"></i>',
				condition: li => {
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
		]);
	}

	static generateCommandData(lightData: Partial<AmbientLightData>) {
		return `const ld=${JSON.stringify(lightData, null, '')};\nLightTemplates.activate(this.id,ld);`
	}
	static extractLightDataFromMacroCommand(commandString: string): Partial<AmbientLightData> {
		return JSON.parse(/const ld=(.+);/.exec(commandString)[1]) as Partial<AmbientLightData>
	}
}

/**
 * Set of functions that override the Mouse Events for the LightingLayer in order to place templated lights.
 */
export class LightingLayerOverride {
	static ready() {
		libWrapper.register(ARCHITECT.MOD_NAME, 'LightingLayer.prototype._onDragLeftStart',
			this._onDragLeftStart.bind((<LightingLayer>(<Canvas>canvas).getLayer('LightingLayer'))),
			'MIXED');
		libWrapper.register(ARCHITECT.MOD_NAME, 'LightingLayer.prototype._onClickLeft',
			this._onClickLeft.bind((<LightingLayer>(<Canvas>canvas).getLayer('LightingLayer'))),
			'MIXED');
		libWrapper.register(ARCHITECT.MOD_NAME, 'LightingLayer.prototype._onClickRight',
			this._onClickRight.bind((<LightingLayer>(<Canvas>canvas).getLayer('LightingLayer'))),
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
		this.sources.set(preview.sourceId, preview.source);
		this.deactivateAnimation();
		return preview.draw();
	}
}