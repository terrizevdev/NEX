//#ENJOY
const fs = require("fs-extra");
if (fs.existsSync(".env"))
  require("dotenv").config({ path: __dirname + "/.env" });
global.audio = "";
global.video = "";
global.port = process.env.PORT;
global.appUrl = process.env.APP_URL || "";
global.email = "kibuukauthuman0@gmail.com@gmail.com";
global.location = "Wakiso, Uganda";
global.mongodb = process.env.MONGODB_URI || "";
global.allowJids = process.env.ALLOW_JID || "null";
global.blockJids = process.env.BLOCK_JID || "null";
global.DATABASE_URL = process.env.DATABASE_URL || "";
global.timezone = process.env.TZ || process.env.TIME_ZONE || "Africa/Uganda";
global.github = process.env.GITHUB || "https://github.com/terrizevdev/NEX";
global.gurl = process.env.GURL || "https://whatsapp.com/channel/0029Vb57ZHh7IUYcNttXEB3y";
global.website = process.env.GURL || "https://whatsapp.com/channel/0029Vb57ZHh7IUYcNttXEB3y";
global.THUMB_IMAGE = process.env.THUMB_IMAGE || process.env.IMAGE || "https://files.catbox.moe/aid1i4.jpg";
global.devs = "https://t.me/terrizev";
global.sudo = process.env.SUDO || "256784670936";
global.owner = process.env.OWNER_NUMBER || "256754550399";
global.style = process.env.STYLE || "3";
global.gdbye = process.env.GOODBYE || "true";
global.wlcm = process.env.WELCOME || "true";
global.warncount = process.env.WARN_COUNT || "3";
global.disablepm = process.env.DISABLE_PM || "false";
global.disablegroup = process.env.DISABLE_GROUPS || "false",
global.MsgsInLog = process.env.MSGS_IN_LOG || "false";
global.userImages = process.env.USER_IMAGES || "https://files.catbox.moe/ecbf11.jpg";
global.waPresence = process.env.WAPRESENCE || "available";
global.readcmds = process.env.READ_COMMAND || "false";
global.readmessage = process.env.READ_MESSAGE || "false";
global.readmessagefrom = process.env.READ_MESSAGE_FROM || "";
global.read_status = process.env.AUTO_READ_STATUS || "true";
global.save_status = process.env.AUTO_SAVE_STATUS || "false";
global.AUTOSTATUS_REACT = process.env.AUTOSTATUS_REACT === 'true';
global.autoLikeEmoji = process.env.AUTO_LIKE_EMOJI || "💚";
global.save_status_from = process.env.SAVE_STATUS_FROM || "256784670936";
global.read_status_from = process.env.READ_STATUS_FROM || "256784670936";

global.api_smd = "https://api-smd-1.vercel.app";
global.scan = "https://anonymous-session-id-gen.onrender.com/";

