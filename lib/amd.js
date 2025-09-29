const fs = require("fs");
const path = require("path");
const Config = require(__dirname + "/../config.js");
const blockJid = [
  "" + (process.env.BLOCKJIDS || "120363023983262391@g.us"),
  ...(typeof global.blockJids === "string" ? global.blockJids.split(",") : []),
];
const allowJid = [
  "null",
  ...(typeof global.allowJids === "string" ? global.allowJids.split(",") : []),
];
const Pino = require("pino");
const { Boom } = require("@hapi/boom");
const FileType = require("file-type");
const express = require("express");
const app = express();
const events = require("./plugins");
const {
  imageToWebp,
  videoToWebp,
  writeExifImg,
  writeExifVid,
} = require("./exif");
var {
  default: AstaConnectSock,
  proto,
  prepareWAMessageMedia,
  downloadContentFromMessage,
  DisconnectReason,
  useMultiFileAuthState,
  generateForwardMessageContent,
  generateWAMessageFromContent,
  makeInMemoryStore,
  jidDecode,
} = require("@whiskeysockets/baileys");
var last_status = {};
global.setCmdAlias = {};
global.AstaOfficial = false;
global.sqldb = false;
global.pg_pools = false;
const {
  userdb,
  groupdb,
  sleep,
  getBuffer,
  parsedJid,
  tiny,
  botpic,
  tlang,
  runtime,
  getSizeMedia,
  bot_,
  smdBuffer,
} = require("../lib");
const fetch = require("node-fetch");
const axios = require("axios");
const { smsg, callsg, groupsg } = require("./serialized.js");
var prefa =
  !Config.HANDLERS ||
  ["false", "null", " ", "", "nothing", "not", "empty"].includes(
    !Config.HANDLERS
  )
    ? true
    : false;
global.prefix = prefa ? "" : Config.HANDLERS[0];
global.prefixRegex =
  prefa || ["all"].includes(Config.HANDLERS)
    ? new RegExp("^")
    : new RegExp("^[" + Config.HANDLERS + "]");
global.prefixboth = ["all"].includes(Config.HANDLERS);
let baileys = "/Session/";
const connnectpg = async () => {
  try {
    const { Pool } = require("pg");
    const pool = new Pool({
      connectionString: global.DATABASE_URL,
      ssl: {
        rejectUnauthorized: false,
      },
    });
    const client = await pool.connect();
    client.release();
    console.log("🌍 Connected to the PostgreSQL.");
    return true;
  } catch (error) {
    console.log("Could not connect with PostgreSQL.\n");
    return false;
  }
};

