const fs = require('fs')
const path = require('path')
const request = require('request')
const process = require('process')
const MESSAGES = require('./messages')
const Zip = require('adm-zip')
const { v4: uuidv4 } = require('uuid')
const child = require("child_process")

function getOS() {
    switch (process.platform) {
        case 'win32': return 'windows'
        case 'darwin': return 'osx'
        default: return 'linux'
    }
}

function getDefaultMinecraftPath() {
    switch (getOS()) {
        case 'windows': return path.join(process.env.APPDATA, ".minecraft")
        case 'osx': return path.join(os.homedir(), "Library", "Application Support", "minecraft")
        default: return path.join(os.homedir(), ".minecraft")
    }
}

const options = {
    versionId: "1.0",
    gameDirectory: getDefaultMinecraftPath(),
    username: "Steve",
    minRAM: '512M',
    maxRAM: '512M',
    javaPath: "java",
    autodownloading: true,
}

options.gameDirectory = path.resolve(options.gameDirectory)

const VERSION_MANIFEST_URL = "https://piston-meta.mojang.com/mc/game/version_manifest.json"
const LIB_NAME = "camel-core"

let baseRequest = request.defaults({
    pool: { maxSockets: 2 },
    timeout: 50000
})


let events = {
    clientjsonloading: [],
    clientjsonalltasksfinished: [],
    clientjsontaskfinished: [],

    clientjarloading: [],
    clientjaralltasksfinished: [],
    clientjartaskfinished: [],

    objectsloading: [],
    objectsalltasksfinished: [],
    objectstaskfinished: [],

    indexesloading: [],
    indexesalltasksfinished: [],
    indexestaskfinished: [],

    librariesloading: [],
    librariesalltasksfinished: [],
    librariestaskfinished: [],

    nativesloading: [],
    nativesalltasksfinished: [],
    nativestaskfinished: [],

    logj4configurationfileloading: [],
    logj4configurationfilealltasksfinished: [],
    logj4configurationfiletaskfinished: [],

    minecraftargumentsreceived: [],

    jvmargumentsreceived: [],

    minecraftprocessstdoutdata: [],
    minecraftprocessstderrordata: [],
    minecraftprocessclose: [],

    modifiedversionfound: [],

    warn: [],
}

function getError(message, code) {
    let e = new Error(message)
    e.code = code
    return e
}

function download(url, fileDir, filePath, dynamicEventsData, eventPrefix) {

    let staticData = { ...dynamicEventsData }

    function complete() {

        dynamicEventsData.tasksCompleted = dynamicEventsData.tasksCompleted + 1

        dispatchEvent(eventPrefix + "taskfinished", {
            launchId: staticData.launchId,
            totalSize: staticData.totalSize,
            totalTasks: staticData.totalTasks,
            currentTask: staticData.currentTask,
            currentTaskTotalSize: staticData.currentTaskTotalSize,
            bytesReceived: dynamicEventsData.bytesReceived,
            bytesWillBeReceived: staticData.bytesWillBeReceived,
            from: staticData.from,
            to: staticData.to,
        })
    }


    return new Promise((resolve) => {

        let currentTaskCurrentSize = 0

        if (!fs.existsSync(fileDir)) {
            fs.mkdirSync(fileDir, { recursive: true })
        }

        if (fs.existsSync(filePath) && isFullFile(filePath, staticData.currentTaskTotalSize)) {
            complete()
            resolve({
                downloaded: false,
            })
            return
        }

        let _request = baseRequest(url)

        _request.on('data', (chunk) => {
            currentTaskCurrentSize = currentTaskCurrentSize + chunk.length
            dynamicEventsData.bytesReceived = dynamicEventsData.bytesReceived + chunk.length

            dispatchEvent(eventPrefix + "loading", {
                launchId: staticData.launchId,
                totalSize: staticData.totalSize,
                totalTasks: staticData.totalTasks,
                currentTask: staticData.currentTask,
                currentTaskCurrentSize: currentTaskCurrentSize,
                currentTaskTotalSize: staticData.currentTaskTotalSize,
                bytesReceived: dynamicEventsData.bytesReceived,
                bytesWillBeReceived: staticData.bytesWillBeReceived,
                from: staticData.from,
                to: staticData.to,
            })
        })


        const file = fs.createWriteStream(filePath)
        _request.pipe(file)

        file.once('finish', () => {
            complete()
            resolve({
                downloaded: true,
            })
        })
    })
}

