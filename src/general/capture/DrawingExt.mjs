export default async function (this: Drawing) {
	// @ts-ignore
	if (this._destroyed || this.shape._destroyed) return;
	const isTextPreview = (this.data.type === CONST.DRAWING_TYPES.TEXT) && this._controlled;
	this.shape.clear();

	// Outer Stroke
	if (this.data.strokeWidth || isTextPreview) {
		let sc = foundry.utils.colorStringToHex(this.data.strokeColor || "#FFFFFF");
		const sw = isTextPreview ? 8 : this.data.strokeWidth ?? 8;
		this.shape.lineStyle(sw, sc, this.data.strokeAlpha ?? 1);
	}

	// Fill Color or Texture
	if (this.data.fillType || isTextPreview) {
		const fc = foundry.utils.colorStringToHex(this.data.fillColor || "#FFFFFF");
		// @ts-ignore
		if ((this.data.fillType === CONST.DRAWING_FILL_TYPES.PATTERN) && this.texture) {
			this.shape.beginTextureFill({
				// @ts-ignore
				texture: this.texture,
				color: fc || 0xFFFFFF,
				alpha: fc ? this.data.fillAlpha : 1
			});
		} else {
			const fa = isTextPreview ? 0.25 : this.data.fillAlpha;
			this.shape.beginFill(fc, fa);
		}
	}

	// Draw the shape
	switch (this.data.type) {
		case CONST.DRAWING_TYPES.RECTANGLE:
		case CONST.DRAWING_TYPES.TEXT:
			this._drawRectangle();
			break;
		case CONST.DRAWING_TYPES.ELLIPSE:
			this._drawEllipse();
			break;
		case CONST.DRAWING_TYPES.POLYGON:
			this._drawPolygon();
			break;
		case CONST.DRAWING_TYPES.FREEHAND:
			this._drawFreehand();
			break;
	}

	// Conclude fills
	this.shape.lineStyle(0x000000, 0.0).closePath();
	this.shape.endFill();

	// Set shape rotation, pivoting about the non-rotated center
	this.shape.pivot.set(this.data.width / 2, this.data.height / 2);
	this.shape.position.set(this.data.width / 2, this.data.height / 2);
	this.shape.rotation = Math.toRadians(this.data.rotation || 0);

	// Update text position and visibility
	if (this.text) {
		this.text.alpha = this.data.textAlpha ?? 1.0;
		this.text.pivot.set(this.text.width / 2, this.text.height / 2);
		this.text.position.set(
			(this.text.width / 2) + ((this.data.width - this.text.width) / 2),
			(this.text.height / 2) + ((this.data.height - this.text.height) / 2)
		);
		this.text.rotation = this.shape.rotation;
	}
	// Toggle visibility
	this.position.set(this.data.x, this.data.y);
	// this.drawing.hitArea = bounds;
	this.alpha = 1;
}