const fs = require("fs");
const path = require("path");
const config = require("./config");
const v1 = path.join(__dirname, "database");
const v2 = path.join(v1, "groups.json");
const v3 = path.join(v1, "users.json");
const v4 = path.join(v1, "warnings.json");
const v5 = path.join(v1, "mods.json");
const v6 = path.join(v1, "muted.json");
const v7 = path.join(v1, "botmode.json");
const v8 = path.join(v1, "bot-settings.json");
const v9 = path.join(v1, "session.json");
if (!fs.existsSync(v1)) {
  fs.mkdirSync(v1, {
    recursive: true
  });
}
const v10 = (v11, v12 = {}) => {
  if (!fs.existsSync(v11)) {
    fs.writeFileSync(v11, JSON.stringify(v12, null, 2));
  }
};
v10(v2, {});
v10(v3, {});
v10(v4, {});
v10(v5, {
  moderators: []
});
v10(v6, {});
v10(v7, {
  mode: "public"
});
v10(v8, {});
v10(v9, {});
const v13 = {};
const v14 = v15 => {
  if (v13[v15] !== undefined) {
    return v13[v15];
  }
  let v34;
  try {
    {
      const v40 = fs.readFileSync(v15, "utf-8");
      if (v40.trim()) {
        v34 = JSON.parse(v40);
      }
    }
  } catch (v41) {
    {
      console.error("[DB] Primary read failed for " + path.basename(v15) + ": " + v41.message);
    }
  }
  if (v34 === undefined) {
    {
      const v51 = v15 + ".bak";
      try {
        {
          if (fs.existsSync(v51)) {
            {
              const v52 = fs.readFileSync(v51, "utf-8");
              if (v52.trim()) {
                v34 = JSON.parse(v52);
                console.error("[DB] Recovered " + path.basename(v15) + " from backup.");
                fs.writeFileSync(v15, v52, "utf-8");
              }
            }
          }
        }
      } catch (v53) {
        console.error("[DB] Backup read also failed for " + path.basename(v15) + ": " + v53.message);
      }
    }
  }
  v34 = v34 || {};
  v13[v15] = v34;
  return v34;
};
const v65 = (v66, v67) => {
  const v68 = {
    IXPko: "RIEqW",
    sZKWZ: "byeYv",
    iALfu: ".tmp",
    SJyeT: function (v69, v70) {
      return v69 + v70;
    },
    SslsQ: ".bak",
    tBQfh: function (v71, v72) {
      return v71(v72);
    }
  };
  v13[v66] = v67;
  setImmediate(() => {
    const v73 = {
      QiOTD: "public",
      sJWFJ: function (v74, v75) {
        return v74(v75);
      }
    };
    {
      try {
        {
          const v76 = JSON.stringify(v67, null, 2);
          const v77 = v66 + ".tmp";
          fs.writeFileSync(v77, v76, "utf-8");
          try {
            if (fs.existsSync(v66)) {
              fs.copyFileSync(v66, v66 + ".bak");
            }
          } catch (v78) {}
          fs.renameSync(v77, v66);
        }
      } catch (v79) {
        console.error("[DB] Write failed for " + path.basename(v66) + ": " + v79.message);
      }
    }
  });
  return true;
};
const v80 = v81 => {
  const v82 = {
    ksHbK: function (v83, v84) {
      return v83(v84);
    },
    iIJRm: function (v85, v86, v87) {
      return v85(v86, v87);
    }
  };
  const v88 = v14(v2);
  if (!v88[v81]) {
    const v89 = {
      ...config.defaultGroupSettings
    };
    v88[v81] = v89;
    v65(v2, v88);
  }
  return v88[v81];
};
const v90 = (v91, v92) => {
  const v93 = {
    TJcwb: function (v94, v95) {
      return v94(v95);
    },
    Kbxzd: function (v96, v97, v98) {
      return v96(v97, v98);
    }
  };
  const v99 = v14(v2);
  v99[v91] = {
    ...v99[v91],
    ...v92
  };
  return v65(v2, v99);
};
const v100 = v101 => {
  const v102 = {
    dEnql: function (v103, v104) {
      return v103(v104);
    }
  };
  const v105 = v14(v3);
  if (!v105[v101]) {
    v105[v101] = {
      registered: Date.now(),
      premium: false,
      banned: false
    };
    v65(v3, v105);
  }
  return v105[v101];
};
const v106 = (v107, v108) => {
  const v109 = {
    JaTew: function (v110, v111, v112) {
      return v110(v111, v112);
    }
  };
  const v113 = v14(v3);
  v113[v107] = {
    ...v113[v107],
    ...v108
  };
  return v65(v3, v113);
};
const v114 = (v115, v116) => {
  const v117 = v14(v4);
  const v118 = v115 + "_" + v116;
  return v117[v118] || {
    count: 0,
    warnings: []
  };
};
const v119 = (v120, v121, v122) => {
  const v123 = {
    IkyzF: "utf-8",
    IylGY: function (v124, v125) {
      return v124(v125);
    },
    Kezfr: function (v126, v127) {
      return v126 !== v127;
    },
    BvtYg: "mARzG"
  };
  const v128 = v14(v4);
  const v129 = v120 + "_" + v121;
  if (!v128[v129]) {
    {
      v128[v129] = {
        count: 0,
        warnings: []
      };
    }
  }
  v128[v129].count++;
  v128[v129].warnings.push({
    reason: v122,
    date: Date.now()
  });
  v65(v4, v128);
  return v128[v129];
};
const v140 = (v141, v142) => {
  const v143 = {
    xkKwE: function (v144, v145) {
      return v144(v145);
    },
    Ytdwd: function (v146, v147) {
      return v146 > v147;
    },
    BPHby: function (v148, v149, v150) {
      return v148(v149, v150);
    }
  };
  const v151 = v14(v4);
  const v152 = v141 + "_" + v142;
  if (v151[v152] && v151[v152].count > 0) {
    v151[v152].count--;
    v151[v152].warnings.pop();
    v65(v4, v151);
    return true;
  }
  return false;
};
const v153 = (v154, v155) => {
  const v156 = v14(v4);
  const v157 = v154 + "_" + v155;
  delete v156[v157];
  return v65(v4, v156);
};
const v158 = () => {
  const v159 = {
    ZpIdR: function (v160, v161) {
      return v160(v161);
    }
  };
  const v162 = v14(v5);
  return v162.moderators || [];
};
const v163 = v164 => {
  const v165 = {
    HEgrY: function (v166, v167) {
      return v166(v167);
    },
    rANND: "bGvkT"
  };
  const v168 = v14(v5);
  if (!v168.moderators) {
    v168.moderators = [];
  }
  if (!v168.moderators.includes(v164)) {
    {
      v168.moderators.push(v164);
      return v65(v5, v168);
    }
  }
  return false;
};
const v173 = v174 => {
  const v175 = {
    DvKus: function (v176, v177) {
      return v176(v177);
    }
  };
  const v178 = v14(v5);
  if (v178.moderators) {
    v178.moderators = v178.moderators.filter(v179 => v179 !== v174);
    return v65(v5, v178);
  }
  return false;
};
const v180 = v181 => {
  const v182 = {
    mIbUb: function (v183) {
      return v183();
    },
    SlMCX: function (v184, v185) {
      return v184(v185);
    },
    RzyBC: function (v186, v187) {
      return v186(v187);
    },
    CzzKL: "path",
    eytKI: "session",
    kArbv: function (v188, v189) {
      return v188(v189);
    },
    ndyfr: function (v190, v191) {
      return v190 !== v191;
    },
    ZEqZw: "cQwRk",
    udRhy: function (v192, v193) {
      return v192(v193);
    },
    yKKbS: function (v194, v195) {
      return v194(v195);
    }
  };
  const v196 = v158();
  if (v196.includes(v181)) {
    return true;
  }
  const config = require("./config");
  const v197 = require("path").join(__dirname, config.sessionName || "session");
  const v198 = require("path").join(v197, "lid-mapping-" + v181 + "_reverse.json");
  try {
    if (require("fs").existsSync(v198)) {
      {
        const v199 = JSON.parse(require("fs").readFileSync(v198, "utf8").trim());
        if (v199 && v196.includes(String(v199))) {
          return true;
        }
      }
    }
  } catch (v207) {}
  return false;
};
const v208 = v209 => {
  const v210 = v14(v2);
  const v211 = v210[v209] || {};
  if (Array.isArray(v211.badwords)) {
    return v211.badwords;
  } else {
    return [];
  }
};
const v212 = (v213, v214) => {
  const v215 = {
    CpmSo: function (v216, v217, v218) {
      return v216(v217, v218);
    }
  };
  const v219 = v14(v2);
  const v220 = {
    ...config.defaultGroupSettings
  };
  if (!v219[v213]) {
    v219[v213] = v220;
  }
  if (!Array.isArray(v219[v213].badwords)) {
    v219[v213].badwords = [];
  }
  const v221 = v214.toLowerCase().trim();
  if (!v219[v213].badwords.includes(v221)) {
    v219[v213].badwords.push(v221);
    v65(v2, v219);
    return true;
  }
  return false;
};
const v222 = (v223, v224) => {
  const v225 = {
    deDtb: function (v226, v227) {
      return v226(v227);
    },
    BpToO: function (v228, v229) {
      return v228 < v229;
    }
  };
  const v230 = v14(v2);
  if (!v230[v223] || !Array.isArray(v230[v223].badwords)) {
    return false;
  }
  const v231 = v224.toLowerCase().trim();
  const v232 = v230[v223].badwords.length;
  v230[v223].badwords = v230[v223].badwords.filter(v233 => v233 !== v231);
  if (v230[v223].badwords.length < v232) {
    v65(v2, v230);
    return true;
  }
  return false;
};
const v234 = (v235, v236) => {
  const v237 = {
    mbtiq: function (v238, v239) {
      return v238 + v239;
    },
    yNkHL: "@s.whatsapp.net",
    wkMBi: function (v240, v241, v242) {
      return v240(v241, v242);
    }
  };
  const v243 = v14(v6);
  if (!v243[v235]) {
    v243[v235] = [];
  }
  const v244 = v236.split("@")[0] + "@s.whatsapp.net";
  if (!v243[v235].includes(v244)) {
    v243[v235].push(v244);
    v65(v6, v243);
  }
  return true;
};
const v245 = (v246, v247) => {
  const v248 = {
    iOIue: function (v249, v250) {
      return v249(v250);
    },
    rVLwo: "[SESSION-DB] getSession error:",
    SLogX: function (v251, v252) {
      return v251 + v252;
    },
    qnbNu: function (v253, v254) {
      return v253 < v254;
    },
    BNrkq: function (v255, v256) {
      return v255 === v256;
    },
    PUzEP: "XJyJG",
    dHrju: function (v257, v258, v259) {
      return v257(v258, v259);
    }
  };
  const v260 = v14(v6);
  if (!v260[v246]) {
    return false;
  }
  const v261 = v247.split("@")[0] + "@s.whatsapp.net";
  const v262 = v260[v246].length;
  v260[v246] = v260[v246].filter(v263 => v263 !== v261);
  if (v260[v246].length < v262) {
    {
      v65(v6, v260);
      return true;
    }
  }
  return false;
};
const v264 = (v265, v266) => {
  const v267 = {
    YoGyy: "@s.whatsapp.net"
  };
  const v268 = v14(v6);
  if (!v268[v265]) {
    return false;
  }
  const v269 = v266.split("@")[0] + "@s.whatsapp.net";
  return v268[v265].includes(v269);
};
const v270 = v271 => {
  const v272 = v14(v6);
  return v272[v271] || [];
};
const v273 = {
  prefix: ".",
  botName: "Cyntron-X",
  timezone: "Africa/Nairobi",
  menuStyle: "1",
  fontStyle: "normal",
  presenceMode: "off",
  autoReadMode: "off",
  autoReact: false,
  autoReactMode: "bot",
  alwaysOnline: false,
  autoStatusView: false,
  autoStatusReact: false,
  autoStatusEmoji: "💙",
  autoStatusEmojiPool: [],
  autoStatusRandomEmoji: false,
  readReceipts: "off",
  menuImageCustom: false,
  selfMode: false,
  autoSticker: false,
  autoDownload: false,
  autoBio: false
};
const v274 = v275 => {
  const v276 = {
    ZRjUw: function (v277, v278) {
      return v277(v278);
    },
    kjVfH: function (v279, v280) {
      return v279 in v280;
    }
  };
  const v281 = v14(v8);
  if (v275 in v281) {
    return v281[v275];
  } else {
    return v273[v275];
  }
};
const v282 = (v283, v284) => {
  const v285 = {
    YgHRo: function (v286, v287) {
      return v286(v287);
    },
    jysgM: function (v288, v289, v290) {
      return v288(v289, v290);
    }
  };
  const v291 = v14(v8);
  v291[v283] = v284;
  return v65(v8, v291);
};
const v292 = () => {
  const v293 = {
    ooCIB: function (v294, v295) {
      return v294(v295);
    }
  };
  const v296 = v14(v8);
  const v297 = {
    ...v273,
    ...v296
  };
  return v297;
};
const v298 = v299 => {
  const v300 = {
    yyQiv: function (v301, v302, v303) {
      return v301(v302, v303);
    }
  };
  const v304 = v14(v8);
  Object.assign(v304, v299);
  return v65(v8, v304);
};
const v305 = ["public", "private", "group", "pm"];
const v306 = () => {
  const v307 = {
    OCfdU: function (v308, v309) {
      return v308(v309);
    }
  };
  const v310 = v14(v7);
  return v310.mode || "public";
};
const v311 = v312 => {
  if (!v305.includes(v312)) {
    throw new Error("Invalid mode: " + v312);
  }
  const v313 = {
    mode: v312
  };
  return v65(v7, v313);
};
const v314 = v315 => {
  const v316 = {
    tshej: "delete"
  };
  const v317 = v14(v2);
  const v318 = v317[v315] || {};
  const v319 = {
    antiforward: v318.antiforward === true,
    antiforwardAction: v318.antiforwardAction || "delete",
    antiforwardWarnings: v318.antiforwardWarnings || {},
    antiforwardMaxWarnings: v318.antiforwardMaxWarnings || 3
  };
  return v319;
};
const v320 = (v321, v322, v323 = "delete", v324 = 3) => {
  const v325 = {
    Cnzxk: function (v326, v327) {
      return v326(v327);
    }
  };
  const v328 = v14(v2);
  const v329 = {
    ...config.defaultGroupSettings
  };
  if (!v328[v321]) {
    v328[v321] = v329;
  }
  v328[v321].antiforward = v322;
  v328[v321].antiforwardAction = v323;
  v328[v321].antiforwardMaxWarnings = v324;
  return v65(v2, v328);
};
const v330 = (v331, v332) => {
  const v333 = {
    QdPMN: function (v334, v335) {
      return v334(v335);
    },
    UGlHs: function (v336, v337) {
      return v336 + v337;
    }
  };
  const v338 = v14(v2);
  const v339 = {
    ...config.defaultGroupSettings
  };
  if (!v338[v331]) {
    v338[v331] = v339;
  }
  if (!v338[v331].antiforwardWarnings) {
    v338[v331].antiforwardWarnings = {};
  }
  v338[v331].antiforwardWarnings[v332] = (v338[v331].antiforwardWarnings[v332] || 0) + 1;
  v65(v2, v338);
  return v338[v331].antiforwardWarnings[v332];
};
const v340 = (v341, v342) => {
  const v343 = v14(v2);
  const v344 = v343[v341] || {};
  return v344.antiforwardWarnings && v344.antiforwardWarnings[v342] || 0;
};
const v345 = (v346, v347) => {
  const v348 = {
    mShJW: function (v349, v350) {
      return v349(v350);
    },
    UuoCa: function (v351, v352, v353) {
      return v351(v352, v353);
    }
  };
  const v354 = v14(v2);
  if (!v354[v346] || !v354[v346].antiforwardWarnings) {
    return false;
  }
  delete v354[v346].antiforwardWarnings[v347];
  return v65(v2, v354);
};
const v355 = (v356, v357) => {
  const v358 = {
    fMLSr: function (v359, v360) {
      return v359(v360);
    },
    ZCwIV: function (v361, v362, v363) {
      return v361(v362, v363);
    }
  };
  const v364 = v14(v2);
  if (!v364[v356] || !v364[v356].antiforwardWarnings) {
    return false;
  }
  v364[v356].antiforwardWarnings[v357] = 0;
  return v65(v2, v364);
};
const v365 = v366 => {
  const v367 = {
    LoQVo: "base64",
    wTYUZ: function (v368, v369, v370) {
      return v368(v369, v370);
    },
    nbNkp: "[SESSION-DB] saveSession error:"
  };
  try {
    if (!fs.existsSync(v366)) {
      return false;
    }
    const v371 = fs.readFileSync(v366);
    const v372 = v14(v9);
    v372.creds = v371.toString("base64");
    v372.savedAt = Date.now();
    return v65(v9, v372);
  } catch (v373) {
    console.error("[SESSION-DB] saveSession error:", v373.message);
    return false;
  }
};
const v374 = () => {
  const v375 = {
    YxfvG: function (v376, v377) {
      return v376(v377);
    }
  };
  try {
    const v378 = v14(v9);
    return v378.creds || null;
  } catch (v379) {
    console.error("[SESSION-DB] getSession error:", v379.message);
    return null;
  }
};
const v380 = () => {
  return v65(v9, {});
};
function v381() {
  const v382 = {
    fASbf: function (v383, v384) {
      return v383(v384);
    },
    iUJuu: "autoStatusReact",
    bcJma: "autoStatusEmoji",
    qQbPd: "autoStatusEmojiPool"
  };
  return {
    enabled: v274("autoStatusView") || false,
    react: v274("autoStatusReact") || false,
    emoji: v274("autoStatusEmoji") || "💚",
    emojiPool: v274("autoStatusEmojiPool") || [],
    randomEmoji: v274("autoStatusRandomEmoji") || false
  };
}
function v385(v386) {
  const v387 = {
    dIFAf: function (v388, v389) {
      return v388(v389);
    }
  };
  const v390 = {
    autoStatusView: !!v386.enabled,
    autoStatusReact: !!v386.react,
    autoStatusEmoji: v386.emoji || "",
    autoStatusEmojiPool: v386.emojiPool || [],
    autoStatusRandomEmoji: !!v386.randomEmoji
  };
  v298(v390);
}
function v391(v392) {
  return v392.replace(/[\u{FE00}-\u{FE0F}\u{E0100}-\u{E01EF}\u200D\u200B\uFEFF]/gu, "").trim();
}
function v393(v394) {
  const v395 = {
    NsYWw: function (v396, v397) {
      return v396 * v397;
    }
  };
  const v398 = v395;
  if (v394.randomEmoji && v394.emojiPool.length) {
    return v394.emojiPool[Math.floor(v398.NsYWw(Math.random(), v394.emojiPool.length))];
  }
  return v394.emoji;
}
const v399 = {
  getGroupSettings: v80,
  updateGroupSettings: v90,
  getUser: v100,
  updateUser: v106,
  getWarnings: v114,
  addWarning: v119,
  removeWarning: v140,
  clearWarnings: v153,
  getModerators: v158,
  addModerator: v163,
  removeModerator: v173,
  isModerator: v180,
  getBadWords: v208,
  addBadWord: v212,
  removeBadWord: v222,
  muteUser: v234,
  unmuteUser: v245,
  isUserMuted: v264,
  getMutedUsers: v270,
  getBotMode: v306,
  setBotMode: v311,
  VALID_BOT_MODES: v305,
  getBotSetting: v274,
  setBotSetting: v282,
  getAllBotSettings: v292,
  updateBotSettings: v298,
  BOT_SETTINGS_DEFAULTS: v273,
  getAntiforwardSettings: v314,
  updateAntiforwardSettings: v320,
  addAntiforwardWarning: v330,
  getAntiforwardWarningCount: v340,
  clearAntiforwardWarning: v345,
  clearAllAntiforwardWarnings: v355,
  saveSession: v365,
  getSession: v374,
  clearSession: v380,
  loadSettings: v381,
  saveSettings: v385,
  cleanEmoji: v391,
  pickEmoji: v393
};
module.exports = v399;