function isFullFile(filePath, expectedSize) {
    let stats = fs.statSync(filePath)
    return stats.size == expectedSize
}

async function isOnline() {
    let isError = false
    try {
        await fetch("https://piston-meta.mojang.com/mc/game/version_manifest.json")
    } catch (e) {
        isError = true
    }
    return !isError
}

function checkJava(path) {
    return new Promise((resolve) => {
        child.exec(`"${path}" -version`, (error) => {
            if (error) {
                resolve(false)
            } else {
                resolve(true)
            }
        })

    })
}

function log(message, type, error, warncode) {

    let now = new Date()
    const minutes = now.getMinutes().toString().padStart(2, '0')
    const seconds = now.getSeconds().toString().padStart(2, '0')
    const milliseconds = now.getMilliseconds().toString().padStart(3, '0')

    const timestring = `${minutes}:${seconds}:${milliseconds}`

    if (type == "info") {
        console.log(`[${LIB_NAME}] [\x1b[32mINFO\x1b[0m] [${timestring}]: ${message}`)
    }
    if (type == "warn") {
        console.log(`[${LIB_NAME}] [\x1b[33mWARN\x1b[0m] [${timestring}]: ${warncode} ${message} ${error.stack.slice(5)}`)
        dispatchEvent("warn", {
            message: message,
            time: timestring,
            stack: error.stack.slice(5),
            code: warncode
        })
    }
    if (type == "error") {
        console.log(`[${LIB_NAME}] [\x1b[31mERROR\x1b[0m] [${timestring}]: ${error.code} ${message}`)
    }
}


function addEventListener(event, callback) {
    if (!events[event]) {
        log(MESSAGES.W001, "warn", new Error(), "W001")
        return
    }
    if (typeof callback != "function") {
        log(MESSAGES.W002, "warn", new Error(), "W002")
        return
    }
    if (typeof event != "string") {
        log(MESSAGES.W003, "warn", new Error(), "W003")
        return
    }
    events[event].push(callback)
}

function dispatchEvent(event, argument) {
    let returnValue

    if (events[event]) {
        events[event].forEach(callback => {
            returnValue = callback(argument)
        })
    }

    return returnValue
}


function getOS() {
    switch (process.platform) {
        case 'win32': return 'windows'
        case 'darwin': return 'osx'
        default: return 'linux'
    }
}


function parseRule(lib) {
    if (lib.rules) {
        if (lib.rules.length > 1) {
            if (lib.rules[0].action === 'allow' && lib.rules[1].action === 'disallow' && lib.rules[1].os.name === 'osx') {
                return getOS() === 'osx'
            }
            return true
        } else {
            if (lib.rules[0].action === 'allow' && lib.rules[0].os) return lib.rules[0].os.name !== getOS()
        }
    } else {
        return false
    }
}


function isLegacy(client) {
    return client.assets === "legacy" || client.assets === "pre-1.6"
}


function getClient() {
    let filePath = path.join(options.gameDirectory, "versions", options.versionId, options.versionId + ".json")
    if (fs.existsSync(filePath)) {
        let client = JSON.parse(fs.readFileSync(filePath, { encoding: 'utf8' }))
        return client
    } else {
        return false
    }

}

