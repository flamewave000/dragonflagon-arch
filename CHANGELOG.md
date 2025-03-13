# DF Architect

## Release 5.0.0 (2025-03-10)
- **UPDATE:** Migrated to v12.
- **UPDATE:** Downgraded TS -> JS (such sad).
- **UNAVAILABLE:** Light Templates: Will be available in subsequent release.
- **UNAVAILABLE:** Gameboard Capture: May not be made available.
- **UNAVAILABLE:** Tile Flattener: May not be made available.

## Release 4.0.0 (2022-10-01)
- **NEW:** 90% of the core features have been migrated to V10. All but the Canvas Capture and Tile Flattener.
- **UPDATE:** Made the wall counter hint a little more descriptive of all the different wall types.
- **UPDATE:** When you enable the option to display walls, lights, or sounds on other layers, their layer icons will slowly flash blue to indicate this.
- **UPDATE:** Spanish Translations courtesy of [lozalojo](https://github.com/lozalojo).
- **TEMP:** Temporarily disabled Canvas Capture ("Save Game Board Image").
- **TEMP:** Temporarily disabled Tile Flattener.

## Release 3.3.1 (2022-05-28)
- **FIX #124:** Fix issue where enabling the See Walls on other layers would also enable it for the lights and sounds.
- **Fix #129:** Corrected issue with multiple libWrapper registrations for the same function. This was preventing wall-chaining and the force grid snap patch from working together.
- **FIX:** Some errors were cropping up when using the Alt Wall Drop for auto snapping.
- **FIX:** Fractional radii for light templates will now be rounded to nearest 3 decimal places when displayed in the Active Template UI. This stops the UI from becoming obnoxiously wide.

## Release 3.3.0 (2022-05-22)
- **NEW #119:** Switching wall types via hotkey while creating a new wall will also change that new wall to the selected type.
- **NEW #120:** Added new hotkey for toggling Force Snap to Grid on the Walls layer.
- **NEW #120:** Added a patch that will prevent Force Snap to Grid when holding the Shift key. Holding Shift normally bypasses any snapping, but except when the Force Snap to Grid was turned on. This fixes that abnormal behaviour.
- **NEW #115:** New Wall Gap detection feature. Allows you to search for and close small gaps in your wall connections. This feature was requested by [itamarcu](https://github.com/itamarcu) and based on the design of his most excellent macro.

## Release 3.2.3 (2022-05-21)
- **FIX:** Occasionally a player would be able to see the walls when the DM has the "See Walls on other layers" toggled on.
- **FIX #118:** Create Template button in Macro Folder working again.
- **FIX #127:** Light Template image is now editable again.
- **FIX #125:** Fixed error when Game Canvas is disabled.
- **FIX #122:** Fixed Wall Auto-Snap not working when creating a new wall.
- **FIX #117:** Fixed alternate snap button rendering when on Main Control Bar.
- **FIX #126:** Detect legacy layers and filter them out of the Canvas Capture layer management.

## Release 3.2.2 (2022-01-19)
- **FIX #109:** Tile Flattener will now only delete the relevant tiles when cloning the scene.
- **FIX #111:** Tile Flattener now respects selected tile rotation when calculating region of canvas to render.

## Pre-Release 3.2.1 (2022-01-16)
- **FIX #96:** Create Light Template button fixed.
- **FIX #98:** Light Template config updated to use the native AmbientLightConfig dialog instead of a custom one.
- **FIX #97:** Hotbar context menu shows correct labels for macros and light templates.
- **FIX #95:** Light Templates can now be activated and placed as normal.
- **UPDATE #103:** Existing light templates will now be migrated to the new V9 data model.
- **UPDATE #88:** Pre-fab light template compendiums updated to the new V9 data model.

## Pre-Release 3.2.0 (2022-01-09)
- **UPDATED:** Migrated to FoundryVTT V9.
- **UPDATED #101:** Migrated to new PIXI App config Hook.
- **UPDATED #89:** Migrated to new FVTTv9 Core Keybinding API.
- **IMPROVED:** Converted Wall Draw Override to a Wrapper. This will play nicer with other walling modules.
- **FIX #92 & #93:** Wall join/split now working without error.
- **FIX #94:** Fixed light luminosity inversion.
- **FIX #91:** Fixed Colour Picker magnifier alignment.
- **FIX #90:** Fixed and improved performance of Wall Chain Locking feature.
- **FIX #87:** Fixed door render.
- **FIX #100:** Corrected rendering issues for capturing the game canvas.
- **FIX #99:** Corrected rendering and UX issues for running the Tile Flattener.
- **REMOVED:** Temporarily Removed Light Templating features. Will be back before public release.

## Release 3.1.1 (2021-11-07)
- **NEW:** Updated vertical position logic to handle new Library: DF Module Buttons.
- **FIX #84:** Wall Type changer causing an error and failing to change the type of the selected walls.

## Release 3.1.0 (2021-11-02)
- **NEW:** Added specialized code to deal with PF2e's breaking and heavy-handed overhaul of the FoundryVTT canvas Lighting Layer.
- **FIX:** Image scaling caused by Pixel Resolution Scaling. Will now temporarily disable PRS while capturing the canvas.
- **FIX:** Wall Snapping issue when hovering over an existing wall causing that wall to move instead.
- **FIX:** Conflict with Theatre Inserts.
- **FIX:** Changing compression would also change BG Transparency label.
- **FIX:** Format and Compression issue when capture is a single frame.
- **FIX:** Issue when holding Alt for wall snapping whilc Ctrl is pressed/locked.
- **DEV:** Migrated to a Webpack/Gulp build chain.

## Release 3.0.6 (2021-10-23)
- **FIX:** Capture Canvas issue with scene with no background image.

## Release 3.0.5 (2021-10-19)
- **FIX:** Crash when trying to hide a canvas layer that is not properly registered with FoundryVTT.
- **FIX:** Crash when attempting to flatten tiles on a scene with no background image.
- **FIX:** Issue with background colour being transparent by default in FoundryVTT.
- **FIX:** Ctrl Lock was not being preserved across scene transitions.

## Release 3.0.4 (2021-10-07)
- **FIX:** Tiles Flattener wasn't excluding hidden tiles properly.
- **FIX:** Canvas Capture will now hide the borders that appear around hovered and selected Tokens, Tiles, and Drawings.

## Release 3.0.3 (2021-10-05)
- **FIX:** Counters overlapping due to an error when dismissing them.

## Release 3.0.2 (2021-10-04)
- **FIX:** _levels undefined when Levels module not installed.
- **UPDATE:** Spanish Translations courtesy of [lozalojo](https://github.com/lozalojo).

## Release 3.0.1 (2021-09-30)
- **FIX:** Tile Flattener conflict with the Levels module.
- **FIX:** Tile Config thumbnail now supports animated tile sources.
- **FIX:** Object Counter no longer overlaps FPS Meter.
- **NEW:** Tile Flattener has new option to hide animated tiles.

## Release 3.0.0 (2021-09-29)
- **FIX:** Quick Colour Picker not invoking the "change" event on the colour selector elements.
- **NEW:** Including OpenCV library that is only loaded when required.
- **UPDATE:** Major Optimization in Capture Canvas feature, no longer need to split canvas into many images. This will be done automatically and the resulting images stitched together into a single image download.
- **UPDATE:** You are now given a prompt for where to save captured image files, either on the server or on your local computer.
- **NEW:** Introducing a new Canvas Capture API that any module can use.
- **NEW:** New Tile Flattener feature. This uses the new Canvas Capture API to generate images from the tiles in a quick and efficient way.
- **NEW:** Tile, Light, Wall, & Sound Counts. Each of these layers will display a small window in the top right of Foundry with the current number of objects in that layer. Hovering the window will display additional information.
- **NEW:** Toggle the visibility of Walls, Lights, and Sounds controls while on other layers. Simply toggle the Eye button on each layer you want to see.
- **NEW:** Tile Config now shows a thumbnail of the current image. As well as the width, height, and aspect ratio of the original image.
- **NEW:** Tile Config now has a scale button beside the width and height. These will use the aspect ratio of the original image to set the width or height depending on which button you press.

## Release 2.1.2 (2021-08-30)
- Fixed broken Wall Chain Lock feature.
- Heavily Improved Wall Chain Lock to no longer require Click+Drag to chain walls. It will now properly immediately auto-chain like Foundry normally does while holding Ctrl.

## Release 2.1.1 (2021-08-27)
- Spanish Localization Update: Courtesy of [lozalojo](https://github.com/lozalojo)

## Release 2.1.0 (2021-08-18)
- Fixed Canvas Capture layer filtering issues when a layer no longer exists.
- Added custom filename field to Canvas Capture dialog.
- Fixed issues with certain wall features that occurred when the currently viewed scene was not the "active" scene.
- Updated Localization files to be in a better hierarchical format.
- Fixed some broken localizations.
- Added check for the Library: DF Hotkeys which is required.
- Update Light Templates to use the new Darkness Range that was introduced in 0.8.x.
- Added a data migration for existing light templates.
- Updated software license from MIT to BSD-3-Clause.

## Release 2.0.2 (2021-06-16)
- Cleaned up some deprecated calls that were flagged in the console.
- Updated the compatibility to FoundryVTT 0.8.7

## Release 2.0.1 (2021-06-06)
- Fixed issue with deleting walls that was introduced with the new wall direction labels.

## Release 2.0.0 (2021-06-06)
- Migrated entire module to FoundryVTT 0.8.6.
- Added Wall direction labels and orientation inversion.
- Added Wall Endpoint Auto-Snapping when dropping a wall with the Alt key held.
- Added Dark Light placement while holding Alt key.
- Now when you have walls selected, you can hold the Ctrl Key while clicking a wall type in the Scene Controls to instantly change the selected walls to that wall type.
- ColorSettings library is now a hard dependency.
- Canvas Capture now preserves the filter and settings selections between uses.
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
