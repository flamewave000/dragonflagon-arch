import ARCHITECT from "../core/architect.js";
import SETTINGS from "../core/settings.js";

class _WallDirections {
	static readonly PREF_ALLOW_UNSELECTED_INVERT = "WallDirections.AllowUnselectedInvert";
	init() {
		try {
			libWrapper.register(ARCHITECT.MOD_NAME, 'Wall.prototype.draw', this._onWallDraw, 'OVERRIDE');
			libWrapper.register(ARCHITECT.MOD_NAME, 'Wall.prototype.refresh', this._onWallRefresh, 'WRAPPER');
			libWrapper.register(ARCHITECT.MOD_NAME, 'Wall.prototype.control', this._onControlOrRelease, 'WRAPPER');
			libWrapper.register(ARCHITECT.MOD_NAME, 'Wall.prototype.release', this._onControlOrRelease, 'WRAPPER');
			libWrapper.register(ARCHITECT.MOD_NAME, 'Wall.prototype._onClickRight2', this._reverseWallDirection, 'OVERRIDE');
		}
		catch (e) {
			console.error("Could not initialize Wall Direction Labels", e);
		}
	}

	ready() {
		SETTINGS.register(_WallDirections.PREF_ALLOW_UNSELECTED_INVERT, {
			scope: 'world',
			name: 'DF_ARCHITECT.WallDirections_Setting_AllowUnselectedInvertName',
			hint: 'DF_ARCHITECT.WallDirections_Setting_AllowUnselectedInvertHint',
			config: true,
			type: Boolean,
			default: false
		});
	}

	private _onControlOrRelease(this: PlaceableObject, wrapper: Function, ...args: any[]) {
		const result = wrapper(...args);
		this.refresh();
		return result;
	}

	private async _reverseWallDirection(this: Wall) {
		if (SETTINGS.get(_WallDirections.PREF_ALLOW_UNSELECTED_INVERT) && !this._controlled) return;
		if (this.data.dir) {
			await this.update(<DeepPartial<Wall.Data>>{ dir: this.data.dir === 1 ? 2 : 1 });
		} else {
			const data = this.data.c.slice(2).concat(this.data.c.slice(0, 2));
			await this.update(<DeepPartial<Wall.Data>>{ c: data });
		}
	}

	private async _onWallDraw(this: Wall): Promise<Wall> {
		this.clear();

		// Draw wall components
		this.directionIcon = this.data.dir ? this.addChild(this._drawDirection()) : null;
		this.line = this.addChild(new PIXI.Graphics());
		this.endpoints = this.addChild(new PIXI.Graphics());
		const style = new PIXI.TextStyle({
			align: 'center',
			fill: this._getWallColor(),
			fontSize: 12,
			stroke: 0,
			strokeThickness: 2,
			lineHeight: 0
		});
		(<any>this).leftLabel = this.addChild(new PIXI.Text("L", style));
		(<any>this).rightLabel = this.addChild(new PIXI.Text("R", style));

		// Draw current wall
		this.refresh();

		// Enable interactivity, only if the Tile has a true ID
		if (this.id) this.activateListeners();
		return this;
	}
	private _onWallRefresh(this: Wall, wrapper: Function): Wall {
		wrapper();
		const graphics = (<any>this).line as PIXI.Graphics;
		if (!this._controlled || this.data.dir) {
			(<PIXI.Text>(<any>this).leftLabel).renderable = false;
			(<PIXI.Text>(<any>this).rightLabel).renderable = false;
			return this;
		}
		const [x1, y1] = this.data.c.slice(0, 2);
		const [x2, y2] = this.data.c.slice(2);
		const [cx, cy] = [(x1 + x2) / 2, (y1 + y2) / 2]; // calculate the center
		const [px, py] = [-(y2 - y1), x2 - x1]; // Calculate the line perpendicular
		const magnitude = Math.hypot(px, py);
		const [nx, ny] = [px / magnitude, py / magnitude]; // Normalize the perpendicular
		const labelOffset = 10;
		const [lx, ly] = [cx - (nx * labelOffset), cy - (ny * labelOffset)]; // Calculate the position of the Left label
		const [rx, ry] = [(nx * labelOffset) + cx, (ny * labelOffset) + cy]; // Calculate the position of the Right label
		// Update left/right label positioning
		const leftLabel = <PIXI.Text>(<any>this).leftLabel;
		leftLabel.x = lx - (leftLabel.width / 2);
		leftLabel.y = ly - (leftLabel.height / 2);
		leftLabel.style.fill = this._getWallColor();
		leftLabel.renderable = true;
		const rightLabel = <PIXI.Text>(<any>this).rightLabel;
		rightLabel.x = rx - (rightLabel.width / 2);
		rightLabel.y = ry - (rightLabel.height / 2);
		rightLabel.style.fill = this._getWallColor();
		rightLabel.renderable = true;
		return this;
	}
}

export const WallDirections = new _WallDirections();