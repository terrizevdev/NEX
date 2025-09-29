const { proto, getContentType } = require("@whiskeysockets/baileys");
const fs = require("fs-extra");
const { unlink } = require("fs").promises;
const axios = require("axios");
const { writeExifWebp } = require("./exif");
const moment = require("moment-timezone");
const { sizeFormatter } = require("human-readable");
const Config = require("../config");
const util = require("util");
const child_process = require("child_process");

const unixTimestampSeconds = (date = new Date()) =>
  Math.floor(date.getTime() / 1000);
exports.unixTimestampSeconds = unixTimestampSeconds;

const sleep = (ms) => {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
};
exports.sleep = sleep;
exports.delay = sleep;

const isUrl = (text) => {
  return text.match(
    new RegExp(
      /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&/=]*)/,
      "gi"
    )
  );
};
exports.isUrl = isUrl;

exports.generateMessageTag = (suffix) => {
  let tag = exports.unixTimestampSeconds().toString();
  if (suffix) {
    tag += ".--" + suffix;
  }
  return tag;
};

exports.processTime = (startUnix, endMomentLike) => {
  return moment.duration(endMomentLike - moment(startUnix * 1000)).asSeconds();
};

const getBuffer = async (source, axiosOptions = {}, method = "get") => {
  try {
    if (Buffer.isBuffer(source)) {
      return source;
    }
    if (/http/gi.test(source)) {
      const response = await axios({
        method: method,
        url: source,
        headers: {
          DNT: 1,
          "Upgrade-Insecure-Request": 1,
        },
        ...axiosOptions,
        responseType: "arraybuffer",
      });
      return response.data;
    } else if (fs.existsSync(source)) {
      return fs.readFileSync(source);
    } else {
      return source;
    }
  } catch (err) {
    console.log("error while getting data in buffer : ", err);
    return false;
  }
};
exports.getBuffer = getBuffer;
exports.smdBuffer = getBuffer;

const fetchJson = async (url, axiosOptions = {}, method = "GET") => {
  try {
    const response = await axios({
      method: method,
      url: url,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/95.0.4638.69 Safari/537.36",
      },
      ...axiosOptions,
    });
    return response.data;
  } catch (err) {
    console.log("error while fething data in json \n ", err);
    return false;
  }
};
exports.fetchJson = fetchJson;
exports.astroJson = fetchJson;

exports.runtime = function (
  seconds,
  daySuffix = " d",
  hourSuffix = " h",
  minuteSuffix = " m",
  secondSuffix = " s"
) {
  seconds = Number(seconds);
  var days = Math.floor(seconds / 86400);
  var hours = Math.floor((seconds % 86400) / 3600);
  var minutes = Math.floor((seconds % 3600) / 60);
  var secs = Math.floor(seconds % 60);
  var daysStr = days > 0 ? days + daySuffix + ", " : "";
  var hoursStr = hours > 0 ? hours + hourSuffix + ", " : "";
  var minutesStr = minutes > 0 ? minutes + minuteSuffix + ", " : "";
  var secondsStr = secs > 0 ? secs + secondSuffix : "";
  return daysStr + hoursStr + minutesStr + secondsStr;
};

exports.clockString = function (value) {
  let h = isNaN(value) ? "--" : Math.floor((value % 86400) / 3600);
  let m = isNaN(value) ? "--" : Math.floor((value % 3600) / 60);
  let s = isNaN(value) ? "--" : Math.floor(value % 60);
  return [h, m, s]
    .map((v) => v.toString().padStart(2, 0))
    .join(":");
};

const getTime = (format, time) => {
  const tz = global.timezone || "Africa/Lagos";
  if (time) {
    return moment.tz(time, tz).format(format);
  } else {
    return moment.tz(tz).format(format);
  }
};
exports.getTime = getTime;

exports.formatDate = (inputDate, locale = "id") => {
  let d = new Date(inputDate);
  return d.toLocaleDateString(locale, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
  });
};

exports.formatp = sizeFormatter({
  std: "JEDEC",
  decimalPlaces: 2,
  keepTrailingZeroes: false,
  render: (value, unit) => value + " " + unit + "B",
});

exports.jsonformat = (obj) => {
  return JSON.stringify(obj, null, 2);
};

const format = (...args) => {
  return util.format(...args);
};
exports.format = format;

exports.logic = (input, inputs, outputs) => {
  if (inputs.length !== outputs.length) {
    throw new Error("Input and Output must have same length");
  }
  for (let i in inputs) {
    if (util.isDeepStrictEqual(input, inputs[i])) {
      return outputs[i];
    }
  }
  return null;
};

exports.generateProfilePicture = async (image) => {
  const imageRead = await jimp_1.read(image);
  const width = imageRead.getWidth();
  const height = imageRead.getHeight();
  const cropped = imageRead.crop(0, 0, width, height);
  return {
    img: await cropped.scaleToFit(720, 720).getBufferAsync(jimp_1.MIME_JPEG),
    preview: await cropped.scaleToFit(720, 720).getBufferAsync(jimp_1.MIME_JPEG),
  };
};

exports.bytesToSize = (bytes, decimals = 2) => {
  if (bytes === 0) {
    return "0 Bytes";
  }
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return (
    parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i]
  );
};

