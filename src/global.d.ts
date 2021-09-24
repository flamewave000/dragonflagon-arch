
interface Document<T> {
	id: string;
	object: T;
	layer: PlaceablesLayer;
}

interface WallDocument extends Document<Wall> {
	update(data: Partial<Wall.Data>|DeepPartial<Wall.Data>): Promise<any>;
}
declare namespace Scene {
	interface Data extends Entity.Data {
		walls: WallDocument[];
		active: boolean;
		backgroundColor: string;
		darkness: number;
		description: string;
		drawings: Drawing['data'][];
		fogExploration: boolean;
		fogReset: number;
		foreground: string;
		globalLight: boolean;
		globalLightThreshold: number;
		grid: number;
		gridAlpha: number;
		gridColor: string;
		gridDistance: number;
		gridType: Const.GridType;
		gridUnits: string;
		height: number;
		img: string;
		initial: { x: number; y: number; scale: number } | null;
		journal: string | null;
		lights: AmbientLight['data'][];
		name: string;
		navName: string;
		navOrder: number;
		navigation: boolean;
		notes: Note['data'][];
		padding: number;
		permission: Entity.Permission;
		playlist: string | null;
		playlistSound: string | null;
		shiftX: number;
		shiftY: number;
		size: number;
		sort: number;
		sounds: AmbientSound['data'][];
		templates: MeasuredTemplate['data'][];
		tiles: Tile['data'][];
		tokenVision: boolean;
		tokens: Token['data'][];
		walls: Wall['data'][];
		weather: string;
		width: number;
	}
}

class AmbientLightDocument {
	constructor(data?: any, context?: any)
}

