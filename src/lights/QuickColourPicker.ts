
class _QuickColourPicker {
	private readonly SIZE = 5;
	private readonly HALF_SIZE = Math.trunc(this.SIZE / 2);
	private _rows: NodeListOf<HTMLTableRowElement>;
	private _pixels: Uint8Array = null;
	private _colour: string;
	private _currentApp: Application;
	private _enabled = false;
	private _promise: { res: (colour: string) => void, rej: () => void } = null;
	private _html: HTMLElement = $(`<div id="swatch">
	<table>
		${('<tr>' + ('<td></td>'.repeat(this.SIZE)) + '</tr>').repeat(this.SIZE)}
	</table>
</div>`)[0];

	constructor() {
		this._rows = this._html.querySelectorAll('tr');
	}
	ready() {
		document.addEventListener('mousemove', this._handleMouseMove.bind(this));
		document.addEventListener('mousedown', this._handleMouseDown.bind(this));
		document.addEventListener('mouseup', this._handleMouseDown.bind(this));
		Hooks.on('renderLightConfig', (app: LightConfig, html: HTMLElement, data: any) => {
			const button = $(`<button style="flex:0 0" title="${'DF_ARCHITECT.QuickColourPicker_EyeDrop_Title'.localize()}"><i class="fas fa-eye-dropper"></i></button>`);
			button.on('click', async (event: JQuery.ClickEvent) => {
				event.preventDefault();
				const colour = await this.requestColourPick(app);
				this._currentApp.element.find('input[name="tintColor"]').val(colour);
				this._currentApp.element.find('input[data-edit="tintColor"]').val(colour);
			});
			const div = $('<div class="form-fields"></div>');
			$(html).find('input[data-edit="tintColor"]').after(div);
			$(html).find('input[name="tintColor"]').remove().appendTo(div);
			$(html).find('input[data-edit="tintColor"]').remove().appendTo(div);
			button.appendTo(div);
		});
	}

	private _rightDownPosition = [0, 0];
	private _ignoreRightClick = false;
	private async _handleMouseDown(event: MouseEvent) {
		if (!this._enabled) return;
		if (event.button !== 0) {
			if (event.button !== 2) return;
			if (event.type === 'mouseup') {
				if (this._ignoreRightClick) return;
				this._enabled = false;
				$(this._html).remove();
				$(document.body).css('cursor', '');
				await this._currentApp.maximize();
			}
			else {
				this._rightDownPosition = [event.x, event.y];
				if (event.button === 2)
					this._ignoreRightClick = false;
			}
			return;
		}
		if (event.button !== 0) return;
		$(this._html).remove();
		$(document.body).css('cursor', '');
		this._promise.res(this._colour);
		this._promise = null;
		this._colour = '';
		this._enabled = false;
		this._pixels = null;
		await this._currentApp.maximize();
		this._currentApp = null;
	}

	private _handleMouseMove(event: MouseEvent) {
		if (!this._enabled) return;
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
			gl.UNSIGNED_BYTE, this._pixels);
		var hex = '';
		var x = 0;
		var y = 0;
		for (let c = 0; c < this._pixels.length; c += 4) {
			hex = "#" + ((1 << 24) + (this._pixels[c] << 16) + (this._pixels[c + 1] << 8) + this._pixels[c + 2]).toString(16).slice(1);
			x = (c / 4) % this.SIZE;
			y = (this.SIZE - 1) - Math.trunc((c / 4) / this.SIZE);
			(<HTMLElement>this._rows[y].children[x]).style.backgroundColor = hex;
			if (x == this.HALF_SIZE && y == this.HALF_SIZE) {
				const colour = (this._pixels[c] + this._pixels[c + 1] + this._pixels[c + 2]) / 3;
				if (colour > 128)
					this._html.style.setProperty('--dfarch-border', '#000');
				else
					this._html.style.setProperty('--dfarch-border', '#fff');
				this._colour = hex;
			}
		}
		this._html.style.left = event.x + 1 + 'px';
		this._html.style.top = event.y + 1 + 'px';
	}

	async requestColourPick(app: Application): Promise<string> {
		return new Promise(async (res, rej) => {
			if (this._promise != null)
				this._promise.rej();
			this._promise = { res, rej };
			this._currentApp = app;
			this._pixels = new Uint8Array(this.SIZE * this.SIZE * 4);
			document.body.appendChild(this._html);
			await app.minimize();
			this._enabled = true;
			$(document.body).css('cursor', 'crosshair');
		});
	}
}

export const QuickColourPicker = new _QuickColourPicker();