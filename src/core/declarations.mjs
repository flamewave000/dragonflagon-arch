
export default function () {
	if (!Map.prototype.getOrDefault)
		Map.prototype.getOrDefault = function (key, defaultValue) {
			var result = this.get(key);
			if (result === undefined) {
				result = defaultValue instanceof Function ? defaultValue() : defaultValue;
				this.set(key, result);
			}
			return result;
		}
	if (!String.prototype.localize)
		String.prototype.localize = function () {
			return game.i18n.localize(this.valueOf());
		}
};