
interface Document<T> {
	id: string;
	object: T;
	layer: PlaceablesLayer;
}

interface WallDocument extends Document<Wall> {}
declare namespace Scene {
	interface Data extends Entity.Data {
		walls: WallDocument[];
	}
}