declare class TooltipManager {
	activate(element: HTMLElement, { text, direction }: { text: string, direction: "UP" | "DOWN" | "LEFT" | "RIGHT" });
}

declare class InteractionLayer {
	/**
	 * Activate the InteractionLayer, deactivating other layers and marking this layer's children as interactive.
	 * @param {object} [options]      Options which configure layer activation
	 * @param {string} [options.tool]   A specific tool in the control palette to set as active
	 * @returns {InteractionLayer}    The layer instance, now activated
	 */
	 activate({tool}={});
	 /**
	 * Deactivate the InteractionLayer, removing interactivity from its children.
	 * @returns {InteractionLayer}    The layer instance, now inactive
	 */
	deactivate();
}