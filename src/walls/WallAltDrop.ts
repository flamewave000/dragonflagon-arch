import ARCHITECT from "../core/architect";
import SETTINGS from "../core/settings";
import libWrapperShared from "../core/libWrapperShared";
import WallCtrlInvert from "./WallCtrlInvert";
import { WallData } from "@league-of-foundry-developers/foundry-vtt-types/src/foundry/common/data/data.mjs";

interface WallEventData {
	destination: PIXI.Point; preview: Wall; object: Wall; fixed: boolean;
}
export default class WallAltDrop {
	private static readonly DISTANCE = "WallAltDrop.Distance";

	private static _visible = false;
	private static ring = new PIXI.Graphics();

	static init() {
		libWrapper.register(ARCHITECT.MOD_NAME, 'Wall.prototype._onDragLeftMove', this._handleDragMove.bind(this), 'WRAPPER');
		libWrapper.register(ARCHITECT.MOD_NAME, 'Wall.prototype._onDragLeftDrop', this.Wall_handleDragDrop, 'WRAPPER');
		libWrapper.register(ARCHITECT.MOD_NAME, 'Wall.prototype._onDragLeftCancel', this._handleDragCancel.bind(this), 'WRAPPER');
	}

	static ready() {
		SETTINGS.register(WallAltDrop.DISTANCE, {
			name: 'DF_ARCHITECT.WallAltDrop.Setting.DistanceName',
			hint: 'DF_ARCHITECT.WallAltDrop.Setting.DistanceHint',
			config: true,
			scope: 'world',
			type: Number,
			default: 24,
			onChange: (value) => this._drawCircle(value as number)
		});
		const radius: number = SETTINGS.get(WallAltDrop.DISTANCE);
		this._drawCircle(radius as number);

		libWrapper.register(ARCHITECT.MOD_NAME, 'WallsLayer.prototype._onDragLeftMove', this._handleDragMove.bind(this), 'WRAPPER');
		libWrapper.register(ARCHITECT.MOD_NAME, 'WallsLayer.prototype._getWallEndpointCoordinates', (wrapper: any, point: { x: number, y: number }, { snap = true } = {}) => {
			const altPressed = game.keyboard.isModifierActive(KeyboardManager.MODIFIER_KEYS.ALT);
			if (altPressed) {
				snap = false;
				point = WallAltDrop._getClosestPoint(point)?.point ?? point;
			}
			return wrapper(point, { snap });
		}, 'WRAPPER');
		libWrapper.register(ARCHITECT.MOD_NAME, 'WallsLayer.prototype._onDragLeftCancel', this._handleDragCancel.bind(this), 'WRAPPER');
		libWrapperShared.register('WallsLayer.prototype._onDragLeftDrop', this.WallsLayer_onDragLeftDrop);
	}

	private static _drawCircle(radius: number) {
		this.ring.clear();
		this.ring.beginFill(0, 0)
			.lineStyle(4, 0xEE8E26, 1.0, 1)
			.drawCircle(0, 0, radius)
			.endFill();
	}

	private static async _handleDragMove(wrapper: Function, event: PIXI.InteractionEvent) {
		wrapper(event);
		// If we are controlling more than one wall, ignore it
		if ((<Canvas>canvas).walls.controlled.length > 1) return;
		const data = (<any>event.data) as WallEventData;
		// If Alt is not pressed, or no wall is bound, cancel circle and return
		if (!event.data.originalEvent.altKey || (!data.preview && !data.object)) {
			this._updateCircle(false);
			return;
		}
		this._updateCircle(true, data.destination);
	}

	private static async Wall_handleDragDrop(this: Wall, wrapper: Function, event: PIXI.InteractionEvent) {
		const data = (<any>event.data) as WallEventData;
		const { destination, fixed, object } = data;
		await wrapper(event);
		// If we are controlling more than one wall, ignore it
		if ((<Canvas>canvas).walls.controlled.length > 1) return;
		WallAltDrop._updateCircle(false);
		// If Alt is not pressed, or no wall is bound, return
		if (!event.data.originalEvent.altKey || (!this && !object)) return;
		WallAltDrop._updateWallSnap(destination, fixed, event, this);
	}