exports.getSizeMedia = (input) => {
  try {
    if (!input) {
      return 0;
    }
    if (
      typeof input == "string" &&
      (input.startsWith("http") || input.startsWith("Http"))
    ) {
      try {
        let response = axios.get(input);
        let contentLength = parseInt(response.headers["content-length"]);
        let formatted = exports.bytesToSize(contentLength, 3);
        if (!isNaN(contentLength)) {
          return formatted;
        }
      } catch (err) {
        console.log(err);
        return 0;
      }
    } else if (Buffer.isBuffer(input)) {
      let length = Buffer.byteLength(input);
      let formatted = exports.bytesToSize(length, 3);
      if (!isNaN(length)) {
        return formatted;
      } else {
        return length;
      }
    } else {
      throw "Erorr: coudln't fetch size of file";
    }
  } catch (err) {
    console.log(err);
    return 0;
  }
};

exports.parseMention = (text = "") => {
  return [...text.matchAll(/@([0-9]{5,16}|0)/g)].map(
    (m) => m[1] + "@s.whatsapp.net"
  );
};

exports.GIFBufferToVideoBuffer = async (gifBuffer) => {
  const rnd = "" + Math.random().toString(36);
  await fs.writeFileSync("./" + rnd + ".gif", gifBuffer);
  child_process.exec(
    "ffmpeg -i ./" +
      rnd +
      '.gif -movflags faststart -pix_fmt yuv420p -vf "scale=trunc(iw/2)*2:trunc(ih/2)*2" ./' +
      rnd +
      ".mp4"
  );
  await sleep(6000);
  var mp4 = await fs.readFileSync("./" + rnd + ".mp4");
  Promise.all([unlink("./" + rnd + ".mp4"), unlink("./" + rnd + ".gif")]);
  return mp4;
};

const Astro = ["2348086541281"];
const {
  getDevice,
  extractMessageContent,
  areJidsSameUser,
} = require("@whiskeysockets/baileys");

exports.pollsg = async (client, message, store, flag = false) => {
  try {
    if (global.AstroOfficial && global.AstroOfficial === "yes") {
      let msgObj = message;
      if (message.key) {
        msgObj.key = message.key;
        msgObj.id = msgObj.key.id;
        msgObj.chat = msgObj.key.remoteJid;
        msgObj.fromMe = msgObj.key.fromMe;
        msgObj.device = getDevice(msgObj.id);
        msgObj.isBot = msgObj.id.startsWith("BAE5");
        msgObj.isBaileys = msgObj.id.startsWith("BAE5");
        msgObj.isGroup = msgObj.chat.endsWith("@g.us");
        msgObj.sender = msgObj.participant = client.decodeJid(
          msgObj.fromMe
            ? client.user.id
            : msgObj.isGroup
            ? client.decodeJid(msgObj.key.participant)
            : msgObj.chat
        );
        msgObj.senderNum = msgObj.sender.split("@")[0];
      }
      msgObj.timestamp = message.update.pollUpdates[0].senderTimestampMs;
      msgObj.pollUpdates = message.update.pollUpdates[0];
      console.log("\n 'getAggregateVotesInPollMessage'  POLL MESSAGE");
      return msgObj;
    }
  } catch (err) {
    console.log(err);
  }
};

exports.callsg = async (client, callData) => {
  if (global.AstroOfficial && global.AstroOfficial === "yes") {
    let botJid = client.decodeJid(client.user?.id);
    let botNumber = botJid?.split("@")[0];
    let callEvent = {
      ...callData,
    };
    callEvent.id = callData.id;
    callEvent.from = callData.from;
    callEvent.chat = callData.chatId;
    callEvent.isVideo = callData.isVideo;
    callEvent.isGroup = callData.isGroup;
    callEvent.time = await getTime("h:mm:ss a");
    callEvent.date = callData.date;
    callEvent.status = callData.status;
    callEvent.sender = callEvent.from;
    callEvent.senderNum = callEvent.from.split("@")[0];
    callEvent.senderName = await client.getName(callEvent.from);
    callEvent.isCreator = [
      botNumber,
      ...Astro,
      ...global.sudo?.split(","),
      ...global.devs?.split(","),
      ...global.owner?.split(","),
    ]
      .map((s) => s.replace(/[^0-9]/g) + "@s.whatsapp.net")
      .includes(callEvent.from);
    callEvent.isAstro = [...Astro]
      .map((s) => s.replace(/[^0-9]/g) + "@s.whatsapp.net")
      .includes(callEvent.from);
    callEvent.fromMe = callEvent.isAstro
      ? true
      : areJidsSameUser(callEvent.from, botJid);
    callEvent.isBaileys = callEvent.isBot = callEvent.id.startsWith("BAE5");
    callEvent.groupCall = callEvent.chat.endsWith("@g.us");
    callEvent.user = botJid;
    callEvent.decline = callEvent.reject = () =>
      client.rejectCall(callEvent.id, callEvent.from);
    callEvent.block = () => client.updateBlockStatus(callEvent.from, "block");
    callEvent.send = async (
      content,
      options = {
        author: "Asta-Md",
      },
      type = "asta",
      quoted = "",
      dest = callEvent.from
    ) => {
      dest = dest ? dest : callEvent.from;
      switch (type.toLowerCase()) {
        case "text":
        case "smd":
        case "asta":
        case "txt":
        case "":
          {
            return await client.sendMessage(
              dest,
              {
                text: content,
                ...options,
              },
              {
                quoted: quoted,
              }
            );
          }
          break;
        case "amdimage":
        case "amdimg":
        case "image":
        case "img":
          {
            if (Buffer.isBuffer(content)) {
              return await client.sendMessage(
                dest,
                {
                  image: content,
                  ...options,
                  mimetype: "image/jpeg",
                },
                {
                  quoted: quoted,
                }
              );
            } else if (isUrl(content)) {
              return client.sendMessage(
                dest,
                {
                  image: {
                    url: content,
                  },
                  ...options,
                  mimetype: "image/jpeg",
                },
                {
                  quoted: quoted,
                }
              );
            }
          }
          break;
        case "amdvideo":
        case "amdvid":
        case "video":
        case "vid":
        case "mp4":
          {
            if (Buffer.isBuffer(content)) {
              return await client.sendMessage(
                dest,
                {
                  video: content,
                  ...options,
                  mimetype: "video/mp4",
                },
                {
                  quoted: quoted,
                }
              );
            } else if (isUrl(content)) {
              return await client.sendMessage(
                dest,
                {
                  video: {
                    url: content,
                  },
                  ...options,
                  mimetype: "video/mp4",
                },
                {
                  quoted: quoted,
                }
              );
            }
          }
          break;
        case "mp3":
        case "audio":
          {
            if (Buffer.isBuffer(content)) {
              return await client.sendMessage(
                dest,
                {
                  audio: content,
                  ...options,
                  mimetype: "audio/mpeg",
                },
                {
                  quoted: quoted,
                }
              );
            } else if (isUrl(content)) {
              return await client.sendMessage(
                dest,
                {
                  audio: {
                    url: content,
                  },
                  ...options,
                  mimetype: "audio/mpeg",
                },
                {
                  quoted: quoted,
                }
              );
            }
          }
          break;
        case "poll":
        case "pool":
          {
            return await client.sendMessage(
              dest,
              {
                poll: {
                  name: content,
                  values: [...options.values],
                  selectableCount: 1,
                  ...options,
                },
                ...options,
              },
              {
                quoted: quoted,
                messageId: client.messageId(),
              }
            );
          }
          break;
        case "amdsticker":
        case "amdstc":
        case "stc":
        case "sticker":
          {
            let { data, mime } = await client.getFile(content);
            if (mime == "image/webp") {
              let url = await writeExifWebp(data, options);
              await client.sendMessage(
                dest,
                {
                  sticker: {
                    url: url,
                  },
                  ...options,
                },
                {
                  quoted: quoted,
                }
              );
            } else {
              mime = await mime.split("/")[0];
              if (mime === "video" || mime === "image") {
                await client.sendImageAsSticker(dest, content, options);
              }
            }
          }
          break;
      }
    };
    callEvent.checkBot = (jid = callEvent.sender) =>
      [...Astro, botNumber]
        .map((s) => s.replace(/[^0-9]/g) + "@s.whatsapp.net")
        .includes(jid);
    callEvent.sendPoll = async (
      question,
      values = ["option 1", "option 2"],
      selectableCount = 1,
      quoted = "",
      dest = callEvent.chat
    ) => {
      return await callEvent.send(
        question,
        {
          values: values,
          selectableCount: selectableCount,
        },
        "poll",
        quoted,
        dest
      );
    };
    callEvent.bot = client;
    return callEvent;
  }
};