declare class Canvas {
	constructor();
	[key: string]: CanvasLayer;
	protected _dragDrop: DragDrop;
	app: PIXI.Application;
	stage: PIXI.Container;
	hud: HeadsUpDisplay;
	background: any; // TODO: BackgroundLayer
	foreground: any; // TODO: BackgroundLayer
	tiles: any; //TODO: TilesLayer
	drawings: any; //TODO: DrawingsLayer
	grid: GridLayer;
	walls: WallsLayer; //TODO: WallsLayer
	templates: any; //TODO: TemplateLayer
	notes: any; //TODO: NotesLayer
	tokens: TokenLayer;
	lighting: LightingLayer;
	sounds: any; //TODO: SoundsLayer
	sight: SightLayer;
	effects: any; //TODO: EffectsLayer
	controls: any; //TODO: ControlsLayer
	/**
	 * @defaultValue `null`
	 */
	id: string | null;
	/**
	 * @defaultValue `null`
	 */
	scene: Scene | null;
	/**
	 * @defaultValue `null`
	 */
	dimensions: Canvas.Dimensions | null;
	/**
	 * Track the timestamp of the last stage zoom operation
	 * @defaultValue `0`
	 */
	protected _zoomTime: number;
	/**
	 * Track the last automatic pan time to throttle
	 * @defaultValue `0`
	 */
	protected _panTime: number;
	/**
	 * An object of data which is temporarily cached to be reloaded after the canvas is drawn
	 * @defaultValue `{ layer: 'TokenLayer' }`
	 */
	protected _reload: { layer: string };
	/**
	 * The singleton interaction manager instance which handles mouse workflows on the Canvas
	 * @defaultValue `null`
	 */
	mouseInteractionManager: MouseInteractionManager<this['stage']> | null;
	/**
	 * A flag for whether the game Canvas is ready to be used. False if the canvas is not yet drawn, true otherwise.
	 * @defaultValue `false`
	 */
	ready: boolean;
	/**
	 * An Array of pending canvas operations which should trigger on the next re-paint
	 */
	pendingOperations: Array<[(args: any[]) => void, any, any[]]>;
	/**
	 * A Set of unique pending operation names to ensure operations are only performed once
	 */
	protected _pendingOperationNames: Set<string>;
	/**
	 * Create the layers of the game Canvas.
	 * @param stage - The primary canvas stage
	 */
	protected _createLayers(stage: PIXI.Container): void;
	/**
	 * A mapping of named CanvasLayers.
	 * This mapping is defined in the order that layers must be drawn.
	 */
	static get layers(): {
		background: any; // TODO: ConstructorOf<BackgroundLayer>
		tiles: any; // TODO: ConstructorOf<TilesLayer>
		drawings: any; // TODO: ConstructorOf<DrawingsLayer>
		grid: ConstructorOf<GridLayer>;
		walls: any; // TODO: ConstructorOf<WallsLayer>
		templates: any; // TODO: ConstructorOf<TemplateLayer>
		notes: any; // TODO: ConstructorOf<NotesLayer>
		tokens: ConstructorOf<TokenLayer>;
		lighting: ConstructorOf<LightingLayer>;
		sounds: any; // TODO: ConstructorOf<SoundsLayer>
		sight: ConstructorOf<SightLayer>;
		effects: any; // TODO: ConstructorOf<EffectsLayer>
		controls: any; // TODO: ConstructorOf<ControlsLayer>
	} & Partial<Record<string, ConstructorOf<CanvasLayer>>>;
	/**
	 * An Array of all CanvasLayer instances which are active on the Canvas board
	 */
	get layers(): CanvasLayer[];
	/**
	 * Return a reference to the active Canvas Layer
	 */
	get activeLayer(): CanvasLayer | null;
	/**
	 * When re-drawing the canvas, first tear down or discontinue some existing processes
	 */
	tearDown(): Promise<void>;
	/**
	 * Draw the game canvas.
	 * @returns A Promise which resolves once the Canvas is fully drawn
	 */
	draw(scene?: Scene): Promise<this>;
	/**
	 * Get the canvas active dimensions based on the size of the scene's map.
	 * We expand the image size by a factor of 1.5 and round to the nearest 2x grid size.
	 * The rounding accomplishes that the padding buffer around the map always contains whole grid spaces.
	 * @param data - The scene dimensions data being established
	 */
	static getDimensions(data: Canvas.DimensionsData): Canvas.Dimensions;
	/**
	 * Once the canvas is drawn, initialize control, visibility, and audio states
	 */
	protected _initialize(): Promise<void>;
	/**
	 * Initialize all lighting, vision, and sound sources for the Scene.
	 */
	initializeSources(): void;
	/**
	 * Initialize the starting view of the canvas stage
	 * If we are re-drawing a scene which was previously rendered, restore the prior view position
	 * Otherwise set the view to the top-left corner of the scene at standard scale
	 */
	protected _initializeCanvasPosition(): void;
	/**
	 * Initialize a CanvasLayer in the activation state
	 */
	protected _initializeCanvasLayer(): void;
	/**
	 * Initialize a token or set of tokens which should be controlled.
	 * Restore controlled and targeted tokens from before the re-draw.
	 */
	protected _initializeTokenControl(): void;
	/**
	 * Get a reference to the a specific CanvasLayer by it's name
	 * @param layerName - The name of the canvas layer to get
	 */
	getLayer(layerName: string): CanvasLayer | null;
	/**
	 * Given an embedded object name, get the canvas layer for that object
	 */
	protected getLayerByEmbeddedName<T extends string>(
		embeddedName: T
	): T extends keyof Canvas.EmbeddedEntityNameToLayerMap ? Canvas.EmbeddedEntityNameToLayerMap[T] : null;
	/**
	 * Pan the canvas to a certain \{x,y\} coordinate and a certain zoom level
	 * @param x     - The x-coordinate of the pan destination
	 * @param y     - The y-coordinate of the pan destination
	 * @param scale - The zoom level (max of CONFIG.Canvas.maxZoom) of the action
	 */
	pan({ x, y, scale }?: Canvas.ViewPan): void;
	/**
	 * Animate panning the canvas to a certain destination coordinate and zoom scale
	 * Customize the animation speed with additional options
	 * Returns a Promise which is resolved once the animation has completed
	 *
	 * @param x        - The destination x-coordinate
	 * @param y        - The destination y-coordinate
	 * @param scale    - The destination zoom scale
	 * @param duration - The total duration of the animation in milliseconds; used if speed is not set
	 * @param speed    - The speed of animation in pixels per second; overrides duration if set
	 * @returns A Promise which resolves once the animation has been completed
	 */
	animatePan({ x, y, scale, duration, speed }?: Canvas.AnimatedViewPan): Promise<void>;
	/**
	 * Get the constrained zoom scale parameter which is allowed by the maxZoom parameter
	 * @param x     - The requested x-coordinate
	 * @param y     - The requested y-coordinate
	 * @param scale - The requested scale
	 * @returns The allowed scale
	 */
	protected _constrainView({ x, y, scale }: Canvas.ViewPan): Canvas.View;
	/**
	 * Update the blur strength depending on the scale of the canvas stage
	 */
	protected _updateBlur(scale: number): void;
	/**
	 * Recenter the canvas
	 * Otherwise, pan the stage to put the top-left corner of the map in the top-left corner of the window
	 */
	recenter(coordinates?: Canvas.ViewPan | null): void;
	/**
	 * Attach event listeners to the game canvas to handle click and interaction events
	 */
	protected _addListeners(): void;
	/**
	 * Handle left mouse-click events occurring on the Canvas stage or its active Layer.
	 * @see {@link MouseInteractionManager#_handleClickLeft}
	 */
	protected _onClickLeft(event: PIXI.InteractionEvent): void;
	/**
	 * Handle double left-click events occurring on the Canvas stage.
	 * @see {@link MouseInteractionManager#_handleClickLeft2}
	 */
	protected _onClickLeft2(event: PIXI.InteractionEvent): void;
	/**
	 * Handle the beginning of a left-mouse drag workflow on the Canvas stage or its active Layer.
	 * @see {@link MouseInteractionManager#_handleDragStart}
	 */
	protected _onDragLeftStart(event: PIXI.InteractionEvent): void;
	/**
	 * Handle mouse movement events occurring on the Canvas stage or it's active layer
	 * @see {@link MouseInteractionManager#_handleDragMove}
	 */
	protected _onDragLeftMove(event: PIXI.InteractionEvent): void;
	/**
	 * Handle the conclusion of a left-mouse drag workflow when the mouse button is released.
	 * @see {@link MouseInteractionManager#_handleDragDrop}
	 */
	protected _onDragLeftDrop(event: PIXI.InteractionEvent): void;
	/**
	 * Handle the cancellation of a left-mouse drag workflow
	 * @see {@link MouseInteractionManager#_handleDragCancel}
	 */
	protected _onDragLeftCancel(event: PointerEvent): void;
	/**
	 * Handle right mouse-click events occurring on the Canvas stage or it's active layer
	 * @see {@link MouseInteractionManager#_handleClickRight}
	 */
	protected _onClickRight(event: PIXI.InteractionEvent): void;
	/**
	 * Handle right-mouse drag events occuring on the Canvas stage or an active Layer
	 * @see {@link MouseInteractionManager#_handleDragMove}
	 */
	protected _onDragRightMove(event: PIXI.InteractionEvent): void;
	/**
	 * Handle the conclusion of a right-mouse drag workflow the Canvas stage.
	 * @see {@link MouseInteractionManager#_handleDragDrop}
	 * @param event - (unused)
	 */
	protected _onDragRightDrop(event: PIXI.InteractionEvent): void;
	/**
	 * Determine selection coordinate rectangle during a mouse-drag workflow
	 */
	protected _onDragSelect(event: PIXI.InteractionEvent): void;
	/**
	 * Pan the canvas view when the cursor position gets close to the edge of the frame
	 * @param event - The originating mouse movement event
	 */
	protected _onDragCanvasPan(event: MouseEvent): Promise<void> | void;
	/**
	 * Handle window resizing with the dimensions of the window viewport change
	 * @param event - The Window resize event
	 *                (default: `null`)
	 */
	protected _onResize(event?: Event | null): void;
	/**
	 * Handle mousewheel events which adjust the scale of the canvas
	 * @param event - The mousewheel event that zooms the canvas
	 */
	protected _onMouseWheel(event: WheelEvent): void;
	/**
	 * Event handler for the drop portion of a drag-and-drop event.
	 */
	protected _onDrop(event: DragEvent): boolean;
	/**
	 * Add a pending canvas operation that should fire once the socket handling workflow concludes.
	 * This registers operations by a unique string name into a queue - avoiding repeating the same work multiple times.
	 * This is especially helpful for multi-object updates to avoid costly and redundant refresh operations.
	 * @param name  - A unique name for the pending operation, conventionally Class.method
	 * @param fn    - The unbound function to execute later
	 * @param scope - The scope to which the method should be bound when called
	 * @param args  - Arbitrary arguments to pass to the method when called
	 */
	addPendingOperation<S = any, A = any[]>(name: string, fn: (this: S, args: A) => void, scope: S, args: A): void;
	/**
	 * Fire all pending functions that are registered in the pending operations queue and empty it.
	 */
	triggerPendingOperations(): void;
}

