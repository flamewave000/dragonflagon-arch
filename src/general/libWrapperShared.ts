import ARCHITECT from "../core/architect";
import SETTINGS from "../core/settings";

type Wrapper = (...args: any) => unknown;
type Handler = (wrapped: Wrapper, ...args: any) => unknown;

class Registration {
	nextId = 0;
	wrappers = new Map<number, Handler>();

	handler(wrapped: Wrapper, ...args: any) {
		const wrappers = [...this.wrappers.values()];
		let current = (...args: any) => wrappers[0](wrapped, ...args);
		for (let c = 1; c < wrappers.length; c++) {
			const next = current;
			current = (...args: any) => wrappers[c](next, ...args);
		}
		current(...args);
	}
}

export default class libWrapperShared {
	private static registrations = new Map<string, Registration>();

	static register(target: string, handler: Handler) {
		let registration = this.registrations.get(target);
		if (!registration) {
			registration = new Registration();
			libWrapper.register(ARCHITECT.MOD_NAME, target, registration.handler.bind(registration), 'WRAPPER');
			this.registrations.set(target, registration);
		}
		const id = registration.nextId++;
		registration.wrappers.set(id, handler);
		return id;
	}

	static unregister(target: string, id: number): boolean {
		const registration = this.registrations.get(target);
		if (!registration) return false;
		registration.wrappers.delete(id);
		if (registration.wrappers.size === 0) {
			libWrapper.unregister(ARCHITECT.MOD_NAME, target, false);
			this.registrations.delete(target);
		}
		return true;
	}
}