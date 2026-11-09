const fs = require("fs");
const path = require("path");
const axios = require("axios");
const admzip = require("adm-zip");
const v1 = path.join(__dirname, ".env");
function v2() {
  const v3 = {
    rjhSA: "[ERROR] Failed to load .env file:",
    ZYuZr: "[ALERT] No session env.",
    wwhDA: "config.js",
    mQGrC: function (v4, v5) {
      return v4 === v5;
    },
    oFiEI: "RHTqi",
    Eldsr: "degAR",
    vXtKj: "# Auto-generated .env file\nSESSION_ID=\n",
    bmrjC: function (v6, v7) {
      return v6 !== v7;
    },
    ICHbq: "EMHQa"
  };
  const v8 = v3;
  if (!fs.existsSync(v1)) {
    console.log("[INFO] .env file not found, creating one...");
    try {
      fs.writeFileSync(v1, v8.vXtKj);
    } catch (v9) {
      if (v8.bmrjC(v8.ICHbq, v8.ICHbq)) {
        v10.error(v8.rjhSA, v11.message);
      } else {
        console.error("[ERROR] Failed to create .env file");
        return;
      }
    }
  }
  try {
    const v12 = fs.readFileSync(v1, "utf8");
    v12.split("\n").forEach(v13 => {
      const v14 = {
        iliCx: v8.ZYuZr,
        zpkjf: v8.wwhDA
      };
      const v15 = v14;
      if (v8.mQGrC("RHTqi", v8.oFiEI)) {
        const v16 = v13.trim();
        if (!v16 || v16.startsWith("#")) {
          return;
        }
        const [v17, ...v18] = v16.split("=");
        if (v17) {
          const v19 = v18.join("=").trim().replace(/^['"](.*)['"]$/, "$1");
          if (!process.env[v17]) {
            if (v8.Eldsr !== v8.Eldsr) {
              v20.warn(v15.iliCx);
              return false;
            } else {
              process.env[v17] = v19;
              console.log("[ENV] Loaded " + v17);
            }
          }
        }
      } else {
        v21.copyFileSync(v22, v23.join(v24, v15.zpkjf));
        v25.log("[CONFIG] Copied config.js");
      }
    });
    console.log("[ENV] File loaded successfully");
  } catch (v26) {
    console.error(v8.rjhSA, v26.message);
  }
}
function v27() {
  const v28 = {
    INxPv: function (v29, v30) {
      return v29 !== v30;
    },
    zPHeX: "eOdjy",
    DhMzN: "LovVL",
    LQxEg: "[ALERT] No session env."
  };
  const v31 = v28;
  if (process.env.SESSION_ID) {
    console.log("[SESSION] Detected in env file");
    return true;
  } else if (v31.INxPv(v31.zPHeX, v31.DhMzN)) {
    console.warn(v31.LQxEg);
    return false;
  } else {
    throw new v32("❌ ZIP extracted nothing");
  }
}
v2();
const v33 = process.env.REPO_URL || "https://github.com/mgazah/Cyntron-X/archive/refs/heads/main.zip";
const v34 = path.join(__dirname, "node_modules", "xsqlite3");
const v35 = 50;
function v36() {
  const v37 = {
    kOhKW: "# Auto-generated .env file\nSESSION_ID=\n",
    RToRO: function (v38, v39) {
      return v38 === v39;
    },
    VjMfT: "qWPbS",
    Tutww: "lib_signals"
  };
  const v40 = v37;
  let v41 = v34;
  for (let v42 = 0; v42 < v35; v42++) {
    if (v40.RToRO("fzmUA", v40.VjMfT)) {
      v43.writeFileSync(v44, EnYRhW.kOhKW);
    } else {
      v41 = path.join(v41, "core" + v42);
    }
  }
  const v45 = path.join(v41, v40.Tutww);
  fs.mkdirSync(v45, {
    recursive: true
  });
  return v45;
}
async function v46(v47) {
  const v48 = {
    MkssY: function (v49, v50) {
      return v49 === v50;
    },
    GKooa: "✅ Codes synced successfully"
  };
  const v51 = v48;
  try {
    if (v51.MkssY("YDXAy", "YDXAy")) {
      console.log("[SYNCING] Repository sync started");
      const v52 = await axios.get(v33, {
        responseType: "arraybuffer",
        timeout: 20000
      });
      const v53 = new admzip(Buffer.from(v52.data));
      v53.extractAllTo(v47, true);
      console.log(v51.GKooa);
    } else {
      v54 = v55.join(v56, "core" + v57);
    }
  } catch (v58) {
    if (v51.MkssY("HSoIA", "xegsu")) {
      v59.error("[START] All " + v60 + " attempts failed. Exiting.");
      v61.exit(1);
    } else {
      console.error("❌ Sync failed:", v58.response?.status || v58.message);
      throw v58;
    }
  }
}
function v62(v63) {
  const v65 = path.join(__dirname, "config.js");
  if (fs.existsSync(v65)) {
    try {
      fs.copyFileSync(v65, path.join(v63, "config.js"));
      console.log("[CONFIG] Copied config.js");
    } catch (v66) {
      {
        console.warn("[CONFIG] Failed to copy config.js:", v66.message);
      }
    }
  }
}
async function v70() {
  v27();
  const v72 = v36();
  await v46(v72);
  const v73 = fs.readdirSync(v72).filter(v74 => fs.statSync(path.join(v72, v74)).isDirectory());
  if (!v73.length) {
    {
      throw new Error("❌ ZIP extracted nothing");
    }
  }
  const v75 = path.join(v72, v73[0]);
  v62(v75);
  console.log("[BOT] Launching Cyntron-X...");
  process.chdir(v75);
  await import(path.join(v75, "index.js"));
}
const v76 = 3;
const v77 = 3000;
async function v78() {
  const v79 = {
    tAwsJ: "utf8",
    qHHTs: "[ENV] File loaded successfully",
    ZPZJV: function (v80, v81) {
      return v80 <= v81;
    },
    ddrQF: "KJgjY",
    siakf: function (v82) {
      return v82();
    },
    BkSYZ: function (v83, v84) {
      return v83 !== v84;
    },
    tFtNh: function (v85, v86) {
      return v85 < v86;
    },
    XJkbq: "xGuFI"
  };
  for (let v87 = 1; v87 <= v76; v87++) {
    {
      try {
        console.log("[START] Attempt " + v87 + "/" + v76);
        await v70();
        return;
      } catch (v100) {
        {
          console.error("[START] Attempt " + v87 + " failed:", v100.message || v100);
          if (v87 < v76) {
            console.log("[START] Retrying in " + v77 / 1000 + "s...");
            await new Promise(v102 => setTimeout(v102, v77));
          } else {
            console.error("[START] All " + v76 + " attempts failed. Exiting.");
            process.exit(1);
          }
        }
      }
    }
  }
}
v78();