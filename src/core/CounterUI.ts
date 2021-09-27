export default class CounterUI extends Application {
	static get defaultOptions(): Application.Options {
		return <Application.Options>mergeObject(<Partial<Application.Options>>Application.defaultOptions, {
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
		this.element.attr('title', value);
	}

	getData(options?: any): any {
		return {
			count: this._count,
			label: this._label,
			hint: this._hint
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

	close(options: Application.CloseOptions = {}): Promise<unknown> {
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
}