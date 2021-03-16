
declare global {
	interface Map<K, V> {
		getOrDefault<T extends V>(key: K, defaultValue: (() => T) | T): T;
	}
	interface String {
		/** Localizes the string via the global `game.i18n.localize()` function. */
		localize(): string
	}
	interface Indexable<V> {
		[key: string]: V
	}
}

export default function () {
	Map.prototype.getOrDefault = function<T> (key: any, defaultValue: (() => T) | T): T {
		var result: T = this.get(key);
		if (result === undefined) {
			result = defaultValue instanceof Function ? defaultValue() : defaultValue;
			this.set(key, result);
		}
		return result;
	}
	if (!String.prototype.localize) {
		String.prototype.localize = function () {
			return game.i18n.localize(this.valueOf());
		}
	}
};