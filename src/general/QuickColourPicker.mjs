
class _QuickColourPicker {
	/**@readonly*/ #SIZE = 5;
	/**@readonly*/ #HALF_SIZE = Math.trunc(this.#SIZE / 2);
	/**@type {}*/#BUTTON_HTML = '';
	/**@type {NodeListOf<HTMLTableRowElement>}*/#rows;
	/**@type {Uint8Array|null}*/#pixels = null;
	/**@type {string | false}*/#colour;
	/**@type {Application}*/#currentApp;
	/**@type {boolean}*/#enabled = false;
	/**@type { { res: (colour: string | false) => void }}*/#promise = null;
	/**@type { { id: number, minimized: boolean }[]}*/#states = null;
	/**@type {HTMLElement}*/#html = $(`<div id="swatch">
	<table>
		${('<tr>' + ('<td></td>'.repeat(this.#SIZE)) + '</tr>').repeat(this.#SIZE)}
	</table>
</div>`)[0];
	#docObserver = new MutationObserver(this.#handleMutation);

	constructor() {
		this.#rows = this.#html.querySelectorAll('tr');
	}
	ready() {
		this.#BUTTON_HTML = `<button type="button" class="df-arch-colourpicker" data-tooltip="${'DF_ARCHITECT.QuickColourPicker.EyeDrop_Title'.localize()}"><i class="fas fa-eye-dropper"></i></button>`;
		document.addEventListener('mousemove', this.#handleMouseMove.bind(this));
		document.addEventListener('mousedown', this.#handleMouseDownUp.bind(this));
		document.addEventListener('mouseup', this.#handleMouseDownUp.bind(this));
		this.#docObserver.observe(document.body, { childList: true })
	}
	/**
	 * @param {MutationRecord[]} mutations
	 * @param {MutationObserver} _observer
	 */
	#handleMutation(mutations, _observer) {
		for (let mutation of mutations) {
			mutation.addedNodes.forEach(x => {
				if (!(x instanceof HTMLElement)) return;
				if (!x.classList.contains('window-app')) return;
				const element = $(x);
				const appId = parseInt(element.data('appid'));
				if (isNaN(appId)) return;
				const app = ui.windows[appId];
				element.find('color-picker > input[type="text"]').each((_, x) => {
					const button = $(QuickColourPicker.#BUTTON_HTML);
					button.on('click', async event => {
						event.preventDefault();
						const colour = await QuickColourPicker.requestColourPick(app);
						if (colour === false) return;
						const parent = $(event.currentTarget).parent();
						parent.find('input[type="text"]').val(colour);
						parent.find('input[type="color"]').val(colour);
						parent.val(colour).trigger("change");
					})
					$(x).after(button);
				})
			});
		}
	}

	#rightDownPosition = [0, 0];
	#ignoreRightClick = false;
	/**
	 * @param {MouseEvent} event
	 * @returns {Promise<void>}
	 */
	async #handleMouseDownUp(event) {
		if (!this.#enabled) return;
		if (event.button !== 0) {
			if (event.button !== 2) return;
			if (event.type === 'mouseup') {
				if (this.#ignoreRightClick) return;
				this.#colour = false;
				await this.#completeColourRequest();
			}
			else {
				this.#rightDownPosition = [event.x, event.y];
				if (event.button === 2)
					this.#ignoreRightClick = false;
			}
			return;
		}
		await this.#completeColourRequest();
	}

	async #completeColourRequest() {
		$(this.#html).remove();
		$(document.body).css('cursor', '');
		const result = this.#colour;
		const promise = this.#promise;
		this.#promise = null;
		this.#colour = '';
		this.#enabled = false;
		this.#pixels = null;
		this.#currentApp = null;
		// Restore the windows that were not minimized previously
		for (let state of this.#states) {
			if (state.minimized) continue;
			ui.windows[state.id].maximize();
		}
		this.#states = null;
		promise.res(result);
		this.#currentApp?.bringToTop();
	}

	/**@param {MouseEvent} event*/
	#handleMouseMove(event) {
		if (!this.#enabled) return;
		if (event.buttons === 2) {
			const deltaX = event.x - this.#rightDownPosition[0];
			const deltaY = event.y - this.#rightDownPosition[1];
			if (Math.sqrt((deltaX * deltaX) + (deltaY * deltaY)) > 20)
				this.#ignoreRightClick = true;
		}
		/**@type {WebGL2RenderingContext}*/
		const gl = canvas.app.renderer.context.renderer.buffer.gl;
		gl.readPixels(event.x - this.#HALF_SIZE,
			((canvas.app.renderer.height - 1) - event.y) - this.#HALF_SIZE,
			this.#SIZE, this.#SIZE, gl.RGBA,
			gl.UNSIGNED_BYTE, this.#pixels);
		var hex = '';
		var x = 0;
		var y = 0;
		for (let c = 0; c < this.#pixels.length; c += 4) {
			hex = "#" + ((1 << 24) + (this.#pixels[c] << 16) + (this.#pixels[c + 1] << 8) + this.#pixels[c + 2]).toString(16).slice(1);
			x = (c / 4) % this.#SIZE;
			y = (this.#SIZE - 1) - Math.trunc((c / 4) / this.#SIZE);
			this.#rows[y].children[x].style.backgroundColor = hex;
			if (x == this.#HALF_SIZE && y == this.#HALF_SIZE) {
				const colour = (this.#pixels[c] + this.#pixels[c + 1] + this.#pixels[c + 2]) / 3;
				if (colour > 128)
					this.#html.style.setProperty('--dfarch-border', '#000');
				else
					this.#html.style.setProperty('--dfarch-border', '#fff');
				this.#colour = hex;
			}
		}
		this.#html.style.left = event.x + 1 + 'px';
		this.#html.style.top = event.y + 1 + 'px';
	}

	/**
	 * @param {Application} [app]
	 * @returns {Promise<string|false>}
	 */
	async requestColourPick(app) {
		return new Promise(async (res, _) => {
			if (this.#promise != null) this.#promise.res(false);
			this.#promise = { res };
			this.#currentApp = app;
			this.#pixels = new Uint8Array(this.#SIZE * this.#SIZE * 4);
			document.body.appendChild(this.#html);

			// Minimize all of the current windows
			if (this.#states === null) {
				/**@type {Promise<void>[]}*/
				const promises = [];
				this.#states = [];
				for (let window of Object.values(ui.windows)) {
					// If the application does not allow minimization, ignore it
					if (!window.options.minimizable) continue;
					this.#states.push({ id: window.appId, minimized: window._minimized })
					promises.push(window.minimize());
				}
				await Promise.all(promises);
			}

			this.#enabled = true;
			$(document.body).css('cursor', 'crosshair');
		});
	}
}

export const QuickColourPicker = new _QuickColourPicker();
//@ts-ignore
window.EyeDropper = { getColor: _QuickColourPicker.prototype.requestColourPick.bind(QuickColourPicker) };