declare class Scene extends Entity<Scene.Data> {

	deleteEmbeddedDocuments(documentName: string, ids: string[], options?: any): Promise<unknown>;
	createEmbeddedDocuments(documentName: string, data: object[], options?: any): Promise<WallDocument[]>;
	/**
	 * Track whether the scene is the active view
	 */
	_view: boolean;
	/**
	 * Track the viewed position of each scene (while in memory only, not persisted)
	 * When switching back to a previously viewed scene, we can automatically pan to the previous position.
	 * Object with keys: x, y, scale
	 */
	_viewPosition: {
		x: number;
		y: number;
		scale: number;
	};
	static get config(): Entity.Config<Scene>;
	/** @override */
	prepareData(): Scene.Data;
	/** @override */
	prepareEmbeddedEntities(): void;
	/* -------------------------------------------- */
	/*  Properties                                  */
	/* -------------------------------------------- */
	/**
	 * A convenience accessor for the background image of the Scene
	 */
	get img(): string;
	/**
	 * A convenience accessor for whether the Scene is currently active
	 */
	get active(): boolean;
	/**
	 * A convenience accessor for whether the Scene is currently viewed
	 */
	get isView(): boolean;
	/**
	 * A reference to the JournalEntry entity associated with this Scene, or null
	 * @returns
	 */
	get journal(): JournalEntry | null;
	/**
	 * A reference to the Playlist entity for this Scene, or null
	 */
	get playlist(): Playlist | null;
	get walls(): Map<string, Wall> | null;
	/**
	 * Set this scene as the current view
	 * @returns
	 */
	view(): Promise<void>;
	/**
	 * Set this scene as currently active
	 * @returns A Promise which resolves to the current scene once it has been successfully activated
	 */
	activate(): Promise<this>;
	/* -------------------------------------------- */
	/*  Socket Listeners and Handlers               */
	/* -------------------------------------------- */
	/** @override */
	clone(createData?: DeepPartial<Scene.Data>, options?: Entity.CreateOptions): Promise<this>;
	/** @override */
	static create<T extends Scene, U>(
		this: ConstructorOf<T>,
		data: Expanded<U> extends DeepPartial<T['_data']> ? U : DeepPartial<T['_data']>,
		options?: Entity.CreateOptions
	): Promise<T | null>;
	static create<T extends Scene, U>(
		this: ConstructorOf<T>,
		data: Expanded<U> extends DeepPartial<T['_data']> ? Array<U> : Array<DeepPartial<T['_data']>>,
		options?: Entity.CreateOptions
	): Promise<T | T[] | null>;
	/** @override */
	update<U>(
		data: Expanded<U> extends DeepPartial<this['_data']> ? U : never,
		options: Entity.UpdateOptions
	): Promise<this>;
	update(data: DeepPartial<this['_data']>, options: Entity.UpdateOptions): Promise<this>;
	/** @override */
	protected _onCreate(data: this['_data'], options: any, userId: string): void;
	/** @override */
	protected _onUpdate(data: DeepPartial<this['_data']>, options: Entity.UpdateOptions, userId: string): void;
	/** @override */
	protected _onDelete(options: Entity.DeleteOptions, userId: string): void;
	/**
	 * Handle Scene activation workflow if the active state is changed to true
	 */
	protected _onActivate(active: boolean): void;
	/** @override */
	protected _onCreateEmbeddedEntity(embeddedName: string, child: any, options: any, userId: string): void;
	/** @override */
	protected _onUpdateEmbeddedEntity(
		embeddedName: string,
		child: any,
		updateData: any,
		options: any,
		userId: string
	): void;
	/** @override */
	protected _onDeleteEmbeddedEntity(embeddedName: string, child: any, options: any, userId: string): void;
	/** @override */
	protected _onModifyEmbeddedEntity(
		embeddedName: string,
		changes: any[],
		options: any,
		userId: string,
		context?: any
	): void;
	/* -------------------------------------------- */
	/*  History Storage Handlers                    */
	/* -------------------------------------------- */
	/** @override */
	protected static _handleCreateEmbeddedEntity({ request, result, userId }: any): any[];
	/** @override */
	protected static _handleUpdateEmbeddedEntity({ request, result, userId }: any): any[];
	/** @override */
	protected static _handleDeleteEmbeddedEntity({ request, result, userId }: any): any[];
	/* -------------------------------------------- */
	/*  Importing and Exporting                     */
	/* -------------------------------------------- */
	/** @override */
	toCompendium(): Promise<any>;
	/**
	 * Create a 300px by 100px thumbnail image for this scene background
	 * @param img    - A background image to use for thumbnail creation, otherwise the current scene
	 *                 background is used.
	 * @param width  - The desired thumbnail width. Default is 300px
	 * @param height - The desired thumbnail height. Default is 100px;
	 * @returns The created thumbnail data.
	 */
	createThumbnail({
		img,
		width,
		height
	}: {
		img: string | null;
		width?: number;
		height?: number;
	}): Promise<ImageHelper.ThumbnailReturn>;
}


