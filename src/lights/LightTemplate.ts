import ARCHITECT from "../core/architect.js";

declare global {
	class MacroConfig extends BaseEntitySheet { }
	const LightTemplates: _LightTemplates;
}

class _LightTemplates {
	private static readonly FLAG_ISTEMPLATE = 'isLightTemplate';

	init() {
		Hooks.on('renderLightConfig', this._renderLightConfig.bind(this));
		Hooks.on('renderMacroConfig', this._renderMacroConfig.bind(this));
		libWrapper.register(ARCHITECT.MOD_NAME, 'Hotbar.prototype._contextMenu', this._contextMenu, 'OVERRIDE');
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
		const macro = new Macro(data.entity as Macro.Data);
		if (!macro.getFlag(ARCHITECT.MOD_NAME, _LightTemplates.FLAG_ISTEMPLATE))
			return;
		html.find('div.form-group').remove();
		html.find('footer').remove();


		const animationTypes: { [key: string]: string } = { "": "None" };
		for (let [k, v] of Object.entries(CONFIG.Canvas.lightAnimations)) {
			animationTypes[k] = v.label;
		}
		const lightTypes = Object.entries(CONST.SOURCE_TYPES).reduce((obj: { [key: string]: string }, e) => {
			obj[e[1]] = `LIGHT.Type${e[0].titleCase()}`;
			return obj;
		}, {});
		const lightData = JSON.parse((data.entity as Macro.Data).command) as Partial<AmbientLight.Data>;
		const htmlData = {
			object: duplicate(lightData),
			submitText: game.i18n.localize("Update Light Template"),
			lightTypes: lightTypes,
			lightAnimations: animationTypes,
			colorIntensity: Math.sqrt(lightData.tintAlpha).toNearest(0.05)
		}

		const content = await renderTemplate(`modules/${ARCHITECT.MOD_NAME}/templates/light-template.hbs`, htmlData);

		html.find('header.sheet-header').after(content);

		// Resizes the config menu to acommodate the new elements.
		app.element[0].style.height = '';
		app.element[0].style.width = '';
		app.setPosition({ width: 480 });
	}

	/**
	 * Simple function used to generate a specialized Macro to be used for Light Templating.
	 * @param app LightConfig Application
	 */
	private async _createTemplate(app: LightConfig) {
		const lightData = duplicate((<AmbientLight>app.object).data);
		// Delete the obsolete fields
		delete lightData._id;
		delete lightData.x;
		delete lightData.y;
		// Create the Macro
		const macro = await Macro.create({
			name: 'Light Template ' + new Date().toISOString().replace(/(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2}).+/, '$4$5$6'),
			author: 'DF Architect',
			img: `modules/${ARCHITECT.MOD_NAME}/templates/lightbulb.svg`,
			scope: "global",
			type: 'script',
			command: JSON.stringify(lightData, null, '')
		});
		await macro.setFlag(ARCHITECT.MOD_NAME, _LightTemplates.FLAG_ISTEMPLATE, true);
		macro.sheet.render(true);
	}

	private _contextMenu(html: JQuery<HTMLElement>) {
		new ContextMenu(html, ".macro", [
			{
				name: "MACRO.Edit",
				icon: '<i class="fas fa-edit"></i>',
				condition: li => {
					const macro = game.macros.get(li.data("macro-id"));
					return macro && !macro.getFlag(ARCHITECT.MOD_NAME, _LightTemplates.FLAG_ISTEMPLATE) ? macro.owner : false;
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
					return macro && macro.getFlag(ARCHITECT.MOD_NAME, _LightTemplates.FLAG_ISTEMPLATE) ? macro.owner : false;
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