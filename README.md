![logo](https://github.com/ItemLauncherTeam/remote-data/raw/main/camel-core/logo.jpg)

# camel-core
camel-core is a NodeJS library designed to create Minecraft Java Edition launchers on devices running Windows, Linux, or MacOS. It allows you to download, launch, and monitor the download process.

**Discussion, bug reports, news and suggestions are in the official Telegram channel**

<div id="badges">
  <a href="https://t.me/item_launcher_team">
    <img src="https://img.shields.io/badge/Telegram-blue?style=for-the-badge&logo=telegram&logoColor=white" alt="Telegram"/>
  </a>
</div>

### Installation

`npm install camel-core`

### Import

```javascript
const core = require('camel-core')
```

## How the game launch works.

Before loading a version, the engine makes a request to this URL [Link](https://piston-meta.mojang.com/mc/game/version_manifest.json).

If the request is successful, the engine goes to the URL and looks for the specified version there and downloads all the necessary files and launches the game. If the version is not found, it checks if the \<gameDirectory/>versions/\<versionId\>.json file is loaded. If this file is present, it loads all the libraries and other files specified there and launches the game. If it does not find this file, the engine throws the appropriate exception. If an error occurs during the loading process, the engine will not try to launch the version, but will throw an exception.

If the request is unsuccessful, the engine will start looking for the \<gameDirectory\>/versions/\<versionId\>.json file. If this file is present, the engine will try to run this version, if the file is not present, the corresponding exception will be thrown. Note that in this case, the engine will not perform any checks for the presence of files.

## API
#### addEventListener(event, callback)
Adds an event listener.
- **event** - A string with the event name. See Events for more details.
- **callback** - A function that will be executed each time the event occurs. **Callback** will receive the event object as its only argument, which will differ depending on the event. See Events for more details. **Callback** can return values ​​for some events.

Example of usage:

```javascript
core.addEventListener("clientjaralltasksfinished", (event) => {

    //Code to be executed when the launcher loads the main .jar file of the game.

    console.log("Bytes received: ", event.bytesReceived)
})
```

#### launch(options)
Downloads all necessary files (assets, libraries, etc.) and launches the game.

- **options** - an object containing launch settings. More details in the Settings section.

##### Return value:

Version 4 UUID for the current launch call

Usage example:

```javascript
let launchId = core.launch({
    username: "ItemLauncherTeam",
    versionId: "1.20",
})

console.log(launchId)
```

## Settings

Settings is an object that is passed to the **launch** function. It contains the following fields:

| Field | Default Value | Description |
| --- | --- | --- |
| versionId | "1.0" | Minecraft version |
| gameDirectory | %APPDATA%\\.minecraft on Windows, ~/Library/Application Support/minecraft on MacOS, ~/.minecraft on Linux | The main game directory (where assets, saves, etc. are) |
| username | "Steve" | In-game name |
| minRAM | "512M" | Minimum RAM size |
| maxRAM | "512M" | Maximum RAM size |
| javaPath | "java" | Path to the java file |
| autodownloading| true | Whether to upload any files |

## Error Codes

All errors thrown by the engine have their own error codes. Note that the engine has no effect on the error codes of unexpected errors.

| Code | Description |
| --- | --- |
| E001 | The version passed in **options** was not found. |
| E002 | Failed to start java |
| E003 | If the modified version fails to find client.json for the version specified in inheritsFrom |

## Warning Codes

| Code | Description |
| --- | --- |
| W001 | The event name passed to **addEventListener** does not exist |
| W002 | The **callback** argument passed to **addEventListener** is not a function |
| W003 | The **event** argument passed to **addEventListener** is not a string |
| W004 | The value returned by **callback** in **addEventListener**, which should replace Minecraft's default arguments, is not an array |
| W005 | The value returned by **callback** in **addEventListener**, which is supposed to replace the default JVM arguments, is not an array |

## Events

Below is a list of all events.

Before reading the list of events, it is better to read the explanations of some things.

The difference between totalSize and bytesWillBeReceived: when the engine downloads a file, it checks if the file exists and if its size matches the size it should have. If not, the engine will download the file. So bytesWillBeReceived is the number of bytes that will be downloaded, and totalSize is the maximum number that could be downloaded, it will be equal to bytesWillBeReceived if there are no files, but unlike bytesWillBeReceived it is never zero.

What is a task: A task means checking each file for existence and downloading it as needed. For example, we load assets (textures, music, etc.), the program encounters the file logo.png, when the program checks the file for presence and downloads it if necessary, it means that one task has been completed.

- **modifiedversionfound** - Fires when the engine detects that \<gameDirectory\>/saves/\<versionId\>.json is a modified version (contains the inheritsFrom field).

Argument to **callback** in **addEventListener**: an object repeating the structure of \<gameDirectory\>/saves/\<versionId\>.json.

- **warn** - Fires when the engine issues a warning.

Argument in **callback** in **addEventListener**

```javascript
{
    message, // Message with warning
    time, // Time in mm:ss:msms format
    stack, // Stack
    code, // Warning code
}
```

- **clientjsonloading** - Fires when loading the \<gameDirectory\>/versions/\<versionId\>.json file. The event will not fire if there is no internet connection or if the resources for loading cannot be accessed.

Argument in **callback** in **addEventListener**

```javascript
{
    launchId, // version 4 UUID for the current launch call
    totalSize, // Maximum possible number of bytes to load
    totalTasks, // Number of tasks
    currentTask, // Current task number (from 1)
    currentTaskCurrentSize, // Number of bytes loaded by the current task. Can be 0 if the file does not need to be loaded.
    currentTaskTotalSize, // Maximum number of bytes that will be downloaded by the current task (size of the file that is being processed by the current task)
    bytesReceived, // Total number of bytes received
    bytesWillBeReceived, // Number of bytes that will be received
    from, // URL where the file is downloaded from
    to, // Path where the file is downloaded
}
```

- **clientjarloading** - Fires when the \<gameDirectory\>/versions/\<versionId\>.jar file is loading. The event will not fire if there is no internet connection or if the resources for loading cannot be accessed.

Argument in **callback** in **addEventListener**

```javascript
{
    launchId, // version 4 UUID for the current launch call
    totalSize, // Maximum possible number of bytes to load
    totalTasks, // Number of tasks
    currentTask, // Current task number (from 1)
    currentTaskCurrentSize, // Number of bytes loaded by the current task. Can be 0 if the file does not need to be loaded.
    currentTaskTotalSize, // Maximum number of bytes that will be downloaded by the current task (size of the file that is being processed by the current task)
    bytesReceived, // Total number of bytes received
    bytesWillBeReceived, // Number of bytes that will be received
    from, // URL where the file is downloaded from
    to, // Path where the file is downloaded
}
```

- **indexesloading** - Fires when loading the \<versionId\>.json file located in \<gameDirectory\>/assets/indexes. The event will not fire if there is no internet connection or if the assets to load cannot be accessed.

Argument in **callback** in **addEventListener**

```javascript
{
    launchId, // version 4 UUID for the current launch call
    totalSize, // Maximum number of bytes to load
    totalTasks, // Number of tasks
    currentTask, // Current task number (from 1)
    currentTaskCurrentSize, // Number of bytes loaded by the current task. Can be 0 if no file needs to be loaded.
    currentTaskTotalSize, // Maximum number of bytes that will be downloaded by the current task (size of the file that is being processed by the current task)
    bytesReceived, // Total number of bytes received
    bytesWillBeReceived, // Number of bytes that will be received
    from, // URL where the file is downloaded from
    to, // Path where the file is downloaded
}
```

- **objectsloading** - Fires when loading any file located in \<gameDirectory\>/assets/objects or \<gameDirectory\>/resources (for legacy versions). The event does not fire if there is no internet connection or if the resources for loading cannot be accessed.

Argument in **callback** in **addEventListener**

```javascript
{
    launchId, // version 4 UUID for the current launch call
    totalSize, // Maximum possible number of bytes to be loaded
    totalTasks, // Number of tasks
    currentTask, // Current task number (from 1)
    currentTaskCurrentSize, // Number of bytes loaded by the current task. Can be 0 if the file does not need to be loaded.
    currentTaskTotalSize, // Maximum number of bytes that will be downloaded by the current task (size of the file that is being processed by the current task)
    bytesReceived, // Total number of bytes received
    bytesWillBeReceived, // Number of bytes that will be received
    from, // URL where the file is downloaded from
    to, // Path where the file is downloaded
}
```

- **librariesloading** - Fires when loading any library located in \<gameDirectory\>/libraries. The event will not fire if there is no internet connection or if the resources for loading cannot be accessed.

Argument in **callback** in **addEventListener**

```javascript
{
    launchId, // version 4 UUID for the current launch call
    totalSize, // Maximum possible number of bytes to load
    totalTasks, // Number of tasks
    currentTask, // Current task number (from 1)
    currentTaskCurrentSize, // Number of bytes loaded by the current task. Can be 0 if the file does not need to be loaded.
    currentTaskTotalSize, // Maximum number of bytes that will be downloaded by the current task (size of the file that is being processed by the current task)
    bytesReceived, // Total number of bytes received
    bytesWillBeReceived, // Number of bytes that will be received
    from, // URL where the file is downloaded from
    to, // Path where the file is downloaded
}
```

- **nativesloading** - Fires when loading any library located in \<gameDirectory\>/natives/\<versionId\>. The event does not fire if there is no internet connection or if the resources for loading cannot be accessed.

Argument in **callback** in **addEventListener**

```javascript
{
    launchId, // version 4 UUID for the current launch call
    totalSize, // Maximum possible number of bytes to load
    totalTasks, // Number of tasks
    currentTask, // Current task number (from 1)
    currentTaskCurrentSize, // Number of bytes loaded by the current task. Can be 0 if the file does not need to be loaded.
    currentTaskTotalSize, // Maximum number of bytes that will be downloaded by the current task (size of the file that is being processed by the current task)
    bytesReceived, // Total number of bytes received
    bytesWillBeReceived, // Number of bytes that will be received
    from, // URL where the file is downloaded from
    to, // Path where the file is downloaded
}
```

- **logj4configurationfileloading** - Fires when loading the logj4 configuration file. The event will not fire if there is no internet connection or if the resources for loading cannot be accessed.

Argument in **callback** in **addEventListener**

```javascript
{
    launchId, // version 4 UUID for the current launch call
    totalSize, // Maximum possible number of bytes to load
    totalTasks, // Number of tasks
    currentTask, // Current task number (from 1)
    currentTaskCurrentSize, // Number of bytes loaded by the current task. Can be 0 if no file needs to be loaded.
    currentTaskTotalSize, // Maximum number of bytes that will be downloaded by the current task (size of the file that is being processed by the current task)
    bytesReceived, // Total number of bytes received
    bytesWillBeReceived, // Number of bytes that will be received
    from, // URL where the file is downloaded from
    to, // Path where the file is downloaded
}
```

- **clientjsontaskfinished** - Fires when the task that processes the \<gameDirectory\>/versions/<versionId\>.json file finishes. The event does not fire if there is no internet connection or if the download resources cannot be accessed.

Argument in **callback** in **addEventListener**

```javascript
{
    launchId, // version 4 UUID for the current launch call
    totalSize, // Maximum possible number of bytes to be downloaded
    totalTasks, // Number of tasks
    currentTask, // Current task number (from 1)
    currentTaskTotalSize, // Maximum number of bytes to be downloaded by the current task (size of the file being processed by the current task)
    bytesReceived, // Total number of bytes received
    bytesWillBeReceived, // Number of bytes to be received
    from, // URL from which the file is being downloaded
    to, // Path to which the file is being downloaded
}
```

- **clientjartaskfinished** - Fires when the task that processes the \<gameDirectory\>/versions/<versionId\>.jar file finishes. The event does not fire if there is no internet connection or if the download resources cannot be accessed.

Argument in **callback** in **addEventListener**

```javascript
{
    launchId, // version 4 UUID for the current launch call
    totalSize, // Maximum possible number of bytes to be downloaded
    totalTasks, // Number of tasks
    currentTask, // Current task number (from 1)
    currentTaskTotalSize, // Maximum number of bytes to be downloaded by the current task (size of the file being processed by the current task)
    bytesReceived, // Total number of bytes received
    bytesWillBeReceived, // Number of bytes to be received
    from, // URL from which the file is being downloaded
    to, // Path to which the file is being downloaded
}
```

- **indexestaskfinished** - Fires when a task that processes the \<versionId\>.json file located in \<gameDirectory\>/assets/indexes completes. The event does not fire if there is no internet connection or if the assets cannot be accessed for download.

Argument in **callback** in **addEventListener**

```javascript
{
    launchId, // version 4 UUID for the current launch call
    totalSize, // Maximum possible number of bytes to be downloaded
    totalTasks, // Number of tasks
    currentTask, // Current task number (from 1)
    currentTaskTotalSize, // Maximum number of bytes to be downloaded by the current task (size of the file being processed by the current task)
    bytesReceived, // Total number of bytes received
    bytesWillBeReceived, // Number of bytes to be received
    from, // URL from which the file is being downloaded
    to, // Path to which the file is being downloaded
}
```

- **objectstaskfinished** - Fires when a task that processes a file located in \<gameDirectory\>/assets/objects or \<gameDirectory\>/resources (for legacy versions) finishes. The event does not fire if there is no internet connection or if the resources cannot be accessed for download.

Argument in **callback** in **addEventListener**

```javascript
{
    launchId, // version 4 UUID for the current launch call
    totalSize, // Maximum possible number of bytes to be downloaded
    totalTasks, // Number of tasks
    currentTask, // Current task number (from 1)
    currentTaskTotalSize, // Maximum number of bytes to be downloaded by the current task (size of the file being processed by the current task)
    bytesReceived, // Total number of bytes received
    bytesWillBeReceived, // Number of bytes to be received
    from, // URL from which the file is being downloaded
    to, // Path to which the file is being downloaded
}
```

- **librariestaskfinished** - Fires when a task that processes any library located in \<gameDirectory\>/libraries finishes. The event does not fire if there is no internet connection or if the resources for loading cannot be accessed.

Argument in **callback** in **addEventListener**

```javascript
{
    launchId, // version 4 UUID for the current launch call
    totalSize, // Maximum possible number of bytes to be downloaded
    totalTasks, // Number of tasks
    currentTask, // Current task number (from 1)
    currentTaskTotalSize, // Maximum number of bytes to be downloaded by the current task (size of the file being processed by the current task)
    bytesReceived, // Total number of bytes received
    bytesWillBeReceived, // Number of bytes to be received
    from, // URL from which the file is being downloaded
    to, // Path to which the file is being downloaded
}
```

- **nativestaskfinished** - Fires when a task that processes any library located in \<gameDirectory\>/natives/\<versionId\> finishes. The event does not fire if there is no internet connection or if the resources for loading cannot be accessed.

Argument in **callback** in **addEventListener**

```javascript
{
    launchId, // version 4 UUID for the current launch call
    totalSize, // Maximum possible number of bytes to be downloaded
    totalTasks, // Number of tasks
    currentTask, // Current task number (from 1)
    currentTaskTotalSize, // Maximum number of bytes to be downloaded by the current task (size of the file being processed by the current task)
    bytesReceived, // Total number of bytes received
    bytesWillBeReceived, // Number of bytes to be received
    from, // URL from which the file is being downloaded
    to, // Path to which the file is being downloaded
}
```

- **logj4configurationfiletaskfinished** - Fires when the task processing the logj4 configuration file finishes. The event does not fire if there is no internet connection or if the resources for downloading cannot be accessed.

Argument in **callback** in **addEventListener**

```javascript
{
    launchId, // version 4 UUID for the current launch call
    totalSize, // Maximum possible number of bytes that will be downloaded
    totalTasks, // Number of tasks
    currentTask, // Current task number (from 1)
    currentTaskTotalSize, // Maximum number of bytes that will be downloaded by the current task (size of the file that the current task is processing)
    bytesReceived, // Total number of bytes received
    bytesWillBeReceived, // Number of bytes that will be received
    from, // URL from where the file is downloaded
    to, // Path where the file is downloaded
}
```

- **clientjsonalltasksfinished** - Fires after all tasks processing the \<gameDirectory\>/versions/\<versionId\>.json file have finished. The event does not fire if there is no internet connection or if the resources for downloading cannot be accessed.

Argument in **callback** in **addEventListener**

```javascript
{
    launchId, // version 4 UUID for the current launch call
    tasksCompleted, // Number of completed tasks
    bytesReceived, // Number of bytes received
    totalTasks, // Number of tasks
    totalSize, // Maximum possible number of bytes to be downloaded
    bytesWillBeReceived, // Number of bytes to be received
}
```

- **clientjaralltasksfinished** - Fires after all tasks processing the \<gameDirectory\>/versions/\<versionId\>.jar file have finished. The event will not fire if there is no internet connection or if the download resources cannot be accessed.

Argument in **callback** in **addEventListener**

```javascript
{
    launchId, // version 4 UUID for the current launch call
    tasksCompleted, // Number of completed tasks
    bytesReceived, // Number of bytes received
    totalTasks, // Number of tasks
    totalSize, // Maximum possible number of bytes to be downloaded
    bytesWillBeReceived, // Number of bytes to be received
}
```

- **indexesalltasksfinished** - Fires when all tasks processing a file located in \<gameDirectory\>/assets/indexes have finished. The event does not fire if there is no internet connection or if the resources for loading cannot be accessed.

Argument in **callback** in **addEventListener**

```javascript
{
    launchId, // version 4 UUID for the current launch call
    tasksCompleted, // Number of completed tasks
    bytesReceived, // Number of bytes received
    totalTasks, // Number of tasks
    totalSize, // Maximum possible number of bytes that will be downloaded
    bytesWillBeReceived, // Number of bytes that will be received
}
```

- **objectsalltasksfinished** - Fires after all tasks that process files located in \<gameDirectory\>/assets/objects or \<gameDirectory\>/resources (for legacy versions) have finished. The event does not fire if there is no internet connection or if the resources for downloading cannot be accessed.

Argument in **callback** in **addEventListener**

```javascript
{
    launchId, // version 4 UUID for the current launch call
    tasksCompleted, // Number of completed tasks
    bytesReceived, // Number of bytes received
    totalTasks, // Number of tasks
    totalSize, // Maximum possible number of bytes to be downloaded
    bytesWillBeReceived, // Number of bytes to be received
}
```

- **librariesalltasksfinished** - Fires when all tasks that process files located in \<gameDirectory\>/libraries have finished. The event does not fire if there is no internet connection or if the resources for loading cannot be accessed.

Argument in **callback** in **addEventListener**

```javascript
{
    launchId, // version 4 UUID for the current launch call
    tasksCompleted, // Number of completed tasks
    bytesReceived, // Number of bytes received
    totalTasks, // Number of tasks
    totalSize, // Maximum possible number of bytes that will be downloaded
    bytesWillBeReceived, // Number of bytes that will be received
}
```

- **nativesalltasksfinished** - Fires after all tasks processing files located in \<gameDirectory\>/natives/\<versionId\> have finished. The event does not fire if there is no internet connection or if the resources for downloading cannot be accessed.

Argument in **callback** in **addEventListener**

```javascript
{
    launchId, // version 4 UUID for the current launch call
    tasksCompleted, // Number of completed tasks
    bytesReceived, // Number of bytes received
    totalTasks, // Number of tasks
    totalSize, // Maximum possible number of bytes to be downloaded
    bytesWillBeReceived, // Number of bytes to be received
}
```

- **logj4configurationfilealltasksfinished** - Fires when all tasks processing the logj4 configuration file have finished. The event will not fire if there is no internet connection or if resources for downloading cannot be accessed.

Argument in **callback** in **addEventListener**

```javascript
{
    launchId, // version 4 UUID for the current launch call
    tasksCompleted, // Number of completed tasks
    bytesReceived, // Number of bytes received
    totalTasks, // Number of tasks
    totalSize, // Maximum possible number of bytes to be downloaded
    bytesWillBeReceived, // Number of bytes to be received
}
```

- **minecraftargumentsreceived** - Fires when minecraft arguments are received

Argument to **callback** in **addEventListener**: array with minecraft arguments.

The array that **callback** returns from the final call to **addEventListener** that listens for the **minecraftargumentsreceived** event will replace the default minecraft arguments. Note that this will not run any event handlers. If the return value is not an array, it will be ignored and a warning will be printed to the console. The argument to **callback** always receives the default minecraft arguments, regardless of whether any **callback** returned a value.

- **jvmargumentsreceived** - Fires when arguments for the JVM are received

Argument to **callback** in **addEventListener**: an array with arguments for the JVM.

The array that **callback** returns from the final call to **addEventListener** that listens for the **jvmargumentsreceived** event will replace the default JVM arguments. Note that this will not run any event handlers. If the return value is not an array, it will be ignored and a warning will be printed to the console. The argument to **callback** always receives the default JVM arguments, regardless of whether any **callback** returned a value.

- **minecraftprocessstdoutdata** - Fires when data is received from the standard output of the minecraft process.

Argument in **callback** of **addEventListener**: A string from the standard output of the minecraft process.

- **minecraftprocessstderrordata** - Fires when data is received from the standard error of the minecraft process.

Argument in **callback** of **addEventListener**: A string from the standard error of the minecraft process.

- **minecraftprocessclose** - Fires when the minecraft process has closed.

Argument in **callback** of **addEventListener**: The exit code returned by the minecraft process.
