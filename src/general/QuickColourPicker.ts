
class _QuickColourPicker {
	private readonly SIZE = 5;
	private readonly HALF_SIZE = Math.trunc(this.SIZE / 2);
	private _BUTTON_HTML = '';
	private _rows: NodeListOf<HTMLTableRowElement>;
	private _pixels: Uint8Array = null;
	private _colour: string | false;
	private _currentApp: Application;
	private _enabled = false;
	private _promise: { res: (colour: string | false) => void } = null;
	private _states: { id: number, minimized: boolean }[] = null;
	private _html: HTMLElement = $(`<div id="swatch">
	<table>
		${('<tr>' + ('<td></td>'.repeat(this.SIZE)) + '</tr>').repeat(this.SIZE)}
	</table>
</div>`)[0];
	private _docObserver = new MutationObserver(this._handleMutation);

	constructor() {
		this._rows = this._html.querySelectorAll('tr');
	}
	ready() {
		this._BUTTON_HTML = `<button type="button" tabindex="-1" style="flex:0 0" class="df-arch-colourpicker" title="${'DF_ARCHITECT.QuickColourPicker.EyeDrop_Title'.localize()}"><i class="fas fa-eye-dropper"></i></button>`;
		document.addEventListener('mousemove', this._handleMouseMove.bind(this));
		document.addEventListener('mousedown', this._handleMouseDownUp.bind(this));
		document.addEventListener('mouseup', this._handleMouseDownUp.bind(this));
		this._docObserver.observe(document.body, { childList: true })
	}
	private _handleMutation(mutations: MutationRecord[], observer: MutationObserver) {
		for (let mutation of mutations) {
			mutation.addedNodes.forEach(x => {
				if (!(x instanceof HTMLElement)) return;
				if (!x.classList.contains('window-app')) return;
				const element = $(x);
				const appId = parseInt(element.data('appid'));
				if (isNaN(appId)) return;
				const app = ui.windows[appId];
				element.find('input[type="color"]').each((_, x) => {
					const button = $(QuickColourPicker._BUTTON_HTML);
					button.on('click', async (event: JQuery.ClickEvent) => {
						event.preventDefault();
						const colour = await QuickColourPicker.requestColourPick(app);
						if (colour === false) return;
						$(event.currentTarget).parent().find('input[type="color"]').val(colour);
						$(event.currentTarget).parent().find('input.color').val(colour);
					})
					$(x).after(button);
				})
			});
		}
	}

	private _rightDownPosition = [0, 0];
	private _ignoreRightClick = false;
	private async _handleMouseDownUp(event: MouseEvent) {
		if (!this._enabled) return;
		if (event.button !== 0) {
			if (event.button !== 2) return;
			if (event.type === 'mouseup') {
				if (this._ignoreRightClick) return;
				this._colour = false;
				await this._completeColourRequest();
			}
			else {
				this._rightDownPosition = [event.x, event.y];
				if (event.button === 2)
					this._ignoreRightClick = false;
			}
			return;
		}
		await this._completeColourRequest();
	}

	private async _completeColourRequest() {
		$(this._html).remove();
		$(document.body).css('cursor', '');
		const result = this._colour;
		const promise = this._promise;
		this._promise = null;
		this._colour = '';
		this._enabled = false;
		this._pixels = null;
		this._currentApp = null;
		// Restore the windows that were not minimized previously
		for (let state of this._states) {
			if (state.minimized) continue;
			ui.windows[state.id].maximize();
		}
		this._states = null;
		promise.res(result);
		this._currentApp?.bringToTop();
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

	async requestColourPick(app?: Application): Promise<string | false> {
		return new Promise(async (res, _) => {
			if (this._promise != null) this._promise.res(false);
			this._promise = { res };
			this._currentApp = app;
			this._pixels = new Uint8Array(this.SIZE * this.SIZE * 4);
			document.body.appendChild(this._html);

			// Minimize all of the current windows
			if (this._states === null) {
				const promises: Promise<void>[] = [];
				this._states = [];
				for (let window of Object.values(ui.windows)) {
					// If the application does not allow minimization, ignore it
					if (!window.options.minimizable) continue;
					this._states.push({ id: window.appId, minimized: (<any>window)._minimized })
					promises.push(window.minimize());
				}
				await Promise.all(promises);
			}

			this._enabled = true;
			$(document.body).css('cursor', 'crosshair');
		});
	}
}

export const QuickColourPicker = new _QuickColourPicker();
//@ts-ignore
window.EyeDropper = { getColor: _QuickColourPicker.prototype.requestColourPick.bind(QuickColourPicker) };