async function downloadClientJson(url, launchId) {

    let fileDir = path.join(options.gameDirectory, "versions", options.versionId)
    let filePath = path.join(options.gameDirectory, "versions", options.versionId, options.versionId + ".json")

    let totalSize = 0

    await new Promise((resolve) => {
        request.head(url, (_, response) => {
            totalSize = parseInt(response.headers['content-length'])
            resolve(true)
        })
    })


    let clientJsonEventsArgs = {
        tasksCompleted: 0,
        launchId,
        totalSize: totalSize,
        totalTasks: 1,
        currentTask: 1,
        currentTaskCurrentSize: 0,
        currentTaskTotalSize: totalSize,
        bytesReceived: 0,
        bytesWillBeReceived: 0,
        from: url,
        to: filePath,
    }

    if (!(fs.existsSync(filePath) && isFullFile(filePath, totalSize))) {
        clientJsonEventsArgs.bytesWillBeReceived = totalSize
    }

    await download(url, fileDir, filePath, clientJsonEventsArgs, "clientjson")


    dispatchEvent("clientjsonalltasksfinished", {
        launchId: clientJsonEventsArgs.launchId,
        tasksCompleted: clientJsonEventsArgs.tasksCompleted,
        bytesReceived: clientJsonEventsArgs.bytesReceived,
        totalTasks: clientJsonEventsArgs.totalTasks,
        totalSize: clientJsonEventsArgs.totalSize,
        bytesWillBeReceived: clientJsonEventsArgs.bytesWillBeReceived
    })

    log(MESSAGES.I001, "info")
}

async function downloadClientJar(client, launchId) {

    let url = client.downloads.client.url
    let filePath = path.join(options.gameDirectory, "versions", options.versionId, options.versionId + ".jar")
    let fileDir = path.join(options.gameDirectory, "versions", options.versionId)

    let clientJarEventsArgs = {
        launchId,
        totalSize: client.downloads.client.size,
        totalTasks: 1,
        currentTask: 1,
        currentTaskCurrentSize: 0,
        currentTaskTotalSize: client.downloads.client.size,
        bytesReceived: 0,
        bytesWillBeReceived: 0,
        from: url,
        to: filePath,
    }

    if (!(fs.existsSync(filePath) && isFullFile(filePath, client.downloads.client.size))) {
        clientJarEventsArgs.bytesWillBeReceived = client.downloads.client.size
    }

    await download(url, fileDir, filePath, clientJarEventsArgs, "clientjar")


    dispatchEvent("clientjaralltasksfinished", {
        launchId,
        tasksCompleted: 1,
        bytesReceived: clientJarEventsArgs.bytesReceived,
        totalTasks: clientJarEventsArgs.totalTasks,
        totalSize: clientJarEventsArgs.totalSize,
        bytesWillBeReceived: clientJarEventsArgs.bytesWillBeReceived
    })

    log(MESSAGES.I002, "info")
}



