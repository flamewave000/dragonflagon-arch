export default async function(this: Tile) {
	const aw = Math.abs(this.data.width);
	const ah = Math.abs(this.data.height);
	const r = Math.toRadians(this.data.rotation);
	// Update tile appearance
	this.position.set(this.data.x, this.data.y);
	if ( this.tile ) {
		// Tile position
		this.tile.scale.x = this.data.width / this.texture.width;
		this.tile.scale.y = this.data.height / this.texture.height;
		this.tile.position.set(aw/2, ah/2);
		this.tile.rotation = r;
		// Tile appearance
		this.tile.alpha = this.data.hidden ? Math.min(0.5, this.data.alpha) : this.data.alpha;
		// if ( this.occlusionFilter ) this.occlusionFilter.uniforms.alpha = this.data.alpha;
		this.tile.tint = this.data.tint ? foundry.utils.colorStringToHex(this.data.tint) : 0xFFFFFF;
	}
	// Temporary tile background
	if ( this.bg ) this.bg.clear().beginFill(0xFFFFFF, 0.5).drawRect(0, 0, aw, ah).endFill();
	// Define bounds and update the border frame
	let bounds = ( aw === ah ) ?
		new NormalizedRectangle(0, 0, aw, ah) : // Square tiles
		NormalizedRectangle.fromRotation(0, 0, aw, ah, r); // Non-square tiles
	this.hitArea = this._controlled ? bounds.clone().pad(20) : bounds;
	this._refreshBorder(bounds);
	this._refreshHandle(bounds);
	return this;
}