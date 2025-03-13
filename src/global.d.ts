import * as globalFoundry from '../fvtt-scripts/foundry-esm';
import * as globalPIXI from 'pixi.js';
import "./types/libWrapper";
import "./types/TooltipManager";

declare const foundry = globalFoundry;

declare global {
	const PIXI = globalPIXI;

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
	interface SquareGrid {
		_DFArch_getSnappedPosition(x: number, y: number, interval: number | null): { x: number; y: number }
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

declare interface CanvasConfig {
	autoStart?: boolean;
	width?: number;
	height?: number;
	view?: HTMLCanvasElement;
	transparent?: boolean;
	autoDensity?: boolean;
	antialias?: boolean;
	preserveDrawingBuffer?: boolean;
	resolution?: number;
	forceCanvas?: boolean;
	backgroundColor?: number;
	backgroundAlpha?: number;
	clearBeforeRender?: boolean;
	powerPreference?: string;
	sharedTicker?: boolean;
	sharedLoader?: boolean;
	resizeTo?: Window | HTMLElement;
}