async function downloadAssets(client, launchId) {

    let assetIndex = client.assetIndex
    let filePath = path.join(options.gameDirectory, "assets", "indexes", client.assets + ".json")
    let fileDir = path.join(options.gameDirectory, "assets", "indexes")

    let indexesEventsArgs = {
        launchId,
        totalSize: assetIndex.size,
        totalTasks: 1,
        currentTask: 1,
        currentTaskCurrentSize: 0,
        currentTaskTotalSize: 0,
        bytesReceived: 0,
        bytesWillBeReceived: 0,
        from: assetIndex.url,
        to: filePath,
    }

    if (!(fs.existsSync(filePath) && isFullFile(filePath, assetIndex.size))) {
        indexesEventsArgs.bytesWillBeReceived = assetIndex.size
    }

    await Promise.all([download(assetIndex.url, fileDir, filePath, indexesEventsArgs, "indexes")])

    dispatchEvent("indexesalltasksfinished", {
        launchId,
        tasksCompleted: 1,
        bytesReceived: indexesEventsArgs.bytesReceived,
        totalTasks: 1,
        totalSize: indexesEventsArgs.totalSize,
        bytesWillBeReceived: indexesEventsArgs.bytesWillBeReceived
    })

    log(MESSAGES.I003, "info")


    let index = JSON.parse(fs.readFileSync(path.join(options.gameDirectory, "assets", "indexes", client.assets + ".json"), { encoding: 'utf8' }))

    let objectsEventsArgs = {
        tasksCompleted: 0,
        launchId,
        totalSize: assetIndex.totalSize,
        totalTasks: Object.keys(index.objects).length,
        currentTask: 0,
        currentTaskCurrentSize: 0,
        currentTaskTotalSize: 0,
        bytesReceived: 0,
        bytesWillBeReceived: 0,
        from: null,
        to: null,
    }

    Object.keys(index.objects).map((asset) => {
        let subhash = index.objects[asset].hash[0] + index.objects[asset].hash[1]
        let hash = index.objects[asset].hash
        if (isLegacy(client)) {
            let filePath = path.join(options.gameDirectory, "resources", path.dirname(asset), path.basename(asset))
            if (!(fs.existsSync(filePath) && isFullFile(filePath, index.objects[asset].size))) {
                objectsEventsArgs.bytesWillBeReceived = objectsEventsArgs.bytesWillBeReceived + index.objects[asset].size
            }
        } else {
            let filePath = path.join(options.gameDirectory, "assets", "objects", subhash, hash)
            if (!(fs.existsSync(filePath) && isFullFile(filePath, index.objects[asset].size))) {
                objectsEventsArgs.bytesWillBeReceived = objectsEventsArgs.bytesWillBeReceived + index.objects[asset].size
            }
        }
    })

    await Promise.all(Object.keys(index.objects).map(async (asset, i) => {

        let subhash = index.objects[asset].hash[0] + index.objects[asset].hash[1]
        let hash = index.objects[asset].hash
        let url = "https://resources.download.minecraft.net/" + subhash + "/" + hash

        let filePath = path.join(options.gameDirectory, "assets", "objects", subhash, hash)
        let fileDir = path.join(options.gameDirectory, "assets", "objects", subhash)

        objectsEventsArgs.currentTaskTotalSize = index.objects[asset].size
        objectsEventsArgs.from = url
        objectsEventsArgs.to = filePath
        objectsEventsArgs.currentTask = i + 1


        if (isLegacy(client)) {
            filePath = path.join(options.gameDirectory, "resources", path.dirname(asset), path.basename(asset))
            fileDir = path.join(options.gameDirectory, "resources", path.dirname(asset))
            objectsEventsArgs.to = filePath
            return download(url, fileDir, filePath, objectsEventsArgs, "objects")
        } else {
            return download(url, fileDir, filePath, objectsEventsArgs, "objects")
        }


    }))

    dispatchEvent("objectsalltasksfinished", {
        launchId: objectsEventsArgs.launchId,
        tasksCompleted: objectsEventsArgs.tasksCompleted,
        bytesReceived: objectsEventsArgs.bytesReceived,
        totalTasks: objectsEventsArgs.totalTasks,
        totalSize: objectsEventsArgs.totalSize,
        bytesWillBeReceived: objectsEventsArgs.bytesWillBeReceived
    })

    log(MESSAGES.I004, "info")

}

