const {
  sendButtons
} = require("gifted-btns");
const {
  applyFont
} = require("../../utils/fontConverter");
const axios = require("axios");
const config = require("../../config");
const fs = require("fs");
const path = require("path");
const os = require("os");
const GITHUB_USER = "Vinpink2";
const GITHUB_REPO = "June-Ultra";
const REPO_URL = "https://github.com/" + GITHUB_USER + "/" + GITHUB_REPO;
const API_URL = "https://api.github.com/repos/" + GITHUB_USER + "/" + GITHUB_REPO;
function extractButtonResponseId(v1) {
  return v1.message?.buttonsResponseMessage?.selectedButtonId || v1.message?.templateButtonReplyMessage?.selectedId || v1.message?.interactiveResponseMessage?.nativeFlowResponseMessage?.paramsJson || null;
}
function getResponseSender(v2) {
  return v2.key?.participant || v2.key?.remoteJid;
}
function buildMainButtons(v3, v4) {
  const v5 = config.prefix || ".";
  return [{
    name: "cta_url",
    buttonParamsJson: JSON.stringify({
      display_text: "🔗 Open Repo",
      url: v3
    })
  }, {
    name: "cta_copy",
    buttonParamsJson: JSON.stringify({
      display_text: "📋 Copy Repo URL",
      copy_code: v3
    })
  }, {
    id: v5 + "ghzip_" + v4,
    text: "📦 Download ZIP"
  }];
}
module.exports = {
  name: "github",
  aliases: ["repo", "git", "source", "rp", "script"],
  category: "tools",
  description: "Show bot GitHub repository and statistics",
  usage: ".github",
  ownerOnly: false,
  async execute(v6, v7, v8, v9) {
    try {
      const v10 = v9.from;
      const v11 = config.prefix || ".";
      const v12 = v7.key?.participant || v7.key?.remoteJid;
      const v13 = "Powered by " + config.botName;
      const v14 = Date.now();
      let v15;
      let v16 = REPO_URL;
      let v17 = "main";
      try {
        const {
          data: v18
        } = await axios.get(API_URL, {
          headers: {
            "User-Agent": "Cyntron-X"
          },
          timeout: 10000
        });
        v16 = v18.html_url;
        v17 = v18.default_branch || "main";
        v15 = applyFont("┏━━━━━━━━━━━━━━━━\n\n" + ("✧ Repository:  " + v18.name + "\n") + ("✧ Owner:       " + v18.owner.login + "\n") + ("✧ Description: " + (v18.description || "N/A") + "\n") + ("✧ Language:    " + (v18.language || "N/A") + "\n") + ("✧ License:     " + (v18.license?.name || "N/A") + "\n") + ("✧ Branch:      " + v17 + "\n") + ("✧ Visibility:  " + (v18.private ? "🔒 Private" : "🔓 Public") + "\n\n") + "┗━━━━━━━━━━━━━━━━━\n┏━━━━━━━━━━━━━━━━━\n\n⿻ STATISTICS\n" + ("⿻ Stars:       " + v18.stargazers_count.toLocaleString() + "\n") + ("⿻ Forks:       " + v18.forks_count.toLocaleString() + "\n") + ("⿻ Watchers:    " + v18.watchers_count.toLocaleString() + "\n") + ("⿻ Size:        " + (v18.size / 1024).toFixed(2) + " MB\n") + ("⿻ Issues:      " + v18.open_issues_count.toLocaleString() + "\n\n") + "┗━━━━━━━━━━━━━━━━");
      } catch (v19) {
        console.error("[GitHub] API error:", v19.message);
        v15 = applyFont("┏━━『 GITHUB REPOSITORY 』━━\n\n" + ("🤖 Bot Name:   " + config.botName + "\n") + ("📁 Repository: " + GITHUB_REPO + "\n") + ("👤 Owner:      " + GITHUB_USER + "\n") + ("🔗 URL:        " + REPO_URL + "\n\n") + "⚠️ Could not fetch live stats.\n   Visit the repo for latest info.\n\n┗━━━━━━━━━━━━━━━━");
      }
      const v20 = path.join(__dirname, "../../utils/menu1.jpg");
      const v21 = fs.existsSync(v20) ? fs.readFileSync(v20) : null;
      await sendButtons(v6, v10, {
        image: v21 ? {
          buffer: v21,
          mimetype: "image/jpeg"
        } : undefined,
        text: v15,
        footer: v13,
        buttons: buildMainButtons(v16, v14)
      }, {
        quoted: v7
      });
      const v22 = async v23 => {
        const v24 = v23.messages[0];
        if (!v24?.message) {
          return;
        }
        const v25 = extractButtonResponseId(v24);
        if (!v25) {
          return;
        }
        if (v25 !== v11 + "ghzip_" + v14) {
          return;
        }
        if (v24.key?.remoteJid !== v10) {
          return;
        }
        const v26 = getResponseSender(v24);
        if (v26 !== v12) {
          return;
        }
        v6.ev.off("messages.upsert", v22);
        await v6.sendMessage(v10, {
          react: {
            text: "⏳",
            key: v7.key
          }
        });
        const v27 = v16 + "/archive/refs/heads/" + v17 + ".zip";
        let v28;
        try {
          v28 = path.join(os.tmpdir(), GITHUB_REPO + "-" + v14 + ".zip");
          const v29 = await axios({
            method: "get",
            url: v27,
            responseType: "stream",
            timeout: 120000,
            headers: {
              "User-Agent": "Cyntron-X"
            },
            maxRedirects: 5
          });
          const v30 = fs.createWriteStream(v28);
          v29.data.pipe(v30);
          await new Promise((v31, v32) => {
            v30.on("finish", v31);
            v30.on("error", v32);
          });
          if (!fs.existsSync(v28) || fs.statSync(v28).size === 0) {
            throw new Error("ZIP download failed — file is empty");
          }
          const v33 = (fs.statSync(v28).size / 1048576).toFixed(2);
          await v6.sendMessage(v10, {
            document: fs.readFileSync(v28),
            mimetype: "application/zip",
            fileName: GITHUB_REPO + ".zip",
            caption: applyFont("┏━━『 ZIP DOWNLOADED 』━━\n\n" + ("📁 Repository: " + GITHUB_REPO + "\n") + ("🌿 Branch:     " + v17 + "\n") + ("💾 Size:       " + v33 + " MB\n\n") + "┗━━━━━━━━━━━━━━━━\n\n" + ("> " + config.botName))
          }, {
            quoted: v24
          });
          await v6.sendMessage(v10, {
            react: {
              text: "✅",
              key: v7.key
            }
          });
        } catch (v34) {
          console.error("[GitHub] ZIP download error:", v34.message);
          await v6.sendMessage(v10, {
            react: {
              text: "❌",
              key: v7.key
            }
          });
          await v6.sendMessage(v10, {
            text: applyFont("┏━━『 ERROR 』━━\n\n❌ Failed: ZIP Download\n" + ("⚠️ Reason: " + v34.message + "\n\n") + "  Try copying the link instead.\n\n┗━━━━━━━━━━━━━━━━")
          }, {
            quoted: v24
          });
        } finally {
          if (v28 && fs.existsSync(v28)) {
            fs.unlinkSync(v28);
          }
        }
      };
      v6.ev.on("messages.upsert", v22);
      setTimeout(() => v6.ev.off("messages.upsert", v22), 300000);
    } catch (v35) {
      console.error("[GitHub] command error:", v35);
      await v9.reply("❌ Error: " + v35.message);
    }
  }
};