import * as globalFoundry from '../fvtt-scripts/foundry-esm';
import * as globalPIXI from 'pixi.js';


declare global {
	const PIXI = globalPIXI;
	const foundry = globalFoundry;

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

declare interface EntityConfigData<T> {
	blankLabel: string
	defaultClass: string
	entityName: string
	isGM: true
	object: T
	options: object
	sheetClass: string
	sheetClasses: object
}