async function downloadLibraries(libraries, launchId) {

    let targetDownloads = []

    for (let i = 0; i < libraries.length; i++) {
        let lib = libraries[i]

        if (!lib.downloads || !lib.downloads.artifact) continue
        if (parseRule(lib)) continue

        targetDownloads.push(lib)
    }

    let librariesEventsArgs = {
        tasksCompleted: 0,
        launchId,
        totalSize: 0,
        totalTasks: targetDownloads.length,
        currentTask: 0,
        currentTaskCurrentSize: 0,
        currentTaskTotalSize: 0,
        bytesReceived: 0,
        bytesWillBeReceived: 0,
        from: null,
        to: null,
    }

    targetDownloads.map((lib, i) => {
        let filePath = path.join(options.gameDirectory, "libraries", path.dirname(lib.downloads.artifact.path), path.basename(lib.downloads.artifact.path))
        if (!(fs.existsSync(filePath) && isFullFile(filePath, lib.downloads.artifact.size))) {
            librariesEventsArgs.bytesWillBeReceived = librariesEventsArgs.bytesWillBeReceived + lib.downloads.artifact.size
        }
        librariesEventsArgs.totalSize = librariesEventsArgs.totalSize + lib.downloads.artifact.size

    })

    await Promise.all(targetDownloads.map((lib, i) => {

        let filePath = path.join(options.gameDirectory, "libraries", path.dirname(lib.downloads.artifact.path), path.basename(lib.downloads.artifact.path))
        let fileDir = path.join(options.gameDirectory, "libraries", path.dirname(lib.downloads.artifact.path))
        let url = lib.downloads.artifact.url

        librariesEventsArgs.currentTaskTotalSize = lib.downloads.artifact.size
        librariesEventsArgs.currentTask = i + 1
        librariesEventsArgs.from = url
        librariesEventsArgs.to = filePath

        return download(url, fileDir, filePath, librariesEventsArgs, "libraries")
    }))


    dispatchEvent("librariesalltasksfinished", {
        launchId: librariesEventsArgs.launchId,
        tasksCompleted: librariesEventsArgs.tasksCompleted,
        bytesReceived: librariesEventsArgs.bytesReceived,
        totalTasks: librariesEventsArgs.totalTasks,
        totalSize: librariesEventsArgs.totalSize,
        bytesWillBeReceived: librariesEventsArgs.bytesWillBeReceived,
    })

    log(MESSAGES.I005, "info")
}



async function downloadNatives(libraries, launchId) {

    let natives = []

    libraries.map(async (lib) => {
        if (!lib.downloads || !lib.downloads.classifiers) return
        if (parseRule(lib)) return

        const native = getOS() === 'osx'
            ? lib.downloads.classifiers['natives-osx'] || lib.downloads.classifiers['natives-macos']
            : lib.downloads.classifiers[`natives-${getOS()}`]

        if (native) natives.push(native)
    })

    let nativesEventsArgs = {
        tasksCompleted: 0,
        launchId,
        totalSize: 0,
        totalTasks: natives.length,
        currentTask: 0,
        currentTaskCurrentSize: 0,
        currentTaskTotalSize: 0,
        bytesReceived: 0,
        bytesWillBeReceived: 0,
        from: null,
        to: null,
    }

    for (let i = 0; i < natives.length; i++) {
        let native = natives[i]
        nativesEventsArgs.totalSize = nativesEventsArgs.totalSize + native.size
        nativesEventsArgs.bytesWillBeReceived = nativesEventsArgs.totalSize
    }

    await Promise.all(natives.map(async (native, i) => {

        let url = native.url
        let filePath = path.join(options.gameDirectory, "natives", options.versionId, native.path.split('/').pop())
        let fileDir = path.join(options.gameDirectory, "natives", options.versionId)

        nativesEventsArgs.currentTask = i + 1
        nativesEventsArgs.currentTaskTotalSize = native.size
        nativesEventsArgs.from = url
        nativesEventsArgs.to = filePath

        await download(url, fileDir, filePath, nativesEventsArgs, "natives").then(() => {
            try {
                new Zip(filePath).extractAllTo(fileDir, true)
                fs.unlinkSync(filePath)
            } catch (e) {
                console.log(e)
            }
        })
    }))

    dispatchEvent("nativesalltasksfinished", {
        launchId: nativesEventsArgs.launchId,
        tasksCompleted: nativesEventsArgs.tasksCompleted,
        bytesReceived: nativesEventsArgs.bytesReceived,
        totalTasks: nativesEventsArgs.totalTasks,
        totalSize: nativesEventsArgs.totalSize,
        bytesWillBeReceived: nativesEventsArgs.bytesWillBeReceived,
    })

    log(MESSAGES.I006, "info")
}

