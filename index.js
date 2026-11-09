require("dotenv").config();
const v1 = process.stdout.write;
process.stdout.write = function (v2, v3, v4) {
  const v6 = v2.toString();
  if (v6.includes("Closing session: SessionEntry") || v6.includes("SessionEntry {")) {
    return;
  }
  return v1.apply(this, arguments);
};
const v7 = process.stderr.write;
process.stderr.write = function (v8, v9, v10) {
  const v11 = v8.toString();
  if (v11.includes("Closing session: SessionEntry")) {
    return;
  }
  return v7.apply(this, arguments);
};
const v12 = console.log;
console.log = function (v13, ...v14) {
  const v15 = {
    iEsgL: function (v16, v17) {
      return v16 === v17;
    },
    sUmJK: "Closing session: SessionEntry",
    RKLqm: "jHxZu",
    ZDUDP: "BRTlE"
  };
  const v18 = v15;
  if (v18.iEsgL(typeof v13, "string") && v13.startsWith(v18.sUmJK)) {
    if (v18.RKLqm !== v18.ZDUDP) {
      return;
    } else {
      v19.mkdirSync(v20.join(v21, "data"), {
        recursive: true
      });
    }
  }
  v12.apply(console, [v13, ...v14]);
};
const fs = require("fs");
const chalk = require("chalk");
const path = require("path");
const os = require("os");
const {
  default: v22,
  useMultiFileAuthState: v23,
  DisconnectReason: v24,
  fetchLatestBaileysVersion: v25,
  jidNormalizedUser: v26,
  makeCacheableSignalKeyStore: v27,
  delay: v28
} = require("@whiskeysockets/baileys");
const nodecache = require("node-cache");
const pino = require("pino");
const readline = require("readline");
const {
  rmSync: v29
} = require("fs");
const momenttimezone = require("moment-timezone");
const lolcatjs = require("lolcatjs");
const {
  normalizeJidWithLid: v30
} = require("./utils/jidHelper");
const {
  applyFont: v31
} = require("./utils/fontConverter");
process.env.PUPPETEER_SKIP_DOWNLOAD = "true";
process.env.PUPPETEER_SKIP_CHROMIUM_DOWNLOAD = "true";
function v32(v33, v34 = "white", v35 = false) {
  const v40 = chalk.blue.bold("[ Cyntron-X ]");
  const v41 = v35 ? console.error : console.log;
  const v42 = chalk[v34] ? chalk[v34](v33) : v33;
  if (v33.includes("\n") || v33.includes("════")) {
    {
      v41(v40, v42);
    }
  } else {
    v41(v40 + " " + v42);
  }
}
global.log = v32;
global.isBotConnected = false;
global.connectDebounceTimeout = null;
global.errorRetryCount = 0;
global.isReconnecting = false;
global._consecutive500Count = 0;
global._activeIntervals = [];
global.botState = "disconnected";
global.currentSock = null;
global.connectedAt = null;
global.__CORE__ = __dirname;
global.__ROOT__ = __dirname;
const config = require("./config");
try {
  const database = require("./database");
  const v44 = database.getAllBotSettings();
  for (const [v45, v46] of Object.entries(v44)) {
    if (v45 in config && v46 !== null && v46 !== undefined) {
      config[v45] = v46;
    }
  }
  if (v44.autoReadMode && v44.autoReadMode !== "off") {
    config.autoRead = v44.autoReadMode === "on" || v44.autoReadMode === "group";
  }
  if (v44.presenceMode === "typing") {
    config.autoTyping = true;
  }
  if (v44.presenceMode === "recording") {
    config.autoRecording = true;
  }
  if (v44.presenceMode === "recordtype") {
    config.autoRecording = true;
    config.autoRecordType = true;
  }
  if (v44.menuImageCustom) {
    const v47 = path.join(__dirname, "data/custom_menu.jpg");
    const v48 = path.join(__dirname, "utils/bot_image.jpg");
    const v49 = path.join(__dirname, "assets/menu1.jpg");
    let v50 = null;
    if (fs.existsSync(v47)) {
      try {
        v50 = fs.readFileSync(v47);
      } catch {}
    }
    if (!v50 && v44.menuImageData) {
      try {
        const v51 = Buffer.from(v44.menuImageData, "base64");
        if (!v51 || v51.length < 100) {
          throw new Error("Decoded image data is empty or too small to be valid.");
        }
        v50 = v51;
        try {
          fs.mkdirSync(path.join(__dirname, "data"), {
            recursive: true
          });
        } catch {}
        fs.writeFileSync(v47, v50);
        v32("[ SETTINGS ] Custom menu image rebuilt from database.", "cyan");
      } catch (v52) {
        v32("[ SETTINGS ] Could not rebuild menu image from database: " + v52.message, "yellow");
        v50 = null;
      }
    }
    if (v50) {
      try {
        fs.writeFileSync(v48, v50);
        try {
          fs.writeFileSync(v49, v50);
        } catch {}
        v32("[ SETTINGS ] Custom menu image restored successfully.", "cyan");
      } catch (v53) {
        v32("[ SETTINGS ] Could not restore custom menu image: " + v53.message, "yellow");
      }
    } else {
      database.setBotSetting("menuImageCustom", false);
      database.setBotSetting("menuImageData", null);
      v32("[ SETTINGS ] Custom menu image missing from both disk and database.", "yellow");
    }
  }
} catch (v54) {
  v32("[ SETTINGS ] Could not load runtime settings: " + v54.message, "yellow");
}
const handler = require("./handler");
const {
  saveSession: v55,
  getSession: v56,
  clearSession: v57
} = require("./database");
const v58 = path.join(__dirname, config.sessionName || "session");
const v59 = path.join(v58, "creds.json");
const v60 = path.join(__dirname, "login.json");
const v61 = path.join(process.cwd(), ".env");
if (!fs.existsSync(v61)) {
  const v62 = ["# Cyntron-X — Environment Variables", "# Paste your session ID here after first login using .getsession", "SESSION_ID=", "", "# Optional: override bot port (default 5000)", "# PORT=5000"].join("\n");
  fs.writeFileSync(v61, v62, "utf8");
  v32("[ .env ] No .env file found — created with default template.", "green");
}
function v63() {
  try {
    if (!fs.existsSync(v61)) {
      return "";
    }
    const v73 = fs.readFileSync(v61, "utf8").split("\n");
    for (const v74 of v73) {
      {
        const v75 = v74.trim();
        if (v75.startsWith("#") || !v75.startsWith("SESSION_ID=")) {
          continue;
        }
        const v76 = v75.slice("SESSION_ID=".length).trim();
        return v76;
      }
    }
  } catch (v77) {
    {
      v32("[ .env ] Failed to read SESSION_ID: " + v77.message, "red", true);
    }
  }
  return "";
}
const v84 = v63();
if (v84) {
  process.env.SESSION_ID = v84;
}
const v85 = path.join(__dirname, "message_backup.json");
const v86 = path.join(__dirname, "sessionErrorCount.json");
global.messageBackup = {};
function v87() {
  const v88 = {
    wBjoB: "✅ Session error count reset.",
    dOLFC: "green",
    RUldx: "bTMca",
    kaQCL: "XLVGU",
    tnVRW: "utf-8"
  };
  try {
    if (fs.existsSync(v85)) {
      {
        return JSON.parse(fs.readFileSync(v85, "utf-8"));
      }
    }
  } catch (v96) {
    v32("Error loading message backup: " + v96.message, "red", true);
  }
  return {};
}
let v97 = null;
function v98(v99) {
  const v100 = {
    stffh: function (v101, v102) {
      return v101 === v102;
    },
    bGwQk: "igfPM",
    wpQaY: function (v103, v104, v105, v106) {
      return v103(v104, v105, v106);
    },
    OVtUR: function (v107, v108, v109) {
      return v107(v108, v109);
    }
  };
  if (v97) {
    return;
  }
  v97 = setTimeout(() => {
    v97 = null;
    try {
      fs.writeFile(v85, JSON.stringify(v99, null, 2), () => {});
    } catch (v110) {
      {
        v32("Error saving message backup: " + v110.message, "red", true);
      }
    }
  }, 5000);
}
global.messageBackup = v87();
function v111() {
  const v112 = {
    LWrUN: function (v113, v114, v115) {
      return v113(v114, v115);
    },
    vAAtQ: "utf-8",
    kVsOC: function (v116, v117) {
      return v116 === v117;
    },
    XvMSP: "mntmm",
    CqaiQ: function (v118, v119, v120, v121) {
      return v118(v119, v120, v121);
    },
    YvmFh: "red"
  };
  try {
    if (fs.existsSync(v86)) {
      return JSON.parse(fs.readFileSync(v86, "utf-8"));
    }
  } catch (v122) {
    {
      v32("Error loading error count: " + v122.message, "red", true);
    }
  }
  return {
    count: 0,
    last_error_timestamp: 0
  };
}
function v123(v124) {
  const v125 = {
    DMCNc: function (v126, v127, v128) {
      return v126(v127, v128);
    },
    UpcPJ: "Invalid Session ID! Must start with 'Cyntron-X:~' (legacy prefixes including unstoppable:~, sanezo:~, and suniza:~ are also accepted)",
    PAqHf: "tLxbj",
    iCNXa: "qWMju",
    eNiBN: "Khsqz",
    UYlGo: function (v129, v130, v131, v132) {
      return v129(v130, v131, v132);
    },
    ufVuZ: "red"
  };
  try {
    {
      fs.writeFileSync(v86, JSON.stringify(v124, null, 2));
    }
  } catch (v135) {
    {
      v32("Error saving error count: " + v135.message, "red", true);
    }
  }
}
function v136() {
  const v137 = {
    HCobf: "green",
    neqEO: function (v138, v139, v140, v141) {
      return v138(v139, v140, v141);
    }
  };
  try {
    if (fs.existsSync(v86)) {
      fs.unlinkSync(v86);
      v32("✅ Session error count reset.", "green");
    }
  } catch (v142) {
    v32("Failed to delete error count file: " + v142.message, "red", true);
  }
}
function v143() {
  const v144 = {
    dXsDQ: function (v145, v146, v147) {
      return v145(v146, v147);
    },
    keNfa: function (v148) {
      return v148();
    },
    swOfs: function (v149, v150) {
      return v149 === v150;
    },
    NgiEn: "2|6|3|1|0|5|4",
    qHDjn: function (v151, v152, v153) {
      return v151(v152, v153);
    },
    HaeIb: "[ SESSION ] files cleared successfully.",
    tsDhL: "green",
    myBiv: function (v154, v155, v156, v157) {
      return v154(v155, v156, v157);
    },
    REFRP: "red"
  };
  try {
    {
      const v158 = "2|6|3|1|0|5|4".split("|");
      while (true) {
        switch (v158[v159++]) {
          case "0":
            global.errorRetryCount = 0;
            continue;
          case "1":
            v136();
            continue;
          case "2":
            v32("[ CLEARING ] session folder...", "blue");
            continue;
          case "3":
            if (fs.existsSync(v60)) {
              fs.unlinkSync(v60);
            }
            continue;
          case "4":
            v32("[ SESSION ] files cleared successfully.", "green");
            continue;
          case "5":
            v57();
            continue;
          case "6":
            v29(v58, {
              recursive: true,
              force: true
            });
            continue;
        }
        break;
      }
    }
  } catch (v160) {
    v32("Failed to clear session files: " + v160.message, "red", true);
  }
}
function v161() {
  const v162 = {
    HndTd: "Closing session: SessionEntry",
    ThWmQ: function (v163, v164) {
      return v163 / v164;
    },
    tvWRS: function (v165, v166) {
      return v165 * v166;
    },
    SYOly: function (v167, v168) {
      return v167 === v168;
    },
    NgDIc: "dbVDH",
    DuFWg: "AFVSx",
    aLuCo: function (v169, v170) {
      return v169 > v170;
    },
    IUVme: function (v171, v172, v173) {
      return v171(v172, v173);
    },
    ueFzU: "[ MSG CLEANUP ] Old messages removed 🧹"
  };
  const v174 = v87();
  const v175 = Math.floor(Date.now() / 1000);
  const v176 = 1440 * 60;
  const v177 = {};
  for (const v178 in v174) {
    {
      for (const v180 in v174[v178]) {
        if (v175 - v174[v178][v180].timestamp <= v176) {
          v179[v180] = v174[v178][v180];
        }
      }
      if (Object.keys(v179).length > 0) {
        v177[v178] = v179;
      }
    }
  }
  v98(v177);
  v32("[ MSG CLEANUP ] Old messages removed 🧹", "green");
}
function v181(v182) {
  const v183 = {
    yqyoN: function (v184, v185) {
      return v184(v185);
    },
    SXTpf: function (v186, v187, v188, v189) {
      return v186(v187, v188, v189);
    },
    clPkD: function (v190, v191) {
      return v190 > v191;
    },
    DBYJN: "rKhxU",
    EtvRM: "GLAZP",
    qUsAL: function (v192, v193) {
      return v192 === v193;
    },
    fjitS: "UdSKt",
    mWkOm: function (v194, v195) {
      return v194 + v195;
    },
    FKVyu: "@s.whatsapp.net",
    rjCON: function (v196, v197, v198) {
      return v196(v197, v198);
    }
  };
  const v199 = path.join(__dirname);
  fs.readdir(v199, async (v200, v201) => {
    const v202 = {
      PBlwN: function (v203, v204, v205, v206) {
        return v203(v204, v205, v206);
      }
    };
    if (v200) {
      return v32("[Junk Cleanup] Error reading dir: " + v200, "red", true);
    }
    const v207 = v201.filter(v208 => [".gif", ".png", ".mp3", ".mp4", ".opus", ".jpg", ".webp", ".webm", ".zip"].some(v209 => v208.endsWith(v209)));
    if (v207.length > 0) {
      {
        if (v182?.user?.id) {
          {
            const v210 = {
              text: "🧹 Detected " + v207.length + " junk file(s) — deleted automatically."
            };
            v182.sendMessage(v182.user.id.split(":")[0] + "@s.whatsapp.net", v210).catch(() => {});
          }
        }
        v207.forEach(v211 => {
          try {
            fs.unlinkSync(path.join(v199, v211));
          } catch (v212) {}
        });
        v32("[Junk Cleanup] " + v207.length + " file(s) deleted.", "yellow");
      }
    }
  });
}
const v213 = process.stdin.isTTY ? readline.createInterface({
  input: process.stdin,
  output: process.stdout
}) : null;
const v214 = v215 => v213 ? new Promise(v216 => v213.question(v215, v216)) : Promise.resolve("");
async function v217(v218) {
  const v219 = {
    method: v218
  };
  await fs.promises.writeFile(v60, JSON.stringify(v219, null, 2));
}
async function v220() {
  const v221 = {
    zopvp: function (v222, v223) {
      return v222 * v223;
    },
    Jpvtc: function (v224, v225, v226) {
      return v224(v225, v226);
    },
    eXjPT: function (v227, v228) {
      return v227 / v228;
    },
    kFaaF: "white",
    eldOg: function (v229, v230) {
      return v229 === v230;
    },
    lIYra: "EDdLL"
  };
  if (fs.existsSync(v60)) {
    {
      return JSON.parse(fs.readFileSync(v60, "utf-8")).method;
    }
  }
  return null;
}
function v231() {
  return fs.existsSync(v59);
}
const v232 = ["Cyntron-X:~", "cyntron-x:~", "unstoppable:~", "sanezo:~", "suniza:~", "Ultra-X:~"];
async function v233() {
  const v234 = {
    Lndzl: function (v235, v236) {
      return v235 !== v236;
    },
    dtkDj: "FzUyA",
    xaemM: "3|2|4|1|0",
    UjQmk: function (v237, v238) {
      return v237(v238);
    },
    jjVuL: function (v239, v240, v241) {
      return v239(v240, v241);
    },
    IOzlM: "white",
    yHGTq: function (v242, v243, v244) {
      return v242(v243, v244);
    },
    coSwW: "[ERROR]: Invalid SESSION_ID format."
  };
  const v245 = process.env.SESSION_ID;
  if (v245 && v245.trim() !== "") {
    {
      if (!v232.some(v246 => v245.trim().startsWith(v246))) {
        const v247 = "3|2|4|1|0".split("|");
        let v248 = 0;
        while (true) {
          switch (v247[v248++]) {
            case "0":
              process.exit(1);
              continue;
            case "1":
              await v28(20000);
              continue;
            case "2":
              v32(chalk.black.bgYellowBright("[SESSION ID] MUST start with \"Cyntron-X:~\" (legacy prefixes including unstoppable:~, sanezo:~, and suniza:~ are also accepted)."), "white");
              continue;
            case "3":
              v32(chalk.black.bgYellowBright("[ERROR]: Invalid SESSION_ID format."), "white");
              continue;
            case "4":
              v32(chalk.black.bgYellowBright("Please fix your SESSION_ID and restart. Exiting in 20 seconds..."), "white");
              continue;
          }
          break;
        }
      }
    }
  }
}
async function v250() {
  const v251 = {
    VcUvp: "Ultra-X:~",
    IsWOL: "Cyntron-X:~",
    exxaQ: "base64",
    ArvCc: "utf8",
    COTCx: function (v252, v253, v254) {
      return v252(v253, v254);
    }
  };
  await fs.promises.mkdir(v58, {
    recursive: true
  });
  if (!fs.existsSync(v59) && global.SESSION_ID) {
    const v255 = global.SESSION_ID;
    let v256;
    const v257 = ["Cyntron-X:~", "cyntron-x:~", "unstoppable:~", "sanezo:~", "suniza:~", "Ultra-X:~"];
    const v258 = v257.find(v259 => v255.startsWith(v259));
    if (!v258) {
      throw new Error("Unknown session Format: " + v257.join(", "));
    }
    const v260 = v255.slice(v258.length);
    v256 = Buffer.from(v260, "base64");
    JSON.parse(v256.toString("utf8"));
    await fs.promises.writeFile(v59, v256);
    v32("✅ Session saved from SESSION_ID successfully.", "green");
  }
}
async function v261() {
  const v262 = {
    FxETO: function (v263) {
      return v263();
    }
  };
  if (v231()) {
    return false;
  }
  const v264 = v56();
  if (!v264) {
    return false;
  }
  try {
    await fs.promises.mkdir(v58, {
      recursive: true
    });
    const v265 = Buffer.from(v264, "base64");
    JSON.parse(v265.toString("utf8"));
    await fs.promises.writeFile(v59, v265);
    return true;
  } catch (v266) {
    v32("⚠️ DB session restore failed", "yellow");
    v57();
    return false;
  }
}
let v267 = 0;
const v268 = 1800000;
async function v269(v270 = false) {
  const v271 = {
    kSXdT: "[ Cyntron-X ]",
    Gndhe: "utf-8",
    GyMnk: function (v272, v273) {
      return v272 === v273;
    },
    jYeAL: "tvlcI",
    AmCeN: function (v274, v275) {
      return v274 < v275;
    },
    GdqqC: function (v276, v277) {
      return v276 - v277;
    },
    iiWCZ: "base64",
    uahUt: "iXqFy",
    OqkSH: "wpqSS",
    Codjm: function (v278, v279) {
      return v278 + v279;
    }
  };
  const v280 = v271;
  try {
    if (v280.GyMnk("Uhxvy", v280.jYeAL)) {
      const v281 = v282.blue.bold(XNGcQb.kSXdT);
      const v283 = v284 ? v285.error : v286.log;
      const v287 = v288[v289] ? v290[v291](v292) : v293;
      if (v294.includes("\n") || v295.includes("════")) {
        v283(v281, v287);
      } else {
        v283(v281 + " " + v287);
      }
    } else {
      const v296 = Date.now();
      if (!v270 && v280.AmCeN(v280.GdqqC(v296, v267), v268)) {
        return;
      }
      if (!fs.existsSync(v59)) {
        return;
      }
      const v297 = fs.readFileSync(v59, "utf8");
      JSON.parse(v297);
      const v298 = Buffer.from(v297, "utf8").toString(v280.iiWCZ);
      const v299 = "Cyntron-X:~" + v298;
      if (v280.GyMnk(process.env.SESSION_ID?.trim(), v299)) {
        if (v280.GyMnk("PtACs", "PtACs")) {
          v267 = v296;
          return;
        } else {
          return v300.parse(v301.readFileSync(v302, XNGcQb.Gndhe));
        }
      }
      if (fs.existsSync(v61)) {
        const v303 = fs.readFileSync(v61, "utf8");
        if (/^SESSION_ID=\s*$/m.test(v303)) {
          if (v280.uahUt === v280.OqkSH) {
            return v304.parse(v305.readFileSync(v306, XNGcQb.Gndhe)).method;
          } else {
            process.env.SESSION_ID = v299;
            v267 = v296;
            return;
          }
        }
        global._suppressEnvWatcherUntil = Date.now() + 3000;
        const v307 = /^SESSION_ID=/m.test(v303) ? v303.replace(/^SESSION_ID=.*$/m, "SESSION_ID=" + v299) : v280.Codjm(v303.trimEnd(), "\nSESSION_ID=" + v299 + "\n");
        fs.writeFileSync(v61, v307);
        process.env.SESSION_ID = v299;
        v267 = v296;
      }
    }
  } catch (v308) {}
}
async function v309() {
  const v310 = {
    imkzA: function (v311, v312, v313, v314) {
      return v311(v312, v313, v314);
    },
    Zaxzg: "red",
    UvVzW: function (v315, v316, v317) {
      return v315(v316, v317);
    },
    ahUBW: "✅ Session error count reset.",
    JayVw: "green",
    mMlPZ: function (v318) {
      return v318();
    },
    StRZE: function (v319) {
      return v319();
    },
    kVcHe: function (v320, v321) {
      return v320 !== v321;
    },
    GPWsM: function (v322, v323) {
      return v322 === v323;
    },
    TBFOI: "WjeVl",
    qDrKC: "zhTap",
    bTlxl: "Choose Any WhatsApp Login method:",
    LaLzL: function (v324, v325, v326) {
      return v324(v325, v326);
    },
    BcfjG: function (v327, v328, v329) {
      return v327(v328, v329);
    },
    XgmWV: "yellow",
    TKZHZ: function (v330, v331, v332) {
      return v330(v331, v332);
    },
    MUpVX: "Session Formats accepted:",
    okLde: function (v333, v334, v335) {
      return v333(v334, v335);
    },
    tslwV: "Cyntron-X:~<base64> (legacy prefixes including unstoppable:~, sanezo:~, and suniza:~ also accepted)",
    SlkWZ: function (v336, v337) {
      return v336(v337);
    },
    sGLyi: "\nYour session ID: ",
    bjwlo: "Sdsfh",
    kwXXM: function (v338, v339, v340) {
      return v338(v339, v340);
    },
    maJqp: "session",
    zgUdc: "fuNsQ",
    Axjuq: "Example: 2547xxxxxxxx",
    uVggk: "\nYour phone number: ",
    wjppO: function (v341, v342, v343) {
      return v341(v342, v343);
    },
    MLDOD: "number",
    QBtkt: function (v344, v345, v346) {
      return v344(v345, v346);
    },
    zGbDz: "Invalid option! Please choose 1 or 2."
  };
  const v347 = await v220();
  if (v347 && v231()) {
    return v347;
  }
  if (!v231() && fs.existsSync(v60)) {
    {
      fs.unlinkSync(v60);
    }
  }
  if (!process.stdin.isTTY) {
    {
      v32("❌ No SESSION_ID found and no TTY available for interactive login.", "red");
      process.exit(1);
    }
  }
  v32("Choose Any WhatsApp Login method:", "green");
  v32("1. ✓Enter Session ID", "yellow");
  v32("2. ✓Enter Phone Number", "yellow");
  let v352 = await v214(chalk.greenBright("\nYour choice (1 or 2): "));
  v352 = v352.trim();
  if (v352 === "1") {
    v32("\nEnter your session ID, if it doesn't work put it in .env file (Get it from repository)", "yellow");
    v32("Session Formats accepted:", "yellow");
    v32("Cyntron-X:~<base64> (legacy prefixes including unstoppable:~, sanezo:~, and suniza:~ also accepted)", "yellow");
    let v353 = await v214(chalk.greenBright("\nYour session ID: "));
    v353 = v353.trim();
    if (!v232.some(v354 => v353.startsWith(v354))) {
      {
        v32("Invalid Session ID! Must start with 'Cyntron-X:~' (legacy prefixes including unstoppable:~, sanezo:~, and suniza:~ are also accepted)", "red");
        process.exit(1);
      }
    }
    global.SESSION_ID = v353;
    await v217("session");
    return "session";
  } else if (v352 === "2") {
    {
      v32("\nEnter your WhatsApp phone number with country code.", "green");
      v32("Example: 2547xxxxxxxx", "green");
      let v360 = await v214(chalk.greenBright("\nYour phone number: "));
      v360 = v360.trim().replace(/[^0-9]/g, "");
      if (v360.length < 7) {
        v32("Invalid phone number.", "red");
        return v309();
      }
      global.phoneNumber = v360;
      await v217("number");
      return "number";
    }
  } else {
    v32("Invalid option! Please choose 1 or 2.", "red");
    return v309();
  }
}
async function v364(v365) {
  const v366 = {
    cYixq: "@s.whatsapp.net",
    QAnlb: "Waiting 3 seconds for socket to stabilize...",
    roDrI: function (v367, v368) {
      return v367(v368);
    },
    kRZHb: function (v369, v370, v371) {
      return v369(v370, v371);
    },
    rmjcp: "white",
    dfirs: function (v372, v373, v374) {
      return v372(v373, v374);
    },
    IAANy: "blue",
    PLukV: function (v375, v376) {
      return v375 === v376;
    },
    ctYdG: "MaNaE",
    fafni: function (v377, v378, v379, v380) {
      return v377(v378, v379, v380);
    }
  };
  try {
    v32("Waiting 3 seconds for socket to stabilize...", "yellow");
    await v28(3000);
    let v381 = await v365.requestPairingCode(global.phoneNumber);
    v381 = v381?.match(/.{1,4}/g)?.join("-") || v381;
    v32(chalk.black.bgCyanBright("\n🔑 Your Pairing Code: " + v381 + "\n"), "white");
    v32("\n1. Open WhatsApp → Settings → Linked Devices\n2. Tap \"Link a Device\"\n3. Enter the code above\n", "blue");
    return true;
  } catch (v382) {
    {
      v32("Failed to get pairing code: " + v382.message, "red", true);
      return false;
    }
  }
}
function v383() {
  const v384 = {
    aqEBc: "🔵 Replit",
    XfXZI: "🐦‍⬛ Linux Container (LXC)",
    dvqnW: "🚉 Railway",
    QwXSf: "🪟 Windows",
    EDFFJ: "darwin",
    MjhGc: "🍎 macOS",
    HUxrZ: "🐧 Linux",
    SecrL: "❓ Unknown",
    cCTRK: "📱 Termux",
    cJTSP: "🖥️ Panel"
  };
  const v385 = "3|7|4|0|6|2|8|1|5".split("|");
  let v386 = 0;
  while (true) {
    switch (v385[v386++]) {
      case "0":
        if (process.env.REPLIT_SLUG || process.env.REPL_ID) {
          return "🔵 Replit";
        }
        continue;
      case "1":
        if (process.env.LXC) {
          return "🐦‍⬛ Linux Container (LXC)";
        }
        continue;
      case "2":
        if (process.env.PORTS && process.env.CYPHERX_HOST_ID) {
          return "🌀 CypherX Platform";
        }
        continue;
      case "3":
        if (process.env.DYNO) {
          return "☁️ Heroku";
        }
        continue;
      case "4":
        if (process.env.RAILWAY_ENVIRONMENT || process.env.RAILWAY_PROJECT_ID) {
          return "🚉 Railway";
        }
        continue;
      case "5":
        switch (os.platform()) {
          case "win32":
            return "🪟 Windows";
          case "darwin":
            return "🍎 macOS";
          case "linux":
            return "🐧 Linux";
          default:
            return "❓ Unknown";
        }
        continue;
      case "6":
        if (process.env.PREFIX && process.env.PREFIX.includes("termux")) {
          return "📱 Termux";
        }
        continue;
      case "7":
        if (process.env.RENDER) {
          return "⚡ Render";
        }
        continue;
      case "8":
        if (process.env.P_SERVER_UUID) {
          return "🖥️ Panel";
        }
        continue;
    }
    break;
  }
}
async function v387(v388) {
  const v389 = {
    rjqKf: function (v390, v391) {
      return v390(v391);
    },
    wIjOt: "@s.whatsapp.net",
    RCvNg: function (v392, v393, v394) {
      return v392(v393, v394);
    },
    CYqkk: "Connected",
    cDTyB: function (v395) {
      return v395();
    },
    UuDFV: "red"
  };
  if (global.isBotConnected) {
    return;
  }
  await v28(1500);
  try {
    if (!v388.user || global.isBotConnected) {
      return;
    }
    global.isBotConnected = true;
    const v396 = v388.user.id.split(":")[0] + "@s.whatsapp.net";
    const v397 = config.prefix === "" ? "none" : config.prefix || ".";
    const v398 = v383();
    const v399 = Array.isArray(config.ownerName) ? config.ownerName[0] : config.ownerName;
    const v400 = v31("┏━━━━━━✧ CONNECTED ✧━━━━━━━\n┃✧ Bot: " + config.botName + "\n┃✧ Prefix: [ " + v397 + " ]\n┃✧ Owner: " + v399 + "\n┃✧ Platform: " + v398 + "\n┃✧ Status: 🟢 Online \n┃✧ Time: " + new Date().toLocaleString() + "\n┗━━━━━━━━━━━━━━━━━━━━━━━━━━");
    const v401 = {
      text: v400
    };
    await v388.sendMessage(v396, v401);
    v32("Connected", "red");
    v136();
    global.errorRetryCount = 0;
  } catch (v402) {
    v32("Welcome message error: " + v402.message, "red", true);
    global.isBotConnected = false;
  }
}
async function v403(v404) {
  const v405 = {
    KkQxu: function (v406) {
      return v406();
    },
    flHrY: function (v407, v408) {
      return v407 >= v408;
    },
    haDol: function (v409, v410) {
      return v409(v410);
    }
  };
  if (v404 !== v24.connectionTimeout) {
    return false;
  }
  global.errorRetryCount++;
  const v411 = 10;
  const v412 = v111();
  v412.count = global.errorRetryCount;
  v412.last_error_timestamp = Date.now();
  v123(v412);
  v32("Connection Timeout (408). Retry " + global.errorRetryCount + "/" + v411, "yellow");
  if (global.errorRetryCount >= v411) {
    v32(chalk.black.bgYellowBright("[MAX TIMEOUTS] " + v411 + " reached. Waiting 60s before next attempt..."), "white");
    v136();
    global.errorRetryCount = 0;
    await v28(60000);
  }
  return true;
}
async function v413() {
  const v414 = {
    HDgOo: function (v415) {
      return v415();
    },
    UcAFH: function (v416, v417, v418) {
      return v416(v417, v418);
    },
    LTZoR: "Cleanup done. Waiting 3 seconds...",
    DujbP: "yellow",
    vDCQV: function (v419, v420) {
      return v419(v420);
    }
  };
  const v421 = fs.existsSync(v58);
  const v422 = v231();
  if (v421 && !v422) {
    v143();
    v32("Cleanup done. Waiting 3 seconds...", "yellow");
    await v28(3000);
  }
}
function v423() {
  const v424 = {
    SHqvK: function (v425, v426) {
      return v425 === v426;
    },
    mWkDm: "change",
    VZQAx: function (v427, v428, v429) {
      return v427(v428, v429);
    },
    aAlHV: "[ENV CHANGED] Restarting to apply new configuration...",
    BXrwS: "utf8",
    SyKmO: function (v430, v431) {
      return v430 + v431;
    },
    hTXVG: function (v432, v433) {
      return v432 + v433;
    },
    HrTNW: "red",
    ASAPp: function (v434, v435) {
      return v434 !== v435;
    },
    FYWRU: "kurVl",
    cBVBw: "aAKHF",
    xQaIW: function (v436, v437, v438) {
      return v436(v437, v438);
    },
    UcjDN: "[ WATCHER ] Monitoring .env for changes...",
    rRjbH: "njfWL",
    NeLzK: "BhAoz",
    aAWeU: function (v439, v440, v441) {
      return v439(v440, v441);
    },
    RIZnv: "yellow"
  };
  try {
    {
      v32("[ WATCHER ] Monitoring .env for changes...", "green");
      fs.watch(v61, {
        persistent: false
      }, (v442, v443) => {
        if (v443 && v442 === "change") {
          if (global._suppressEnvWatcherUntil && Date.now() < global._suppressEnvWatcherUntil) {
            return;
          }
          v32(chalk.black.bgBlueBright("[ENV CHANGED] Restarting to apply new configuration..."), "white");
          process.exit(1);
        }
      });
    }
  } catch (v462) {
    {
      v32("⚠️ .env watcher failed: " + v462.message, "yellow");
    }
  }
}
const v463 = {
  messages: new Map(),
  maxPerChat: 20,
  bind(v464) {
    const v465 = {
      ramIO: function (v466, v467) {
        return v466 !== v467;
      },
      vRnaM: function (v468, v469) {
        return v468 > v469;
      }
    };
    const v470 = v465;
    v464.on("messages.upsert", ({
      messages: v471
    }) => {
      if (v470.ramIO("Gnujz", "jyrYx")) {
        for (const v472 of v471) {
          if (!v472.key?.id) {
            continue;
          }
          const v473 = v472.key.remoteJid;
          if (!v463.messages.has(v473)) {
            v463.messages.set(v473, new Map());
          }
          const v474 = v463.messages.get(v473);
          v474.set(v472.key.id, v472);
          if (v470.vRnaM(v474.size, v463.maxPerChat)) {
            v474.delete(v474.keys().next().value);
          }
        }
      } else {
        v475("Message handler error: " + v476.message, "red", true);
      }
    });
  },
  async loadMessage(v477, v478) {
    return v463.messages.get(v477)?.get(v478) || null;
  }
};
const v479 = new Set();
setInterval(() => v479.clear(), 300000);
const v480 = ["closing session", "sessionentry", "prekey bundle", "pendingprekey", "_chains", "registrationid", "currentratchet", "chainkey", "ratchet", "signal protocol", "ephemeralkeypair", "indexinfo", "basekey", "ratchetkey"];
function v481() {
  const v482 = {
    NMxFn: function (v483, v484) {
      return v483(v484);
    },
    iHJfx: function (v485, v486) {
      return v485 !== v486;
    },
    dyQFQ: "xvXJJ",
    CVfun: function (v487, v488) {
      return v487(v488);
    },
    FGRJk: "silent"
  };
  const v489 = pino({
    level: "silent"
  });
  v489.info = (...v490) => {
    {
      const v494 = v490.map(v495 => typeof v495 === "string" ? v495 : JSON.stringify(v495)).join(" ").toLowerCase();
      if (!v480.some(v496 => v494.includes(v496))) {
        pino({
          level: "info"
        }).info(...v490);
      }
    }
  };
  v489.debug = () => {};
  v489.trace = () => {};
  return v489;
}
const v497 = v498 => !v498 || v498.includes("@broadcast") || v498.includes("status.broadcast") || v498.includes("@newsletter");
let v499 = null;
async function v500() {
  const v501 = {
    InGLi: "session-",
    InlIY: function (v502, v503) {
      return v502 > v503;
    },
    uGEUb: function (v504, v505) {
      return v504 - v505;
    },
    rJanL: function (v506, v507) {
      return v506 * v507;
    },
    kCcxe: function (v508, v509) {
      return v508 * v509;
    },
    YToKs: function (v510) {
      return v510();
    },
    SPksk: function (v511, v512) {
      return v511 !== v512;
    },
    nYgVC: "xwgDu",
    tvCsq: function (v513, v514, v515) {
      return v513(v514, v515);
    },
    dtKPR: "yellow"
  };
  if (v499) {
    return v499;
  }
  try {
    const v516 = await v25();
    v499 = v516.version;
  } catch (v517) {
    {
      v499 = [2, 3000, 1023507977];
      v32("[ VERSION ] fetchLatestBaileysVersion failed (" + v517.message + "). Using fallback version.", "yellow");
    }
  }
  return v499;
}
async function v529() {
  const v530 = {
    ZzGjF: function (v531, v532) {
      return v531(v532);
    },
    XaSPq: function (v533, v534) {
      return v533 !== v534;
    },
    RUJcn: "QiKER",
    MFmkd: "@lid",
    nOLea: "gCzop",
    irAtc: function (v535, v536, v537) {
      return v535(v536, v537);
    },
    SzmID: "red",
    SUCOj: "already",
    oeCCu: "unexpected",
    wMZQu: function (v538, v539) {
      return v538 !== v539;
    },
    hctOv: "HIqtU",
    tjmuq: function (v540, v541) {
      return v540 < v541;
    },
    oAVjU: "white",
    wbMqu: "close",
    kDZuP: "connecting",
    qURRn: function (v542, v543) {
      return v542 === v543;
    },
    aENHj: function (v544, v545, v546) {
      return v544(v545, v546);
    },
    SODpw: "disconnected",
    IPeiS: "yellow",
    tWBxN: function (v547, v548) {
      return v547 > v548;
    },
    MDQkz: function (v549) {
      return v549();
    },
    fNNRm: "hepmO",
    zEeDx: function (v550, v551) {
      return v550 * v551;
    },
    DgnHE: function (v552, v553) {
      return v552 / v553;
    },
    HPalm: function (v554, v555) {
      return v554 === v555;
    },
    sinNL: function (v556, v557) {
      return v556 + v557;
    },
    NtVPg: function (v558, v559) {
      return v558 >= v559;
    },
    RomTB: function (v560, v561, v562) {
      return v560(v561, v562);
    },
    ZeqNr: function (v563, v564) {
      return v563 !== v564;
    },
    tGnVB: function (v565, v566, v567) {
      return v565(v566, v567);
    },
    CnhBp: function (v568, v569) {
      return v568 === v569;
    },
    ylHIN: "connected",
    kUIfD: "unknown",
    GINaV: "Connecting...",
    rjMLj: function (v570, v571) {
      return v570(v571);
    },
    RQWsz: "FiJ0HpoqKOS0llgeS1uydN",
    aAGPn: "DYypfAwEthA6N4VHreEC4O",
    rqoXn: function (v572, v573) {
      return v572(v573);
    },
    OHSzP: "readReceipts",
    WHALR: "all",
    KlYoF: "DWlMF",
    qlEwM: "XhwIq",
    pqgSv: function (v574, v575, v576, v577) {
      return v574(v575, v576, v577);
    },
    TaBkD: "utf-8",
    zousV: "ZJxmr",
    nuyyC: "BqOzD",
    uKSrt: "creds.json was not written after download — SESSION_ID may be corrupt or expired",
    iGvst: "not-authorized",
    OcgPE: "notify",
    TjxXP: function (v578, v579) {
      return v578(v579);
    },
    hJtJl: "./database",
    jVbJN: function (v580, v581) {
      return v580(v581);
    },
    uQUmr: "./commands/owner/antideletestatus",
    ndZYB: function (v582, v583) {
      return v582 === v583;
    },
    qjbnc: function (v584, v585) {
      return v584 !== v585;
    },
    LQUfe: "AZrWV",
    BVcyJ: "status@broadcast",
    ASjqE: "read",
    mpmrv: "ujXit",
    zluHT: "ZSRkE",
    NmcjR: "VLYlf",
    vatyB: function (v586, v587) {
      return v586(v587);
    },
    LtwWp: function (v588, v589) {
      return v588(v589);
    },
    gFrOV: "snlRG",
    jjAAt: "HhNlf",
    FxKuo: function (v590, v591) {
      return v590 * v591;
    },
    yYFRD: function (v592, v593) {
      return v592 - v593;
    },
    ojRWC: function (v594, v595) {
      return v594 * v595;
    },
    jhDOS: function (v596, v597) {
      return v596 === v597;
    },
    WkHBa: "tDAbz",
    DUfAx: "Africa/Nairobi",
    CfUiC: "N/A",
    tQFIS: "@g.us",
    PfrvY: "xwuhk",
    PseqT: function (v598, v599) {
      return v598(v599);
    },
    luzyM: "dddd",
    LbAnJ: "HH:mm:ss z",
    Oacik: "┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━─ ⳹\n",
    PxZBr: function (v600, v601, v602) {
      return v600(v601, v602);
    },
    qTxOL: "unavailable",
    UKbVE: function (v603, v604) {
      return v603 !== v604;
    },
    WzeEb: "WhHaF",
    fmsvZ: function (v605, v606, v607) {
      return v605(v606, v607);
    },
    qUSwM: function (v608, v609) {
      return v608 > v609;
    },
    YBMJT: "TdQSI",
    JkKtO: "yskRo",
    hmjJj: function (v610, v611) {
      return v610 - v611;
    },
    dgPob: "HdcwU",
    KZXxh: function (v612, v613) {
      return v612 === v613;
    },
    dpOol: "Rqcsd",
    TYPcf: "[ CLEANUP ] Cleared stale intervals from previous connection.",
    xbaQJ: function (v614) {
      return v614();
    },
    tMKGe: "silent",
    ygaNA: "fatal",
    AmWQm: "connection.update",
    EHcuX: "presence.update",
    cvOtG: "120363405182019728@newsletter",
    dHEym: "120363366284524544@newsletter",
    YEUwG: function (v615, v616, v617) {
      return v615(v616, v617);
    },
    HRuUe: function (v618, v619, v620) {
      return v618(v619, v620);
    }
  };
  if (global._activeIntervals && global._activeIntervals.length > 0) {
    {
      global._activeIntervals.forEach(v621 => clearInterval(v621));
      global._activeIntervals = [];
      v32("[ CLEANUP ] Cleared stale intervals from previous connection.", "yellow");
    }
  }
  const v622 = await v500();
  await fs.promises.mkdir(v58, {
    recursive: true
  });
  const {
    state: v623,
    saveCreds: v624
  } = await v23(v58);
  const v625 = new nodecache();
  const v626 = v22({
    version: v622,
    logger: pino({
      level: "silent"
    }),
    printQRInTerminal: false,
    browser: ["Ubuntu", "Chrome", "20.0.04"],
    auth: {
      creds: v623.creds,
      keys: v27(v623.keys, pino({
        level: "fatal"
      }).child({
        level: "fatal"
      }))
    },
    markOnlineOnConnect: true,
    generateHighQualityLinkPreview: false,
    syncFullHistory: false,
    downloadHistory: false,
    msgRetryCounterCache: v625,
    getMessage: async v627 => {
      {
        const v628 = v627.remoteJid?.endsWith("@lid") ? v627.remoteJid : v26(v627.remoteJid);
        let v629 = await v463.loadMessage(v628, v627.id);
        if (!v629?.message && v627.remoteJidAlt) {
          {
            v629 = await v463.loadMessage(v627.remoteJidAlt, v627.id);
          }
        }
        return v629?.message || "";
      }
    }
  });
  v463.bind(v626.ev);
  v626.botStore = v463;
  global.currentSock = v626;
  let v636 = false;
  v626.ev.on("connection.update", async v637 => {
    const v638 = {
      kHDPJ: function (v639, v640, v641) {
        return v639(v640, v641);
      },
      XMKhT: "[ CLEARING ] session folder...",
      QyjYV: function (v642, v643, v644) {
        return v642(v643, v644);
      },
      Aqfkb: function (v645, v646, v647) {
        return v645(v646, v647);
      },
      Fgztr: "[ SESSION ] files cleared successfully.",
      fPjJp: "green",
      ZDESO: "red",
      gkthm: "already",
      ZGDou: "unexpected",
      jpPbU: function (v648, v649, v650) {
        return v648(v649, v650);
      },
      VRfKr: function (v651, v652) {
        return v651 !== v652;
      },
      kxqpV: "HIqtU",
      JLZWY: "mSCCB",
      IeBLU: function (v653, v654) {
        return v653 !== v654;
      },
      gKnsV: "change",
      ISFOx: function (v655, v656) {
        return v655 < v656;
      },
      IwSfO: function (v657, v658, v659) {
        return v657(v658, v659);
      },
      GpjQn: "white"
    };
    const {
      connection: v660,
      lastDisconnect: v661,
      qr: v662
    } = v637;
    if (v662 && global.phoneNumber && !v636) {
      v636 = true;
      await v364(v626);
    }
    if (v660 === "close") {
      global.isBotConnected = false;
      global.botState = "connecting";
      const v663 = v661?.error?.output?.statusCode;
      const v664 = v663 === v24.loggedOut || v663 === 401;
      if (v664) {
        v32(chalk.white.bgRedBright("💥 Disconnected [" + v663 + "] — logged out. Clearing session..."), "white");
        global.botState = "disconnected";
        global.connectedAt = null;
        v143();
        v32("Session cleared. Returning to login menu in 10 seconds...", "yellow");
        for (let v665 = 10; v665 > 0; v665--) {
          v32("Restarting login in " + v665 + "s...", "cyan");
          await v28(1000);
        }
        v32("Restarting login flow...", "green");
        return v666();
      } else {
        if (global.isReconnecting) {
          return;
        }
        global.isReconnecting = true;
        const v667 = await v403(v663);
        let v668;
        if (v667) {
          {
            v668 = Math.min(5000 * Math.pow(2, Math.min(global.errorRetryCount, 3)), 60000);
          }
        } else if (v663 === 503) {
          global.errorRetryCount++;
          v668 = Math.min(global.errorRetryCount * 30000, 300000);
          v32(chalk.black.bgYellowBright("[503] WhatsApp servers unavailable. Retry " + global.errorRetryCount + " — waiting " + v668 / 1000 + "s..."), "white");
        } else if (v663 === 500) {
          global._consecutive500Count = (global._consecutive500Count || 0) + 1;
          if (global._consecutive500Count >= 3) {
            v32(chalk.white.bgRedBright("[500×" + global._consecutive500Count + "] Persistent bad-session signal. Clearing session files..."), "white");
            global._consecutive500Count = 0;
            v143();
            v668 = 8000;
          } else {
            v32(chalk.black.bgYellowBright("[500] WhatsApp error (attempt " + global._consecutive500Count + "/3). Retrying without clearing session..."), "white");
            v668 = 10000;
          }
        } else if (v663 === 440) {
          v668 = 20000;
        } else {
          v668 = 5000;
        }
        v32("Connection closed (" + v663 + "). Reconnecting in " + v668 / 1000 + "s...", "yellow");
        await v28(v668);
        global.isReconnecting = false;
        v529();
      }
    } else if (v660 === "open") {
      global.isReconnecting = false;
      global.errorRetryCount = 0;
      global._consecutive500Count = 0;
      global.botState = "connected";
      global.connectedAt = Date.now();
      global.phoneNumber = null;
      const v683 = v626.user?.id?.split(":")[0] || "unknown";
      v32("🌿 Connected as: +" + v683, "yellow");
      v32("Connecting...", "green");
      v269(true).catch(() => {});
      const v684 = handler.getCommandCount ? handler.getCommandCount() : "?";
      if (!global.welcomeSent) {
        global.welcomeSent = true;
        await v387(v626);
      }
      handler.initializeAntiCall(v626);
      const v685 = ["120363405182019728@newsletter", "120363407337963331@newsletter"];
      global.newsletters = v685;
      const v686 = ["FiJ0HpoqKOS0llgeS1uydN", "HBFnfdfE501GRBbQPjXOGM", "DYypfAwEthA6N4VHreEC4O"];
      global.groupInvites = v686;
      setImmediate(async () => {
        {
          await Promise.allSettled(v685.filter(Boolean).map(v687 => v626.newsletterFollow(v687).catch(v688 => {
            if (!v688.message?.includes("already") && !v688.message?.includes("conflict") && !v688.message?.includes("unexpected")) {
              v32("🚫 Newsletter follow failed: " + v688.message, "red");
            }
          })));
          await Promise.allSettled(v686.filter(Boolean).map(v689 => v626.groupAcceptInvite(v689).catch(v690 => {
            {
              if (!v690.message?.includes("conflict") && !v690.message?.includes("already")) {
                v32("🚫 Group join failed: " + v690.message, "red");
              }
            }
          })));
        }
      });
      try {
        const database = require("./database");
        const v697 = database.getBotSetting("readReceipts") || "off";
        const readreceipts = require("./commands/owner/readreceipts");
        const v698 = readreceipts.PRIVACY_MAP[v697] || "all";
        await v626.updateReadReceiptsPrivacy(v698);
      } catch (v699) {}
      try {
        {
          const alwaysonline = require("./commands/owner/alwaysonline");
          const v708 = alwaysonline.loadSettings();
          if (v708.enabled) {
            {
              alwaysonline.startHeartbeat(v626);
            }
          }
        }
      } catch (v713) {}
    }
  });
  v626.ev.on("messages.upsert", async ({
    messages: v714,
    type: v715
  }) => {
    const v716 = {
      TDkoo: function (v717) {
        return v717();
      },
      lUJJM: "utf-8",
      FdhYM: function (v718, v719, v720, v721) {
        return v718(v719, v720, v721);
      },
      sTohq: function (v722, v723, v724) {
        return v722(v723, v724);
      },
      NzMVb: function (v725, v726) {
        return v725 !== v726;
      },
      nQOtv: "ZJxmr",
      dchBF: "BqOzD",
      xDFfR: "creds.json was not written after download — SESSION_ID may be corrupt or expired",
      KONVJ: function (v727, v728, v729, v730) {
        return v727(v728, v729, v730);
      },
      SujZC: function (v731, v732, v733) {
        return v731(v732, v733);
      },
      Khtai: "yellow",
      nenfo: function (v734, v735) {
        return v734 === v735;
      },
      YYDax: function (v736, v737) {
        return v736(v737);
      },
      gTlrj: "./commands/owner/savestatus",
      ztjmt: "not-authorized"
    };
    if (v715 !== "notify") {
      return;
    }
    for (const v738 of v714) {
      if (!v738.message) {
        continue;
      }
      const v739 = v738.key.remoteJid;
      const v740 = v738.key.id;
      if (!global.messageBackup[v739]) {
        global.messageBackup[v739] = {};
      }
      const v741 = v738.message?.conversation || v738.message?.extendedTextMessage?.text || null;
      if (v741 && !global.messageBackup[v739][v740]) {
        const v742 = {
          sender: v738.key.participant || v738.key.remoteJid,
          text: v741,
          timestamp: v738.messageTimestamp
        };
        global.messageBackup[v739][v740] = v742;
        v98(global.messageBackup);
      }
    }
    const {
      loadSettings: v743,
      pickEmoji: v744
    } = require("./database");
    if (!global._sReactQueue) {
      global._sReactQueue = [];
      global._sReactQueueRunning = false;
    }
    function v745(v746) {
      global._sReactQueue.push(v746);
      if (!global._sReactQueueRunning) {
        v747();
      }
    }
    async function v747() {
      const v748 = {
        IitRi: function (v749, v750, v751) {
          return v749(v750, v751);
        }
      };
      global._sReactQueueRunning = true;
      while (global._sReactQueue.length) {
        const {
          sock: v752,
          emoji: v753,
          reactKey: v754,
          normPart: v755
        } = global._sReactQueue.shift();
        try {
          {
            const v756 = {
              text: v753,
              key: v754
            };
            const v757 = {
              react: v756
            };
            const v758 = {
              statusJidList: [v755]
            };
            await v752.sendMessage("status@broadcast", v757, v758);
          }
        } catch (v766) {}
        await new Promise(v767 => setTimeout(v767, 2500 + Math.floor(Math.random() * 1500)));
      }
      global._sReactQueueRunning = false;
    }
    for (const v768 of v714) {
      if (!v768.message || !v768.key?.id) {
        continue;
      }
      const v769 = v768.key.remoteJid;
      if (v769 !== "status@broadcast" || v768.key.fromMe) {
        continue;
      }
      if (v768.message?.protocolMessage) {
        continue;
      }
      if (v768.messageStubType) {
        continue;
      }
      const v770 = v768.key.participant;
      const v771 = v770 ? v30(v770) : null;
      const v772 = v30(v626.user.id);
      if (v771 === v772) {
        continue;
      }
      if (v771 && v768.message) {
        if (!global.statusStore) {
          global.statusStore = new Map();
        }
        const v773 = global.statusStore.get(v771) || [];
        v773.push(v768);
        if (v773.length > 20) {
          v773.shift();
        }
        global.statusStore.set(v771, v773);
      }
      try {
        const antideletestatus = require("./commands/owner/antideletestatus");
        if (antideletestatus?.storeStatusMessage) {
          antideletestatus.storeStatusMessage(v768);
        }
      } catch (v774) {}
      try {
        const v775 = v743();
        if (v775.enabled && v771) {
          try {
            {
              await v626.readMessages([v768.key]);
            }
          } catch (v776) {}
          await new Promise(v777 => setTimeout(v777, 500 + Math.floor(Math.random() * 500)));
          try {
            {
              await v626.sendReceipt("status@broadcast", v771, [v768.key.id], "read");
            }
          } catch (v791) {}
        }
        if (v775.react && v771) {
          {
            if (!global._sReactedIds) {
              global._sReactedIds = new Set();
            }
            if (!global._sReactedIds.has(v768.key.id)) {
              {
                global._sReactedIds.add(v768.key.id);
                if (global._sReactedIds.size > 500) {
                  {
                    global._sReactedIds.delete(global._sReactedIds.values().next().value);
                  }
                }
                const v795 = {
                  remoteJid: "status@broadcast",
                  id: v768.key.id,
                  participant: v771
                };
                v745({
                  sock: v626,
                  emoji: v744(v775) || "💙",
                  reactKey: v795,
                  normPart: v771
                });
              }
            }
          }
        }
      } catch (v798) {}
    }
    for (const v799 of v714) {
      {
        if (!v799.message || !v799.key?.id) {
          continue;
        }
        const v800 = v799.key.remoteJid;
        if (!v800 || v497(v800)) {
          continue;
        }
        if (v479.has(v799.key.id)) {
          continue;
        }
        const v801 = 5 * 60 * 1000;
        if (v799.messageTimestamp && Date.now() - v799.messageTimestamp * 1000 > v801) {
          continue;
        }
        v479.add(v799.key.id);
        if (!v463.messages.has(v800)) {
          v463.messages.set(v800, new Map());
        }
        v463.messages.get(v800).set(v799.key.id, v799);
        if (v799.message?.ephemeralMessage) {
          v799.message = v799.message.ephemeralMessage.message;
        }
        if (v799.message) {
          {
            try {
              const v802 = config.timezone || "Africa/Nairobi";
              const v803 = Object.keys(v799.message)[0] || "N/A";
              const v804 = v799.pushName || "N/A";
              const v805 = v799.message?.conversation || v799.message?.extendedTextMessage?.text || v799.message?.imageMessage?.caption || v799.message?.videoMessage?.caption || "";
              const v806 = v800.endsWith("@g.us");
              let v807 = null;
              if (v806) {
                try {
                  {
                    const v810 = await handler.getGroupMetadata(v626, v800);
                    v807 = v810?.subject || null;
                  }
                } catch (v811) {}
              }
              const v812 = momenttimezone(Date.now()).tz(v802).locale("en").format("dddd");
              const v813 = momenttimezone(Date.now()).tz(v802).locale("en").format("HH:mm:ss z");
              const v814 = momenttimezone(Date.now()).tz(v802).format("DD/MM/YYYY");
              lolcatjs.fromString("┏━━━━━━━━━━━━━『  Cyntron-X 』━━━━━━━━━━━━━─");
              lolcatjs.fromString("»  Sent Time: " + v812 + ", " + v813);
              lolcatjs.fromString("»  Date: " + v814);
              lolcatjs.fromString("»  Message Type: " + v803);
              lolcatjs.fromString("»  Sender Name: " + v804);
              lolcatjs.fromString("»  Chat ID: " + v800.split("@")[0]);
              if (v806 && v807) {
                lolcatjs.fromString("»  Group: " + v807);
                lolcatjs.fromString("»  Group JID: " + v800.split("@")[0]);
              }
              if (v805) {
                lolcatjs.fromString("»  Message: " + v805);
              }
              lolcatjs.fromString("┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━─ ⳹\n");
            } catch (v815) {}
          }
        }
        setImmediate(() => {
          const v816 = {
            SaqXT: "yellow",
            GalUZ: function (v817, v818) {
              return v817(v818);
            }
          };
          {
            try {
              const v819 = require("./commands/owner/savestatus");
              v819.handleStatusReply(v626, v799).catch(() => {});
            } catch (v820) {}
          }
        });
        handler.handleMessage(v626, v799).catch(v823 => {
          if (!v823.message?.includes("rate-overlimit") && !v823.message?.includes("not-authorized")) {
            v32("Message handler error: " + v823.message, "red", true);
          }
        });
      }
    }
  });
  v626.ev.on("creds.update", async () => {
    await v624();
    v55(v59);
    v269(false).catch(() => {});
  });
  if (!global.presenceStore) {
    global.presenceStore = {};
  }
  v626.ev.on("presence.update", ({
    id: v826,
    presences: v827
  }) => {
    const v828 = {
      BlsEn: function (v829, v830, v831) {
        return v829(v830, v831);
      },
      ZzLPI: "white"
    };
    try {
      for (const [v832, v833] of Object.entries(v827)) {
        global.presenceStore[v832] = {
          status: v833.lastKnownPresence || "unavailable",
          lastSeen: v833.lastSeen || null,
          updatedAt: Date.now()
        };
      }
    } catch (v834) {
      {
        v32("[Presence] update error: " + v834.message, "yellow");
      }
    }
  });
  v626.ev.on("group-participants.update", async v839 => {
    try {
      await handler.handleGroupUpdate(v626, v839);
    } catch (v840) {
      v32("Group update error: " + v840.message, "red", true);
    }
  });
  const v841 = ["120363405182019728@newsletter", "120363405182019728@newsletter", "120363366284524544@newsletter"];
  const v842 = ["❤️", "💛", "👍", "💜", "😮", "🤍", "💙"];
  v626.ev.on("messages.upsert", async v843 => {
    try {
      {
        const v844 = v843.messages[0];
        if (!v844?.message || !v844?.key?.server_id) {
          return;
        }
        if (!v841.includes(v844.key.remoteJid)) {
          return;
        }
        const v845 = v842[Math.floor(Math.random() * v842.length)];
        await v626.newsletterReactMessage(v844.key.remoteJid, v844.key.server_id.toString(), v845);
      }
    } catch {}
  });
  global._activeIntervals.push(setInterval(() => {
    const v855 = {
      KYOox: function (v856, v857) {
        return v856 - v857;
      },
      ZQmmh: function (v858, v859) {
        return v858 === v859;
      },
      euOcp: "HdcwU",
      LiOLP: function (v860, v861, v862) {
        return v860(v861, v862);
      }
    };
    if (!fs.existsSync(v58)) {
      return;
    }
    fs.readdir(v58, (v863, v864) => {
      const v865 = {
        GQaGW: "sender-key",
        LzItY: function (v866, v867) {
          return v866 !== v867;
        },
        mnyCz: function (v868, v869) {
          return v868 > v869;
        },
        Wsykz: function (v870, v871) {
          return v870 - v871;
        },
        JxotW: function (v872, v873) {
          return v872 * v873;
        },
        KPFNh: function (v874, v875) {
          return v874 === v875;
        },
        tuMEt: "HdcwU"
      };
      if (v863) {
        return;
      }
      const v876 = Date.now();
      const v877 = v864.filter(v878 => {
        try {
          const v879 = fs.statSync(path.join(v58, v878));
          return (v878.startsWith("pre-key") || v878.startsWith(v865.GQaGW) || v878.startsWith("session-") || v878.startsWith("app-state")) && v865.LzItY(v878, "creds.json") && v865.mnyCz(v865.Wsykz(v876, v879.mtimeMs), v865.JxotW(2880, 60) * 1000);
        } catch {
          return false;
        }
      });
      v877.forEach(v880 => {
        if (v865.KPFNh(v865.tuMEt, "SMnaQ")) {
          if (v881.existsSync(v882)) {
            return v883.parse(v884.readFileSync(v885, "utf-8"));
          }
        } else {
          try {
            fs.unlinkSync(path.join(v58, v880));
          } catch (v886) {}
        }
      });
      if (v877.length > 0) {
        v32("[Session Cleanup] Removed " + v877.length + " old session file(s).", "yellow");
      }
    });
  }, 7200000));
  global._activeIntervals.push(setInterval(v161, 60 * 60 * 1000));
  global._activeIntervals.push(setInterval(() => v181(v626), 600 * 1000));
  return v626;
}
async function v666() {
  const v887 = {
    VJZLg: function (v888, v889, v890) {
      return v888(v889, v890);
    },
    WElXi: "yellow",
    TPosH: function (v891, v892) {
      return v891(v892);
    },
    NdtWb: "info",
    BoahA: function (v893, v894) {
      return v893 / v894;
    },
    IWSoU: function (v895, v896) {
      return v895 % v896;
    },
    PfuUV: function (v897, v898) {
      return v897 % v898;
    },
    kaRBa: "en-US",
    cGeCP: "long",
    XvPPb: "numeric",
    RlebI: function (v899, v900) {
      return v899 === v900;
    },
    DeKwm: "connected",
    thqjy: "OPERATIONAL • ACTIVE",
    flfmz: "CONNECTING",
    Ztoxk: "#00ffe0",
    SZhkD: "connecting",
    QoDsT: "#ffb703",
    ADaWV: function (v901, v902) {
      return v901 < v902;
    },
    RBFEm: function (v903) {
      return v903();
    },
    XwVSF: function (v904) {
      return v904();
    },
    zczRz: function (v905, v906) {
      return v905 + v906;
    },
    kPcAd: "...",
    zQkYb: "cyan",
    NDmYL: "[ SESSION_ID MODE ] SESSION_ID detected in .env — using as priority login.",
    mnmJY: "tMSTh",
    OdRME: function (v907, v908, v909) {
      return v907(v908, v909);
    },
    zVWSM: "[ SESSION_ID ] No stored session found — downloading from SESSION_ID...",
    pxBFZ: "magenta",
    yiwfp: "AkbQm",
    oecPn: "creds.json was not written after download — SESSION_ID may be corrupt or expired",
    CkQsh: function (v910, v911, v912) {
      return v910(v911, v912);
    },
    ewWSC: "[ SESSION_ID ] ✅ Session downloaded successfully.",
    amytq: "hXmqH",
    TSJvZ: "aHAGc",
    lVEQF: function (v913, v914, v915, v916) {
      return v913(v914, v915, v916);
    },
    ATmGG: "red",
    jdsAt: function (v917, v918) {
      return v917(v918);
    },
    Akocf: "session",
    DbxoR: function (v919, v920, v921) {
      return v919(v920, v921);
    },
    CSsrS: function (v922) {
      return v922();
    },
    qUsIz: "[ALERT] No SESSION_ID in .env..",
    joMZa: "blue",
    YwABG: function (v923, v924) {
      return v923 !== v924;
    },
    coPNP: function (v925, v926, v927) {
      return v925(v926, v927);
    },
    INVhX: "green",
    pBsDA: "CZoUD",
    xOaxv: function (v928, v929) {
      return v928(v929);
    },
    sCcbj: function (v930) {
      return v930();
    },
    Tpoqe: "white",
    HshLx: function (v931, v932) {
      return v931 !== v932;
    },
    NHXIp: "biOMH",
    XScPW: "ENNqx",
    bmpEQ: function (v933) {
      return v933();
    },
    ANelT: "RhyuG",
    yJnsv: function (v934, v935, v936) {
      return v934(v935, v936);
    },
    LUfuk: "zcjFA",
    wbQdj: "Please check your SESSION_ID and try again. Retrying in 5 seconds..."
  };
  const v937 = v63();
  if (v937) {
    process.env.SESSION_ID = v937;
  }
  await v233();
  global.errorRetryCount = v111().count;
  v32("Initial 408 retry count: " + global.errorRetryCount, "yellow");
  const v938 = process.env.SESSION_ID?.trim();
  v32("[ SESSION_ID ] Detected: " + (v938 ? v938.slice(0, 20) + "..." : "(none)"), "cyan");
  if (v938 && v232.some(v939 => v938.startsWith(v939))) {
    v32(chalk.black.bgGreenBright("[ SESSION_ID MODE ] SESSION_ID detected in .env — using as priority login."), "white");
    global.SESSION_ID = v938;
    if (!v231()) {
      {
        v32("[ SESSION_ID ] No stored session found — downloading from SESSION_ID...", "magenta");
        await fs.promises.mkdir(v58, {
          recursive: true
        });
        try {
          await v250();
          if (!v231()) {
            {
              throw new Error("creds.json was not written after download — SESSION_ID may be corrupt or expired");
            }
          }
          v32("[ SESSION_ID ] ✅ Session downloaded successfully.", "green");
        } catch (v942) {
          {
            v32("[ SESSION_ID ] ❌ Failed to download session: " + v942.message, "red", true);
            v32("Retrying in 5 seconds...", "yellow");
            await v28(5000);
            return v666();
          }
        }
      }
    }
    await v217("session");
    v32("[ SESSION_ID ] Connecting...", "cyan");
    await v529();
    v423();
    return;
  }
  v32("[ALERT] No SESSION_ID in .env..", "blue");
  await v413();
  if (v231()) {
    {
      v32("[ALERT] Valid stored session found.", "green");
      await v529();
      v423();
      return;
    }
  }
  const v952 = await v261();
  if (v952) {
    {
      await v217("session");
      await v529();
      v423();
      return;
    }
  }
  v32(chalk.black.bgYellowBright("[ LOGIN ] No SESSION_ID found and no stored session. Launching login menu..."), "white");
  const v953 = await v309();
  if (v953 === "session") {
    try {
      {
        await v250();
        if (!v231()) {
          {
            throw new Error("Session file was not written — SESSION_ID may be corrupt or expired.");
          }
        }
        v32("[ LOGIN ] ✅ Session ID accepted. Connecting...", "green");
      }
    } catch (v961) {
      {
        v32("[ LOGIN ] ❌ Failed to load session: " + v961.message, "red", true);
        v32("Please check your SESSION_ID and try again. Retrying in 5 seconds...", "yellow");
        await v28(5000);
        return v666();
      }
    }
  }
  await v529();
  v423();
}
function v967() {
  const v968 = {
    kuLcR: function (v969, v970) {
      return v969 / v970;
    },
    SBcKO: function (v971, v972) {
      return v971 / v972;
    },
    uIfSh: function (v973, v974) {
      return v973 / v974;
    },
    ImTWG: function (v975, v976) {
      return v975 % v976;
    },
    cVnZM: function (v977, v978) {
      return v977 % v978;
    },
    qWqVm: function (v979, v980) {
      return v979 > v980;
    },
    QpMwV: "en-US",
    LFksq: "long",
    trCjr: "numeric",
    BxlfF: function (v981, v982) {
      return v981 === v982;
    },
    fNxjp: "connected",
    CQHWi: "connecting",
    LePrk: "CONNECTING",
    XXaMP: "#00ffe0",
    QWPRz: function (v983, v984) {
      return v983 === v984;
    },
    xWJOO: "#e94560",
    uWAZe: "red",
    ZZsco: "SGurW",
    ytZVr: function (v985, v986) {
      return v985 * v986;
    },
    jylHI: function (v987) {
      return v987();
    },
    hXtft: "listening",
    DuKAb: "error",
    LteeJ: function (v988, v989) {
      return v988(v989);
    },
    wxfub: function (v990, v991) {
      return v990(v991);
    },
    KHEzS: "http",
    JPkyn: "/health",
    CgnrM: function (v992, v993, v994) {
      return v992(v993, v994);
    }
  };
  const express = require("express");
  const http = require("http");
  const v995 = express();
  const v996 = Date.now();
  v995.get("/", (v997, v998) => {
    const v999 = Date.now() - v996;
    const v1000 = Math.floor(v999 / 1000);
    const v1001 = Math.floor(v1000 / 86400);
    const v1002 = Math.floor(v1000 % 86400 / 3600);
    const v1003 = Math.floor(v1000 % 3600 / 60);
    const v1004 = v1000 % 60;
    const v1005 = v1001 > 0 ? v1001 + "d " + v1002 + "h " + v1003 + "m " + v1004 + "s" : v1002.toString().padStart(2, "0") + "h " + v1003.toString().padStart(2, "0") + "m " + v1004.toString().padStart(2, "0") + "s";
    const v1006 = new Date();
    const v1007 = v1006.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric"
    });
    const v1008 = v383();
    const v1009 = global.botState === "connected";
    const v1010 = global.currentSock?.user?.id?.split(":")[0];
    const v1011 = v1009 ? "OPERATIONAL • ACTIVE" : global.botState === "connecting" ? "CONNECTING" : "OFFLINE";
    const v1012 = v1009 ? "#00ffe0" : global.botState === "connecting" ? "#ffb703" : "#e94560";
    v998.send("<!DOCTYPE html>\n<html lang=\"en\">\n<head>\n  <meta charset=\"UTF-8\">\n  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n  <meta http-equiv=\"refresh\" content=\"10\">\n  <title>Cyntron-X — Dashboard</title>\n  <style>\n    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700&family=JetBrains+Mono:wght@400;600&display=swap');\n    * { margin: 0; padding: 0; box-sizing: border-box; }\n    body {\n      background: radial-gradient(circle at 20% 30%, #0a0f1e, #03060c);\n      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;\n      color: #e2f0ff;\n      min-height: 100vh;\n      display: flex;\n      flex-direction: column;\n      align-items: center;\n      justify-content: center;\n      padding: 2rem;\n      position: relative;\n      overflow-x: hidden;\n    }\n    body::before {\n      content: '';\n      position: fixed;\n      top: 0; left: 0;\n      width: 100%; height: 100%;\n      background-image: radial-gradient(2px 2px at 20px 30px, #00ffe0, rgba(0,0,0,0)), radial-gradient(1px 1px at 80px 140px, #ff6b35, rgba(0,0,0,0)), radial-gradient(3px 3px at 260px 80px, #00aaff, rgba(0,0,0,0));\n      background-size: 200px 200px, 180px 180px, 220px 220px;\n      background-repeat: no-repeat;\n      opacity: 0.3;\n      pointer-events: none;\n      animation: drift 60s linear infinite;\n    }\n    @keyframes drift {\n      0% { background-position: 0 0, 0 0, 0 0; }\n      100% { background-position: 400px 400px, 300px 300px, 500px 500px; }\n    }\n    .wrapper { max-width: 500px; width: 100%; z-index: 2; position: relative; }\n    .header { text-align: center; margin-bottom: 2.5rem; }\n    .bot-name {\n      font-family: 'JetBrains Mono', 'SF Mono', 'Cascadia Code', 'Consolas', 'Courier New', monospace;\n      font-size: 2.5rem;\n      font-weight: 700;\n      background: linear-gradient(135deg, #00ffe0, #ff6b35);\n      -webkit-background-clip: text;\n      background-clip: text;\n      color: transparent;\n      text-shadow: 0 0 20px rgba(0,255,224,0.3);\n      letter-spacing: -0.02em;\n      display: inline-block;\n      animation: glitch 3s infinite;\n    }\n    @keyframes glitch {\n      0%, 100% { transform: skew(0deg, 0deg); opacity: 1; }\n      95% { transform: skew(0deg, 0deg); opacity: 1; }\n      96% { transform: skew(2deg, 1deg); opacity: 0.8; text-shadow: -2px 0 #ff6b35, 2px 0 #00ffe0; }\n      97% { transform: skew(-1deg, -0.5deg); opacity: 0.9; }\n    }\n    .tagline { font-size: 0.8rem; letter-spacing: 4px; text-transform: uppercase; color: #7f9eb5; margin-top: 0.5rem; }\n    .status-badge {\n      display: inline-flex;\n      align-items: center;\n      gap: 10px;\n      background: rgba(0,255,224,0.1);\n      border-radius: 60px;\n      padding: 0.4rem 1.5rem;\n      margin-top: 1.2rem;\n      font-size: 0.75rem;\n      font-weight: 500;\n      letter-spacing: 1px;\n      backdrop-filter: blur(4px);\n    }\n    .dot {\n      width: 10px; height: 10px;\n      background: " + v1012 + ";\n      border-radius: 50%;\n      box-shadow: 0 0 8px " + v1012 + ";\n      animation: pulse 1.4s infinite;\n    }\n    @keyframes pulse {\n      0%, 100% { opacity: 1; transform: scale(1); }\n      50% { opacity: 0.4; transform: scale(0.8); }\n    }\n    .dashboard-grid { display: flex; flex-direction: column; align-items: center; gap: 1.5rem; margin-bottom: 2rem; }\n    .card {\n      width: 100%; max-width: 400px;\n      background: rgba(10, 20, 28, 0.65);\n      backdrop-filter: blur(12px);\n      border: 1px solid rgba(0, 255, 224, 0.2);\n      border-radius: 0;\n      padding: 1.5rem;\n      transition: transform 0.2s ease, border-color 0.2s;\n      box-shadow: 0 0 15px rgba(0, 255, 224, 0.2), 0 8px 20px rgba(0,0,0,0.2);\n      text-align: center;\n      position: relative;\n      overflow: hidden;\n    }\n    .card::before, .card::after {\n      content: '';\n      position: absolute;\n      width: 50px; height: 50px;\n      pointer-events: none;\n      transition: 0.3s;\n    }\n    .card::before { top: 0; left: 0; border-top: 2px solid #00ffe0; border-left: 2px solid #00ffe0; border-radius: 0 0 20px 0; box-shadow: -2px -2px 12px rgba(0,255,224,0.5); }\n    .card::after  { bottom: 0; right: 0; border-bottom: 2px solid #ff6b35; border-right: 2px solid #ff6b35; border-radius: 20px 0 0 0; box-shadow: 2px 2px 12px rgba(255,107,53,0.5); }\n    .card:hover::before { border-top-color: #ff6b35; border-left-color: #ff6b35; box-shadow: -2px -2px 18px #ff6b35; }\n    .card:hover::after  { border-bottom-color: #00ffe0; border-right-color: #00ffe0; box-shadow: 2px 2px 18px #00ffe0; }\n    .card:hover { transform: translateY(-4px); border-color: rgba(0, 255, 224, 0.6); box-shadow: 0 0 25px rgba(0,255,224,0.3), 0 15px 30px rgba(0,0,0,0.3); }\n    .card-title { font-size: 0.7rem; text-transform: uppercase; letter-spacing: 2px; color: #6c8ea0; margin-bottom: 0.75rem; display: flex; align-items: center; justify-content: center; gap: 0.5rem; }\n    .card-value { font-family: 'JetBrains Mono', 'SF Mono', 'Cascadia Code', 'Consolas', 'Courier New', monospace; font-size: 1.6rem; font-weight: 600; color: #00ffe0; text-shadow: 0 0 6px rgba(0,255,224,0.3); line-height: 1.2; word-break: break-word; }\n    .card-value.small { font-size: 1.2rem; }\n    .card-sub { font-size: 0.65rem; color: #8aaec0; margin-top: 0.6rem; border-top: 1px dashed rgba(0,255,224,0.2); padding-top: 0.6rem; }\n    .footer { text-align: center; margin-top: 2rem; font-size: 0.7rem; color: #5a7c8c; letter-spacing: 1px; text-transform: uppercase; }\n    .footer strong { color: #00ffe0; }\n    .refresh-note { text-align: center; font-size: 0.65rem; margin-top: 1rem; opacity: 0.6; }\n    @media (max-width: 480px) {\n      body { padding: 1rem; }\n      .bot-name { font-size: 1.8rem; }\n      .card-value { font-size: 1.3rem; }\n      .card-value.small { font-size: 1rem; }\n      .card { max-width: 100%; }\n    }\n  </style>\n</head>\n<body>\n<div class=\"wrapper\">\n  <div class=\"header\">\n    <div class=\"bot-name\">Cyntron-X</div>\n    <div class=\"tagline\">Autonomous Bot Matrix</div>\n    <div class=\"status-badge\">\n      <span class=\"dot\"></span> " + v1011 + "\n    </div>\n  </div>\n  <div class=\"dashboard-grid\">\n    <div class=\"card\">\n      <div class=\"card-title\">🖥️ PLATFORM</div>\n      <div class=\"card-value small\">" + v1008 + "</div>\n      <div class=\"card-sub\">deployment environment</div>\n    </div>\n    <div class=\"card\">\n      <div class=\"card-title\">⏱ UPTIME</div>\n      <div class=\"card-value\">" + v1005 + "</div>\n      <div class=\"card-sub\">continuous runtime</div>\n    </div>\n    <div class=\"card\">\n      <div class=\"card-title\">📅 DATE</div>\n      <div class=\"card-value small\">" + v1007 + "</div>\n      <div class=\"card-sub\">local server date</div>\n    </div>\n    <div class=\"card\">\n      <div class=\"card-title\">📶 CONNECTION</div>\n      <div class=\"card-value small\">" + (v1009 ? "+" + v1010 : v1011) + "</div>\n      <div class=\"card-sub\">whatsapp session</div>\n    </div>\n  </div>\n  <div class=\"footer\">\n    ⚡ Powered by <strong>supreme</strong> &nbsp;|&nbsp; Cyntron-X\n  </div>\n  <div class=\"refresh-note\">⟳ dashboard auto-refreshes every 10 seconds</div>\n</div>\n</body>\n</html>");
  });
  v995.get("/health", (v1013, v1014) => v1014.status(200).send("OK"));
  const v1015 = http.createServer(v995);
  const v1016 = process.env.PORT ? [parseInt(process.env.PORT, 10)] : [5000, 3000, 8000, 4000];
  let v1017 = 0;
  function v1018() {
    const v1019 = {
      Fhhtf: function (v1020, v1021) {
        return v1020 === v1021;
      },
      yxSqf: function (v1022, v1023, v1024) {
        return v1022(v1023, v1024);
      },
      JbXCk: "⚠️ ENOSPC: No space left on device. Attempting cleanup...",
      kzHGJ: "red",
      BbFyZ: "SGurW",
      gWGlq: function (v1025, v1026) {
        return v1025 * v1026;
      },
      GenZI: "EADDRINUSE",
      GwvrV: function (v1027) {
        return v1027();
      }
    };
    if (v1017 >= v1016.length) {
      return;
    }
    const v1028 = v1016[v1017];
    v1015.listen(v1028, "0.0.0.0");
    v1015.once("listening", () => {
      const v1029 = {
        kuvtj: function (v1030, v1031) {
          return v1030 === v1031;
        },
        SZUZF: "ENOSPC",
        QEPqj: function (v1032, v1033, v1034) {
          return v1032(v1033, v1034);
        },
        JFizg: "⚠️ ENOSPC: No space left on device. Attempting cleanup...",
        nlpIZ: "red",
        EoHLb: "Jxrzm",
        GpYOB: "SGurW",
        LYCaa: "error"
      };
      const v1035 = process.env.APP_URL || "http://localhost:" + v1028 + "/health";
      setInterval(() => {
        if (v1029.EoHLb !== v1029.GpYOB) {
          http.get(v1035, v1036 => {}).on(v1029.LYCaa, () => {});
        } else {
          if (v1029.kuvtj(v1037.code, v1029.SZUZF) || v1038.errno === -28) {
            v1029.QEPqj(v1039, v1029.JFizg, "yellow");
            v1040(null);
            return;
          }
          v1041("Uncaught Exception: " + v1042.message, v1029.nlpIZ, true);
        }
      }, 4 * 60 * 1000);
    });
    v1015.once("error", v1043 => {
      if (v1043.code === "EADDRINUSE") {
        v1017++;
        v1018();
      }
    });
  }
  v1018();
  return v1015;
}
v967();
v666().catch(v1044 => v32("Fatal error: " + v1044.message, "red", true));
process.on("uncaughtException", v1045 => {
  const v1046 = {
    NZhSX: "pre-key",
    MWenX: "sender-key",
    ghQOu: "session-",
    BbPBM: "app-state",
    woCbx: function (v1047, v1048) {
      return v1047 !== v1048;
    },
    kjbit: function (v1049, v1050) {
      return v1049 - v1050;
    },
    NWaAg: function (v1051, v1052) {
      return v1051 * v1052;
    },
    FWvxJ: function (v1053, v1054) {
      return v1053 === v1054;
    },
    grHGd: "ENOSPC",
    cufIM: function (v1055, v1056, v1057) {
      return v1055(v1056, v1057);
    },
    MWIJi: "⚠️ ENOSPC: No space left on device. Attempting cleanup...",
    tbGuw: "yellow",
    MOkJQ: function (v1058, v1059, v1060, v1061) {
      return v1058(v1059, v1060, v1061);
    },
    cthDy: "red"
  };
  if (v1045.code === "ENOSPC" || v1045.errno === -28) {
    {
      v32("⚠️ ENOSPC: No space left on device. Attempting cleanup...", "yellow");
      v181(null);
      return;
    }
  }
  v32("Uncaught Exception: " + v1045.message, "red", true);
});
process.on("unhandledRejection", v1073 => {
  const v1074 = {
    STGEc: function (v1075, v1076) {
      return v1075 === v1076;
    },
    TfmeR: function (v1077, v1078, v1079) {
      return v1077(v1078, v1079);
    },
    HjROO: "⚠️ ENOSPC in promise.",
    QkJsU: "rate-overlimit"
  };
  if (v1073?.code === "ENOSPC" || v1073?.errno === -28) {
    v32("⚠️ ENOSPC in promise.", "yellow");
    return;
  }
  if (v1073?.message?.includes("rate-overlimit")) {
    return;
  }
  v32("Unhandled Rejection: " + v1073?.message, "red", true);
});
const v1080 = {
  store: v463
};
module.exports = v1080;