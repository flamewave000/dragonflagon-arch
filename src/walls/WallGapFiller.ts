import { WallData } from "@league-of-foundry-developers/foundry-vtt-types/src/foundry/common/data/data.mjs";
import SETTINGS from "../core/settings";


interface WallGap {
	wallA: Wall;
	wallB: Wall;
	distanceSquared: number;
	midpoint: { x: number, y: number };
}

export default class WallGapFiller {
	private static readonly PREF_GAP_THRESHOLD = 'WallGapFiller.GapThreshold';

	private static get threshold(): number { return SETTINGS.get(this.PREF_GAP_THRESHOLD); }

	static init() {
		Hooks.on('getSceneControlButtons', (controls: SceneControl[]) => {
			const wallsControls = controls.find(x => x.name === 'walls');
			wallsControls.tools.splice(wallsControls.tools.findIndex(x => x.name === 'join') + 1, 0, {
				icon: 'fas fa-vector-square',
				name: 'wall-gaps',
				title: 'DF_ARCHITECT.WallGapFiller.ToolButtonLabel',
				button: true,
				visible: game.user.isGM,
				onClick: this._fillGaps.bind(this)
			});
		});
	}

	static ready() {
		SETTINGS.register(this.PREF_GAP_THRESHOLD, {
			scope: 'world',
			config: true,
			default: 5,
			type: Number,
			name: 'DF_ARCHITECT.WallGapFiller.SettingName',
			hint: 'DF_ARCHITECT.WallGapFiller.SettingHint',
		});
	}

	static _calculateWallGap(wallAData: WallData, wallBData: WallData): Partial<WallGap> {
		const wallA = wallAData.c;
		const wallB = wallBData.c;

		// Compare A1 to B1
		const ab1: [number, [number, number]] = [((wallA[0] - wallB[0]) ** 2) + ((wallA[1] - wallB[1]) ** 2), [wallA[0] + wallB[0], wallA[1] + wallB[1]]];
		// Compare A2 to B2
		const ab2: [number, [number, number]] = [((wallA[2] - wallB[2]) ** 2) + ((wallA[3] - wallB[3]) ** 2), [wallA[2] + wallB[2], wallA[3] + wallB[3]]];
		// Compare A1 to B2
		const ab3: [number, [number, number]] = [((wallA[0] - wallB[2]) ** 2) + ((wallA[1] - wallB[3]) ** 2), [wallA[0] + wallB[2], wallA[1] + wallB[3]]];
		// Compare A2 to B1
		const ab4: [number, [number, number]] = [((wallA[2] - wallB[0]) ** 2) + ((wallA[3] - wallB[1]) ** 2), [wallA[2] + wallB[0], wallA[3] + wallB[1]]];

		let final: [number, [number, number]];
		// Detect which endpoint pair is the closest of the 4 wall endpoint pairings
		if (ab1[0] < ab2[0] && ab1[0] < ab3[0] && ab1[0] < ab4[0])
			final = ab1;
		else if (ab2[0] < ab3[0] && ab2[0] < ab4[0])
			final = ab2;
		else if (ab3[0] < ab4[0])
			final = ab3;
		else
			final = ab4;
		// return the midpoint between the closest endpoints, and their squared distance
		return {
			midpoint: {
				x: final[1][0] / 2,
				y: final[1][1] / 2
			}, distanceSquared: final[0]
		};
	}

	private static async _findWallGaps(): Promise<WallGap[]> {
		return new Promise(res => {
			const walls = <Wall[]>canvas.walls.objects.children;
			const wallGaps: WallGap[] = [];
			const thresholdSquared = this.threshold ** 2;
			let wallGap: Partial<WallGap>;
			// O(n^2) Not exactly a true depiction. In reality, the number of iterations will equal [ n(n+1) / 2 ].
			// Basically each time we complete a comparison of one item, that item will be ignored for all future, so our
			// list decreases in size by 1 on each iteration of the outer loop
			for (let a = 0; a < walls.length; a++) {
				// Our list of comparison grow shorter for each wall we check
				for (let b = a + 1; b < walls.length; b++) {
					// Calculate the smallest gap between the two walls
					wallGap = this._calculateWallGap(walls[a].data, walls[b].data);
					// If the distance is too far, or they are overlapped perfectly, ignore the result
					if (wallGap.distanceSquared > thresholdSquared || wallGap.distanceSquared === 0) continue;
					// Add the wall references and add the gap to the list
					wallGap.wallA = walls[a];
					wallGap.wallB = walls[b];
					wallGaps.push(<any>wallGap);
				}
			}
			res(wallGaps);
		});
	}