function getMinecraftArguments(client) {

    let args = []
    let finalArgs = []
    let id = uuidv4()

    let assetsRoot = path.join(options.gameDirectory, "assets")
    if (isLegacy(client)) {
        assetsRoot = path.join(options.gameDirectory, "resources")
    }

    const fields = {
        '${auth_access_token}': id,
        '${auth_session}': id,
        '${auth_player_name}': options.username,
        '${auth_uuid}': id,
        '${auth_xuid}': id,
        '${user_properties}': `{}`,
        '${user_type}': "mojang",
        '${version_name}': options.versionId,
        '${assets_index_name}': client.assets,
        '${game_directory}': options.gameDirectory,
        '${assets_root}': assetsRoot,
        '${game_assets}': assetsRoot,
        '${version_type}': client.type,
        '${clientid}': id,
    }


    if (client.minecraftArguments) {
        args = client.minecraftArguments.split(" ")
    } else {
        args = client.arguments.game
    }

    for (let i = 0; i < args.length; i++) {
        if (typeof args[i] === "string") {
            if (Object.keys(fields).includes(args[i])) {
                args[i] = fields[args[i]]
            }
        }
    }

    for (let i = 0; i < args.length; i++) {
        if (typeof args[i] == "string" || typeof args[i] == "number") {
            finalArgs = [...finalArgs, args[i]]
        }
    }

    let newFinalArguments = dispatchEvent("minecraftargumentsreceived", finalArgs)

    if (newFinalArguments) {
        if (Array.isArray(newFinalArguments)) {
            return newFinalArguments
        } else {
            log(MESSAGES.W004, "warn", new Error(), "W004")
            return finalArgs
        }
    } else {
        return finalArgs
    }

}

function getClassesPaths(libraries) {

    function findJarFiles(dir, targetNames, result = []) {
        const files = fs.readdirSync(dir);

        for (const file of files) {
            const fullPath = path.join(dir, file);
            const stat = fs.statSync(fullPath);

            if (stat.isDirectory()) {
                findJarFiles(fullPath, targetNames, result);
            } else if (file.endsWith('.jar') && targetNames.includes(file)) {
                result.push(fullPath);
            }
        }

        return result;
    }

    let librariesJarNames = []

    for (let i = 0; i < libraries.length; i++) {
        if (parseRule(libraries[i])) continue
        let splitedMavenName = libraries[i].name.split(":")
        let libraryJarName = `${splitedMavenName[1]}-${splitedMavenName[2]}${splitedMavenName[3] ? '-' + splitedMavenName[3] : ''}.jar`

        librariesJarNames.push(libraryJarName)
    }


    const classesPaths = findJarFiles(path.join(options.gameDirectory, "libraries"), librariesJarNames);

    return classesPaths
}


async function downloadLogj4ConfigurationFile(client, launchId) {

    if (!client.logging) return

    let url = client.logging.client.file.url
    let filePath = path.join(options.gameDirectory, "assets", "log_configs", client.logging.client.file.id)
    let fileDir = path.join(options.gameDirectory, "assets", "log_configs")


    let logj4ConfigurationFileEventsArgs = {
        tasksCompleted: 0,
        launchId,
        totalSize: client.logging.client.file.size,
        totalTasks: 1,
        currentTask: 1,
        currentTaskCurrentSize: 0,
        currentTaskTotalSize: client.logging.client.file.size,
        bytesReceived: 0,
        bytesWillBeReceived: 0,
        from: url,
        to: filePath,
    }

    if (!(fs.existsSync(filePath) && isFullFile(filePath, logj4ConfigurationFileEventsArgs.totalSize))) {
        logj4ConfigurationFileEventsArgs.bytesWillBeReceived = logj4ConfigurationFileEventsArgs.totalSize
    }

    await download(url, fileDir, filePath, logj4ConfigurationFileEventsArgs, "logj4configurationfile")


    dispatchEvent("logj4configurationfilealltasksfinished", {
        launchId: logj4ConfigurationFileEventsArgs.launchId,
        tasksCompleted: logj4ConfigurationFileEventsArgs.tasksCompleted,
        bytesReceived: logj4ConfigurationFileEventsArgs.bytesReceived,
        totalTasks: logj4ConfigurationFileEventsArgs.totalTasks,
        totalSize: logj4ConfigurationFileEventsArgs.totalSize,
        bytesWillBeReceived: logj4ConfigurationFileEventsArgs.bytesWillBeReceived,
    })

    log(MESSAGES.I007, "info")
}

