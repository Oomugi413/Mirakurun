const { describe, it } = require("node:test");
const assert = require("assert");

// Import the functions to be tested
const winService = require("../lib/Mirakurun/winService");

describe("[win-service.spec] winService.ts: toServiceId()", () => {
  it("Service name is normalized to lowercase alphanumerics", () => {
    assert.strictEqual(winService.toServiceId(winService.SERVICE_DISPLAY_NAME), "mirakurun");
    assert.strictEqual(winService.toServiceId("Mirakurun Server 2"), "mirakurunserver2");
  });
});

describe("[win-service.spec] winService.ts: parseServiceAccount()", () => {
  it("Account without a domain uses the local computer name", () => {
    assert.deepStrictEqual(winService.parseServiceAccount("mirakurun", "MY-PC"), {
      domain: "MY-PC",
      account: "mirakurun"
    });
  });

  it("`.\\user` is treated as a local account", () => {
    assert.deepStrictEqual(winService.parseServiceAccount(".\\mirakurun", "MY-PC"), {
      domain: "MY-PC",
      account: "mirakurun"
    });
  });

  it("Explicit domain is kept as is", () => {
    assert.deepStrictEqual(winService.parseServiceAccount("corp.local\\mirakurun", "MY-PC"), {
      domain: "corp.local",
      account: "mirakurun"
    });
  });

  it("Surrounding spaces are trimmed", () => {
    assert.deepStrictEqual(winService.parseServiceAccount("  mirakurun  ", "MY-PC"), {
      domain: "MY-PC",
      account: "mirakurun"
    });
  });

  it("Input without an account name results in null", () => {
    assert.strictEqual(winService.parseServiceAccount("", "MY-PC"), null);
    assert.strictEqual(winService.parseServiceAccount("   ", "MY-PC"), null);
    assert.strictEqual(winService.parseServiceAccount("MY-PC\\", "MY-PC"), null);
  });
});

describe("[win-service.spec] winService.ts: defaultServiceAccountName()", () => {
  it("Defaults to the logged on user instead of LocalSystem", () => {
    assert.strictEqual(
      winService.defaultServiceAccountName({ USERDOMAIN: "MY-PC", USERNAME: "mirakurun" }),
      "MY-PC\\mirakurun"
    );
  });

  it("Falls back to COMPUTERNAME when USERDOMAIN is missing", () => {
    assert.strictEqual(
      winService.defaultServiceAccountName({ COMPUTERNAME: "MY-PC", USERNAME: "mirakurun" }),
      "MY-PC\\mirakurun"
    );
  });

  it("Returns the user name only when no domain is available", () => {
    assert.strictEqual(winService.defaultServiceAccountName({ USERNAME: "mirakurun" }), "mirakurun");
  });

  it("Returns an empty string when the user name is unknown", () => {
    assert.strictEqual(winService.defaultServiceAccountName({}), "");
  });
});

describe("[win-service.spec] winService.ts: extractExecutablePath()", () => {
  it("Takes the first token of a command line", () => {
    assert.strictEqual(
      winService.extractExecutablePath("C:/DTV/BonRecTest.exe --driver BonDriver_PX4-T.dll"),
      "C:/DTV/BonRecTest.exe"
    );
  });

  it("Handles a quoted path containing spaces", () => {
    assert.strictEqual(
      winService.extractExecutablePath("\"C:/Program Files/DTV/BonRecTest.exe\" --output -"),
      "C:/Program Files/DTV/BonRecTest.exe"
    );
  });

  it("Returns null for an empty command", () => {
    assert.strictEqual(winService.extractExecutablePath(""), null);
    assert.strictEqual(winService.extractExecutablePath("   "), null);
  });
});