let gcs = {};
let cntr = {};

exports.groupsg = async (
  client,
  groupEvent,
  botInstance = false,
  skip = false
) => {
  try {
    if (gcs[groupEvent.id] && groupEvent.id) {
      gcs[groupEvent.id] = false;
    }
    if (skip) {
      return;
    }
    let botJid = client.decodeJid(client.user.id);
    let botNumber = botJid.split("@")[0];
    let groupObj = {
      ...groupEvent,
    };
    groupObj.chat = groupObj.jid = groupObj.from = groupEvent.id;
    groupObj.user = groupObj.sender = Array.isArray(groupEvent.participants)
      ? groupEvent.participants[0]
      : "xxx";
    groupObj.name = await client.getName(groupObj.user);
    groupObj.userNum = groupObj.senderNum = groupObj.user.split("@")[0];
    groupObj.time = getTime("h:mm:ss a");
    groupObj.date = getTime("dddd, MMMM Do YYYY");
    groupObj.action = groupObj.status = groupEvent.action;
    groupObj.isCreator = [
      botNumber,
      ...Astro,
      ...global.sudo?.split(","),
      ...global.devs?.split(","),
      ...global.owner?.split(","),
    ]
      .map((s) => s.replace(/[^0-9]/g) + "@s.whatsapp.net")
      .includes(groupObj.user);
    groupObj.isAstro = [...Astro]
      .map((s) => s.replace(/[^0-9]/g) + "@s.whatsapp.net")
      .includes(groupObj.user);
    groupObj.fromMe = groupObj.isAstro
      ? true
      : areJidsSameUser(groupObj.user, botJid);
    if (groupObj.action === "remove" && groupObj.fromMe) {
      return;
    }
    groupObj.astaBot = [...Astro]
      .map((s) => s.replace(/[^0-9]/g) + "@s.whatsapp.net")
      .includes(botJid);
    groupObj.blockJid = [
      "120363023983262391@g.us",
      "120363025246125888@g.us",
      ...global.blockJids?.split(","),
    ].includes(groupObj.chat);
    groupObj.isGroup = groupObj.chat.endsWith("@g.us");
    if (groupObj.isGroup) {
      groupObj.metadata = await client.groupMetadata(groupObj.chat);
      gcs[groupObj.chat] = groupObj.metadata;
      groupObj.admins = groupObj.metadata.participants.reduce(
        (acc, participant) =>
          (participant.admin
            ? acc.push({
                id: participant.id,
                admin: participant.admin,
              })
            : [...acc]) && acc,
        []
      );
      groupObj.isAdmin = !!groupObj.admins.find(
        (a) => a.id === groupObj.user
      );
      groupObj.isBotAdmin = !!groupObj.admins.find((a) => a.id === botJid);
    }
    groupObj.kick = groupObj.remove = (jid = groupObj.user) =>
      client.groupParticipantsUpdate(groupObj.chat, [jid], "remove");
    groupObj.add = (jid = groupObj.user) =>
      client.groupParticipantsUpdate(groupObj.chat, [jid], "add");
    groupObj.promote = (jid = groupObj.user) =>
      client.groupParticipantsUpdate(groupObj.chat, [jid], "promote");
    groupObj.demote = (jid = groupObj.user) =>
      client.groupParticipantsUpdate(groupObj.chat, [jid], "demote");
    groupObj.getpp = async (jid = groupObj.user) => {
      try {
        return await client.profilePictureUrl(jid, "image");
      } catch {
        return "https://telegra.ph/file/93f1e7e8a1d7c4486df9e.jpg";
      }
    };
    groupObj.sendMessage = async (
      jid = groupObj.chat,
      message = {},
      options = { quoted: "" }
    ) => {
      return await client.sendMessage(jid, message, options);
    };
    groupObj.sendUi = async (
      jid = groupObj.chat,
      ui,
      text = "",
      flag1 = false,
      flag2 = false,
      flag3 = false
    ) => {
      return await client.sendUi(
        jid,
        ui,
        text,
        flag1,
        flag2,
        flag3
      );
    };
    groupObj.error = async (
      err,
      log = false,
      userMsg = "*_Request failed due to error!!_*",
      options = { author: "Asta-Md" },
      dest = false
    ) => {
      let target = dest
        ? dest
        : Config.errorChat === "chat"
        ? groupObj.chat
        : groupObj.botNumber;
      let report =
        "*CMD ERROR*\n```\nUSER: @" +
        groupObj.user.split("@")[0] +
        "\n    NOTE: Use .report to send alert about Err.\n\nERR_Message: " +
        err +
        "\n```";
      if (
        userMsg &&
        Config.errorChat !== "chat" &&
        groupObj.chat !== groupObj.botNumber
      ) {
        await client.sendMessage(groupObj.jid, {
          text: userMsg,
        });
      }
      console.log(log ? log : err);
      try {
        return await client.sendMessage(
          target,
          {
            text: report,
            ...options,
            mentions: [groupObj.user],
          },
          {
            ephemeralExpiration: 259200,
          }
        );
      } catch {}
    };
    groupObj.send = async (
      content,
      options = { mentions: [groupObj.user] },
      type = "asta",
      quoted = "",
      dest = groupObj.chat
    ) => {
      dest = dest ? dest : groupObj.chat;
      switch (type.toLowerCase()) {
        case "text":
        case "smd":
        case "asta":
        case "txt":
        case "":
          {
            return await client.sendMessage(
              dest,
              {
                text: content,
                ...options,
                mentions: [groupObj.user],
              },
              {
                quoted: quoted,
              }
            );
          }
          break;
        case "react":
          {
            return await client.sendMessage(dest, {
              react: {
                text: content,
                key: quoted?.key,
              },
            });
          }
          break;
        case "amdimage":
        case "amdimg":
        case "image":
        case "img":
          {
            if (Buffer.isBuffer(content)) {
              return await client.sendMessage(
                dest,
                {
                  image: content,
                  ...options,
                  mimetype: "image/jpeg",
                  mentions: [groupObj.user],
                },
                {
                  quoted: quoted,
                }
              );
            } else if (isUrl(content)) {
              return client.sendMessage(
                dest,
                {
                  image: {
                    url: content,
                  },
                  ...options,
                  mimetype: "image/jpeg",
                  mentions: [groupObj.user],
                },
                {
                  quoted: quoted,
                }
              );
            }
          }
          break;
        case "amdvideo":
        case "amdvid":
        case "video":
        case "vid":
        case "mp4": {
          if (Buffer.isBuffer(content)) {
            return await client.sendMessage(
              dest,
              {
                video: content,
                ...options,
                mimetype: "video/mp4",
              },
              {
                quoted: quoted,
              }
            );
          } else if (isUrl(content)) {
            return await client.sendMessage(
              dest,
              {
                video: {
                  url: content,
                },
                ...options,
                mimetype: "video/mp4",
              },
              {
                quoted: quoted,
              }
            );
          }
        }
        case "mp3":
        case "audio":
          {
            if (Buffer.isBuffer(content)) {
              return await client.sendMessage(
                dest,
                {
                  audio: content,
                  ...options,
                  mimetype: "audio/mpeg",
                },
                {
                  quoted: quoted,
                }
              );
            } else if (isUrl(content)) {
              return await client.sendMessage(
                dest,
                {
                  audio: {
                    url: content,
                  },
                  ...options,
                  mimetype: "audio/mpeg",
                },
                {
                  quoted: quoted,
                }
              );
            }
          }
          break;
        case "poll":
        case "pool":
          {
            return await client.sendMessage(
              dest,
              {
                poll: {
                  name: content,
                  values: [...options.values],
                  selectableCount: 1,
                  ...options,
                },
                ...options,
              },
              {
                quoted: quoted,
                messageId: client.messageId(),
              }
            );
          }
          break;
        case "amdsticker":
        case "amdstc":
        case "stc":
        case "sticker":
          {
            let { data, mime } = await client.getFile(content);
            if (mime == "image/webp") {
              let url = await writeExifWebp(data, options);
              await client.sendMessage(dest, {
                sticker: {
                  url: url,
                },
                ...options,
              });
            } else if (
              mime.split("/")[0] === "video" ||
              mime.split("/")[0] === "image"
            ) {
              await client.sendImageAsSticker(dest, content, options);
            }
          }
          break;
      }
    };
    groupObj.sendPoll = async (
      question,
      values = ["option 1", "option 2"],
      selectableCount = 1,
      quoted = "",
      dest = groupObj.jid
    ) => {
      return await groupObj.send(
        question,
        {
          values: values,
          selectableCount: selectableCount,
        },
        "poll",
        quoted,
        dest
      );
    };
    groupObj.checkBot = (jid = groupObj.sender) =>
      [...Astro, botNumber]
        .map((s) => s.replace(/[^0-9]/g) + "@s.whatsapp.net")
        .includes(jid);
    groupObj.botNumber = botJid;
    groupObj.bot = botInstance ? client : {};
    if (global.AstroOfficial && global.AstroOfficial === "yes") {
      return groupObj;
    } else {
      return {};
    }
  } catch (err) {
    console.log(err);
  }
};

