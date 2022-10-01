import { AmbientLightData } from "@league-of-foundry-developers/foundry-vtt-types/src/foundry/common/data/data.mjs";
import ARCHITECT from "../core/architect";
import CounterUI from "../core/CounterUI";
import SETTINGS from "../core/settings";

export default class LightCounter {
	private static _counter = new CounterUI(0, 'Lights');
	static ready() {
		libWrapper.register(ARCHITECT.MOD_NAME, 'LightingLayer.prototype.activate', (wrapped: Function) => {
			wrapped();
			this.updateCount();
			if (SETTINGS.get('General.ShowCounters'))
				this._counter.render(true);
		}, 'WRAPPER');
		libWrapper.register(ARCHITECT.MOD_NAME, 'LightingLayer.prototype.deactivate', (wrapped: Function) => {
			wrapped();
			if (this._counter.rendered)
				this._counter.close();
		}, 'WRAPPER');
		Hooks.on('createAmbientLight', () => this.updateCount());
		Hooks.on('updateAmbientLight', () => this.updateCount());
		Hooks.on('deleteAmbientLight', () => this.updateCount());
	}

	static updateCount() {
		if (!SETTINGS.get('General.ShowCounters')) return;
		const objects = canvas.lighting.objects.children as AmbientLight[];
		this._counter.count = objects.length;
		var normal = 0;
		var unrestrained = 0;
		var normalVision = 0;
		var unrestrainedVision = 0;
		objects.forEach(x => {
			const t = ((x.document as AmbientLightData).vision ? 0x10 : 0x00) | ((x.document as AmbientLightData).walls ? 0x1 : 0x0);
			if (t == 0x01) normal++;
			else if (t == 0x11) normalVision++;
			else if (t == 0x00) unrestrained++;
			else if (t == 0x10) unrestrainedVision++;
		});
		this._counter.hint = `Normal: ${normal}
Provides Vision: ${normalVision}
Unrestrained: ${unrestrained}
Unrestrained & Provides Vision: ${unrestrainedVision}`;
	}
}