const connnectMongo = async () => {
  const mongoose = require("mongoose");
  try {
    mongoose.set("strictQuery", true);
    await mongoose.connect(MONGODB);
    console.log("🌍 Connected to the MongoDB.");
    return true;
  } catch {
    console.log("Could not connect with MongoDB.");
    return false;
  }
};
let Asta = {};
const store = makeInMemoryStore({
  logger: Pino({
    level: "silent",
  }).child({
    level: "silent",
  }),
});
const storeFilePath = path.join(__dirname, "/store.json");
try {
  if (fs.existsSync(storeFilePath)) {
    store.readFromFile(storeFilePath);
  }
} catch (error) {
  console.log("CLIENT STORE ERROR:\n", error);
}
require("events").EventEmitter.defaultMaxListeners = 2000;
//
/** BOT FUNCTIONALITY */
//
async function syncdb() {
  let thumbnailImagePath = __dirname + "/assets/asta.jpeg";

  try {
    global.log0 =
      typeof THUMB_IMAGE === "string"
        ? await getBuffer(THUMB_IMAGE.split(",")[0])
        : fs.readFileSync(thumbnailImagePath);
  } catch (error) {
    thumbnailImagePath = __dirname + "/assets/asta.jpeg";
  }
  global.log0 =
    global.log0 || fs.readFileSync(thumbnailImagePath);
  const { state: state, saveCreds: creds } = await useMultiFileAuthState(
    __dirname + baileys
  );
  let AstaConn = AstaConnectSock({
    logger: Pino({ level: "silent" || "debug" || "fatal" }),
    printQRInTerminal: false,
    browser: ["Windows", "chrome", "ANONYMOUS-MD"],
    fireInitQueries: true,
    shouldSyncHistoryMessage: true,
    downloadHistory: true,
    syncFullHistory: true,
    generateHighQualityLinkPreview: true,
    markOnlineOnConnect: true,
    auth: state,
    getMessage: async (message) => {
      let defaultMessage = { conversation: "Hello World!" };
      if (store) {
        const storedMessage = await store.loadMessage(
          message.remoteJid,
          message.id
        );
        return storedMessage.message || defaultMessage;
      }
      return defaultMessage;
    },
  });
  store.bind(AstaConn.ev);
  setInterval(() => {
    try {
      const filePath = __dirname + "/store.json";
      store.writeToFile(filePath);
    } catch (error) {
      console.log("CLIENT STORE ERROR:\n", error);
    }
  }, 10000);
  AstaConn.ev.on("call", async (callData) => {
    let callResponse = await callsg(
      AstaConn,
      JSON.parse(JSON.stringify(callData[0]))
    );
    events.commands.map(async (command) => {
      if (command.call === "offer" && callResponse.status === "offer") {
        try {
          command.function(callResponse, { store: store, Void: AstaConn });
        } catch (error) {
          console.error("[CALL ERROR] ", error);
        }
      }
      if (command.call === "accept" && callResponse.status === "accept") {
        try {
          command.function(callResponse, { store: store, Void: AstaConn });
        } catch (error) {
          console.error("[CALL ACCEPT ERROR] ", error);
        }
      }
      if (
        command.call === "call" ||
        command.call === "on" ||
        command.call === "all"
      ) {
        try {
          command.function(callResponse, { store: store, Void: AstaConn });
        } catch (error) {
          console.error("[CALL ERROR] ", error);
        }
      }
    });
  });
  var botNumber = false;
  let dbgroup = {};
  let dbuser = {};
  AstaConn.ev.on("messages.upsert", async (callData) => {
    try {
      if (!callData.messages || !Array.isArray(callData.messages)) {
        return;
      }
      botNumber = botNumber || AstaConn.decodeJid(AstaConn.user.id);
      for (mek of callData.messages) {
        mek.message =
          Object.keys(mek.message || {})[0] === "ephemeralMessage"
            ? mek.message.ephemeralMessage.message
            : mek.message;
        if (
          !mek.message ||
          !mek.key ||
          !/broadcast/gi.test(mek.key.remoteJid)
        ) {
          continue;
        }
        let messageData = await smsg(
          AstaConn,
          JSON.parse(JSON.stringify(mek)),
          store,
          true
        );
        if (!messageData.message) {
          continue;
        }
        let messageBody = messageData.body;
        let eventData = {
          body: messageBody,
          mek: mek,
          text: messageBody,
          args: messageBody.split(" ") || [],
          botNumber: botNumber,
          isCreator: messageData.isCreator,
          store: store,
          budy: messageBody,
          Asta: {
            bot: AstaConn,
          },
          Void: AstaConn,
          proto: proto,
        };
        events.commands.map(async (command) => {
          if (typeof command.on === "string") {
            let commandName = command.on.trim();
            let shouldExecute =
              !command.fromMe || (command.fromMe && messageData.fromMe);
            if (
              /status|story/gi.test(commandName) &&
              (messageData.jid === "status@broadcast" ||
                mek.key.remoteJid === "status@broadcast") &&
              shouldExecute
            ) {
              command.function(messageData, messageBody, eventData);
            } else if (
              ["broadcast"].includes(commandName) &&
              (/broadcast/gi.test(mek.key.remoteJid) ||
                messageData.broadcast ||
                /broadcast/gi.test(messageData.from)) &&
              shouldExecute
            ) {
              command.function(messageData, messageBody, eventData);
            }
          }
        });
      }
    } catch (error) {
      console.log("ERROR broadCast --------- messages.upsert \n", error);
    }
  });

  AstaConn.ev.on("messages.upsert", async (callData) => {
    try {
      botNumber = botNumber || AstaConn.decodeJid(AstaConn.user.id);
      if (!global.isStart) {
        return;
      }
      for (mek of callData.messages) {
        if (!mek.message) {
          continue;
        }
        mek.message =
          Object.keys(mek.message || {})[0] === "ephemeralMessage"
            ? mek.message.ephemeralMessage.message
            : mek.message;
        if (!mek.message || !mek.key || /broadcast/gi.test(mek.key.remoteJid)) {
          continue;
        }
        let messageData = await smsg(
          AstaConn,
          JSON.parse(JSON.stringify(mek)),
          store,
          true
        );
        let message = messageData;
        if (!messageData.message || messageData.chat.endsWith("broadcast")) {
          continue;
        }
        var { body: messageBody } = messageData;
        var isCreator = messageData.isCreator;
        var rawText =
          typeof messageData.text == "string" ? messageData.text.trim() : false;
        if (rawText && messageBody[1] && messageBody[1] == " ") {
          messageBody = messageBody[0] + messageBody.slice(2);
        }
        let isCommand = false;
        let commandName = false;
        let commandPrefix = false;
        if (rawText && Config.HANDLERS.toLowerCase().includes("null")) {
          isCommand = true;
          commandName = messageBody.split(" ")[0].toLowerCase() || false;
        } else if (rawText && !Config.HANDLERS.toLowerCase().includes("null")) {
          isCommand =
            prefixboth ||
            (messageBody && prefixRegex.test(messageBody[0])) ||
            (messageData.isAsta &&
              /923184474176|923004591719|17863688449/g.test(botNumber) &&
              messageBody[0] == ",");
          commandName = isCommand
            ? prefa
              ? messageBody.trim().split(" ")[0].toLowerCase()
              : messageBody.slice(1).trim().split(" ")[0].toLowerCase()
            : false;
          commandPrefix = prefixboth
            ? messageBody.trim().split(" ")[0].toLowerCase()
            : "";
        } else {
          isCommand = false;
        }
        let command = commandName ? commandName.trim() : "";
        if (command && global.setCmdAlias[command] !== undefined) {
          commandName = global.setCmdAlias[command];
          isCommand = true;
        } else if (messageData.mtype == "stickerMessage") {
          command = "sticker-" + messageData.msg.fileSha256;
          if (global.setCmdAlias[command]) {
            commandName = global.setCmdAlias[command];
            isCommand = true;
          }
        }
        if (blockJid.includes(messageData.chat) && !messageData.isAsta) {
          return;
        }
        if (
          isCommand &&
          (messageData.isBaileys ||
            (!isCreator &&
              Config.WORKTYPE === "private" &&
              !allowJid.includes(messageData.chat)))
        ) {
          isCommand = false;
        }
        const args = messageData.body
          ? messageBody.trim().split(/ +/).slice(1)
          : [];
        if (
          !isCreator &&
          global.disablepm === "true" &&
          isCommand &&
          !messageData.isGroup
        ) {
          isCommand = false;
        }
        if (
          !isCreator &&
          global.disablegroup === "true" &&
          isCommand &&
          messageData.isGroup &&
          !allowJid.includes(messageData.chat)
        ) {
          isCommand = false;
        }
        Asta.bot = AstaConn;
        if (isCommand) {
          let command =
            events.commands.find(
              (command) => command.pattern === commandName
            ) ||
            events.commands.find(
              (command) => command.alias && command.alias.includes(commandName)
            );
          if (!command && prefixboth && commandPrefix) {
            command =
              events.commands.find(
                (command) => command.pattern === commandPrefix
              ) ||
              events.commands.find(
                (command) =>
                  command.alias && command.alias.includes(commandPrefix)
              );
          }
          if (command && command.fromMe && !messageData.fromMe && !isCreator) {
            command = false;
            return messageData.reply(tlang().owner);
          }
          if (messageData.isGroup && command && commandName !== "bot") {
            let groupData = dbgroup[messageData.chat] ||
              (await groupdb.findOne({
                id: messageData.chat,
              })) || {
                botenable: toBool(
                  messageData.isAsta || !blockJid.includes(messageData.chat)
                ),
              };
            if (groupData && groupData.botenable === "false") {
              command = false;
            }
            if (command && groupData) {
              let pattern = command.pattern.replace(
                /[.*+?^${}()|[\]\\]/g,
                "\\$&"
              );
              let regex = new RegExp("\\b" + pattern + "\b");
              if (
                groupData.disablecmds !== "false" &&
                regex.test(groupData.disablecmds)
              ) {
                command = false;
              }
            }
          }
          if (!isCreator && command) {
            try {
              let userData = dbuser[messageData.sender] ||
                (await userdb.findOne({
                  id: messageData.sender,
                })) || {
                  ban: "false",
                };
              if (userData.ban === "true") {
                command = false;
                messageData.reply(
                  "Hey " +
                    messageData.senderName.split("\n").join("  ") +
                    ",\n_You are banned from using commands._"
                );
              }
            } catch (error) {
              console.log("checkban.ban", error);
            }
          }
          if (command) {
            if (command.react) {
              messageData.react(command.react);
            }
            let text = messageData.body
              ? messageBody.trim().split(/ +/).slice(1).join(" ")
              : "";
            let pattern = command.pattern;
            messageData.cmd = pattern;
            try {
              command.function(messageData, text, {
                cmd: pattern,
                text: text,
                body: messageBody,
                args: args,
                cmdName: commandName,
                isCreator: isCreator,
                smd: pattern,
                botNumber: botNumber,
                budy: rawText,
                store: store,
                Asta: Asta,
                Void: AstaConn,
              });
            } catch (error) {
              console.log("[ERROR] ", error);
            }
          } else {
            isCommand = false;
            const category =
              events.commands.find(
                (command) => command.category === commandName
              ) || false;
            if (category) {
              const commands = {};
              let commandList = "";
              events.commands.map(async (command, index) => {
                if (
                  command.dontAddCommandList === false &&
                  command.pattern !== undefined
                ) {
                  if (!commands[command.category]) {
                    commands[command.category] = [];
                  }
                  commands[command.category].push(command.pattern);
                }
              });
              for (const category in commands) {
                if (commandName == category.toLowerCase()) {
                  commandList =
                    "┌───〈 " +
                    category.toLowerCase() +
                    " menu  〉───◆\n│╭─────────────···▸\n┴│▸\n";
                  for (const command of commands[category]) {
                    commandList += "⬡│▸ " + command + "\n";
                  }
                  commandList +=
                    "┬│▸\n│╰────────────···▸▸\n└───────────────···▸";
                  break;
                }
              }
              AstaConn.sendUi(messageData.jid, {
                caption: tiny(commandList),
              });
            }
          }
        }
        try {
          dbgroup[messageData.chat] =
            (await groupdb.findOne({
              id: messageData.chat,
            })) ||
            (await groupdb.new({
              id: messageData.chat,
              botenable:
                messageData.chat === "120363023983262391@g.us"
                  ? "false"
                  : "true",
              goodbye: toBool(global.gdbye),
              welcome: toBool(global.wlcm),
            }));
          dbuser[messageData.sender] =
            (await userdb.findOne({
              id: messageData.sender,
            })) ||
            (await userdb.new({
              id: messageData.sender,
              name: messageData.pushName || "Unknown",
            }));
        } catch (error) {
          main();
        }
        text = messageData.body;
        let eventData = {
          dbuser: dbuser[messageData.sender],
          dbgroup: dbgroup[messageData.chat],
          body: messageBody,
          mek: mek,
          text: text,
          args: args,
          botNumber: botNumber,
          isCreator: isCreator,
          icmd: isCommand,
          store: store,
          budy: rawText,
          Asta: Asta,
          Void: AstaConn,
          proto: proto,
        };
        let dataTypes = {
          mp4: "video",
          mp3: "audio",
          webp: "sticker",
          photo: "image",
          picture: "image",
          vv: "viewonce",
        };
        events.commands.map(async (command) => {
          if (typeof command.on === "string") {
            let commandName = command.on.trim();
            let shouldExecute =
              !command.fromMe || (command.fromMe && messageData.fromMe);
            if (commandName === "main" && shouldExecute) {
              command.function(messageData, messageBody, eventData);
            } else if (
              messageData.text &&
              commandName === "text" &&
              /text|txt|true|smd|asta/gi.test(command.quoted) &&
              messageData.quoted &&
              messageData.quoted.text &&
              shouldExecute
            ) {
              command.function(messageData, messageBody, eventData);
            } else if (
              messageData.text &&
              ["body", "text"].includes(commandName) &&
              shouldExecute
            ) {
              command.function(messageData, messageBody, eventData);
            } else if (
              typeof messageData[dataTypes[commandName] || commandName] ===
                "boolean" &&
              messageData.quoted &&
              messageData.quoted[command.quoted] &&
              shouldExecute
            ) {
              command.function(messageData, messageBody, eventData);
            } else if (
              commandName === "viewonce" &&
              (messageData.viewOnce || mek.message.viewOnceMessageV2)
            ) {
              try {
                command.function(messageData, messageBody, eventData);
              } catch (error) {
                console.log("[ERROR] ", error);
              }
            } else if (
              typeof messageData[dataTypes[commandName] || commandName] ===
                "boolean" &&
              shouldExecute
            ) {
              command.function(messageData, messageBody, eventData);
            }
            if (
              commandName === "delete" &&
              messageData.mtype == "protocolMessage" &&
              messageData.msg.type === "REVOKE" &&
              shouldExecute
            ) {
              command.function(messageData, messageBody, eventData);
            } else if (
              commandName === "poll" &&
              /poll/gi.test(messageData.mtype) &&
              shouldExecute
            ) {
              command.function(messageData, messageBody, eventData);
            } else if (
              commandName === "quoted" &&
              messageData.quoted &&
              shouldExecute
            ) {
              command.function(messageData, messageBody, eventData);
            }
          }
        });
      }
    } catch (error) {
      console.log("client.js --------- messages.upsert \n", error);
    }
  });
  let Astro = {};
  AstaConn.ev.on(
    "group-participants.update",
    async (groupParticipantsUpdate) => {
      try {
        let groupData = await groupsg(
          AstaConn,
          JSON.parse(JSON.stringify(groupParticipantsUpdate)),
          true
        );
        if (!groupData || !groupData.isGroup) {
          return;
        }
        events.commands.map(async (command) => {
          if (groupData.status === command.group) {
            try {
              command.function(groupData, { store: store, Void: AstaConn });
            } catch (error) {
              console.error("[GROUP PARTICIPANTS ADD ERROR] ", error);
            }
          }
          if (/on|true|main|all|asta|smd/gi.test(command.group)) {
            try {
              command.function(groupData, { store: store, Void: AstaConn });
            } catch (error) {
              console.error("[GROUP PARTICIPANTS PROMOTE ERROR] ", error);
            }
          }
        });
      } catch (error) {
        console.log(error);
      }
    }
  );

  AstaConn.ev.on("groups.update", async (groupsUpdate) => {
    try {
      for (const group of groupsUpdate) {
        if (!store.allgroup) {
          store.allgroup = {};
        }
        store.allgroup[group.id] = group;
      }
    } catch (error) {
      console.log(error);
    }
  });

  AstaConn.ev.on("groups.upsert", async (groupsUpsert) => {
    try {
      events.commands.map(async (command) => {
        if (
          /on|true|main|all|asta|smd/gi.test(
            command.groupsetting || command.upsertgroup || command.groupupsert
          )
        ) {
          command.function(
            { ...groupsUpsert[0], bot: AstaConn },
            { store: store, Void: AstaConn, data: groupsUpsert }
          );
        }
      });
      await groupsg(
        AstaConn,
        JSON.parse(JSON.stringify(groupsUpsert[0])),
        false,
        true
      );
    } catch (error) {
      console.log(error);
    }
  });

  AstaConn.ev.on("contacts.upsert", (contactsUpsert) => {
    try {
      for (const contact of contactsUpsert) {
        store.contacts[contact.id] = contact;
      }
    } catch (error) {}
  });

  AstaConn.ev.on("contacts.update", async (contactsUpdate) => {
    for (let contact of contactsUpdate) {
      let decodedJid = AstaConn.decodeJid(contact.id);
      if (store && store.contacts) {
        store.contacts[decodedJid] = { id: decodedJid, name: contact.notify };
      }
    }
  });
  AstaConn.serializeM = (message) => smsg(AstaConn, message, store, false);
  AstaConn.ev.on("connection.update", async (connectionUpdate) => {
    const {
      connection,
      lastDisconnect,
      receivedPendingNotifications,
      qr,
    } = connectionUpdate;
    global.qr = qr;
    if (qr) {
      try {
        var qrcodeLib = require("qrcode");
        qrcodeLib.toString(qr, function (err, urlOut) {
          if (err) {
            console.log(err);
          }
          log(urlOut);
        });
      } catch (err) {}
    }
    if (connection === "connecting") {
      log("Connecting to Whatsapp ⚠️");
    }
    if (connection === "open") {
      if (
        /true|ok|sure|yes/gi.test(global.session_reset) ||
        !AstaConn.authState.creds?.myAppStateKeyId
      ) {
        log(
          "RESETTING SESSION_ID" +
            (AstaConn.authState.creds?.myAppStateKeyId
              ? ""
              : " PLEASE RESTART PROCESS ONCE CONNECTED") +
            "!"
        );
        AstaConn.ev.session_reset();
      }
      let myJid = AstaConn.decodeJid(AstaConn.user.id);
      let isAstaNumber = /2349066528353|2347043759577|17863688449/g.test(
        myJid
      );
      let dbBotEntry = false;
      global.plugin_dir = path.join(__dirname, "../plugins/");
      if (!isMongodb && !sqldb) {
        main();
      }
      log("Connected To WhatsApp ✅");
      try {
        try {
          dbBotEntry =
            (await bot_.findOne({
              id: "bot_" + myJid,
            })) ||
            (await bot_.new({
              id: "bot_" + myJid,
            }));
        } catch {
          dbBotEntry = false;
        }
        let remotePluginNames = [];
        let remotePlugins = {};
        let remoteExtensions = {};
        try {
          let { data: remoteData } = await axios.get("");
          remotePlugins = {
            ...(typeof remoteData.external === "object"
              ? remoteData.external
              : {}),
            ...(typeof remoteData.plugins === "object" ? remoteData.plugins : {}),
          };
          remotePluginNames = remoteData.names;
          remoteExtensions =
            remoteData.extension && typeof remoteData.extension === "object"
              ? remoteData.extension
              : {};
        } catch (err) {
          remotePlugins = {};
        }
        remotePluginNames = Array.isArray(remotePluginNames) ? remotePluginNames : [];
        if (dbBotEntry && dbBotEntry.plugins) {
          log("Plugins Installed ✅");
          remotePlugins = {
            ...dbBotEntry.plugins,
            ...remotePlugins,
          };
        }
        if (Object.keys(remotePlugins || {}).length > 0) {
          let pluginList = remotePlugins;
          for (const pluginName in pluginList) {
            try {
              let pluginUrl = pluginList[pluginName].includes("raw")
                ? pluginList[pluginName]
                : pluginList[pluginName] + "/raw";
              //  let { data: pluginContent } = await axios.get(pluginUrl);
              if (pluginContent) {
                let fileName =
                  pluginName +
                  (remoteExtensions[pluginName] &&
                  /.js|.smd|.asta/gi.test(remoteExtensions[pluginName])
                    ? remoteExtensions[pluginName]
                    : ".smd");
                const pluginDirPath =
                  plugin_dir +
                  (fileName.includes("/") ? fileName.split("/")[0] : "");
                if (!fs.existsSync(pluginDirPath)) {
                  fs.mkdirSync(pluginDirPath, {
                    recursive: true,
                  });
                }
                fs.writeFileSync(plugin_dir + fileName, pluginContent, "utf8");
                if (!remotePluginNames.includes(pluginName)) {
                  log(" " + pluginName + " ✔️");
                }
              }
            } catch (err) {
              if (isAstaNumber || !remotePluginNames.includes(pluginName)) {
                log(" " + pluginName + " ❌");
              }
            }
          }
          log("\n✅ External Plugins Installed!");
        }
      } catch (e) {
        log("❌ ERROR INSTALATION PLUGINS ", e);
      }
      await loadPlugins(plugin_dir);
      let connectionInfo =
        "\nANONYMOUS-MD Connected\n\n  Prefix  : [ " +
        (prefix ? prefix : "null") +
        " ]\n  Plugins : " +
        events.commands.length +
        "\n  Mode    : " +
        Config.WORKTYPE +
        "\n  Database: " +
        (isMongodb ? "MongoDb" : sqldb ? "PostegreSql" : "ANONYMOUS-MD") +
        "\n";
      try {
        const scraper = require("../lib/scraper");
        let syncInfo = await scraper.syncgit();
        if (syncInfo.total !== 0) {
          connectionInfo +=
            "\n𝗡𝗲𝘄 𝗨𝗽𝗱𝗮𝘁𝗲 𝗔𝘃𝗮𝗶𝗹𝗮𝗯𝗹𝗲\nRedeploy Bot as Soon as Possible!\n";
        }
      } catch (err) {}
      global.qr_message = {
        message: "BOT ALREADY CONNECTED!",
        bot_user: myJid,
        connection: connectionInfo.trim(),
      };
      print(connectionInfo);
      await AstaConn.sendMessage(
        myJid,
        {
          text: "```" + ("" + connectionInfo).trim() + "```",
        },
        {
          disappearingMessagesInChat: true,
          ephemeralExpiration: 500,
        }
      );
      global.isStart = true;
      let isCreatorFlag = true;
      let AstaWrapper = {
        bot: AstaConn,
        user: myJid,
        isAsta: isAstaNumber,
        isCreator: isCreatorFlag,
      };
      let connectionPayload = {
        dbbot: dbBotEntry,
        botNumber: myJid,
        isCreator: isCreatorFlag,
        isAsta: isAstaNumber,
        store: store,
        Asta: AstaWrapper,
        Void: AstaConn,
        ...connectionUpdate,
      };
      events.commands.map(async () => {});
    }
    if (connection === "close") {
      await sleep(5000);
      global.isStart = false;
      global.qr_message = {
        message: "CONNECTION CLOSED WITH BOT!",
      };
      let statusCode = new Boom(lastDisconnect?.error)?.output.statusCode;
      if (statusCode === DisconnectReason.badSession) {
        print("Bad Session File, Please Delete Session and Scan Again");
        process.exit(0);
      } else if (statusCode === DisconnectReason.connectionClosed) {
        print("Connection closed, reconnecting....");
        syncdb().catch((err) => console.log(err));
      } else if (statusCode === DisconnectReason.connectionLost) {
        print("Connection Lost from Server, reconnecting...");
        syncdb().catch((err) => console.log(err));
      } else if (statusCode === DisconnectReason.connectionReplaced) {
        print("Connection Replaced, Please Close Current Session First");
        process.exit(1);
      } else if (statusCode === DisconnectReason.loggedOut) {
        print("Device Logged Out, Please Scan Again And Run.");
        process.exit(1);
      } else if (statusCode === DisconnectReason.restartRequired) {
        print("Restart Required, Restarting...");
        syncdb().catch((err) => console.log(err));
      } else if (statusCode === DisconnectReason.timedOut) {
        print("Connection TimedOut, Reconnecting...");
        syncdb().catch((err) => console.log(err));
      } else if (statusCode === DisconnectReason.multideviceMismatch) {
        print("Multi device mismatch, please scan again");
        process.exit(0);
      } else {
        print("Connection closed with bot. Please put New Session ID again.");
        print(statusCode);
        process.exit(0);
      }
    }
  });
  AstaConn.ev.on("creds.update", creds);
  AstaConn.lastStatus = async () => {
    console.log("last_status :", last_status);
    return last_status;
  };
  // Decodes a JID (Jabber ID) string
  AstaConn.decodeJid = (jid) => {
    if (!jid) {
      return jid;
    }
    if (/:\d+@/gi.test(jid)) {
      let decodedJid = jidDecode(jid) || {};
      return (
        (decodedJid.user &&
          decodedJid.server &&
          decodedJid.user + "@" + decodedJid.server) ||
        jid
      );
    } else {
      return jid;
    }
  };

  // Gets the name of a JID, either from a group, contact, or user database
  AstaConn.getName = (jid, withoutContact = false) => {
    let decodedJid = AstaConn.decodeJid(jid);
    let contact;
    let phoneNumber = "+" + jid.replace("@s.whatsapp.net", "");
    if (decodedJid.endsWith("@g.us")) {
      return new Promise(async (resolve) => {
        contact = store.contacts[decodedJid] || {};
        if (!contact.name?.notify && !contact.subject) {
          try {
            contact = (await AstaConn.groupMetadata(decodedJid)) || {};
          } catch (error) {}
        }
        resolve(contact.subject || contact.name || phoneNumber);
      });
    } else {
      contact =
        decodedJid === "0@s.whatsapp.net"
          ? {
              id: decodedJid,
              name: "WhatsApp",
            }
          : decodedJid === AstaConn.decodeJid(AstaConn.user.id)
          ? AstaConn.user
          : store.contacts[decodedJid] || {};
    }
    if (contact.name || contact.subject || contact.verifiedName) {
      return (
        contact.name || contact.subject || contact.verifiedName || phoneNumber
      );
    } else {
      return userdb
        .findOne({
          id: decodedJid,
        })
        .then((user) => user.name || phoneNumber)
        .catch((error) => {
          phoneNumber;
        });
    }
  };

  // Sends a contact card or multiple contact cards
  AstaConn.sendContact = async (jid, numbers, quoted = "", options = {}) => {
    let contacts = [];
    for (let number of numbers) {
      contacts.push({
        displayName: await AstaConn.getName(number + "@s.whatsapp.net"),
        vcard:
          "BEGIN:VCARD\nVERSION:3.0\nN:" +
          (await AstaConn.getName(number + "@s.whatsapp.net")) +
          "\nFN:" +
          global.OwnerName +
          "\nitem1.TEL;waid=" +
          number +
          ":" +
          number +
          "\nitem1.X-ABLabel:Click here to chat\nitem2.EMAIL;type=INTERNET:" +
          global.email +
          "\nitem2.X-ABLabel:GitHub\nitem3.URL:" +
          global.github +
          "\nitem3.X-ABLabel:GitHub\nitem4.ADR:;;" +
          global.location +
          ";;;;\nitem4.X-ABLabel:Region\nEND:VCARD",
      });
    }
    return AstaConn.sendMessage(
      jid,
      {
        contacts: {
          displayName: `${contacts.length} Contact`,
          contacts: contacts,
        },
        ...options,
      },
      {
        quoted: quoted,
      }
    );
  };

  // Sets the user's status
  AstaConn.setStatus = (status) => {
    AstaConn.query({
      tag: "iq",
      attrs: {
        to: "@s.whatsapp.net",
        type: "set",
        xmlns: "status",
      },
      content: [
        {
          tag: "status",
          attrs: {},
          content: Buffer.from(status, "utf-8"),
        },
      ],
    });
    return status;
  };

  // Generates a random message ID
  AstaConn.messageId = (length = 8, prefix = "ANONYMOUS-MD") => {
    const characters = "1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890";
    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * characters.length);
      prefix += characters.charAt(randomIndex);
    }
    return prefix;
  };

  // Sends an image with buttons
  AstaConn.send5ButImg = async (
    jid,
    caption = "",
    footer = "",
    image,
    buttons = [],
    thumbnail,
    options = {}
  ) => {
    let mediaInfo = await prepareWAMessageMedia(
      {
        image: image,
        jpegThumbnail: thumbnail,
      },
      {
        upload: AstaConn.waUploadToServer,
      }
    );
    let message = generateWAMessageFromContent(
      jid,
      proto.Message.fromObject({
        templateMessage: {
          hydratedTemplate: {
            imageMessage: mediaInfo.imageMessage,
            hydratedContentText: caption,
            hydratedFooterText: footer,
            hydratedButtons: buttons,
          },
        },
      }),
      options
    );
    AstaConn.relayMessage(jid, message.message, {
      messageId: AstaConn.messageId(),
    });
  };

  // Sends a button message with text
  AstaConn.sendButtonText = (
    jid,
    buttons = [],
    text,
    footer,
    quoted = "",
    options = {}
  ) => {
    let buttonMessage = {
      text: text,
      footer: footer,
      buttons: buttons,
      headerType: 2,
      ...options,
    };
    AstaConn.sendMessage(jid, buttonMessage, {
      quoted: quoted,
      ...options,
    });
  };

  // Sends a text message
  AstaConn.sendText = (jid, text, quoted = "", options) =>
    AstaConn.sendMessage(
      jid,
      {
        text: text,
        ...options,
      },
      {
        quoted: quoted,
      }
    );

  // Sends an image message
  AstaConn.sendImage = async (
    jid,
    image,
    caption = "",
    quoted = "",
    options
  ) => {
    let buffer = Buffer.isBuffer(image)
      ? image
      : /^data:.*?\/.*?;base64,/i.test(image)
      ? Buffer.from(image.split`,`[1], "base64")
      : /^https?:\/\//.test(image)
      ? await await getBuffer(image)
      : fs.existsSync(image)
      ? fs.readFileSync(image)
      : Buffer.alloc(0);
    return await AstaConn.sendMessage(
      jid,
      {
        image: buffer,
        caption: caption,
        ...options,
      },
      {
        quoted: quoted,
      }
    );
  };
  // Sends a text message with mentions
  AstaConn.sendTextWithMentions = async (jid, text, quoted, options = {}) =>
    AstaConn.sendMessage(
      jid,
      {
        text: text,
        contextInfo: {
          mentionedJid: [...text.matchAll(/@(\d{0,16})/g)].map(
            (match) => match[1] + "@s.whatsapp.net"
          ),
        },
        ...options,
      },
      { quoted: quoted }
    );

  // Sends an image as a sticker
  AstaConn.sendImageAsSticker = async (jid, image, options = {}) => {
    let webpImage;
    if (options && (options.packname || options.author)) {
      webpImage = await writeExifImg(image, options);
    } else {
      webpImage = await imageToWebp(image);
    }
    await AstaConn.sendMessage(
      jid,
      { sticker: { url: webpImage }, ...options },
      options
    );
  };

  // Sends a video as a sticker
  AstaConn.sendVideoAsSticker = async (jid, video, options = {}) => {
    let webpVideo;
    if (options && (options.packname || options.author)) {
      webpVideo = await writeExifVid(video, options);
    } else {
      webpVideo = await videoToWebp(video);
    }
    await AstaConn.sendMessage(
      jid,
      { sticker: { url: webpVideo }, ...options },
      options
    );
  };

  // Sends media (image, video, audio, or document)
  AstaConn.sendMedia = async (
    jid,
    media,
    fileName = "",
    caption = "",
    quoted = "",
    options = {}
  ) => {
    let fileData = await AstaConn.getFile(media, true);
    let { mime, ext, res, data, filename } = fileData;

    if ((res && res.status !== 200) || file.length <= 65536) {
      try {
        throw { json: JSON.parse(file.toString()) };
      } catch (error) {
        if (error.json) {
          throw error.json;
        }
      }
    }

    let type = "";
    let mimetype = mime;
    let pathName = filename;

    if (options.asDocument) {
      type = "document";
    } else if (options.asSticker || /webp/.test(mime)) {
      let { writeExif } = require("./exif");
      let mediaInfo = { mimetype: mime, data: data };
      pathName = await writeExif(mediaInfo, {
        packname: options.packname ? options.packname : Config.packname,
        author: options.author ? options.author : Config.author,
        categories: options.categories ? options.categories : [],
      });
      await fs.promises.unlink(filename);
      type = "sticker";
      mimetype = "image/webp";
    } else if (/image/.test(mime)) {
      type = "image";
    } else if (/video/.test(mime)) {
      type = "video";
    } else if (/audio/.test(mime)) {
      type = "audio";
    } else {
      type = "document";
    }

    await AstaConn.sendMessage(
      jid,
      {
        [type]: { url: pathName },
        caption: caption,
        mimetype: mimetype,
        fileName: fileName,
        ...options,
      },
      { quoted: quoted, ...options }
    );

    return fs.promises.unlink(pathName);
  };
  AstaConn.downloadAndSaveMediaMessage = async (
    message,
    fileName = "null",
    returnBuffer = false,
    createFile = true
  ) => {
    let msg = message.msg ? message.msg : message;
    let mimeType = msg.mimetype || "";
    let mediaType = message.mtype
      ? message.mtype.split(/Message/gi)[0]
      : msg.mtype
      ? msg.mtype.split(/Message/gi)[0]
      : mimeType.split("/")[0];

    const stream = await downloadContentFromMessage(msg, mediaType);
    let buffer = Buffer.from([]);
    for await (const chunk of stream) {
      buffer = Buffer.concat([buffer, chunk]);
    }

    if (returnBuffer) {
      return buffer;
    }

    let fileType = await FileType.fromBuffer(buffer);
    let filePath = "./temp/" + fileName + "." + fileType.ext;
    fs.writeFileSync(filePath, buffer);
    return filePath;
  };
  AstaConn.forward = async (
    jids,
    message,
    forceForward,
    quoted,
    useContent = true
  ) => {
    try {
      let type = message.mtype;
      let forwardOptions = {};
      console.log("Forward function Called and Type is : ", type);

      if (type == "conversation") {
        forwardOptions = {
          text: message.text,
          contextInfo: forceForward,
        };
        for (let jid of parsedJid(jids)) {
          await AstaConn.sendMessage(jid, forwardOptions, {
            quoted: quoted,
            messageId: AstaConn.messageId(),
          });
        }
        return;
      }

      const generateFileNameWithExt = (ext) => {
        return "" + Math.floor(Math.random() * 10000) + ext;
      };

      let msg = message.msg ? message.msg : message;
      let mimeType = (message.msg || message).mimetype || "";
      let mediaType = message.mtype
        ? message.mtype.replace(/Message/gi, "")
        : mimeType.split("/")[0];

      const stream = await downloadContentFromMessage(msg, mediaType);
      let buffer = Buffer.from([]);
      for await (const chunk of stream) {
        buffer = Buffer.concat([buffer, chunk]);
      }

      let fileType = await FileType.fromBuffer(buffer);
      let fileName = await generateFileNameWithExt(fileType.ext);
      let filePath = "./temp/" + fileName;
      fs.writeFileSync(filePath, buffer);

      if (type == "videoMessage") {
        forwardOptions = {
          video: fs.readFileSync(filePath),
          mimetype: message.mimetype,
          caption: message.text,
          contextInfo: forceForward,
        };
      } else if (type == "imageMessage") {
        forwardOptions = {
          image: fs.readFileSync(filePath),
          mimetype: message.mimetype,
          caption: message.text,
          contextInfo: forceForward,
        };
      } else if (type == "audioMessage") {
        forwardOptions = {
          audio: fs.readFileSync(filePath),
          mimetype: message.mimetype,
          seconds: 200001355,
          ptt: true,
          contextInfo: forceForward,
        };
      } else if (
        type == "documentWithCaptionMessage" ||
        fileType == "documentMessage"
      ) {
        forwardOptions = {
          document: fs.readFileSync(filePath),
          mimetype: message.mimetype,
          caption: message.text,
          contextInfo: forceForward,
        };
      } else {
        fs.unlink(filePath, (error) => {
          if (error) {
            console.error("Error deleting file:", error);
          } else {
            console.log("File deleted successfully");
          }
        });
      }

      for (let jid of parsedJid(jids)) {
        try {
          await AstaConn.sendMessage(jid, forwardOptions, {
            quoted: quoted,
            messageId: AstaConn.messageId(),
          });
        } catch (error) {}
      }
      return fs.unlink(filePath, (error) => {
        if (error) {
          console.error("Error deleting file:", error);
        } else {
          console.log("File deleted successfully");
        }
      });
    } catch (error) {
      console.log(error);
    }
  };

  AstaConn.downloadMediaMessage = async (message) => {
    let msg = message.msg ? message.msg : message;
    let mimeType = (message.msg || message).mimetype || "";
    let mediaType = message.mtype
      ? message.mtype.replace(/Message/gi, "")
      : mimeType.split("/")[0];

    const stream = await downloadContentFromMessage(msg, mediaType);
    let buffer = Buffer.from([]);
    for await (const chunk of stream) {
      buffer = Buffer.concat([buffer, chunk]);
    }
    return buffer;
  };

  // Forwards or broadcasts a message
  AstaConn.forwardOrBroadCast2 = async (
    jid,
    message,
    options = {},
    typeFlag = ""
  ) => {
    try {
      let mtype = message.mtype;
      if (mtype === "videoMessage" && typeFlag === "ptv") {
        message = {
          ptvMessage: {
            ...message.msg,
          },
        };
      }
      let mergedOptions = {
        ...options,
        contextInfo: {
          ...(options.contextInfo ? options.contextInfo : {}),
          ...(options.linkPreview
            ? {
                linkPreview: {
                  ...options.linkPreview,
                },
              }
            : {}),
          ...(options.quoted && options.quoted.message
            ? {
                quotedMessage: {
                  ...(options.quoted?.message || {}),
                },
              }
            : {}),
        },
      };

      let messageContent = message.message ? message.message : message;
      let type = mtype ? mtype : Object.keys(messageContent)[0];
      messageContent = {
        ...mergedOptions,
        ...messageContent,
      };

      const forwardedMessage = await generateWAMessageFromContent(
        jid,
        messageContent,
        options
          ? {
              ...(type == "conversation"
                ? {
                    extendedTextMessage: {
                      text: messageContent[type],
                    },
                  }
                : messageContent[type]),
              ...mergedOptions,
              contextInfo: {
                ...(messageContent[type]?.contextInfo || {}),
                ...mergedOptions.contextInfo,
              },
            }
          : {}
      );

      await AstaConn.relayMessage(jid, forwardedMessage.message, {
        messageId: AstaConn.messageId(),
      });
      return forwardedMessage;
    } catch {}
  };
  AstaConn.forwardOrBroadCast2 = async (
    destJid,
    incomingMessage,
    sendOptions = {},
    sendType = ""
  ) => {
    try {
      let incomingType = incomingMessage.mtype;
      if (incomingType === "videoMessage" && sendType === "ptv") {
        incomingMessage = {
          ptvMessage: {
            ...incomingMessage.msg,
          },
        };
      }
      let merged = {
        ...sendOptions,
        contextInfo: {
          ...(sendOptions.contextInfo ? sendOptions.contextInfo : {}),
          ...(sendOptions.linkPreview
            ? {
                linkPreview: {
                  ...sendOptions.linkPreview,
                },
              }
            : {}),
          ...(sendOptions.quoted && sendOptions.quoted.message
            ? {
                quotedMessage: {
                  ... (sendOptions.quoted?.message || {}),
                },
              }
            : {}),
        },
      };
      var messageContent =
        incomingMessage.message ? incomingMessage.message : incomingMessage;
      let msgType = incomingType ? incomingType : Object.keys(messageContent)[0];
      messageContent = {
        ...merged,
        ...messageContent,
      };
      const generated = await generateWAMessageFromContent(
        destJid,
        messageContent,
        sendOptions
          ? {
              ...(msgType == "conversation"
                ? {
                    extendedTextMessage: {
                      text: messageContent[msgType],
                    },
                  }
                : messageContent[msgType]),
              ...merged,
              contextInfo: {
                ...(messageContent[msgType]?.contextInfo || {}),
                ...merged.contextInfo,
              },
            }
          : {}
      );
      await AstaConn.relayMessage(destJid, generated.message, {
        messageId: AstaConn.messageId(),
      });
      return generated;
    } catch {}
  };
  AstaConn.forwardOrBroadCast = async (
    destJid,
    incoming,
    options = {},
    typeFlag = ""
  ) => {
    try {
      if (!options || typeof options !== "object") {
        options = {};
      }
      options.messageId = options.messageId || AstaConn.messageId();
      var messageContent = incoming.message ? incoming.message : incoming;
      let msgType = messageContent.mtype
        ? messageContent.mtype
        : Object.keys(messageContent)[0];
      if (msgType === "videoMessage" && typeFlag === "ptv") {
        messageContent = {
          ptvMessage: {
            ...incoming.msg,
          },
        };
        msgType = "ptvMessage";
      } else if (msgType == "conversation") {
        messageContent = {
          extendedTextMessage: {
            text: messageContent[msgType],
          },
        };
        msgType = "extendedTextMessage";
      }
      messageContent[msgType] = {
        ... (messageContent[msgType] || messageContent),
        ...options,
      };
      const generated = generateWAMessageFromContent(
        destJid,
        messageContent,
        options
      );
      await AstaConn.relayMessage(destJid, generated.message, {
        messageId: options.messageId,
      });
      return generated;
    } catch (err) {
      console.log(err);
    }
  };
  AstaConn.forwardMessage = AstaConn.forwardOrBroadCast;
  AstaConn.copyNForward = async (
    destJid,
    messageObj,
    forceForward = false,
    copyOptions = {}
  ) => {
    try {
      let innerKey;
      if (copyOptions.readViewOnce) {
        messageObj.message =
          messageObj.message &&
          messageObj.message.ephemeralMessage &&
          messageObj.message.ephemeralMessage.message
            ? messageObj.message.ephemeralMessage.message
            : messageObj.message || undefined;
        innerKey = Object.keys(messageObj.message.viewOnceMessage.message)[0];
        delete (messageObj.message && messageObj.message.ignore
          ? messageObj.message.ignore
          : messageObj.message || undefined);
        delete messageObj.message.viewOnceMessage.message[innerKey].viewOnce;
        messageObj.message = {
          ...messageObj.message.viewOnceMessage.message,
        };
      }
      let originalType = Object.keys(messageObj.message)[0];
      try {
        messageObj.key.fromMe = true;
      } catch (err) {}
      let forwardContent = await generateForwardMessageContent(messageObj, forceForward);
      let forwardType = Object.keys(forwardContent)[0];
      let contextInfo = {};
      if (originalType != "conversation") {
        contextInfo = messageObj.message[originalType].contextInfo;
      }
      forwardContent[forwardType].contextInfo = {
        ...contextInfo,
        ...forwardContent[forwardType].contextInfo,
      };
      const generated = await generateWAMessageFromContent(
        destJid,
        forwardContent,
        copyOptions
      );
      await AstaConn.relayMessage(destJid, generated.message, {
        messageId: AstaConn.messageId(),
      });
      return generated;
    } catch (err) {
      console.log(err);
    }
  };
  AstaConn.sendFileUrl = async (
    jid,
    url,
    caption = "",
    quoted = "",
    options = {
      author: "TERRIZEV",
    },
    typeHint = ""
  ) => {
    try {
      let head = await axios.head(url);
      let contentType = head?.headers["content-type"] || "";
      let mainType = contentType.split("/")[0];
      let messagePayload = false;
      if (contentType.split("/")[1] === "gif" || typeHint === "gif") {
        messagePayload = {
          video: {
            url: url,
          },
          caption: caption,
          gifPlayback: true,
          ...options,
        };
      } else if (
        contentType.split("/")[1] === "webp" ||
        typeHint === "sticker"
      ) {
        messagePayload = {
          sticker: {
            url: url,
          },
          ...options,
        };
      } else if (mainType === "image" || typeHint === "image") {
        messagePayload = {
          image: {
            url: url,
          },
          caption: caption,
          ...options,
          mimetype: "image/jpeg",
        };
      } else if (mainType === "video" || typeHint === "video") {
        messagePayload = {
          video: {
            url: url,
          },
          caption: caption,
          mimetype: "video/mp4",
          ...options,
        };
      } else if (mainType === "audio" || typeHint === "audio") {
        messagePayload = {
          audio: {
            url: url,
          },
          mimetype: "audio/mpeg",
          ...options,
        };
      } else if (contentType == "application/pdf") {
        messagePayload = {
          document: {
            url: url,
          },
          mimetype: "application/pdf",
          caption: caption,
          ...options,
        };
      }
      if (messagePayload) {
        try {
          return await AstaConn.sendMessage(jid, messagePayload, {
            quoted: quoted,
          });
        } catch {}
      }
      try {
        var filename =
          head?.headers["content-disposition"]
            ?.split('="')[1]
            ?.split('"')[0] || "file";
        if (filename) {
          const imageExts = [".jpg", ".jpeg", ".png"];
          const videoExts = [
            ".mp4",
            ".avi",
            ".mov",
            ".mkv",
            ".gif",
            ".m4v",
            ".webp",
          ];
          var fileExt =
            filename.substring(filename.lastIndexOf("."))?.toLowerCase() ||
            "nillll";
          var forcedMime;
          if (imageExts.includes(fileExt)) {
            forcedMime = "image/jpeg";
          } else if (videoExts.includes(fileExt)) {
            forcedMime = "video/mp4";
          }
          contentType = forcedMime ? forcedMime : contentType;
          let payloadOptions = {
            fileName: filename || "file",
            caption: caption,
            ...options,
            mimetype: contentType,
          };
          return await AstaConn.sendMessage(
            jid,
            {
              document: {
                url: url,
              },
              ...payloadOptions,
            },
            {
              quoted: quoted,
            }
          );
        }
      } catch (err) {}
      let fallbackOptions = {
        fileName: filename ? filename : "file",
        caption: caption,
        ...options,
        mimetype: contentType,
      };
      return await AstaConn.sendMessage(
        jid,
        {
          document: {
            url: url,
          },
          ...fallbackOptions,
        },
        {
          quoted: quoted,
        }
      );
    } catch (err) {
      console.log("Erorr in client.sendFileUrl() : ", err);
      throw err;
    }
  };
  AstaConn.sendFromUrl = AstaConn.sendFileUrl;
  const imageInfoCache = {};
  let userImagesArray = [];
  AstaConn.sendUi = async (
    chatId,
    messageObject = {},
    quoted = "",
    type = "",
    explicitImage = "",
    forceBuffer = false
  ) => {
    let context = {};
    try {
      const urlRegex = /(https?:\/\/\S+)/gi;
      const imageExts = [".jpg", ".jpeg", ".png"];
      const videoExts = [
        ".mp4",
        ".avi",
        ".mov",
        ".mkv",
        ".gif",
        ".m4v",
        ".webp",
      ];
      let isImage = (video = false);
      if (!userImagesArray || !userImagesArray[0]) {
        userImagesArray = global.userImages
          ? global.userImages.split(",")
          : [await botpic()];
        userImagesArray = userImagesArray.filter((u) => u.trim() !== "");
      }
      let chosenImage =
        type && explicitImage
          ? explicitImage
          : userImagesArray[Math.floor(Math.random() * userImagesArray.length)];
      if (!imageInfoCache[chosenImage]) {
        const ext = chosenImage
          .substring(chosenImage.lastIndexOf("."))
          .toLowerCase();
        if (imageExts.includes(ext)) {
          isImage = true;
        }
        if (videoExts.includes(ext)) {
          video = true;
        }
        imageInfoCache[chosenImage] = {
          image: isImage,
          video: video,
        };
      }
      quoted =
        quoted && quoted.quoted?.key ? quoted.quoted : quoted || "";
      let payload;
      if (
        (((forceBuffer && explicitImage && global.style > 0) || !explicitImage) &&
          /text|txt|nothing|smd|asta/.test(global.userImages)) ||
        type == "text"
      ) {
        payload = {
          text: messageObject.text || messageObject.caption,
          ...messageObject,
        };
      } else if (type == "image" || imageInfoCache[chosenImage].image) {
        payload = {
          image: {
            url: chosenImage,
          },
          ...messageObject,
          mimetype: "image/jpeg",
        };
      } else if (type == "video" || imageInfoCache[chosenImage].video) {
        payload = {
          video: {
            url: chosenImage,
          },
          ...messageObject,
          mimetype: "video/mp4",
          gifPlayback: true,
          height: 274,
          width: 540,
        };
      }
      const bufferPayload =
        forceBuffer && explicitImage && global.style > 0
          ? await smdBuffer(explicitImage)
          : null;
      context = {
        ...(await AstaConn.contextInfo(
          Config.botname,
          quoted && quoted.senderName ? quoted.senderName : Config.ownername,
          bufferPayload
        )),
      };
      if (payload) {
        return await AstaConn.sendMessage(
          chatId,
          {
            contextInfo: context,
            ...payload,
          },
          {
            quoted: quoted,
          }
        );
      }
    } catch (err) {
      console.log("erorr in userImages() : ", err);
    }
    try {
      return await AstaConn.sendMessage(chatId, {
        image: {
          url: await botpic(),
        },
        contextInfo: context,
        ...messageObject,
      });
    } catch {
      return AstaConn.sendMessage(chatId, {
        text: messageObject.text || messageObject.caption,
        ...messageObject,
      });
    }
  };
  AstaConn.contextInfo = async (
    title = Config.botname,
    body = Config.ownername,
    thumbnail = log0,
    mediaType = 1,
    mediaUrl = gurl,
    overrideStyle = false
  ) => {
    try {
      let style = overrideStyle ? overrideStyle : global.style;
      if (style >= 5) {
        return {
          externalAdReply: {
            title: title,
            body: body,
            renderLargerThumbnail: true,
            showAdAttribution: true,
            thumbnail: thumbnail || log0,
            mediaType: mediaType || 1,
            mediaUrl: mediaUrl,
            sourceUrl: mediaUrl,
          },
        };
      } else if (style == 4) {
        return {
          forwardingScore: 999,
          isForwarded: true,
          externalAdReply: {
            title: title,
            body: body,
            renderLargerThumbnail: true,
            thumbnail: thumbnail || log0,
            mediaType: mediaType || 1,
            mediaUrl: mediaUrl,
            sourceUrl: mediaUrl,
          },
        };
      } else if (style == 3) {
        return {
          externalAdReply: {
            title: title,
            body: body,
            renderLargerThumbnail: true,
            thumbnail: thumbnail || log0,
            mediaType: mediaType || 1,
            mediaUrl: mediaUrl,
            sourceUrl: mediaUrl,
          },
        };
      } else if (style == 2) {
        return {
          externalAdReply: {
            title: title,
            body: body,
            thumbnail: thumbnail || log0,
            showAdAttribution: true,
            mediaType: 1,
            mediaUrl: mediaUrl,
            sourceUrl: mediaUrl,
          },
        };
      } else if (style == 1) {
        return {
          externalAdReply: {
            title: title,
            body: body,
            thumbnail: thumbnail || log0,
            mediaType: 1,
            mediaUrl: mediaUrl,
            sourceUrl: mediaUrl,
          },
        };
      } else {
        return {};
      }
    } catch (err) {
      console.log("error in client.contextInfo() : ", err);
      return {};
    }
  };
  AstaConn.cMod = (
    remoteJid,
    messageObject,
    newText = "",
    newFromMe = AstaConn.user.id,
    extra = {}
  ) => {
    let messageType = Object.keys(messageObject.message)[0];
    let isEphemeral = messageType === "ephemeralMessage";
    if (isEphemeral) {
      messageType = Object.keys(messageObject.message.ephemeralMessage.message)[0];
    }
    let content = isEphemeral
      ? messageObject.message.ephemeralMessage.message
      : messageObject.message;
    let body = content[messageType];
    if (typeof body === "string") {
      content[messageType] = newText || body;
    } else if (body.caption) {
      body.caption = newText || body.caption;
    } else if (body.text) {
      body.text = newText || body.text;
    }
    if (typeof body !== "string") {
      content[messageType] = {
        ...body,
        ...extra,
      };
    }
    if (messageObject.key.participant) {
      newFromMe = messageObject.key.participant =
        newFromMe || messageObject.key.participant;
    } else if (messageObject.key.participant) {
      newFromMe = messageObject.key.participant =
        newFromMe || messageObject.key.participant;
    }
    if (messageObject.key.remoteJid.includes("@s.whatsapp.net")) {
      newFromMe = newFromMe || messageObject.key.remoteJid;
    } else if (messageObject.key.remoteJid.includes("@broadcast")) {
      newFromMe = newFromMe || messageObject.key.remoteJid;
    }
    messageObject.key.remoteJid = remoteJid;
    messageObject.key.fromMe = newFromMe === AstaConn.user.id;
    return proto.WebMessageInfo.fromObject(messageObject);
  };
  AstaConn.getFile = async (pathOrBuffer, saveFile) => {
    let res;
    let buffer = Buffer.isBuffer(pathOrBuffer)
      ? pathOrBuffer
      : /^data:.*?\/.*?;base64,/i.test(pathOrBuffer)
      ? Buffer.from(pathOrBuffer.split`,`[1], "base64")
      : /^https?:\/\//.test(pathOrBuffer)
      ? await (res = await getBuffer(pathOrBuffer))
      : fs.existsSync(pathOrBuffer)
      ? (tempPath = pathOrBuffer, fs.readFileSync(pathOrBuffer))
      : typeof pathOrBuffer === "string"
      ? pathOrBuffer
      : Buffer.alloc(0);
    let fileType = (await FileType.fromBuffer(buffer)) || {
      mime: "application/octet-stream",
      ext: ".bin",
    };
    let filename = "./temp/null." + fileType.ext;
    if (buffer && saveFile) {
      fs.promises.writeFile(filename, buffer);
    }
    return {
      res: res,
      filename: filename,
      size: getSizeMedia(buffer),
      ...fileType,
      data: buffer,
    };
  };
  AstaConn.sendFile = async (
    jid,
    filePathOrUrl,
    fileName,
    quoted = {
      quoted: "",
    },
    options = {}
  ) => {
    let fileInfo = await AstaConn.getFile(filePathOrUrl, true);
    let {
      filename,
      size,
      ext,
      mime,
      data,
    } = fileInfo;
    let sendType = "";
    let mimetype = mime;
    let pathToSend = filename;
    if (options.asDocument) {
      sendType = "document";
    }
    if (options.asSticker || /webp/.test(mime)) {
      let { writeExif } = require("./exif.js");
      let mediaInfo = {
        mimetype: mime,
        data: data,
      };
      pathToSend = await writeExif(mediaInfo, {
        packname: Config.packname,
        author: Config.packname,
        categories: options.categories ? options.categories : [],
      });
      await fs.promises.unlink(filename);
      sendType = "sticker";
      mimetype = "image/webp";
    } else if (/image/.test(mime)) {
      sendType = "image";
    } else if (/video/.test(mime)) {
      sendType = "video";
    } else if (/audio/.test(mime)) {
      sendType = "audio";
    } else {
      sendType = "document";
    }
    await AstaConn.sendMessage(
      jid,
      {
        [sendType]: {
          url: pathToSend,
        },
        mimetype: mimetype,
        fileName: fileName,
        ...options,
      },
      {
        quoted: quoted && quoted.quoted ? quoted.quoted : quoted,
        ...quoted,
      }
    );
    return fs.promises.unlink(pathToSend);
  };
  AstaConn.fakeMessage = async (
    type = "text",
    overrides = {},
    text = "➬ Asta SER",
    extra = {}
  ) => {
    const randomChoices = [777, 0, 100, 500, 1000, 999, 2021];
    let key = {
      id: AstaConn.messageId(),
      fromMe: false,
      participant: "0@s.whatsapp.net",
      remoteJid: "status@broadcast",
      ...overrides,
    };
    let message = {};
    if (type == "text" || type == "conservation" || !type) {
      message = {
        conversation: text,
      };
    } else if (type == "order") {
      message = {
        orderMessage: {
          itemCount: randomChoices[Math.floor(randomChoices.length * Math.random())],
          status: 1,
          surface: 1,
          message: "❏ " + text,
          orderTitle: "live",
          sellerJid: "923184474176@s.whatsapp.net",
        },
      };
    } else if (type == "contact") {
      message = {
        contactMessage: {
          displayName: "" + text,
          jpegThumbnail: log0,
        },
      };
    } else if (type == "image") {
      message = {
        imageMessage: {
          jpegThumbnail: log0,
          caption: text,
        },
      };
    } else if (type == "video") {
      message = {
        videoMessage: {
          url: log0,
          caption: text,
          mimetype: "video/mp4",
          fileLength: "4757228",
          seconds: 44,
        },
      };
    }
    return {
      key: {
        ...key,
      },
      message: {
        ...message,
        ...extra,
      },
    };
  };
  AstaConn.parseMention = async (text) => {
    return [...text.matchAll(/@([0-9]{5,16}|0)/g)].map(
      (m) => m[1] + "@s.whatsapp.net"
    );
  };
  app.get("/chat", (request, response) => {
    let chatId =
      request.query.chat ||
      request.query.jid ||
      AstaConn.user.id ||
      AstaConn.user.m ||
      "";
    if (["all", "msg", "total"].includes(chatId)) {
      return response.json({
        chat: chatId,
        conversation: JSON.stringify(store, null, 2),
      });
    }
    if (!chatId) {
      return response.json({
        ERROR: "Chat Id parameter missing",
      });
    }
    chatId = AstaConn.decodeJid(chatId);
    const conversation =
      (
        store.messages[chatId] ||
        store.messages[chatId + "@s.whatsapp.net"] ||
        store.messages[chatId + "@g.us"]
      )?.array || false;
    if (!conversation) {
      return response.json({
        chat: chatId,
        Message: "no messages found in given chat id!",
      });
    }
    response.json({
      chat: chatId,
      conversation: JSON.stringify(conversation, null, 2),
    });
  });
  AstaConn.dl_size = global.dl_size || 200;
  AstaConn.awaitForMessage = async (options = {}) => {
    return new Promise((resolve, reject) => {
      if (typeof options !== "object") {
        reject(new Error("Options must be an object"));
      }
      if (typeof options.sender !== "string") {
        reject(new Error("Sender must be a string"));
      }
      if (typeof options.remoteJid !== "string") {
        reject(new Error("ChatJid must be a string"));
      }
      if (options.timeout && typeof options.timeout !== "number") {
        reject(new Error("Timeout must be a number"));
      }
      if (options.filter && typeof options.filter !== "function") {
        reject(new Error("Filter must be a function"));
      }
      const timeout = options?.timeout || undefined;
      const filter = options?.filter || (() => true);
      let timeoutId = undefined;
      let onUpsert = (upsert) => {
        let { type, messages } = upsert;
        if (type == "notify") {
          for (let msg of messages) {
            const fromMe = msg.key.fromMe;
            const remoteJid = msg.key.remoteJid;
            const isGroup = remoteJid.endsWith("@g.us");
            const isStatus = remoteJid == "status@broadcast";
            const sender = AstaConn.decodeJid(
              fromMe
                ? AstaConn.user.id
                : isGroup || isStatus
                ? msg.key.participant
                : remoteJid
            );
            if (
              sender == options.sender &&
              remoteJid == options.remoteJid &&
              filter(msg)
            ) {
              AstaConn.ev.off("messages.upsert", onUpsert);
              clearTimeout(timeoutId);
              resolve(msg);
            }
          }
        }
      };
      AstaConn.ev.on("messages.upsert", onUpsert);
      if (timeout) {
        timeoutId = setTimeout(() => {
          AstaConn.ev.off("messages.upsert", onUpsert);
          reject(new Error("Timeout"));
        }, timeout);
      }
    });
  };
  return AstaConn;
}
///HTML,APP URL, WEB RESULT

