import ARCHITECT from "../core/architect.mjs";
import SETTINGS from "../core/settings.mjs";
import libWrapperShared from "../core/libWrapperShared.mjs";
import WallCtrlInvert from "./WallCtrlInvert.mjs";


/**
 * @typedef {object} WallEventData
 * @property {PIXI.Point} destination
 * @property {Wall} preview
 * @property {Wall} object
 * @property {boolean} fixed
 */

export default class WallAltDrop {
	/**@readonly*/static DISTANCE = "WallAltDrop.Distance";

	static _visible = false;
	static ring = new PIXI.Graphics();

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
			onChange: (value) => this._drawCircle(value)
		});
		/**@type {number}*/
		const radius = SETTINGS.get(WallAltDrop.DISTANCE);
		this._drawCircle(radius);

		libWrapper.register(ARCHITECT.MOD_NAME, 'WallsLayer.prototype._onDragLeftMove', this._handleDragMove.bind(this), 'WRAPPER');
		libWrapper.register(ARCHITECT.MOD_NAME, 'WallsLayer.prototype._getWallEndpointCoordinates',
			/**
			 * @param {Function} wrapper
			 * @param { { x: number, y: number } } point
			 * @param {  { snap = true } } param2
			 * @returns {unknown}
			 */
			(wrapper, point, { snap = true } = {}) => {
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

	/**@param {number} radius*/
	static _drawCircle(radius) {
		this.ring.clear();
		this.ring.beginFill(0, 0)
			.lineStyle(4, 0xEE8E26, 1.0, 1)
			.drawCircle(0, 0, radius)
			.endFill();
	}

	/**
	 * @param {Function} wrapper
	 * @param {PIXI.InteractionEvent} event
	 * @returns {Promise}
	 */
	static async _handleDragMove(wrapper, event) {
		wrapper(event);
		// If we are controlling more than one wall, ignore it
		if (canvas.walls.controlled.length > 1) return;
		/**@type {WallEventData}*/
		const data = event.interactionData;
		// If Alt is not pressed, or no wall is bound, cancel circle and return
		if (!event.data.originalEvent.altKey || (!data.preview && !data.object)) {
			this._updateCircle(false);
			return;
		}
		this._updateCircle(true, data.destination);
	}

	/**
	 * @this Wall
	 * @param {Function} wrapper
	 * @param {PIXI.InteractionEvent} event
	 * @returns {Promise<unknown>}
	 */
	static async Wall_handleDragDrop(wrapper, event) {
		/**@type {WallEventData}*/
		const data = event.interactionData;
		const { destination, fixed, object } = data;
		await wrapper(event);
		// If we are controlling more than one wall, ignore it
		if (canvas.walls.controlled.length > 1) return;
		WallAltDrop._updateCircle(false);
		// If Alt is not pressed, or no wall is bound, return
		if (!event.data.originalEvent.altKey || (!this && !object)) return;
		WallAltDrop._updateWallSnap(destination, fixed, event, this);
	}

	/**
	 * @this WallsLayer
	 * @param {Function} wrapper
	 * @param {PIXI.InteractionEvent} event
	 * @returns {Promise}
	 */
	static async WallsLayer_onDragLeftDrop(wrapper, event) {
		/**@type {WallEventData}*/
		const { destination, fixed, object, preview } = event.interactionData;
		var wall = preview;
		await wrapper(event);
		if (event.type === 'mousemove') return;
		// If we are controlling more than one wall, ignore it
		if (canvas.walls.controlled.length > 1) return;
		WallAltDrop._updateCircle(false);
		// If Alt is not pressed, or no wall is bound, return
		if (!event.data.originalEvent.altKey || (!this && !object)) return;
		if (wall) {
			wall = await new Promise((res, _) => {
				var counter = 0;
				const waiter = () => {
					counter += 10;
					if (!wall.document.id) {
						if (counter > 2000) res(undefined);
						else setTimeout(waiter, 100);
						return;
					}
					res(game.scenes.viewed.data.walls.find(x => x.id === canvas.walls.last.id)?.object);
				}
				setTimeout(waiter, 10);
			});
		}
		WallAltDrop._updateWallSnap(destination, fixed, event, wall ?? object);
	}
	/**
	 * @param {Function} wrapper
	 * @param {PIXI.InteractionEvent} event
	 */
	static async _handleDragCancel(wrapper, event) {
		wrapper(event);
		this._updateCircle(false);
	}

	/**
	 * @param {boolean} visible
	 * @param { { x: number, y: number } } [position]
	 */
	static _updateCircle(visible, position) {
		if (visible) {
			if (this._visible != visible)
				canvas.walls.addChild(this.ring);
			this.ring.setTransform(position.x, position.y).updateTransform();
		} else if (this._visible != visible) {
			canvas.walls.removeChild(this.ring);
		}
		this._visible = visible;
	}

	/**
	 * @param { { x: number, y: number } } dest
	 * @param {string} [wallId]
	 * @returns { {dist:number,point:{x:number,y:number}} }
	 */
	static _getClosestPoint(dest, wallId) {
		const walls = game.scenes.viewed.walls.filter(x => x.id != wallId);
		/**@type {number}*/const radius = SETTINGS.get(this.DISTANCE);
		const closestPoints = walls.map(wall => {
			const [x, y] = WallsLayer.getClosestEndpoint(dest, wall.object)
			return { dist: Math.hypot(x - dest.x, y - dest.y), point: { x, y } };
		}).filter(x => x.dist <= radius).sort((a, b) => a.dist - b.dist);
		return closestPoints[0];
	}

	/**
	 * @param { { x: number, y: number } } dest
	 * @param {boolean} fixed
	 * @param {PIXI.InteractionEvent} event
	 * @param {Wall} wall
	 * @returns {Promise<Wall>}
	 */
	static async _updateWallSnap(dest, fixed, event, wall) {
		if (!wall.document) return wall;
		const closestPoint = this._getClosestPoint(dest, wall.document.id);
		// If there are no points nearby
		if (!closestPoint) return wall;
		/**@type {number[]}*/
		const target = [closestPoint.point.x, closestPoint.point.y];

		const p0 = fixed ? wall.coords.slice(2, 4) : wall.coords.slice(0, 2);
		const coords = fixed ? target.concat(p0) : p0.concat(target);
		// If we are chaining walls, move the new wall's origin to the target point
		if ((game.keyboard.isModifierActive(KeyboardManager.MODIFIER_KEYS.CONTROL) && !WallCtrlInvert.enabled)
			|| (!game.keyboard.isModifierActive(KeyboardManager.MODIFIER_KEYS.CONTROL) && WallCtrlInvert.enabled)) {
			event.interactionData.object.document.c[0] = target[0];
			event.interactionData.object.document.c[1] = target[1];
		}
		// If we collapsed the wall, delete it
		if ((coords[0] === coords[2]) && (coords[1] === coords[3])) {
			await /**@type {WallDocument}*/(wall.document).delete();
			return wall;
		}
		wall.layer['last'].point = target;
		if (wall.document.id)
			await wall.document.update({ c: coords });
		return wall;
	}
}
