export default class SETTINGS {
	private static _MOD_NAME: string;
	static init(moduleName: string) {
		this._MOD_NAME = moduleName;
	}
	static register<T>(key: string, config: ClientSettings.PartialSettingConfig<T>) { game.settings.register(SETTINGS._MOD_NAME, key, config); }
	static registerMenu(key: string, config: ClientSettings.PartialSettingSubmenuConfig) { game.settings.registerMenu(SETTINGS._MOD_NAME, key, config); }
	static get<T>(key: string): T { return <T>game.settings.get(SETTINGS._MOD_NAME, key); }
	static async set<T>(key: string, value: T): Promise<T> { return await game.settings.set(SETTINGS._MOD_NAME, key, value); }
	static default<T>(key: string): T { return <T>game.settings.settings.get(SETTINGS._MOD_NAME + '.' + key).default; }
	/** helper for referencing a Typed constructor for the `type` field of a setting { type: SETTINGS.typeOf<MyClass>() } */
	static typeOf<T>(): ConstructorOf<T> { return Object as any; }
}