function getJVMArguments(client, classesPaths) {

    const oss = {
        windows: '-XX:HeapDumpPath=MojangTricksIntelDriversForPerformance_javaw.exe_minecraft.exe.heapdump',
        osx: '-XstartOnFirstThread',
        linux: '-Xss1M'
    }

    let nativesDirectory = path.join(options.gameDirectory, "natives", options.versionId)

    let JVMArgs = [
        '-XX:-UseAdaptiveSizePolicy',
        '-XX:-OmitStackTraceInFastThrow',
        `-Djava.library.path=${nativesDirectory}`,
        `-Xmx${options.minRAM}`,
        `-Xms${options.maxRAM}`,
        `-Djava.library.path=${nativesDirectory}`,
        `-Djna.tmpdir=${nativesDirectory}`,
        `-Dorg.lwjgl.system.SharedLibraryExtractPath=${nativesDirectory}`,
        `-Dio.netty.native.workdir=${nativesDirectory}`,
    ]

    if (client.arguments && client.arguments.jvm) {
        for (let i = 0; i < client.arguments.jvm.length; i++) {
            let arg = client.arguments.jvm[i]
            if (typeof arg == "string") {
                let value = arg.split("=")[1]
                if (value && !(value.startsWith("$"))) {
                    JVMArgs.push(arg)
                }
            }
        }
    }

    JVMArgs.push(oss[getOS()])


    if (client.logging) {
        JVMArgs.push(`-Dlog4j.configurationFile=${path.join(options.gameDirectory, "assets", "log_configs", client.logging.client.file.id)}`)
    }


    let cpArg = ['-cp']
    let separator = getOS() === 'windows' ? ';' : ':'
    let clientJarPath = path.join(options.gameDirectory, "versions", options.versionId, options.versionId + ".jar")
    let jar = `${separator}${clientJarPath}`
    cpArg.push(`${classesPaths.join(separator)}${jar}`)
    cpArg.push(client.mainClass)


    JVMArgs = [...JVMArgs, ...cpArg]


    let newJVMArguments = dispatchEvent("jvmargumentsreceived", JVMArgs)

    if (newJVMArguments) {
        if (Array.isArray(newJVMArguments)) {
            return newJVMArguments
        } else {
            log(MESSAGES.W005, "warn", new Error(), "W005")
            return JVMArgs
        }
    } else {
        return JVMArgs
    }
}

function startMinecraft(minecraftargs, JVMArgs) {

    let launchArgs = [].concat(JVMArgs, minecraftargs)

    let game = child.spawn(`${options.javaPath}`, launchArgs, {
        detached: true
    })

    game.stdout.on('data', (data) => dispatchEvent("minecraftprocessstdoutdata", data.toString()))
    game.stderr.on('data', (data) => dispatchEvent("minecraftprocessstderrordata", data.toString()))
    game.on('close', (code) => dispatchEvent("minecraftprocessclose", code))

}

function isModifiedVersion(client) {
    return "inheritsFrom" in client
}