	private static async _fillGaps() {
		// Disable interaction with canvas
		const overlayElement = $(`<div id="dfarch-temp-overlay" style="background:#444c"><h1>${'DF_ARCHITECT.WallGapFiller.DetectGapsLabel'.localize()}</h1><div class="dfarch-dual-ring"></div></div>`);
		overlayElement.appendTo(document.body);
		// Detect all the wall gaps, this can take some noticeable time if there are 100+ walls
		const wallGaps = await this._findWallGaps();
		overlayElement.remove();

		// If there are no wall gaps, notify the user and exit
		if (wallGaps.length === 0) {
			Dialog.prompt({
				callback: () => { },
				content: `<p>${'DF_ARCHITECT.WallGapFiller.NoGaps'.localize()}</p>`,
				title: 'DF_ARCHITECT.WallGapFiller.DialogTitle'.localize()
			});
			return;
		}

		// Draw a little circle around each wall gap
		const graphics = new PIXI.Graphics();
		canvas.walls.addChild(graphics);
		graphics.lineStyle(3, 0x00FF00, 0.7);
		graphics.beginFill(0, 0);
		for (const gap of wallGaps) {
			graphics.drawCircle(gap.midpoint.x, gap.midpoint.y, (Math.sqrt(gap.distanceSquared) / 2) + 8);
		}
		graphics.endFill();

		// Ask the user if they would like to close the wall gaps
		const decision = await Dialog.confirm({
			title: 'DF_ARCHITECT.WallGapFiller.DialogTitle'.localize(),
			content: `<p>${'DF_ARCHITECT.WallGapFiller.GapsDetected'.localize().replace('{count}', wallGaps.length.toString())}</p>`,
			defaultYes: true
		});

		if (decision) {
			let d1 = 0;
			let d2 = 0;
			// Display Progress Bar
			SceneNavigation.displayProgressBar({
				label: 'DF_ARCHITECT.WallGapFiller.ProgressLabel'.localize().replace('{0}', '0').replace('{1}', wallGaps.length.toString()),
				pct: 0
			});
			let count = 0;
			// Iterate over each gap and close them
			for (const gap of wallGaps) {
				// Calculate the new Wall A data and update it
				d1 = (gap.wallA.data.c[0] - gap.midpoint.x) ** 2 + (gap.wallA.data.c[1] - gap.midpoint.y) ** 2;
				d2 = (gap.wallA.data.c[2] - gap.midpoint.x) ** 2 + (gap.wallA.data.c[3] - gap.midpoint.y) ** 2;
				if (d1 < d2)
					await gap.wallA.document.update({ c: [gap.midpoint.x, gap.midpoint.y, gap.wallA.data.c[2], gap.wallA.data.c[3]] });
				else
					await gap.wallA.document.update({ c: [gap.wallA.data.c[0], gap.wallA.data.c[1], gap.midpoint.x, gap.midpoint.y] });
				// Calculate the new Wall B data and update it
				d1 = (gap.wallB.data.c[0] - gap.midpoint.x) ** 2 + (gap.wallB.data.c[1] - gap.midpoint.y) ** 2;
				d2 = (gap.wallB.data.c[2] - gap.midpoint.x) ** 2 + (gap.wallB.data.c[3] - gap.midpoint.y) ** 2;
				if (d1 < d2)
					await gap.wallB.document.update({ c: [gap.midpoint.x, gap.midpoint.y, gap.wallB.data.c[2], gap.wallB.data.c[3]] });
				else
					await gap.wallB.document.update({ c: [gap.wallB.data.c[0], gap.wallB.data.c[1], gap.midpoint.x, gap.midpoint.y] });
				// Update progress bar
				SceneNavigation.displayProgressBar({
					label: 'DF_ARCHITECT.WallGapFiller.ProgressLabel'.localize().replace('{0}', (++count).toString()).replace('{1}', wallGaps.length.toString()),
					pct: (count / wallGaps.length) * 100
				});
			}
		}
		// Remove and destroy the graphics object containing the green circles
		canvas.walls.removeChild(graphics);
		graphics.destroy({ children: true });
	}
}