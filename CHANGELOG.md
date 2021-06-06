# DF Architect

## Release 2.0.0 (2021-06-)
- Added Wall Endpoint Auto-Snapping when dropping a wall with the Alt key held.
- Added Dark Light placement while holding Alt key.
- Now when you have walls selected, you can hold the Ctrl Key while clicking a wall type in the Scene Controls to instantly change the selected walls to that wall type.
- ColorSettings library is now a hard dependency.
- Fixed Colour Picker so it no longer activates when you hit Enter in a config form.
- Fixed the Capture Canvas so it will no longer deadlock if an exception occurs during the extraction. Also added a warning dialog if the entire canvas is over 100MB in memory size.
- Spanish Localization - Courtesy of [lozalojo](https://github.com/lozalojo)

## Release v1.1.0 (2021-04-18)
- Fixed on-load crash when AltGridSnap is disabled.
- Fixed permission hole where players could switch to GM only layers via the layer hotkeys. Removed the layer hotkeys for non-GMs.
- Added ability to split a canvas render into parts in order to deal with overly large maps that are too big for the GPU.

## Release v1.0.0 (2021-04-09)
- Wall Split/Join: Auto select resulting walls.
- Wall Split/Join: No longer Grid Snapping.
- Canvas Capture: Added layer filtering.
- Canvas Capture: Added option to include padding in the Whole Canvas capture.
- Light Origin: Swapped default colours.
- Light Origin: Correct alignment.
- Added Hotkeys menu to DF Architect settings.
- Light Templates: Macro Directory erroneously adding buttons to sidebar.
- Alt Grid Snap: Added option to move the button from the tools column to the bottom of the controls column.
- Colour Picker: Now generic and API is exposed for other modules to use.
- ReadMe Finally finished!

## Alpha Release v0.9.0 (2021-04-04)
- General code cleanup on light templates.
- Some styling adjustments to the active template dialog.
- You can now create a light template directly from the Macro Directory.
- Standard Light Template Compendiums:
	- Light Templates: D&D5e
	- Light Templates: Pathfinder 1E
	- Light Templates: Pathfinder 2E

## Alpha Release v0.8.0 (2021-04-03)
- Light Templates! You can now create, edit, and place templated lights!

## Alpha Release v0.7.1 (2021-04-03)
- Fixed tile drag+drop issue with Alt Grid snap enabled.

## Alpha Release v0.7.0 (2021-04-02)
- Added canvas image capture. What ever the canvas currently looks like, you can capture that image and save it to a file.

## Alpha Release v0.6.0 (2021-03-29)
- Quick colour picker eyedrop tool for Light Sources.

## Alpha Release v0.5.0 (2021-03-28)
- Added light source crosshairs when holding Shift key.
- Added Bug Reporter integration in manifest.
- Added soft-dependency on "lib - Color Settings".

## Alpha Release v0.4.0 (2021-03-22)
- Added Wall Splitting
- Added Wall Joining

## Alpha Release v0.3.1 (2021-03-15)
- Removed internal Hotkeys implementation.
- Integrated DF Hotkeys library dependency.

## Alpha Release v0.3.0 (2021-03-13)
- Layer Hot Swap shortcut. You can select 2 layers that a hotkey can quickly swap between. Defaulted to `Alt + Q`.
- Added Wall Chain Lock. This essentially inverts the Ctrl key behaviour.
- Added Wall Chain Lock hotkey, defaulted to `Alt + C`.
- Added Wall Type shortcuts. These are defaulted to the keys `Shift + 1` to `Shift + 6`.

## Alpha Release v0.2.0 (2021-03-07)
- Alternate Grid Snapping now works perfectly.
- Added Toggle button to all scene control layers.
- Can be disabled in the module settings (removes the button from the scene controls).

## Alpha Release v0.1.0 (2021-03-07)
- Initial Alpha Release
- Layers now have Hotkeys assigned to quickly switch between them
