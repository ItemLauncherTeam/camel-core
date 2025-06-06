# Change Log
All notable changes to this project will be documented in this file.

## Quick navigation

- [<u>1.1.0</u>](#1.1.0)

<h2 id="1.1.0">[1.1.0] - 2025-06-06</h2>
 
**For more details, see the documentation.**
 

### Added

- Support for modified versions has been added.

- Added the autodownloading setting. By default, true. If you set false, the engine will not load anything, but will immediately start the game.

- An event 'warn' has been added that is triggered when the engine issues warnings. 

- Errors and warnings now have unique codes.

- Added 'modifiedversionfound' event that fires when the engine detects that \<gameDirectory\>/saves/\<versionId\>.json refers to a modified version (contains inheritsFrom filed).

- Error E003
 
### Changed

- Now some files (assets, libraries, natives) will be loaded in parallel, not sequentially. That is, several files can be loaded at the same time. This should speed up loading. 

- The logj4 config file is now loaded into \<gameDirectory\>/assets/log_configs.

- Some default settings have been changed.

- The launch function now returns a version 4 UUID for the current launch call.

- The launch function is now synchronous.

- Improved parsing of JVM arguments

### Fixed

- The argument --assetIndex is now set correctly.

### Removed

- resolutionWidth and resolutionHeight have been removed from the settings.