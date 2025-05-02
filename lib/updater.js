"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const child_process_1 = require("child_process");
const fs_1 = require("fs");
const latest_version_1 = require("latest-version");
const pkg = require("../package.json");
if (process.env.DOCKER === "YES") {
    console.error("Error: running in Docker.");
    process.exit(1);
}
if (process.platform !== "win32" && process.getuid() !== 0) {
    console.error("Error: root please.");
    process.exit(1);
}
if (!pkg._resolved) {
    console.error("Error: incompatible environment. (installed from not npm?)");
    process.exit(1);
}
(async () => {
    const current = pkg.version;
    console.log("current:", current);
    const latest = await (0, latest_version_1.default)("mirakurun");
    console.log("latest:", latest);
    if (current === latest) {
        console.log("already up to date.");
        process.exit(0);
    }
    if (current.split(".")[0] !== latest.split(".")[0]) {
        console.error("updater has aborted cause major version outdated.");
        process.exit(0);
    }
    console.log("updating...");
    const npm = spawnNpmInstall(latest);
    npm.on("exit", (code) => {
        if (code === 0) {
            console.log("updated successfully.");
            process.exit(0);
        }
        else {
            console.error("failed! reverting...");
            const npm = spawnNpmInstall(current);
            npm.on("exit", () => process.exit(1));
        }
    });
})();
function spawnNpmInstall(version) {
    let command = "npm";
    const args = [
        "install",
        `${pkg.name}@${version}`,
        "-g",
        "--production"
    ];
    if (process.platform === "win32") {
        command = "npm.cmd";
    }
    else {
        args.push("--unsafe-perm");
    }
    console.log(">", command, ...args);
    let out;
    if (process.env.UPDATER_LOG_PATH) {
        out = (0, fs_1.openSync)(process.env.UPDATER_LOG_PATH, "a");
    }
    const npm = (0, child_process_1.spawn)(command, args, {
        detached: true,
        stdio: [
            "ignore",
            out || process.stdout,
            out || process.stderr
        ]
    });
    npm.unref();
    return npm;
}
//# sourceMappingURL=updater.js.map