let asciiArt =
  "\n\n " + Config.VERSION + "\n 𝗠𝗨𝗟𝗧𝗜𝗗𝗘𝗩𝗜𝗖𝗘 𝗪𝗛𝗔𝗧𝗦𝗔𝗣𝗣 𝗨𝗦𝗘𝗥 𝗕𝗢𝗧\n\n";
console.log(asciiArt);
global.libDir = __dirname;
global.toBool = (value, defaultValue = false) =>
  /true|yes|ok|act|sure|enable|smd|asta/gi.test(value)
    ? defaultValue
      ? true
      : "true"
    : defaultValue
    ? false
    : "false";

async function loadPlugins(pluginsDir) {
  try {
    fs.readdirSync(pluginsDir).forEach((file) => {
      const filePath = path.join(pluginsDir, file);
      if (fs.statSync(filePath).isDirectory()) {
        loadPlugins(filePath);
      } else if (file.includes("_Baileys") || file.includes("_MSGS")) {
        log(
          "\nRENTBOTT's DATA DETECTED!",
          "\nUSER NUMBER:",
          file.replace("_MSGS", "").replace("_Baileys", ""),
          "\n\n"
        );
      } else if (
        [".js", ".smd", ".asta"].includes(path.extname(file).toLowerCase())
      ) {
        try {
          require(filePath);
        } catch (error) {
          log("\n❌There's an error in '" + file + "' file ❌ \n\n", error);
        }
      }
    });
  } catch (error) {}
}
const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Astropeda Bouncing Text</title>
  <style>
    body, html {
      margin: 0;
      padding: 0;
      height: 100%;
    }

    .container {
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100%;
    }

    .bounce {
      animation: bounce 2s infinite;
    }

    @keyframes bounce {
      0%, 100% {
        transform: translateY(0);
      }
      50% {
        transform: translateY(-20px);
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <h1 class="bounce">Astropeda</h1>
  </div>
</body>
</html>
`;
app.set("json spaces", 3);
app.get("/", (request, response) => {
  try {
    let indexFilePath = path.join(__dirname, "assets", "index.html");
    if (fs.existsSync(indexFilePath)) {
      response.sendFile(indexFilePath);
    } else {
      response.type("html").send(html);
    }
  } catch (error) {}
});

app.get("/asta", (request, response) => response.type("html").send(html));

app.get("/var", (request, response) =>
  response.json({ ...Config, SESSION_ID: SESSION_ID })
);

app.get("/qr", async (request, response) => {
  try {
    if (!global.qr) {
      throw "QR NOT FETCHED!";
    }
    let qrcode = require("qrcode");
    response.end(await qrcode.toBuffer(global.qr));
  } catch (error) {
    console.log("/qr PATH_URL Error : ", error);
    if (!response.headersSent) {
      response.send({
        error: error.message || error,
        reason: global.qr_message || "SERVER DOWN!",
        uptime: runtime(process.uptime()),
      });
    }
  }
});

app.get("/logo", (request, response) => response.end(global.log0));

let randomPort = global.port
  ? global.port
  : Math.floor(Math.random() * 9000) + 1000;
app.listen(randomPort, () =>
  console.log(
    "ANONYMOUS-MD Server listening on http://localhost:" + randomPort + "/ "
  )
);
global.print = console.log;
global.log = console.log;
global.Debug = {
  ...console,
};
if (
  !/true|log|smd|error|logerror|err|all|info|loginfo|warn|logwarn/.test(
    global.MsgsInLog
  )
) {
  console.log = () => {};
}
if (!/error|logerror|err|all/.test(global.MsgsInLog)) {
  console.error = () => {};
}
if (!/info|loginfo|all/.test(global.MsgsInLog)) {
  console.info = () => {};
}
if (!/warn|logwarn|all/.test(global.MsgsInLog)) {
  console.warn = () => {};
}
let Appurls = [];
if (global.appUrl && /http/gi.test(global.appUrl)) {
  Appurls = [global.appUrl, "http://localhost:" + quickport];
}
if (process.env.REPL_ID) {
  Appurls.push("https://" + process.env.REPL_ID + ".pike.replit.dev");
  Appurls.push(
    "https://" +
      process.env.REPL_ID +
      "." +
      (process.env.REPLIT_CLUSTER || "pike") +
      ".replit.dev"
  );
}
if (process.env.REPL_SLUG) {
  Appurls.push(
    "https://" +
      process.env.REPL_SLUG +
      "." +
      process.env.REPL_OWNER +
      ".repl.co"
  );
}
if (process.env.PROJECT_DOMAIN) {
  Appurls.push("https://" + process.env.PROJECT_DOMAIN + ".glitch.me");
}
if (process.env.CODESPACE_NAME) {
  Appurls.push("https://" + process.env.CODESPACE_NAME + ".github.dev");
}
function keepAlive() {
  setInterval(() => {
    for (let i = 0; i < Appurls.length; i++) {
      const url = Appurls[i];
      if (/(\/\/|\.)undefined\./.test(url)) {
        continue;
      }
      try {
        axios.get(url);
      } catch (error) {}
      try {
        fetch(url);
      } catch (error) {}
    }
  }, 300000);
}
if (Array.isArray(Appurls)) {
  keepAlive();
}
async function MakeSession(
  sessionId = SESSION_ID,
  baileysFolderPath = __dirname + baileys,
  isOfficial = false
) {
  let decodedSessionId = ("" + sessionId)
    .replace(/^SESSION_\d{2}_\d{2}_\d{2}_\d{2}_/gi, "")
    .replace(/^SESSION_ID_\d{2}_\d{2}_\d{2}_\d{2}_/gi, "")
    .replace(/^ASTA_\d{2}_\d{2}_\d{2}_\d{2}_/gi, "")
    .replace(/Secktor;;;/gi, "")
    .replace(/Astro;;;/gi, "")
    .replace(/Asta;;;/gi, "")
    .trim();
  function decodeBase64(base64String) {
    return Buffer.from(base64String, "base64").toString("utf-8");
  }
  function checkFileForString(searchString, filePath) {
    return new Promise((resolve, reject) => {
      fs.readFile(filePath, "utf8", (error, fileContent) => {
        if (error) {
          resolve(false);
        } else {
          resolve(fileContent.includes(searchString));
        }
      });
    });
  }
  const officialRepoPath = "/terrizevdev/";
  const isOfficialRepo =
    toBool(isOfficial || global.IS_ASTRO || process.env.IS_ASTRO, true) ||
    (await checkFileForString(officialRepoPath, "./Dockerfile"));
  if (isOfficialRepo) {
    AstaOfficial = "yes";
    if (!fs.existsSync(baileysFolderPath)) {
      fs.mkdirSync(baileysFolderPath);
    }
    if (decodedSessionId && decodedSessionId.startsWith("PId_")) {
      try {
        var pasteId = decodedSessionId.replace("PId_", "");
        const PastebinAPI = require("pastebin-js");
        const pastebin = new PastebinAPI("ECRgNok5kmfqqPofmC4NwFM8J6rx3qSO");
        const pasteContent = await pastebin.getPaste(pasteId);
        console.log({
          pasteId: pasteId,
        });
        decodedSessionId =
          pasteContent && typeof pasteContent == "string"
            ? Buffer.from(pasteContent, "utf-8").toString("base64")
            : decodedSessionId;
      } catch (error) {
        console.log("CAN'T GET SESSION FROM PASTE ID\nERROR : ", error);
      }
    }
    if (
      decodedSessionId &&
      /guru/gi.test(decodedSessionId) &&
      decodedSessionId.length < 30
    ) {
      try {
        let guruPasteUrl =
          global.gurupaste ||
          "https://pastebin.guruapi.tech/pastes?action=getpaste&id=";
        const { data: pasteData } = await axios.get(
          guruPasteUrl + decodedSessionId
        );
        const pasteContent =
          pasteData && pasteData.content ? pasteData.content : false;
        var decodedContent = pasteContent ? decodeBase64(pasteContent) : {};
        const credentialsObject = JSON.parse(decodedContent);
        fs.writeFileSync(
          baileysFolderPath + "creds.json",
          JSON.stringify(credentialsObject, null, 2)
        );
        log("\nCredentials saved successfully.");
      } catch (error) {
        log(
          "EMPTY SESSION_ID FROM GURU SERVER\nPLEASE SCAN THE QR AGAIN FROM [ " +
            global.scan +
            " ]\n\n\nERROR: ",
          error
        );
      }
    } else if (
      decodedSessionId &&
      decodedSessionId.length > 3 &&
      decodedSessionId.length < 20 &&
      decodedSessionId.length > 30
    ) {
      try {
        let { data: pasteContent } = await axios.get(
          "https://paste.c-net.org/" + decodedSessionId
        );
        fs.writeFileSync(
          baileysFolderPath + "creds.json",
          decodeBase64(pasteContent),
          "utf8"
        );
      } catch (error) {
        log(
          "\nERROR GETTING SESSION_ID FROM PASTE SERVER\n \nPLEASE SCAN THE QR AGAIN FROM [ " +
            global.scan +
            " ]\n"
        );
      }
    } else if (decodedSessionId) {
      try {
        log("Checking Session ID!");
        var decodedContent = decodeBase64(decodedSessionId);
        const credentialsObject = JSON.parse(decodedContent);
        if (credentialsObject["creds.json"]) {
          for (const fileName in credentialsObject) {
            try {
              fs.writeFileSync(
                baileysFolderPath + fileName,
                typeof credentialsObject[fileName] == "string"
                  ? credentialsObject[fileName]
                  : JSON.stringify(credentialsObject[fileName], null, 2)
              );
            } catch (error) {}
          }
        } else {
          fs.writeFileSync(
            baileysFolderPath + "creds.json",
            JSON.stringify(credentialsObject, null, 2)
          );
        }
        log("\nCredentials Saved Successfully.");
      } catch (error) {
        log(
          "INVALID SESSION_ID ERROR FROM SERVER\nPLEASE SCAN THE QR AGAIN FROM [ " +
            global.scan +
            " ]\n\n\nERROR : ",
          error
        );
      }
    }
  } else {
    AstaOfficial = false;
    log(
      "\n\nYou are using a Modified Version. Please Run Bot from the Original Repository.\nDeploy From : https://github.com" +
        officialRepoPath +
        "Asta-Md\n"
    );
    process.exit(0);
  }
}
async function main() {
  if (MONGODB && MONGODB.includes("MONGODB")) {
    try {
      isMongodb = await connnectMongo();
    } catch {}
  }
  if (
    !global.isMongodb &&
    global.DATABASE_URL &&
    !["false", "null"].includes(global.DATABASE_URL)
  ) {
    try {
      global.sqldb = await connnectpg();
    } catch {}
  }
}
module.exports = {
  init: MakeSession,
  connect: syncdb,
  logger: global.Debug,
  DATABASE: {
    sync: main,
  },
};