describe("[win-service.spec] winService.ts: collectTunerDirectories()", () => {
  it("Collects directories of command and decoder", () => {
    const tunersYaml = [
      "- name: local_device",
      "  types:",
      "    - GR",
      "  command: >-",
      "    C:/DTV/BonDriver/BonRecTest.exe --driver BonDriver_PX4-T.dll --output -",
      "    --space <space> --channel <channel>",
      "  decoder: C:/DTV/tools/arib-b25-stream-test.exe",
      "  isDisabled: false"
    ].join("\n");

    assert.deepStrictEqual(winService.collectTunerDirectories(tunersYaml), [
      "C:/DTV/BonDriver",
      "C:/DTV/tools"
    ]);
  });

  it("Skips commands resolved through PATH", () => {
    const tunersYaml = ["- name: tuner", "  command: recpt1 --b25 <channel> - -", "  decoder: arib-b25-stream-test"].join("\n");

    assert.deepStrictEqual(winService.collectTunerDirectories(tunersYaml), []);
  });

  it("Does not report the same directory twice", () => {
    const tunersYaml = [
      "- name: tuner1",
      "  command: C:/DTV/BonRecTest.exe --output -",
      "- name: tuner2",
      "  command: C:/DTV/BonRecTest.exe --output -"
    ].join("\n");

    assert.deepStrictEqual(winService.collectTunerDirectories(tunersYaml), ["C:/DTV"]);
  });

  it("Returns an empty array for broken or unexpected yaml", () => {
    assert.deepStrictEqual(winService.collectTunerDirectories("\tbroken: ["), []);
    assert.deepStrictEqual(winService.collectTunerDirectories("server: {}"), []);
    assert.deepStrictEqual(winService.collectTunerDirectories(""), []);
  });
});

describe("[win-service.spec] winService.ts: buildServicePath()", () => {
  it("Appends missing directories to the machine PATH", () => {
    const result = winService.buildServicePath("C:\\Windows\\system32;C:\\Windows;C:\\Program Files\\nodejs\\", [
      "C:\\Program Files\\nodejs",
      "C:/DTV/BonDriver"
    ]);

    // A trailing separator does not make it a different directory
    assert.strictEqual(result, "C:\\Windows\\system32;C:\\Windows;C:\\Program Files\\nodejs;C:/DTV/BonDriver");
  });

  it("Drops empty entries", () => {
    assert.strictEqual(winService.buildServicePath("C:\\Windows;;", ["", "   "]), "C:\\Windows");
  });
});

describe("[win-service.spec] winService.ts: buildServiceEnvironment()", () => {
  it("Passes through USERPROFILE / LOCALAPPDATA used to resolve config paths", () => {
    const entries = winService.buildServiceEnvironment({
      machinePath: "C:\\Windows",
      extraDirectories: ["C:/DTV/BonDriver"],
      serviceName: "mirakurun",
      userProfile: "C:\\Users\\mirakurun",
      localAppData: "C:\\Users\\mirakurun\\AppData\\Local"
    });

    assert.deepStrictEqual(entries, [
      { name: "Path", value: "C:\\Windows;C:/DTV/BonDriver" },
      { name: "USERPROFILE", value: "C:\\Users\\mirakurun" },
      { name: "LOCALAPPDATA", value: "C:\\Users\\mirakurun\\AppData\\Local" },
      { name: "MIRAKURUN_WIN_SERVICE_NAME", value: "mirakurun" },
      { name: "USING_WINSER", value: "1" }
    ]);
  });

  it("Omits user variables that are not available", () => {
    const entries = winService.buildServiceEnvironment({
      machinePath: "C:\\Windows",
      extraDirectories: [],
      serviceName: "mirakurunsub"
    });

    assert.deepStrictEqual(entries, [
      { name: "Path", value: "C:\\Windows" },
      { name: "MIRAKURUN_WIN_SERVICE_NAME", value: "mirakurunsub" },
      { name: "USING_WINSER", value: "1" }
    ]);
  });
});

describe("[win-service.spec] winService.ts: getWindowsServiceName()", () => {
  it("Falls back to the default service name", () => {
    assert.strictEqual(winService.getWindowsServiceName({}), "mirakurun");
  });

  it("Uses the name given at install time", () => {
    assert.strictEqual(
      winService.getWindowsServiceName({ MIRAKURUN_WIN_SERVICE_NAME: "mirakurunsub" }),
      "mirakurunsub"
    );
  });

  it("Rejects a name that would affect the shell (it is passed to sc start)", () => {
    assert.strictEqual(winService.getWindowsServiceName({ MIRAKURUN_WIN_SERVICE_NAME: "a & calc" }), "mirakurun");
    assert.strictEqual(winService.getWindowsServiceName({ MIRAKURUN_WIN_SERVICE_NAME: "" }), "mirakurun");
  });
});
