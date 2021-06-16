import ARCHITECT from "../core/architect.js";
import SETTINGS from "../core/settings.js";

interface WallEventData {
	destination: PIXI.Point; preview: Wall; object: Wall; fixed: boolean;
}
class _WallAltDrop {
	private static readonly DISTANCE = "WallAltDrop.Distance";

	private _visible = false;
	private ring = new PIXI.Graphics();

	init() {
		libWrapper.register(ARCHITECT.MOD_NAME, 'Wall.prototype._onDragLeftMove', this._handleDragMove.bind(this), 'WRAPPER');
		libWrapper.register(ARCHITECT.MOD_NAME, 'Wall.prototype._onDragLeftDrop', this._handleDragDrop.bind(this), 'WRAPPER');
		libWrapper.register(ARCHITECT.MOD_NAME, 'Wall.prototype._onDragLeftCancel', this._handleDragCancel.bind(this), 'WRAPPER');
	}

	ready() {
		SETTINGS.register(_WallAltDrop.DISTANCE, {
			name: 'DF_ARCHITECT.WallAltDrop_Setting_DistanceName',
			hint: 'DF_ARCHITECT.WallAltDrop_Setting_DistanceHint',
			config: true,
			scope: 'world',
			type: Number,
			default: 24,
			onChange: (value) => this._drawCircle(value as number)
		});
		const radius: number = SETTINGS.get(_WallAltDrop.DISTANCE);
		this._drawCircle(radius as number);

		libWrapper.register(ARCHITECT.MOD_NAME, 'WallsLayer.prototype._onDragLeftMove', this._handleDragMove.bind(this), 'WRAPPER');
		libWrapper.register(ARCHITECT.MOD_NAME, 'WallsLayer.prototype._onDragLeftDrop', this._handleDragDrop.bind(this), 'WRAPPER');
		libWrapper.register(ARCHITECT.MOD_NAME, 'WallsLayer.prototype._onDragLeftCancel', this._handleDragCancel.bind(this), 'WRAPPER');
	}

	private _drawCircle(radius: number) {
		this.ring.clear();
		this.ring.beginFill(0, 0)
			.lineStyle(4, 0xEE8E26, 1.0, 1)
			.drawCircle(0, 0, radius)
			.endFill();
	}

	private async _handleDragMove(wrapper: Function, event: PIXI.InteractionEvent) {
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
	private async _handleDragDrop(wrapper: Function, event: PIXI.InteractionEvent) {
		await wrapper(event);
		// If we are controlling more than one wall, ignore it
		if ((<Canvas>canvas).walls.controlled.length > 1) return;
		const data = (<any>event.data) as WallEventData;
		this._updateCircle(false);
		// If Alt is not pressed, or no wall is bound, return
		if (!event.data.originalEvent.altKey || (!data.preview && !data.object)) return;
		if (data.preview) {
			data.preview = await new Promise<Wall>((res, _) => {
				var counter = 0;
				const waiter = () => {
					counter += 100;
					if (data.preview.data._id === "preview") {
						if (counter > 2000) res(undefined);
						else setTimeout(waiter, 100);
						return;
					}
					res(game.scenes.active.data.walls.find(x => x.id === (<Canvas>canvas).walls.last.id).object);
				}
				setTimeout(waiter, 100);
			});
		}
		this._updateWallSnap(data.destination, data.fixed, data.preview);
	}
	private async _handleDragCancel(wrapper: Function, event: PIXI.InteractionEvent) {
		wrapper(event);
		this._updateCircle(false);
	}

	private _updateCircle(visible: boolean, position?: { x: number, y: number }) {
		if (visible) {
			if (this._visible != visible)
				(<Canvas>canvas).walls.addChild(this.ring);
			this.ring.setTransform(position.x, position.y).updateTransform();
		} else if (this._visible != visible) {
			(<Canvas>canvas).walls.removeChild(this.ring);
		}
		this._visible = visible;
	}

	private async _updateWallSnap(dest: { x: number, y: number }, fixed: boolean, newWall?: Wall): Promise<Wall> {
		const wallsLayer = (<Canvas>canvas).walls;
		// If we are controlling more than one wall, ignore it
		if (!newWall && wallsLayer.controlled.length != 1) return null;
		const wall: Wall = newWall || wallsLayer.controlled[0];
		const walls = game.scenes.active.data.walls.filter(x => x.id != wall.data._id);
		const radius: number = SETTINGS.get(_WallAltDrop.DISTANCE);
		const closestPoints = walls.map(wall => {
			const [x, y] = WallsLayer.getClosestEndpoint(dest, <Wall>(<any>wall).object)
			return { dist: Math.hypot(x - dest.x, y - dest.y), point: { x, y } };
		}).filter(x => x.dist <= radius).sort((a, b) => a.dist - b.dist);
		// If there are no points nearby
		if (closestPoints.length == 0) return wall;
		const target: PointArray = [closestPoints[0].point.x, closestPoints[0].point.y];

		const p0 = fixed ? wall.coords.slice(2, 4) : wall.coords.slice(0, 2);
		const coords = fixed ? target.concat(p0) : p0.concat(target);
		if ((coords[0] === coords[2]) && (coords[1] === coords[3])) {
			return await wall.delete(); // If we collapsed the wall, delete its
		}
		(<WallsLayer>wall.layer).last.point = target;
		return await wall.document.update(<any>{ c: coords });
	}
}

export const WallAltDrop = new _WallAltDrop();