global.SESSION_ID =
  process.env.SESSION_ID ||
  "eyJub2lzZUtleSI6eyJwcml2YXRlIjp7InR5cGUiOiJCdWZmZXIiLCJkYXRhIjoiVUZ1YlB6b3ZBKzExQVpFL2FPL25YUHczbnRsVDdPeW9QVk9JYkQ3SlFFbz0ifSwicHVibGljIjp7InR5cGUiOiJCdWZmZXIiLCJkYXRhIjoiczVxS3pRVlpndDF4ZXBvWno4a0NSc1M4cjRJeG5rbFQzM1lNb1pLQjhYWT0ifX0sInBhaXJpbmdFcGhlbWVyYWxLZXlQYWlyIjp7InByaXZhdGUiOnsidHlwZSI6IkJ1ZmZlciIsImRhdGEiOiIrQ0pBMyt3SEcvbzlsR2k0MGg3YW5sc1FQYk0wZ0hvc25KUEpjdVFKOUdvPSJ9LCJwdWJsaWMiOnsidHlwZSI6IkJ1ZmZlciIsImRhdGEiOiJXQk4vWWpJK251Vk16YTVSN3djMDhxM0FuWHlaRG1pbGFoR1lqN1hSVlFRPSJ9fSwic2lnbmVkSWRlbnRpdHlLZXkiOnsicHJpdmF0ZSI6eyJ0eXBlIjoiQnVmZmVyIiwiZGF0YSI6InNOczVVMzBXdTkwSEozVFIwT3paaExDenRVbFowbkxUemg5aXRnY1g4MXM9In0sInB1YmxpYyI6eyJ0eXBlIjoiQnVmZmVyIiwiZGF0YSI6ImF5eXMrTjhRSDBDRmhZOXVCM0REa25vVlE2NE9EWlpNSW51RlBMVnZIQ2s9In19LCJzaWduZWRQcmVLZXkiOnsia2V5UGFpciI6eyJwcml2YXRlIjp7InR5cGUiOiJCdWZmZXIiLCJkYXRhIjoiU0luRXAzWllSV0lnTkdYYVhTOXU5NnRPdUlxNStqT0pDbTFac2p3NDgyUT0ifSwicHVibGljIjp7InR5cGUiOiJCdWZmZXIiLCJkYXRhIjoiR053dEI4VmdNbk5PVUFvRG5rb2lWaVpVOXlwaW9KSE14Y3RLdVlJY2JCTT0ifX0sInNpZ25hdHVyZSI6eyJ0eXBlIjoiQnVmZmVyIiwiZGF0YSI6IlVDQ2lIeUw2SFlic1dEWUVCN2NHRXVMaHI0OU1tS3htdDZBanROVlczQUhsbzg2TXNMVC8relJ1TTMxWTZuSTJiY2FJWlJVZnFXMHFTL1paa29nUERRPT0ifSwia2V5SWQiOjF9LCJyZWdpc3RyYXRpb25JZCI6MjExLCJhZHZTZWNyZXRLZXkiOiJxdy9CdFoyTUg4OUtuVWViRllYbTl1cWdWZVJld05uKzJUaGx0ZG9IeFJvPSIsInByb2Nlc3NlZEhpc3RvcnlNZXNzYWdlcyI6W10sIm5leHRQcmVLZXlJZCI6MzEsImZpcnN0VW51cGxvYWRlZFByZUtleUlkIjozMSwiYWNjb3VudFN5bmNDb3VudGVyIjowLCJhY2NvdW50U2V0dGluZ3MiOnsidW5hcmNoaXZlQ2hhdHMiOmZhbHNlfSwicmVnaXN0ZXJlZCI6dHJ1ZSwicGFpcmluZ0NvZGUiOiJZMVdCRDZFUCIsIm1lIjp7ImlkIjoiMjU2NzU0NTUwMzk5Ojg2QHMud2hhdHNhcHAubmV0IiwibmFtZSI6IlRlcnJpIiwibGlkIjoiMjc5MzEwOTM0MDAzODQ0Ojg2QGxpZCJ9LCJhY2NvdW50Ijp7ImRldGFpbHMiOiJDT0hMN1BBQ0VJV2Y1c1lHR0JBZ0FDZ0EiLCJhY2NvdW50U2lnbmF0dXJlS2V5Ijoia01wdnlJZEJ2Ukd2MmFKb2FScTAyMEVwOHdxM1dTdTNVejFCZnNrcHoxYz0iLCJhY2NvdW50U2lnbmF0dXJlIjoiOWdCUE9hZWNDdlhtVzRpTUFnMHE2RjhidHRNa1RBaThyVFZzTmx5ejdVbUFvZVhjUjdrdHZnZy83OUpxTXYyMDlJV2RHa2tTSE9jN0lmWVJkOFJERHc9PSIsImRldmljZVNpZ25hdHVyZSI6InkxUkROMEc2Tmk1ak1wTHZ4NFZScEphOTV6Z0RzdUJEbXliQ3VjTTVTYkFJWCtnUjc2cmlDWXhyU0RvWXpjU2NkTjFsTXRlajdlQ2ppQncrZWVzRURBPT0ifSwic2lnbmFsSWRlbnRpdGllcyI6W3siaWRlbnRpZmllciI6eyJuYW1lIjoiMjU2NzU0NTUwMzk5Ojg2QHMud2hhdHNhcHAubmV0IiwiZGV2aWNlSWQiOjB9LCJpZGVudGlmaWVyS2V5Ijp7InR5cGUiOiJCdWZmZXIiLCJkYXRhIjoiQlpES2I4aUhRYjBScjltaWFHa2F0TnRCS2ZNS3Qxa3J0MU05UVg3SktjOVgifX1dLCJwbGF0Zm9ybSI6InNtYmEiLCJyb3V0aW5nSW5mbyI6eyJ0eXBlIjoiQnVmZmVyIiwiZGF0YSI6IkNBSUlCUT09In0sImxhc3RBY2NvdW50U3luY1RpbWVzdGFtcCI6MTc1OTA4ODUzMSwibGFzdFByb3BIYXNoIjoiMkc0QW11IiwibXlBcHBTdGF0ZUtleUlkIjoiQUFBQUFQUUUifQ=="
module.exports = {
  menu: process.env.MENU || "2",
  HANDLERS: process.env.PREFIX || "+",
  BRANCH: process.env.BRANCH || "main",
  VERSION: process.env.VERSION || "1.0.0",
  caption: process.env.CAPTION || "`ANONYMOIS-MD™`",
  author: process.env.PACK_AUTHER || "ANONYMOUS-MD",
  packname: process.env.PACK_NAME || "A N O N Y M O U S",
  botname: process.env.BOT_NAME || "ANONYMOUS-MD",
  ownername: process.env.OWNER_NAME || "TERRIZEV",
  errorChat: process.env.ERROR_CHAT || "",
  KOYEB_API: process.env.KOYEB_API || "false",
  REMOVE_BG_KEY: process.env.REMOVE_BG_KEY || "",
  OPENAI_API_KEY: process.env.OPENAI_API_KEY || "",
  HEROKU_API_KEY: process.env.HEROKU_API_KEY || "",
  HEROKU_APP_NAME: process.env.HEROKU_APP_NAME || "",
  antilink_values: process.env.ANTILINK_VALUES || "all",
  HEROKU: process.env.HEROKU_APP_NAME && process.env.HEROKU_API_KEY,
  aitts_Voice_Id: process.env.AITTS_ID || "37",
  ELEVENLAB_API_KEY: process.env.ELEVENLAB_API_KEY || "",
  WORKTYPE: process.env.WORKTYPE || process.env.MODE || "private",
  LANG: (process.env.THEME || "A N O N Y M O U S").toUpperCase(),
};
global.rank = "updated";
global.isMongodb = false;
let file = require.resolve(__filename);
fs.watchFile(file, () => {
  fs.unwatchFile(file);
  console.log(`Update'${__filename}'`);
  delete require.cache[file];
  require(file);
});
