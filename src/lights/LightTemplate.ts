import ARCHITECT from "../core/architect.js";

declare global {
	class MacroConfig extends BaseEntitySheet { }
	const LightTemplates: _LightTemplates;
}

class _LightTemplates {
	private static readonly FLAG_IS_TEMPLATE = 'isLightTemplate';

	private _currentActiveTemplate: string | null = null;

	init() {
		Hooks.on('renderLightConfig', this._renderLightConfig.bind(this));
		Hooks.on('renderMacroConfig', this._renderMacroConfig.bind(this));
		Hooks.on('renderSceneControls', async controls => {
			if (!game.user.isGM) return;
			if (controls.activeControl !== 'lighting') {
				await this.deactivate();
				return;
			}
		});
		libWrapper.register(ARCHITECT.MOD_NAME, 'Hotbar.prototype._contextMenu', this._contextMenu, 'OVERRIDE');
	}

	async activate(macroId: string, lightData: Partial<AmbientLight.Data>) {
		console.debug(`Run ${macroId} using ${JSON.stringify(lightData)}`)

		if (this._currentActiveTemplate !== null) {
			this.deactivate();
		}

		const lightTypes = Object.entries(CONST.SOURCE_TYPES).reduce((obj: { [key: string]: string }, e) => {
			obj[e[1]] = `LIGHT.Type${e[0].titleCase()}`;
			return obj;
		}, {});
		const templateHtml = $(await renderTemplate(`modules/${ARCHITECT.MOD_NAME}/templates/cur-light-template.hbs`, {
			name: game.macros.get(macroId).name,
			data: lightData,
			colorIntensity: Math.sqrt(lightData.tintAlpha).toNearest(0.05),
			lightType: lightTypes[lightData.t],
			animationType: lightData.lightAnimation.type === "" ? 'None' : CONFIG.Canvas.lightAnimations[lightData.lightAnimation.type].label
		}));
		const rect = $('#controls .active .control-tools')[0].getBoundingClientRect();
		templateHtml.css('left', rect.right + 10 + 'px');
		templateHtml.css('top', rect.top + 'px');
		templateHtml.find('a').on('click', this.deactivate.bind(this));
		this._currentActiveTemplate = macroId;
		templateHtml.appendTo(document.body);
	}

	async deactivate() {
		// clear the status from previous selection
		$('#dfarch-cur-light-template').remove();
		this._currentActiveTemplate = null;
	}

	private _renderLightConfig(app: LightConfig, html: JQuery<HTMLElement>, data: any) {
		const button = $(`<button type="button" style="margin-bottom:0.25em" name="save-template">
<i class="far fa-lightbulb"></i>
${'DF_ARCHITECT.LightTemplate_CreateTemplate_Button'.localize()}
</button>`);
		html.find('button[name="submit"]').before(button);
		button.on('click', (event) => { event.preventDefault(); this._createTemplate(app) });
	}

	private async _renderMacroConfig(app: MacroConfig, html: JQuery<HTMLElement>, data: BaseEntitySheet.Data) {
		console.debug(data.entity);
		const macro = new Macro(data.entity as Macro.Data);
		if (!macro.getFlag(ARCHITECT.MOD_NAME, _LightTemplates.FLAG_IS_TEMPLATE))
			return;
		html.find('div.form-group').remove();
		html.find('footer').remove();

		// Generate the same kind of lighting configuration data as LightConfig does
		const animationTypes: { [key: string]: string } = { "": "None" };
		for (let [k, v] of Object.entries(CONFIG.Canvas.lightAnimations)) {
			animationTypes[k] = v.label;
		}
		const lightTypes = Object.entries(CONST.SOURCE_TYPES).reduce((obj: { [key: string]: string }, e) => {
			obj[e[1]] = `LIGHT.Type${e[0].titleCase()}`;
			return obj;
		}, {});

		const command = (data.entity as Macro.Data).command;

		const lightData = JSON.parse(/const ld=(.+);/.exec(command)[1]) as Partial<AmbientLight.Data>;
		const htmlData = {
			object: duplicate(lightData),
			lightTypes: lightTypes,
			lightAnimations: animationTypes,
			colorIntensity: Math.sqrt(lightData.tintAlpha).toNearest(0.05)
		}

		// Render the form
		const content = $(await renderTemplate(`modules/${ARCHITECT.MOD_NAME}/templates/light-template.hbs`, htmlData));

		html.find('header.sheet-header').after(content);

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
				command: this._generateCommandData(formData),
				name: name,
				img: img
			});
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
	private async _createTemplate(app: LightConfig) {
		const lightData = duplicate((<AmbientLight>app.object).data) as Partial<AmbientLight.Data>;
		// Delete the obsolete fields
		delete lightData._id;
		delete lightData.x;
		delete lightData.y;
		delete lightData.hidden;
		// Create the Macro
		const macro = await Macro.create({
			name: 'Light Template ' + new Date().toISOString().replace(/(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2}).+/, '$4$5$6'),
			author: 'DF Architect',
			img: `modules/${ARCHITECT.MOD_NAME}/templates/lightbulb.svg`,
			scope: "global",
			type: 'script',
			command: this._generateCommandData(lightData)
		});
		await macro.setFlag(ARCHITECT.MOD_NAME, _LightTemplates.FLAG_IS_TEMPLATE, true);
		macro.sheet.render(true);
	}

	private _generateCommandData(lightData: Partial<AmbientLight.Data>) {
		return `const ld=${JSON.stringify(lightData, null, '')};\nLightTemplates.activate(this.id,ld);`
	}

	private _contextMenu(html: JQuery<HTMLElement>) {
		new ContextMenu(html, ".macro", [
			{
				name: "MACRO.Edit",
				icon: '<i class="fas fa-edit"></i>',
				condition: li => {
					const macro = game.macros.get(li.data("macro-id"));
					return macro && !macro.getFlag(ARCHITECT.MOD_NAME, _LightTemplates.FLAG_IS_TEMPLATE) ? macro.owner : false;
				},
				callback: li => {
					const macro = game.macros.get(li.data("macro-id"));
					macro.sheet.render(true);
				}
			},
			{
				name: "DF_ARCHITECT.LightTemplate_EditTemplate_Label",
				icon: '<i class="fas fa-edit"></i>',
				condition: li => {
					const macro = game.macros.get(li.data("macro-id"));
					return macro && macro.getFlag(ARCHITECT.MOD_NAME, _LightTemplates.FLAG_IS_TEMPLATE) ? macro.owner : false;
				},
				callback: li => {
					const macro = game.macros.get(li.data("macro-id"));
					macro.sheet.render(true);
				}
			},
			{
				name: "MACRO.Remove",
				icon: '<i class="fas fa-times"></i>',
				callback: li => {
					game.user.assignHotbarMacro(null, li.data("slot"));
				}
			},
			{
				name: "MACRO.Delete",
				icon: '<i class="fas fa-trash"></i>',
				condition: li => {
					const macro = game.macros.get(li.data("macro-id"));
					return macro ? macro.owner : false;
				},
				callback: li => {
					const macro = game.macros.get(li.data("macro-id"));
					return Dialog.confirm({
						title: `${game.i18n.localize("MACRO.Delete")} ${macro.name}`,
						content: game.i18n.localize("MACRO.DeleteConfirm"),
						yes: macro.delete.bind(macro)
					});
				}
			},
		]);
	}
}

// @ts-ignore
window.LightTemplates = new _LightTemplates();

export const LightTemplate = LightTemplates;