	private static async WallsLayer_onDragLeftDrop(this: WallsLayer, wrapper: Function, event: PIXI.InteractionEvent) {
		const data = (<any>event.data) as WallEventData;
		const { destination, fixed, object } = data;
		var wall = data.preview;
		await wrapper(event);
		if (event.type === 'mousemove') return;
		// If we are controlling more than one wall, ignore it
		if ((<Canvas>canvas).walls.controlled.length > 1) return;
		WallAltDrop._updateCircle(false);
		// If Alt is not pressed, or no wall is bound, return
		if (!event.data.originalEvent.altKey || (!this && !object)) return;
		if (wall) {
			wall = await new Promise<Wall>((res, _) => {
				var counter = 0;
				const waiter = () => {
					counter += 10;
					if (!wall.data._id) {
						if (counter > 2000) res(undefined);
						else setTimeout(waiter, 100);
						return;
					}
					res(game.scenes.viewed.data.walls.find(x => x.id === (<Canvas>canvas).walls['last'].id)?.object as Wall);
				}
				setTimeout(waiter, 10);
			});
		}
		WallAltDrop._updateWallSnap(destination, fixed, event, wall ?? object);
	}
	private static async _handleDragCancel(wrapper: Function, event: PIXI.InteractionEvent) {
		wrapper(event);
		this._updateCircle(false);
	}

	private static _updateCircle(visible: boolean, position?: { x: number, y: number }) {
		if (visible) {
			if (this._visible != visible)
				(<Canvas>canvas).walls.addChild(this.ring);
			this.ring.setTransform(position.x, position.y).updateTransform();
		} else if (this._visible != visible) {
			(<Canvas>canvas).walls.removeChild(this.ring);
		}
		this._visible = visible;
	}

	private static _getClosestPoint(dest: { x: number, y: number }, wallId?: string): {
		dist: number;
		point: {
			x: number;
			y: number;
		};
	} {
		const walls = game.scenes.viewed.walls.filter(x => x.id != wallId);
		const radius: number = SETTINGS.get(this.DISTANCE);
		const closestPoints = walls.map(wall => {
			const [x, y] = WallsLayer.getClosestEndpoint(dest, <Wall>(<any>wall).object)
			return { dist: Math.hypot(x - dest.x, y - dest.y), point: { x, y } };
		}).filter(x => x.dist <= radius).sort((a, b) => a.dist - b.dist);
		return closestPoints[0];
	}

	private static async _updateWallSnap(dest: { x: number, y: number }, fixed: boolean, event: PIXI.InteractionEvent, wall: Wall): Promise<Wall> {
		const closestPoint = this._getClosestPoint(dest, wall.document._id);
		// If there are no points nearby
		if (!closestPoint) return wall;
		const target: PointArray = [closestPoint.point.x, closestPoint.point.y];

		const p0 = fixed ? wall.coords.slice(2, 4) : wall.coords.slice(0, 2);
		const coords = fixed ? target.concat(p0) : p0.concat(target);
		// If we are chaining walls, move the new wall's origin to the target point
		if ((game.keyboard.isModifierActive(KeyboardManager.MODIFIER_KEYS.CONTROL) && !WallCtrlInvert.enabled)
			|| (!game.keyboard.isModifierActive(KeyboardManager.MODIFIER_KEYS.CONTROL) && WallCtrlInvert.enabled)) {
			(<any>event.data).object.document.c[0] = target[0];
			(<any>event.data).object.document.c[1] = target[1];
		}
		// If we collapsed the wall, delete it
		if ((coords[0] === coords[2]) && (coords[1] === coords[3])) {
			await (wall.document as WallDocument).delete();
			return wall;
		}
		(<WallsLayer>wall.layer)['last'].point = target;
		if ((wall.document as WallData)._id)
			await wall.document.update(<any>{ c: coords });
		return wall;
	}
}
