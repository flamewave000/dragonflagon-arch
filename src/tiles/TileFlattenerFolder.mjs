import ARCHITECT from "../core/architect.mjs";
import SETTINGS from "../core/settings.mjs";
import TileFlattener from "./TileFlattener.mjs";

export default class ArchiveFolderMenu extends FormApplication {
	static get defaultOptions() {
		return foundry.utils.mergeObject(FormApplication.defaultOptions as Partial<FormApplicationOptions>, {
			width: 400,
			height: 125,
			resizable: false,
			minimizable: false,
			title: 'DF_ARCHITECT.TileFlattener.ImageFolderTitle',
			template: `modules/${ARCHITECT.MOD_NAME}/templates/folder-selection.hbs`,
			submitOnClose: false,
			submitOnChange: false,
			closeOnSubmit: true
		}) as FormApplicationOptions;
	}

	private folder = SETTINGS.get<string>(TileFlattener.PREF_FOLDER);
	private source = SETTINGS.get<string>(TileFlattener.PREF_FOLDER_SOURCE);

	getData(options: any): any {
		return { path: this.folder }
	}

	async _renderInner(data: any): Promise<JQuery<HTMLElement>> {
		const html = await super._renderInner(data);
		const input = html.find('input#dfce-ca-folder-path')[0] as HTMLInputElement;
		html.find('label>button').on('click', async (event: any) => {
			event.preventDefault();
			const fp = new FilePicker(<any>{
				current: SETTINGS.get(TileFlattener.PREF_FOLDER),
				title: 'DF_ARCHITECT.TileFlattener.ImageFolderTitle',
				type: 'folder',
				field: input,
				callback: async (path: string) => {
					this.source = fp.activeSource;
					this.folder = path
				},
				button: event.currentTarget
			});
			await fp.browse('');
		});
		return html;
	}
	protected async _updateObject(event: Event, formData?: object) {
		await SETTINGS.set<string>(TileFlattener.PREF_FOLDER, this.folder);
		await SETTINGS.set<string>(TileFlattener.PREF_FOLDER_SOURCE, this.source);
	}
}