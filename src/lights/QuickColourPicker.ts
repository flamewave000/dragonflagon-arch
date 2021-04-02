
class _QuickColourPicker {
	private readonly SIZE = 5;
	private readonly HALF_SIZE = Math.trunc(this.SIZE / 2);
	private rows: NodeListOf<HTMLTableRowElement>;
	private pixels: Uint8Array = null;
	private colour: string;
	private currentApp: LightConfig;
	private enabled = false;
	private html: HTMLElement = $(`<div id="swatch">
	<table>
		${('<tr>' + ('<td></td>'.repeat(this.SIZE)) + '</tr>').repeat(this.SIZE)}
	</table>
</div>`)[0];

	constructor() {
		this.rows = this.html.querySelectorAll('tr');
	}
	ready() {
		document.addEventListener('mousemove', this._handleMouseMove.bind(this));
		document.addEventListener('mousedown', this._handleMouseDown.bind(this));
		document.addEventListener('mouseup', this._handleMouseDown.bind(this));
		Hooks.on('renderLightConfig', (app: LightConfig, html: HTMLElement, data: any) => {
			this.currentApp = app;
			const button = $(`<button style="flex:0 0" title="${'DF_ARCHITECT.QuickColourPicker_EyeDrop_Title'.localize()}"><i class="fas fa-eye-dropper"></i></button>`);
			button.on('click', async (event: Event) => {
				event.preventDefault();
				this.pixels = new Uint8Array(this.SIZE * this.SIZE * 4);
				document.body.appendChild(this.html);
				await app.minimize();
				this.enabled = true;
				$(document.body).css('cursor', 'crosshair');
			});
			$(html).find('input[data-edit="tintColor"]').after(button);
		});
	}

	private _rightDownPosition = [0, 0];
	private _ignoreRightClick = false;
	private async _handleMouseDown(event: MouseEvent) {
		if (!this.enabled) return;
		if (event.button !== 0) {
			if (event.button !== 2) return;
			if (event.type === 'mouseup') {
				if (this._ignoreRightClick) return;
				this.enabled = false;
				$(this.html).remove();
				$(document.body).css('cursor', '');
				await this.currentApp.maximize();
			}
			else {
				this._rightDownPosition = [event.x, event.y];
				if (event.button === 2)
					this._ignoreRightClick = false;
			}
			return;
		}
		if (event.button !== 0) return;
		this.enabled = false;
		this.pixels = null;
		$(this.html).remove();
		$(document.body).css('cursor', '');
		this.currentApp.element.find('input[name="tintColor"]').val(this.colour);
		this.currentApp.element.find('input[data-edit="tintColor"]').val(this.colour);
		await this.currentApp.maximize();
	}

	private _handleMouseMove(event: MouseEvent) {
		if (!this.enabled) return;
		if (event.buttons === 2) {
			const deltaX = event.x - this._rightDownPosition[0];
			const deltaY = event.y - this._rightDownPosition[1];
			if (Math.sqrt((deltaX * deltaX) + (deltaY * deltaY)) > 20)
				this._ignoreRightClick = true;
		}
		const gl = (<Canvas>canvas).app.renderer.context.renderer.gl;
		gl.readPixels(event.x - this.HALF_SIZE,
			(((<Canvas>canvas).app.renderer.height - 1) - event.y) - this.HALF_SIZE,
			this.SIZE, this.SIZE, gl.RGBA,
			gl.UNSIGNED_BYTE, this.pixels);
		var hex = '';
		var x = 0;
		var y = 0;
		for (let c = 0; c < this.pixels.length; c += 4) {
			hex = "#" + ((1 << 24) + (this.pixels[c] << 16) + (this.pixels[c + 1] << 8) + this.pixels[c + 2]).toString(16).slice(1);
			x = (c / 4) % this.SIZE;
			y = (this.SIZE - 1) - Math.trunc((c / 4) / this.SIZE);
			(<HTMLElement>this.rows[y].children[x]).style.backgroundColor = hex;
			if (x == this.HALF_SIZE && y == this.HALF_SIZE) {
				const colour = (this.pixels[c] + this.pixels[c + 1] + this.pixels[c + 2]) / 3;
				if (colour > 128)
					this.html.style.setProperty('--dfarch-border', '#000');
				else
					this.html.style.setProperty('--dfarch-border', '#fff');
				this.colour = hex;
			}
		}
		this.html.style.left = event.x + 1 + 'px';
		this.html.style.top = event.y + 1 + 'px';
	}
}

export const QuickColourPicker = new _QuickColourPicker();