declare class Wall extends PlaceableObject<Wall.Data> {
	document: WallDocument;
	/**
	 * @remarks Not used for `Wall`
	 */
	controlIcon: null;
	/**
	 * @remarks Type is `MouseInteractionManager<this, this['endpoints']>`
	 */
	mouseInteractionManager: MouseInteractionManager<this, any> | null;
	/**
	 * An reference the Door Control icon associated with this Wall, if any
	 */
	protected doorControl: DoorControl | null;
	/** @override */
	static get embeddedName(): 'Wall';
	/**
	 * A convenience reference to the coordinates Array for the Wall endpoints, [x0,y0,x1,y1].
	 */
	get coords(): Wall.Data['c'];
	/** @override */
	get bounds(): NormalizedRectangle;
	/**
	 * Return the coordinates [x,y] at the midpoint of the wall segment
	 */
	get midpoint(): [number, number];
	/** @override */
	get center(): PIXI.Point;
	/**
	 * Get the direction of effect for a directional Wall
	 * @returns The angle of wall effect
	 */
	get direction(): number | null;
	directionIcon: null | PIXI.Sprite;
	line: null | PIXI.Graphics;
	/**
	 * This helper converts the wall segment to a Ray
	 * @returns The wall in Ray representation
	 */
	toRay(): Ray;
	/** @override */
	draw(): Promise<this>;
	endpoints: PIXI.Graphics;
	/** @override */
	protected _createInteractionManager(): NonNullable<this['mouseInteractionManager']>;
	/** @override */
	activateListeners(): void;
	/**
	 * Draw a directional prompt icon for one-way walls to illustrate their direction of effect.
	 * @returns The drawn icon
	 */
	_drawDirection(): PIXI.Sprite; // TODO: returning void may be unreachable
	/** @override */
	refresh(): this;
	/**
	 * Compute an approximate Polygon which encloses the line segment providing a specific hitArea for the line
	 * @param coords - The original wall coordinates
	 * @param pad    - The amount of padding to apply
	 * @returns A constructed Polygon for the line
	 */
	protected _getWallHitPolygon(coords: [number, number, number, number], pad: number): PIXI.Polygon;
	/**
	 * Given the properties of the wall - decide upon a color to render the wall for display on the WallsLayer
	 */
	_getWallColor(): number;
	/** @override */
	protected _onControl({ chain }?: { chain?: boolean }): void;
	/** @override */
	protected _onRelease(): void;
	/** @override */
	destroy(options?: { children?: boolean; texture?: boolean; baseTexture?: boolean }): void;
	/**
	 * Test whether the Wall direction lies between two provided angles
	 * This test is used for collision and vision checks against one-directional walls
	 */
	isDirectionBetweenAngles(lower: number, upper: number): boolean;
	/**
	 * A simple test for whether a Ray can intersect a directional wall
	 * @param ray - The ray to test
	 * @returns Can an intersection occur?
	 */
	canRayIntersect(ray: Ray): boolean;
	/**
	 * Get an Array of Wall objects which are linked by a common coordinate
	 * @returns An object reporting ids and endpoints of the linked segments
	 */
	getLinkedSegments(): {
		ids: string;
		walls: Wall[];
		endpoints: Array<[number, number]>;
	};
	/** @override */
	protected _onCreate(): void;
	/** @override */
	protected _onUpdate(data: Wall.Data): void;
	/** @override */
	protected _onDelete(): void;
	/**
	 * Callback actions when a wall that contains a door is moved or its state is changed
	 * @param doorChange - Update vision and sound restrictions
	 */
	protected _onModifyWall(doorChange?: boolean): Promise<void>;
	/** @override */
	protected _canControl(user?: User, event?: PIXI.InteractionEvent): boolean;
	/** @override */
	protected _onHoverIn(event: PIXI.InteractionEvent, options?: { hoverOutOthers: boolean }): void;
	/** @override */
	protected _onHoverOut(event: PIXI.InteractionEvent): void;
	/**
	 * Handle mouse-hover events on the line segment itself, pulling the Wall to the front of the container stack
	 */
	protected _onMouseOverLine(event: PIXI.InteractionEvent): void;
	/** @override */
	protected _onClickLeft(event: PIXI.InteractionEvent): boolean;
	/** @override */
	protected _onClickLeft2(event: PIXI.InteractionEvent): void;
	/** @override */
	protected _onClickRight2(event: PIXI.InteractionEvent): void;
	/** @override */
	protected _onDragLeftStart(event: PIXI.InteractionEvent): void;
	/** @override */
	protected _onDragLeftMove(event: PIXI.InteractionEvent): void;
	/** @override */
	protected _onDragLeftDrop(event: PIXI.InteractionEvent): Promise<any>;
}
declare namespace Wall {
	interface Data extends PlaceableObject.Data {
		/**
		 * Coordinates of the endpoints
		 */
		c: [number, number, number, number];
		/**
		 * 0 - both
		 * 1 - left
		 * 2 - right
		 */
		dir?: Const.WallDirection;
		/**
		 * 0 - wall
		 * 1 - door
		 * 2 - secret
		 */
		door: Const.WallDoorType;
		/**
		 * 0 - closed
		 * 1 - open
		 * 2 - locked
		 */
		ds: Const.WallDoorState;
		/**
		 * 0 - blocked
		 * 1 - allowed
		 */
		move: Const.WallMovementType;
		/**
		 * 0 - opaque
		 * 1 - transparent
		 * 2 - terrain
		 */
		sense: Const.WallSenseType;
	}
}