declare global {
	interface Map<K, V> {
		getOrDefault(key: K, defaultValue: () => V): V;
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
	Map.prototype.getOrDefault = function (key: any, defaultValue: () => any) {
		var result = this.get(key);
		if (result === undefined) {
			result = defaultValue();
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