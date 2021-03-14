import ARCHITECT from "./architect.js";

export default class SETTINGS {
	static register<T>(key: string, config: ClientSettings.PartialData<T>) { game.settings.register(ARCHITECT.MOD_NAME, key, config); }
	static get<T>(key: string): T { return game.settings.get(ARCHITECT.MOD_NAME, key); }
	static async set<T>(key: string, value: T): Promise<T> { return await game.settings.set(ARCHITECT.MOD_NAME, key, value); }
	static default<T>(key: string): T { return game.settings.settings.get(`${ARCHITECT.MOD_NAME}.${key}`).default; }
	static typeOf<T>(): ConstructorOf<T> { return Object as any; }
}