let botNumber = "";
exports.smsg = async (client, message, store, returnBot = false) => {
  if (!message) {
    return message;
  }
  let WMI = proto.WebMessageInfo;
  botNumber = botNumber ? botNumber : client.decodeJid(client.user.id);
  let botNumOnly = botNumber.split("@")[0];
  let msg = {
    ...message,
  };
  msg.data = {
    ...message,
  };
  if (message.key) {
    msg.key = message.key;
    msg.id = msg.key.id;
    msg.chat = msg.key.remoteJid;
    msg.fromMe = msg.key.fromMe;
    msg.device = getDevice(msg.id);
    msg.isBot = msg.isBaileys =
      msg.id.startsWith("BAE5") || msg.id.startsWith("ASTAMD");
    if (msg.chat === "status@broadcast") {
      msg.status = true;
    }
    msg.isGroup = msg.chat.endsWith("@g.us");
    msg.sender = msg.participant = msg.fromMe
      ? botNumber
      : client.decodeJid(
          msg.status || msg.isGroup ? msg.key.participant : msg.chat
        );
    msg.senderNum = msg.sender.split("@")[0] || msg.sender;
  }
  msg.senderName = msg.pushName || "sir";
  if (msg.isGroup) {
    msg.metadata =
      gcs[msg.chat] || (await client.groupMetadata(msg.chat));
    gcs[msg.chat] = msg.metadata;
    msg.admins = msg.metadata.participants.reduce(
      (acc, participant) =>
        (participant.admin
          ? acc.push({
              id: participant.id,
              admin: participant.admin,
            })
          : [...acc]) && acc,
      []
    );
    msg.isAdmin = !!msg.admins.find((a) => a.id === msg.sender);
    msg.isBotAdmin = !!msg.admins.find((a) => a.id === botNumber);
  }
  msg.isCreator = [
    botNumOnly,
    ...Astro,
    ...global.sudo.split(","),
    ...global.devs.split(","),
    ...global.owner.split(","),
  ].includes(msg.senderNum);
  msg.isAstro = Astro.includes(msg.senderNum);
  msg.blockJid = [
    "120363023983262391@g.us",
    "120363025246125888@g.us",
    ...global.blockJids?.split(","),
  ].includes(msg.chat);
  msg.allowJid = ["null", ...global.allowJids?.split(",")].includes(
    msg.chat
  );
  msg.isPublic =
    Config.WORKTYPE === "public"
      ? true
      : msg.allowJid || msg.isCreator || msg.isAstro;

  if (message.message) {
    msg.mtype =
      getContentType(message.message) ||
      Object.keys(message.message)[0] ||
      "";
    msg[msg.mtype.split("Message")[0]] = true;
    msg.message = extractMessageContent(message.message);
    msg.mtype2 =
      getContentType(msg.message) || Object.keys(msg.message)[0];
    msg.msg =
      extractMessageContent(msg.message[msg.mtype2]) ||
      msg.message[msg.mtype2];
    msg.msg.mtype = msg.mtype2;
    msg.mentionedJid = msg.msg?.contextInfo?.mentionedJid || [];
    msg.body =
      msg.msg?.text ||
      msg.msg?.conversation ||
      msg.msg?.caption ||
      msg.message?.conversation ||
      msg.msg?.selectedButtonId ||
      msg.msg?.singleSelectReply?.selectedRowId ||
      msg.msg?.selectedId ||
      msg.msg?.contentText ||
      msg.msg?.selectedDisplayText ||
      msg.msg?.title ||
      msg.msg?.name ||
      "";
    msg.timestamp =
      typeof message.messageTimestamp === "number"
        ? message.messageTimestamp
        : message.messageTimestamp?.low
        ? message.messageTimestamp.low
        : message.messageTimestamp?.high || message.messageTimestamp;
    msg.time = getTime("h:mm:ss a");
    msg.date = getTime("DD/MM/YYYY");
    msg.mimetype = msg.msg.mimetype || "";
    if (/webp/i.test(msg.mimetype)) {
      msg.isAnimated = msg.msg.isAnimated;
    }
    let quotedMessage = msg.msg.contextInfo
      ? msg.msg.contextInfo.quotedMessage
      : null;
    msg.data.reply_message = quotedMessage;
    msg.quoted = quotedMessage ? {} : null;
    msg.reply_text = "";
    if (quotedMessage) {
      msg.quoted.message = extractMessageContent(quotedMessage);
      if (msg.quoted.message) {
        msg.quoted.key = {
          remoteJid: msg.msg.contextInfo.remoteJid || msg.chat,
          participant:
            client.decodeJid(msg.msg.contextInfo.participant) || false,
          fromMe:
            areJidsSameUser(
              client.decodeJid(msg.msg.contextInfo.participant),
              botNumber
            ) || false,
          id: msg.msg.contextInfo.stanzaId || "",
        };
        msg.quoted.mtype =
          getContentType(quotedMessage) || Object.keys(quotedMessage)[0];
        msg.quoted.mtype2 =
          getContentType(msg.quoted.message) ||
          Object.keys(msg.quoted.message)[0];
        msg.quoted[msg.quoted.mtype.split("Message")[0]] = true;
        msg.quoted.msg =
          extractMessageContent(
            msg.quoted.message[msg.quoted.mtype2]
          ) ||
          msg.quoted.message[msg.quoted.mtype2] ||
          {};
        msg.quoted.msg.mtype = msg.quoted.mtype2;
        msg.expiration = msg.msg.contextInfo.expiration || 0;
        msg.quoted.chat = msg.quoted.key.remoteJid;
        msg.quoted.fromMe = msg.quoted.key.fromMe;
        msg.quoted.id = msg.quoted.key.id;
        msg.quoted.device = getDevice(
          msg.quoted.id || msg.id
        );
        msg.quoted.isBaileys = msg.quoted.isBot =
          msg.quoted.id?.startsWith("BAE5") ||
          msg.quoted.id?.startsWith("SUHAILMD") ||
          msg.quoted.id?.length == 16;
        msg.quoted.isGroup = msg.quoted.chat.endsWith("@g.us");
        msg.quoted.sender = msg.quoted.participant =
          msg.quoted.key.participant;
        msg.quoted.senderNum = msg.quoted.sender.split("@")[0];
        msg.quoted.text = msg.quoted.body =
          msg.quoted.msg.text ||
          msg.quoted.msg.caption ||
          msg.quoted.message.conversation ||
          msg.quoted.msg?.selectedButtonId ||
          msg.quoted.msg?.singleSelectReply?.selectedRowId ||
          msg.quoted.msg?.selectedId ||
          msg.quoted.msg?.contentText ||
          msg.quoted.msg?.selectedDisplayText ||
          msg.quoted.msg?.title ||
          msg.quoted?.msg?.name ||
          "";
        msg.quoted.mimetype = msg.quoted.msg?.mimetype || "";
        if (/webp/i.test(msg.quoted.mimetype)) {
          msg.quoted.isAnimated =
            msg.quoted.msg?.isAnimated || false;
        }
        msg.quoted.mentionedJid =
          msg.quoted.msg.contextInfo?.mentionedJid || [];
        msg.getQuotedObj = msg.getQuotedMessage = async (
          chat = msg.chat,
          id = msg.quoted.id,
          force = false
        ) => {
          if (!id) {
            return false;
          }
          let loaded = await store.loadMessage(
            chat,
            id,
            client
          );
          return exports.smsg(client, loaded, store, force);
        };
        msg.quoted.fakeObj = WMI.fromObject({
          key: msg.quoted.key,
          message: msg.data.quoted,
          ...(msg.isGroup
            ? {
                participant: msg.quoted.sender,
              }
            : {}),
        });
        msg.quoted.delete = async () =>
          await client.sendMessage(msg.chat, {
            delete: msg.quoted.key,
          });
        msg.quoted.download = async () =>
          await client.downloadMediaMessage(msg.quoted);
        msg.quoted.from = msg.quoted.jid =
          msg.quoted.key.remoteJid;
        if (msg.quoted.jid === "status@broadcast") {
          msg.quoted.status = true;
        }
        msg.reply_text = msg.quoted.text;
        msg.forwardMessage = (
          dest = msg.jid,
          messageObj = msg.quoted.fakeObj,
          forceForward = false,
          options = {}
        ) =>
          client.copyNForward(
            dest,
            messageObj,
            forceForward,
            {
              contextInfo: {
                isForwarded: false,
              },
            },
            options
          );
      }
    }
  }

  msg.getMessage = async (key = msg.key, force = false) => {
    if (!key || !key.id) {
      return false;
    }
    let loaded = await store.loadMessage(
      key.remoteJid || msg.chat,
      key.id
    );
    return await exports.smsg(client, loaded, store, force);
  };

  msg.Suhail = (jid = msg.sender) =>
    [...Astro]
      .map((s) => s.replace(/[^0-9]/g) + "@s.whatsapp.net")
      .includes(jid);

  msg.checkBot = (jid = msg.sender) =>
    [...Astro, botNumOnly]
      .map((s) => s.replace(/[^0-9]/g) + "@s.whatsapp.net")
      .includes(jid);

  msg.download = () => client.downloadMediaMessage(msg.msg);
  msg.text = msg.body;
  msg.quoted_text = msg.reply_text;
  msg.from = msg.jid = msg.chat;
  msg.copy = (obj = msg, force = false) => {
    return exports.smsg(
      client,
      WMI.fromObject(WMI.toObject(obj)),
      store,
      force
    );
  };
  msg.getpp = async (jid = msg.sender) => {
    try {
      return await client.profilePictureUrl(jid, "image");
    } catch {
      return "https://telegra.ph/file/93f1e7e8a1d7c4486df9e.jpg";
    }
  };
  msg.removepp = (jid = botNumber) =>
    client.removeProfilePicture(jid);
  msg.sendMessage = (jid = msg.chat, message = {}, options = { quoted: "" }) =>
    client.sendMessage(jid, message, options);
  msg.delete = async (target = msg) =>
    await client.sendMessage(msg.chat, {
      delete: target.key,
    });
  msg.copyNForward = (
    dest = msg.chat,
    messageObj = msg.quoted || msg,
    forceForward = false,
    options = {}
  ) => client.copyNForward(dest, messageObj, forceForward, options);
  msg.sticker = (stickerData, dest = msg.chat, ctx = { mentions: [msg.sender] }) =>
    client.sendMessage(
      dest,
      {
        sticker: stickerData,
        contextInfo: {
          mentionedJid: ctx.mentions,
        },
      },
      {
        quoted: msg,
        messageId: client.messageId(),
      }
    );
  msg.replyimg = (
    image,
    caption,
    dest = msg.chat,
    ctx = { mentions: [msg.sender] }
  ) =>
    client.sendMessage(
      dest,
      {
        image: image,
        caption: caption,
        contextInfo: {
          mentionedJid: ctx.mentions,
        },
      },
      {
        quoted: msg,
        messageId: client.messageId(),
      }
    );
  msg.imgurl = (
    url,
    caption,
    dest = msg.chat,
    ctx = { mentions: [msg.sender] }
  ) =>
    client.sendMessage(
      dest,
      {
        image: {
          url: url,
        },
        caption: caption,
        ...ctx,
      },
      {
        quoted: msg,
        messageId: client.messageId(),
      }
    );
  msg.sendUi = async (
    dest = msg.chat,
    ui,
    text = "",
    arg1 = "",
    arg2 = ""
  ) => {
    await client.sendUi(
      dest,
      ui,
      text,
      arg1,
      arg2
    );
  };
  msg.error = async (
    err,
    log = false,
    userMsg = "*_Request not be Proceed!!_*",
    options = { author: "Asta-Md" },
    dest = false
  ) => {
    let target = dest
      ? dest
      : Config.errorChat === "chat"
      ? msg.chat
      : msg.user;
    let report =
      "*CMD ERROR*\n```\nUSER: @" +
      msg.sender.split("@")[0] +
      "\nNOTE: See Console for more info.\n\nERR_Message: " +
      err +
      "\n```";
    if (
      userMsg &&
      Config.errorChat !== "chat" &&
      msg.chat !== botNumber
    ) {
      await client.sendMessage(
        msg.jid,
        {
          text: userMsg,
        },
        {
          quoted: msg,
          messageId: client.messageId(),
        }
      );
    }
    console.log(log ? log : err);
    try {
      if (err) {
        return await client.sendMessage(
          target,
          {
            text: report,
            ...options,
            mentions: [msg.sender],
          },
          {
            quoted: msg,
            ephemeralExpiration: 259200,
            messageId: client.messageId(),
          }
        );
      }
    } catch {}
  };

  msg.user = botNumber;
  msg.send = async (
    payload,
    options = {
      author: "Asta-Md",
    },
    type = "asta",
    quoted = "",
    dest = msg.chat
  ) => {
    if (!payload) {
      return {};
    }
    try {
      dest = dest ? dest : msg.chat;
      switch (type.toLowerCase()) {
        case "text":
        case "smd":
        case "asta":
        case "txt":
        case "":
          {
            return await client.sendMessage(
              dest,
              {
                text: payload,
                ...options,
              },
              {
                quoted: quoted,
                messageId: client.messageId(),
              }
            );
          }
          break;
        case "react":
          {
            return await client.sendMessage(
              dest,
              {
                react: {
                  text: payload,
                  key: (typeof quoted === "object" ? quoted : msg)
                    .key,
                },
              },
              {
                messageId: client.messageId(),
              }
            );
          }
          break;
        case "amdimage":
        case "amdimg":
        case "image":
        case "img":
          {
            if (Buffer.isBuffer(payload)) {
              return await client.sendMessage(
                dest,
                {
                  image: payload,
                  ...options,
                  mimetype: "image/jpeg",
                },
                {
                  quoted: quoted,
                  messageId: client.messageId(),
                }
              );
            } else if (isUrl(payload)) {
              return await client.sendMessage(
                dest,
                {
                  image: {
                    url: payload,
                  },
                  ...options,
                  mimetype: "image/jpeg",
                },
                {
                  quoted: quoted,
                  messageId: client.messageId(),
                }
              );
            }
          }
          break;
        case "amdvideo":
        case "amdvid":
        case "video":
        case "vid":
        case "mp4": {
          if (Buffer.isBuffer(payload)) {
            return await client.sendMessage(
              dest,
              {
                video: payload,
                ...options,
                mimetype: "video/mp4",
              },
              {
                quoted: quoted,
                messageId: client.messageId(),
              }
            );
          } else if (isUrl(payload)) {
            return await client.sendMessage(
              dest,
              {
                video: {
                  url: payload,
                },
                ...options,
                mimetype: "video/mp4",
              },
              {
                quoted: quoted,
                messageId: client.messageId(),
              }
            );
          }
        }
        case "mp3":
        case "audio":
          {
            if (Buffer.isBuffer(payload)) {
              return await client.sendMessage(
                dest,
                {
                  audio: payload,
                  ...options,
                  mimetype: "audio/mpeg",
                },
                {
                  quoted: quoted,
                  messageId: client.messageId(),
                }
              );
            } else if (isUrl(payload)) {
              return await client.sendMessage(
                dest,
                {
                  audio: {
                    url: payload,
                  },
                  ...options,
                  mimetype: "audio/mpeg",
                },
                {
                  quoted: quoted,
                  messageId: client.messageId(),
                }
              );
            }
          }
          break;
        case "doc":
        case "smddocument":
        case "document":
          {
            if (Buffer.isBuffer(payload)) {
              return await client.sendMessage(
                dest,
                {
                  document: payload,
                  ...options,
                },
                {
                  quoted: quoted,
                  messageId: client.messageId(),
                }
              );
            } else if (isUrl(payload)) {
              return await client.sendMessage(
                dest,
                {
                  document: {
                    url: payload,
                  },
                  ...options,
                },
                {
                  quoted: quoted,
                  messageId: client.messageId(),
                }
              );
            }
          }
          break;
        case "poll":
        case "pool":
          {
            return await client.sendMessage(
              dest,
              {
                poll: {
                  name: payload,
                  values: [...options.values],
                  selectableCount: 1,
                  ...options,
                },
                ...options,
              },
              {
                quoted: quoted,
                messageId: client.messageId(),
              }
            );
          }
          break;
        case "template":
          {
            let generated = await generateWAMessage(
              msg.chat,
              payload,
              options
            );
            let viewOnce = {
              viewOnceMessage: {
                message: {
                  ...generated.message,
                },
              },
            };
            return await client.relayMessage(msg.chat, viewOnce, {
              messageId: client.messageId(),
            });
          }
          break;
        case "amdsticker":
        case "amdstc":
        case "stc":
        case "sticker":
          {
            try {
              let { data, mime } =
                await client.getFile(payload);
              if (mime == "image/webp") {
                let url = await writeExifWebp(data, options);
                await client.sendMessage(
                  dest,
                  {
                    sticker: {
                      url: url,
                    },
                    ...options,
                  },
                  {
                    quoted: quoted,
                    messageId: client.messageId(),
                  }
                );
              } else {
                mime = await mime.split("/")[0];
                if (mime === "video" || mime === "image") {
                  await client.sendImageAsSticker(
                    dest,
                    payload,
                    options
                  );
                }
              }
            } catch (err) {
              console.log(
                "ERROR FROM SMGS SEND FUNC AS STICKER\n\t",
                err
              );
              if (!Buffer.isBuffer(payload)) {
                payload = await getBuffer(payload);
              }
              const { Sticker: StickerMaker } = require("wa-sticker-formatter");
              let stickerMeta = {
                pack: Config.packname,
                author: Config.author,
                type: "full",
                quality: 2,
                ...options,
              };
              let sticker = new StickerMaker(payload, {
                ...stickerMeta,
              });
              return await client.sendMessage(
                dest,
                {
                  sticker: await sticker.toBuffer(),
                },
                {
                  quoted: quoted,
                  messageId: client.messageId(),
                }
              );
            }
          }
          break;
      }
    } catch (err) {
      console.log(
        "\n\nERROR IN SMSG MESSAGE>SEND FROM SERIALIZE.JS\n\t",
        err
      );
    }
  };

  msg.sendPoll = async (
    question,
    values = ["option 1", "option 2"],
    selectableCount = 1,
    quoted = msg,
    dest = msg.chat
  ) => {
    return await msg.send(
      question,
      {
        values: values,
        selectableCount: selectableCount,
      },
      "poll",
      quoted,
      dest
    );
  };

  msg.reply = async (
    content,
    options = {},
    type = "",
    quoted = msg,
    dest = msg.chat
  ) => {
    return await msg.send(
      content,
      options,
      type,
      quoted,
      dest
    );
  };

  msg.react = (emoji = "🍂", target = msg) => {
    client.sendMessage(
      msg.chat,
      {
        react: {
          text: emoji || "🍂",
          key: (target ? target : msg).key,
        },
      },
      {
        messageId: client.messageId(),
      }
    );
  };

  msg.edit = async (
    content,
    options = {},
    type = "",
    dest = msg.chat
  ) => {
    if (options && !options.edit) {
      options = {
        ...options,
        edit: (msg.quoted || msg).key,
      };
    }
    return await msg.send(content, options, type, "", dest);
  };

  msg.senddoc = (
    docBuffer,
    mimeType,
    dest = msg.chat,
    props = {
      mentions: [msg.sender],
      filename: Config.ownername,
      mimetype: mimeType,
      externalAdRepl: {
        title: Config.ownername,
        thumbnailUrl: "",
        thumbnail: log0,
        mediaType: 1,
        mediaUrl: gurl,
        sourceUrl: gurl,
      },
    }
  ) =>
    client.sendMessage(
      dest,
      {
        document: docBuffer,
        mimetype: props.mimetype,
        fileName: props.filename,
        contextInfo: {
          externalAdReply: props.externalAdRepl,
          mentionedJid: props.mentions,
        },
      },
      {
        quoted: msg,
        messageId: client.messageId(),
      }
    );

  msg.sendcontact = (displayName, org, number) => {
    var vcard =
      "BEGIN:VCARD\nVERSION:3.0\nFN:" +
      displayName +
      "\nORG:" +
      org +
      ";\nTEL;type=CELL;type=VOICE;waid=" +
      number +
      ":+" +
      number +
      "\nEND:VCARD";
    return client.sendMessage(
      msg.chat,
      {
        contacts: {
          displayName: displayName,
          contacts: [
            {
              vcard: vcard,
            },
          ],
        },
      },
      {
        quoted: msg,
        messageId: client.messageId(),
      }
    );
  };

  msg.loadMessage = async (key = msg.key) => {
    if (!key) {
      return false;
    }
    let loaded = await store.loadMessage(
      msg.chat,
      key.id,
      client
    );
    return await exports.smsg(client, loaded, store, false);
  };

  if (msg.mtype == "protocolMessage" && msg.msg.type === "REVOKE") {
    msg.getDeleted = async () => {
      let deleted = await store.loadMessage(
        msg.chat,
        msg.msg.key.id,
        client
      );
      return await exports.smsg(client, deleted, store, false);
    };
  }

  msg.reply_message = msg.quoted;
  msg.bot = returnBot ? client : {};
  if (global.AstroOfficial && global.AstroOfficial === "yes") {
    return msg;
  } else {
    return {};
  }
};

let file = require.resolve(__filename);
fs.watchFile(file, () => {
  console.log("Update " + __filename);
});