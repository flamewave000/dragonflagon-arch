# Dragon Flagon Architect

![console-graphic](.assets/console-graphic.png)



Welcome to the great big Architect's Tool Suite. This module provides many many many new Quality of Life features to the Foundry Walls and Lighting layers. As well as a few extras that are just fun to have and make life a little easier.

I hate big walls of text, so I've done my best to provide some animated previews of what each feature does. I hope you enjoy what this module brings to your FoundryVTT experience!

---

**[![Become a patron](.assets/patreon-image.png)](https://www.patreon.com/bePatron?u=46113583) If you want to support me or just help me buy doggy treats! Also, you can keep up to date on what I'm working on with regular posts! I will be announcing any new modules or pre-releases there for anyone wanting to help me test things out!**

---

## Dependencies

- [Library: DF Hotkeys](https://foundryvtt.com/packages/lib-df-hotkeys/) This is used for all the key bindings for various actions.
- [libWrapper](https://foundryvtt.com/packages/lib-wrapper) This is used where ever DF Architect needs to patch FoundryVTT Core functionality. This helps it play nicer with other modules and avoid conflicts.
- [lib - ColorSettings](https://foundryvtt.com/packages/colorsettings) (Soft Dependency) You don't have to have this library installed, but it makes colour selections in the FoundryVTT modules settings much easier for you.



## General Features

These are some of the general features that are available outside of the Game Board layers

### Alternate Grid Snap

Grid snapping can be toggled to snap to box centers instead of intersections. This is useful for placing walls or similar inbetween the usual snap points without having to hold `Shift` and avoid not getting the walls ends lined up right.

> **Video**  
> Show placing a wall along curve that won't align right.
> Switch to AltSnap and place wall where you want it

### Layer Hotkeys

Layers are now mapped to keyboard shortcuts for quick switching. This is fully customizable in the module's settings.

![Layer Hotkeys](.assets\general-layer-hotkeys.png)

### Layer Quick Swap

Two layers can be mapped to a hotkey that will quickly switch back and forth between them when pressed. For example, when you're working on walls and lighting, and want to quickly switch back and forth between those two layers.

### Canvas Capture

You can now capture the current scene's canvas. Kind of like a screenshot, but it will render either the currently visible portion of the canvas visible in the browser window, or it will render the entire canvas. You can also hide individual layers from the rendered image. This is perfect for removing all lighting, weather, tokens, tiles, drawings, etc. without having to change anything to the gameboard itself. The canvas capture dialog will give you a Live Preview of this filtering in action. You can also have Walls, Light Sources, Sound Sources get rendered as if you were on those layers.

#### Hidden Tokens, Tiles, Drawings

Tokens, Tiles, and Drawings can be made "hidden" in FoundryVTT. By default, Canvas Capture will completely remove these items from the rendering. There is, however, an option to Show Hidden for each individual layer. This will render the hidden Tokens, Tiles, or Drawings to the final image.

> **Video1**  
> Go to Settings
> Display Capture dialog
> Select "Current View"
> Press "Save"
> Show still of saved image
>
> **Video2** ⬅ I can record it all at once and just copy the beginning of the first video to use for the second  
> Same as first
> Select "Entire Canvas"
> Press "Save"
> Show still of saved image
>
> **Video3**
> Show live preview of layer filtering

## Walls Features

### Lock Wall Chaining

When placing walls, you can toggle this option (either with the new "Lock Wall Chaining" button or `Alt + C` hotkey). This will make wall chaining occur without having to hold down the Ctrl key. Instead you hold the Ctrl key to start a new wall without chaining. This is a simple addition to help alleviate stress on your finger that normally has to hold that Ctrl key down when doing a long wall chain.

### Wall Type Hotkey

There now hotkeys for quickly switching to the different wall types.

![Wall Type Hotkeys](.assets\walls-walltype-hotkeys.png)

### Wall Splitting

Each selected wall segment will be divided into 2 wall segments. This can be very useful in conjunction with modules like the [Multiple Wall Point Mover (MWPM)](https://foundryvtt.com/packages/mwpm) module to quickly split a wall in two and move that joint to another place on the map.

> **Video ** 
> Show some walls on a map and click the split button a couple of times

### Wall Joining

The selected contiguous wall segments will be joined into a single wall. Useful when you have a couple of chained walls that really could just be one.

> **Video**  
> Show some walls in an arc on a map and some of them join them.
> Maybe show an overly complex section on a curved wall and join the section

## Lighting Features

### Quick Colour Picker

You can now use an eyedropper from the Light Config dialog to quickly select a colour from the current map. Great for trying to match a light colour to a material in the map like lava, water, etc.

![Quick Colour Picker Demo Video](.assets\lights-colourpicker.gif)

### Show Light Origin

If you are trying to perfectly place a light source, you're going to typically hold the Shift key to avoid snapping to the grid. Now when you hold the Shift key, the Light Source token will be replaced with a set of Crosshairs that point to the exact origin of the light source. By default the crosshairs are White, but if you also hold the Alt key, they will change to Orange (in case the white is difficult to see on your current map).

![Show Light Origin Demo Video](.assets\lights-showorigin.gif)

### Light Templating

Saving and sharing of light templates. You want to place a D&D 5e torch, you can just save the light source as a template to be placed onto the lighting layer at any time.

Light templates are stored in your Macros and can be easily placed onto the Hotbar at the bottom of the screen. Clicking the macro will automatically switch you to the Lighting Layer and activate that template (indicated by the dialog that appears on the left of the screen). This dialog displays the current configuration of the light template, and also has Edit and Cancel buttons for editing the current template, or clearing the current template selection.

When a template is selected, you can `LeftClick + Drag` like normal to place a light using all of the settings, except the Dim/Bright range (as that is determined by how far you drag with your mouse). Alternatively you can `Ctrl + LeftClick` to place a light on your mouse pointer's current position. This will use all the configured settings, including the Dim/Bright range specified in the template.

|Creating a Template from an existing Light Source|Duplicating and changing an existing Template|
| :-: | :-: |
|![Create Template Demo](.assets\lights-template-create.gif)|![Duplicate Template Demo](.assets\lights-template-duplicate.gif)|

| Using a template by Click+Dragging to set range |
| :---------------------------------------------: |
|![Click + Drag Demo](.assets\lights-template-drag.gif)|

#### Standard Light Templates

A compendium of common light templates for D&D 5e, and Pathfinder 1e & 2e. (For PF1e&2e, not pictured are the Sunrods as well, which are alphabetically at the bottom of the list).

These templates are both standard lights with pre-set Dim/Bright Ranges based on the respective rule systems. They also come with secondary pre-animated macros if you want a starting point. You can just import the macros and then edit them however you'd like (Such as adding tint colours).

|D&D 5e Light Templates|Pathfinder 1e Light Templates|Pathfinder 2e Light Templates|
|:-:|:-:|:-:|
|![Light Template Compendium D&D5e](.assets\lights-template-comp-dnd5e.png)|![Light Template Compendium PF1e](.assets\lights-template-comp-pf1e.png)|![Light Template Compendium PF2e](.assets\lights-template-comp-pf2e.png)|