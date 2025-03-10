import { WallData } from "@league-of-foundry-developers/foundry-vtt-types/src/foundry/common/data/module.mjs";
import ARCHITECT from "../core/architect.mjs";
import SETTINGS from "../core/settings.mjs";

interface WallExt extends Wall {
	[key: string]: any;
	dfArchWallExt: {
		leftLabel: PIXI.Text;
		rightLabel: PIXI.Text;
		drawLabels?: boolean;
		style?: PIXI.TextStyle;
	}
}

export default class WallDirections {
	static readonly PREF_ALLOW_UNSELECTED_INVERT = "WallDirections.AllowUnselectedInvert";
	static init() {
		try {
			libWrapper.register(ARCHITECT.MOD_NAME, 'Wall.prototype.draw', this._onWallDraw, 'WRAPPER');
			libWrapper.register(ARCHITECT.MOD_NAME, 'Wall.prototype.refresh', this._onWallRefresh, 'WRAPPER');
			libWrapper.register(ARCHITECT.MOD_NAME, 'Wall.prototype.control', this._onControlOrRelease, 'WRAPPER');
			libWrapper.register(ARCHITECT.MOD_NAME, 'Wall.prototype.release', this._onControlOrRelease, 'WRAPPER');
			libWrapper.register(ARCHITECT.MOD_NAME, 'Wall.prototype._onClickRight2', this._reverseWallDirection, 'OVERRIDE');
		}
		catch (e) {
			console.error("Could not initialize Wall Direction Labels", e);
		}
	}

	static ready() {
		SETTINGS.register(WallDirections.PREF_ALLOW_UNSELECTED_INVERT, {
			scope: 'world',
			name: 'DF_ARCHITECT.WallDirections.Setting.AllowUnselectedInvertName',
			hint: 'DF_ARCHITECT.WallDirections.Setting.AllowUnselectedInvertHint',
			config: true,
			type: Boolean,
			default: false
		});
	}

	private static _onControlOrRelease(this: PlaceableObject, wrapper: Function, ...args: any[]) {
		const result = wrapper(...args);
		if (game.scenes.viewed.walls.has(this.id))
			this.refresh();
		return result;
	}

	private static async _reverseWallDirection(this: Wall) {
		if (SETTINGS.get(WallDirections.PREF_ALLOW_UNSELECTED_INVERT) && !this._controlled) return;
		const data = this.document;
		if (data.dir) {
			await this.document.update(<DeepPartial<WallData>>{ dir: data.dir === 1 ? 2 : 1 });
		} else {
			const data = this.document.c.slice(2).concat(this.document.c.slice(0, 2));
			await this.document.update(<DeepPartial<WallData>>{ c: data });
		}
	}

	private static async _onWallDraw(this: WallExt, wrapper: () => any): Promise<Wall> {
		const style = new PIXI.TextStyle({
			align: 'center',
			fill: this._getWallColor(),
			fontSize: 12,
			stroke: 0,
			strokeThickness: 2,
			lineHeight: 0
		});
		this.dfArchWallExt = {
			leftLabel: new PIXI.Text("L", style),
			rightLabel: new PIXI.Text("R", style),
			drawLabels: true,
			style
		};
		return wrapper();
	}
	private static _onWallRefresh(this: WallExt, wrapper: Function): Wall {
		if (this.dfArchWallExt.drawLabels) {
			delete this.dfArchWallExt.drawLabels;
			this.dfArchWallExt.style.fill = this._getWallColor();
			this.addChild(this.dfArchWallExt.leftLabel);
			this.addChild(this.dfArchWallExt.rightLabel);
		}
		wrapper();
		if (!this.controlled || (this.document as WallData).dir) {
			if (this.dfArchWallExt?.leftLabel)
				this.dfArchWallExt.leftLabel.renderable = false;
			if (this.dfArchWallExt?.rightLabel)
				this.dfArchWallExt.rightLabel.renderable = false;
			return this;
		}
		const [x1, y1] = (this.document as WallData).c.slice(0, 2);
		const [x2, y2] = (this.document as WallData).c.slice(2);
		const [cx, cy] = [(x1 + x2) / 2, (y1 + y2) / 2]; // calculate the center
		const [px, py] = [-(y2 - y1), x2 - x1]; // Calculate the line perpendicular
		const magnitude = Math.hypot(px, py);
		const [nx, ny] = [px / magnitude, py / magnitude]; // Normalize the perpendicular
		const labelOffset = 10;
		const [lx, ly] = [cx - (nx * labelOffset), cy - (ny * labelOffset)]; // Calculate the position of the Left label
		const [rx, ry] = [(nx * labelOffset) + cx, (ny * labelOffset) + cy]; // Calculate the position of the Right label
		// Update left/right label positioning
		this.dfArchWallExt.leftLabel.x = lx - (this.dfArchWallExt.leftLabel.width / 2);
		this.dfArchWallExt.leftLabel.y = ly - (this.dfArchWallExt.leftLabel.height / 2);
		this.dfArchWallExt.leftLabel.style.fill = this._getWallColor();
		this.dfArchWallExt.leftLabel.renderable = true;
		this.dfArchWallExt.rightLabel.x = rx - (this.dfArchWallExt.rightLabel.width / 2);
		this.dfArchWallExt.rightLabel.y = ry - (this.dfArchWallExt.rightLabel.height / 2);
		this.dfArchWallExt.rightLabel.style.fill = this._getWallColor();
		this.dfArchWallExt.rightLabel.renderable = true;
		return this;
	}
}