async function makeVanillaVersionClient(modifiedVersionClient, downloadVanillaClient) {

    let inheritsFrom = modifiedVersionClient.inheritsFrom

    let clientJsonPath = path.join(options.gameDirectory, "versions", inheritsFrom, inheritsFrom + ".json")
    let vanillaVersionClient = null

    if (fs.existsSync(clientJsonPath)) {
        let vanillaVersionClientJSON = fs.readFileSync(clientJsonPath, 'utf8')
        vanillaVersionClient = JSON.parse(vanillaVersionClientJSON)
    } else {
        if (!downloadVanillaClient) {
            let e = getError(MESSAGES.E003, "E003")
            log(MESSAGES.E003, "error", e)
            throw e
        } else {
            let clientURL = await getClientJsonURL(inheritsFrom)
            vanillaVersionClient = await (await fetch(clientURL)).json()
        }
    }


    for (let field in modifiedVersionClient) {
        if (typeof modifiedVersionClient[field] !== "object") {
            if (field in vanillaVersionClient) {
                vanillaVersionClient[field] = modifiedVersionClient[field]
            }
        }
    }


    if (modifiedVersionClient.libraries) {
        let mergedLibraries = []
        let modifiedVersionLibrariesMavenNames = []

        for (let library of modifiedVersionClient.libraries) {
            let splitedMavenName = library.name.split(":")

            modifiedVersionLibrariesMavenNames.push({
                group: splitedMavenName[0],
                artifactId: splitedMavenName[1],
                version: splitedMavenName[2],
            })
        }


        for (let library of vanillaVersionClient.libraries) {
            let canPush = true
            for (let name of modifiedVersionLibrariesMavenNames) {
                let splitedMavenName = library.name.split(":")
                if ((splitedMavenName[0] == name.group && splitedMavenName[1] == name.artifactId)) {
                    canPush = false
                }
            }
            if (canPush) mergedLibraries.push(library)
        }

        for (let library of modifiedVersionClient.libraries) {
            mergedLibraries.push(library)
        }

        vanillaVersionClient.libraries = [...mergedLibraries]
    }



    if (modifiedVersionClient.arguments) {
        if (modifiedVersionClient.arguments.game) {
            vanillaVersionClient.arguments.game = [...vanillaVersionClient.arguments.game, ...modifiedVersionClient.arguments.game]
        }
        if (modifiedVersionClient.arguments.jvm) {
            vanillaVersionClient.arguments.jvm = [...vanillaVersionClient.arguments.jvm, ...modifiedVersionClient.arguments.jvm]
        }
    }


    return vanillaVersionClient
}

async function getClientJsonURL(versionId) {
    let version_manifest_response = await fetch(VERSION_MANIFEST_URL)
    let version_manifest = await version_manifest_response.json()

    let client_url = null

    for (let i = 0; i < version_manifest.versions.length; i++) {
        if (version_manifest.versions[i].id === versionId) {
            client_url = version_manifest.versions[i].url
        }
    }

    return client_url
}

async function launchWrapper(launchId) {

    let online = await isOnline()
    let client = null

    if (online && options.autodownloading) {

        let client_url = await getClientJsonURL(options.versionId)

        if (!client_url) {
            client = getClient()
            if (!client) {
                let e = getError(MESSAGES.E001, "E001")
                log(MESSAGES.E001, "error", e)
                throw e
            }
        } else {
            await downloadClientJson(client_url, launchId)
            client = getClient()
        }

        if (isModifiedVersion(client)) {
            dispatchEvent("modifiedversionfound", client)
            client = await makeVanillaVersionClient(client, true)
        }

        await downloadLogj4ConfigurationFile(client, launchId)
        await downloadClientJar(client, launchId)
        await downloadAssets(client, launchId)
        await downloadLibraries(client.libraries, launchId)
        await downloadNatives(client.libraries, launchId)
    } else {
        client = getClient()
        if (!client) {
            let e = getError(MESSAGES.E001, "E001")
            log(MESSAGES.E001, "error", e)
            throw e
        }
    }

    if (isModifiedVersion(client)) {
        dispatchEvent("modifiedversionfound", client)
        client = await makeVanillaVersionClient(client, false)
    }

    let classesPaths = getClassesPaths(client.libraries)
    let minecraftArguments = getMinecraftArguments(client, options.minecraftCustomArguments, options.replaceMinecraftArgumentValues)
    let JVMArguments = getJVMArguments(client, classesPaths)
    let hasJava = await checkJava(options.javaPath)


    if (!hasJava) {
        let e = getError(MESSAGES.E002, "E002")
        log(MESSAGES.E002, "error", e)
        throw e
    }

    startMinecraft(minecraftArguments, JVMArguments)
}

function launch(_options) {
    let launchId = uuidv4()

    for (let prop in _options) {
        options[prop] = _options[prop]
    }

    launchWrapper(launchId)

    return launchId
}

module.exports = {
    launch,
    addEventListener
}

