import ARCHITECT from "./architect.mjs";

export default class CounterUI extends Application {
	static get defaultOptions(): ApplicationOptions {
		return <ApplicationOptions>mergeObject(<Partial<ApplicationOptions>>Application.defaultOptions, {
			title: null,
			height: 100,
			width: 100,
			minimizable: false,
			resizable: false,
			template: `modules/df-architect/templates/counter-ui.hbs`,
			popOut: false,
		});
	}
	private _count: number = 0;
	private _label: string = '';
	private _hint: string = '';

	static init() {
		// Do not wrap these calls if lib-df-buttons is enabled
		if (game.modules.get('lib-df-buttons')?.active) return;
		libWrapper.register(ARCHITECT.MOD_NAME, 'Sidebar.prototype.expand', function (this: Sidebar, wrapped: Function) {
			Hooks.callAll('collapseSidebarPre', this, !this._collapsed);
			wrapped();
		}, 'WRAPPER');
		libWrapper.register(ARCHITECT.MOD_NAME, 'Sidebar.prototype.collapse', function (this: Sidebar, wrapped: Function) {
			Hooks.callAll('collapseSidebarPre', this, !this._collapsed);
			wrapped();
		}, 'WRAPPER');
	}

	constructor(count: number, label: string) {
		super();
		this._count = count;
		this.label = label;
	}

	get count(): number {
		return this._count;
	}
	set count(value: number) {
		this._count = value;
		this.element.find('#count').val(value);
	}
	get label(): string {
		return this._label;
	}
	set label(value: string) {
		this._label = value;
		this.element.find('#label').val(value);
	}
	get hint(): string {
		return this._hint;
	}
	set hint(value: string) {
		this._hint = value;
	}

	getData(options?: any): any {
		return {
			count: this._count,
			label: this._label
		};
	}

	_injectHTML(html: JQuery) {
		document.body.appendChild(html[0]);
		this._element = html;
		const width = html[0].offsetWidth;
		html.css('width', '0');
		html.animate({
			padding: '.5em 1em',
			width: `${width}px`
		}, 200, () => {
			html.css('width', '');
		});
	}

	async _render(force = false, options = {}): Promise<void> {
		Hooks.on('collapseSidebarPre', this._handleSidebarCollapse.bind(this));
		await super._render(force, options);
		if ((<any>ui.sidebar)._collapsed) {
			this.element.css('right', '35px');
		}

		/**
		 * This catches if the FPS Meter module is enabled and displaying its counter
		 */
		if (game.modules.get('fpsmeter')?.active) {
			const fpsCounter = document.querySelector<HTMLElement>('div.fpsCounter');
			const fpsT = fpsCounter.offsetTop;
			const fpsB = fpsT + fpsCounter.offsetHeight;
			const cuiT = this.element[0].offsetTop - 5; // Add a 5px margin to the top
			const cuiH = this.element[0].offsetHeight + 5; // account for margin
			// If we are touching, push us down to be 5px below the counter
			if ((fpsT <= cuiT && fpsB >= cuiT)
				|| (fpsT >= cuiT && fpsT <= cuiH)
				|| (fpsB >= cuiT && fpsB <= cuiH)) {
				this.element[0].style.top = `${fpsB + 5}px`;
			}
		}
		/**
		 * This catches the existance of the [Library: DF Module Buttons] module
		 * and places ourselves at the bottom of the Sidebar instead of the top.
		 */
		if (game.modules.get('lib-df-buttons')?.active) {
			this.element[0].style.top = 'unset';
			this.element[0].style.bottom = '8px';
		}

		// Add listener for activating the tooltip
		this.element.on('pointerenter', (e: any) => ((<any>game).tooltip as TooltipManager).activate(e.target, { text: this._hint, direction: "LEFT" }));
	}

	close(options: Application.CloseOptions = {}): Promise<void> {
		Hooks.off('collapseSidebarPre', this._handleSidebarCollapse.bind(this));
		/**********************************/
		/****** COPIED FROM FOUNDRY *******/
		/**********************************/
		const states = Application.RENDER_STATES;
		if (!options.force && ![states.RENDERED, states.ERROR].includes(<any>this._state)) return undefined;
		this._state = states.CLOSING;

		// Get the element
		let el = this.element;
		if (!el) return <any>(this._state = states.CLOSED);
		el.css({ minHeight: 0 });

		// Dispatch Hooks for closing the base and subclass applications
		for (let cls of (<any>this.constructor)._getInheritanceChain()) {

			/**
			 * A hook event that fires whenever this Application is closed.
			 * @function closeApplication
			 * @memberof hookEvents
			 * @param {Application} app                     The Application instance being closed
			 * @param {jQuery[]} html                       The application HTML when it is closed
			 */
			Hooks.call(`close${cls.name}`, this, el);
		}
		/**********************************/
		/******* FOUNDRY CODE END *********/
		/**********************************/

		// Animate closing the element
		return new Promise<void>(resolve => {
			el.animate({
				padding: '.5em 0',
				width: '0'
			}, 200, () => {
				el.remove();
				// Clean up data
				this._element = null;
				delete ui.windows[this.appId];
				this._minimized = false;
				this._scrollPositions = null;
				this._state = states.CLOSED;
				resolve();
			});
		});
	}

	private _handleSidebarCollapse(sideBar: Sidebar, collapsed: boolean) {
		if (collapsed) {
			this.element.delay(250).animate({ right: '35px' }, 150);
		} else {
			this.element.animate({ right: '305px' }, 150);
		}
	}
}