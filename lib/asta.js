const axios = require("axios");
const ffmpeg = require("fluent-ffmpeg");
const fs = require("fs-extra");
const util = require("util");
const exec = util.promisify(require("child_process").exec);
const Jimp = require("jimp");
const fetch = require("node-fetch");
const {
  getBuffer,
  fetchJson,
  runtime,
  isUrl,
  GIFBufferToVideoBuffer
} = require("./serialized");
let sides = "*";
const {
  tlang,
  TelegraPh,
  dare,
  truth,
  random_question
} = require("./scraper");
const {
  bot_
} = require("./schemes");
const Config = require("../config.js");
let caption = Config.caption || "";
const {
  Innertube,
  UniversalCache,
  Utils
} = require("youtubei.js");
const {
  existsSync,
  mkdirSync,
  createWriteStream
} = require("fs");

let yt = {};

yt.getInfo = async (videoId, options = {}) => {
  try {
    if (!global.AstroOfficial) {
      return;
    }
    const client = await Innertube.create({
      cache: new UniversalCache(false),
      generate_session_locally: true
    });
    let info = await client.getInfo(videoId, options);
    let qualities = [];
    for (let i = 0; i < info.streaming_data.formats.length; i++) {
      qualities.push(info.streaming_data.formats[i].quality_label);
    }
    let prefQuality = qualities.includes("360p") ? "360p" : "best";
    let result = {
      status: true,
      title: info.basic_info.title,
      id: info.basic_info.id,
      quality: qualities,
      pref_Quality: prefQuality,
      duration: info.basic_info.duration,
      description: info.basic_info.short_description,
      keywords: info.basic_info.keywords,
      thumbnail: info.basic_info.thumbnail[0].url,
      author: info.basic_info.author,
      views: info.basic_info.view_count,
      likes: info.basic_info.like_count,
      category: info.basic_info.category,
      channel: info.basic_info.channel,
      basic_info: info
    };
    return result;
  } catch (err) {
    console.log("./lib/asta/yt.getInfo()\n", err.message);
    return {
      status: false
    };
  }
};

yt.download = async (videoId, options = {
  type: "video",
  quality: "best",
  format: "mp4"
}) => {
  try {
    if (!global.AstroOfficial) {
      return;
    }
    const client = await Innertube.create({
      cache: new UniversalCache(false),
      generate_session_locally: true
    });
    let type = options.type ? options.type : "video";
    let quality = type === "audio" ? "best" : options.quality ? options.quality : "best";
    let format = options.format ? options.format : "mp4";
    const stream = await client.download(videoId, {
      type: type,
      quality: quality,
      format: format
    });
    const tempDir = "./temp";
    if (!existsSync(tempDir)) {
      mkdirSync(tempDir);
    }
    let ext = type === "video" ? "mp4" : "m4a";
    let outPath = tempDir + "/Asta-Md " + videoId + "." + ext;
    var writeStream = createWriteStream(outPath);
    for await (const chunk of Utils.streamToIterable(stream)) {
      writeStream.write(chunk);
    }
    return outPath;
  } catch (err) {
    console.log("./lib/asta/yt.dowanload()\n", err.message);
    return false;
  }
};

async function sendAnimeReaction(messageObj, action = "punch", textToMention = "", altText = "") {
  try {
    var apiRes = await fetchJson("https://api.waifu.pics/sfw/" + action);
    const res = await axios.get(apiRes.url, {
      responseType: "arraybuffer"
    });
    const buffer = Buffer.from(res.data, "utf-8");
    let mentionedId = messageObj.mentionedJid ? messageObj.mentionedJid[0] : messageObj.quoted ? messageObj.quoted.sender : false;
    let videoBuffer = await GIFBufferToVideoBuffer(buffer);
    let captionText = mentionedId ? sides + "@" + messageObj.sender.split("@")[0] + " " + textToMention + " @" + mentionedId.split("@")[0] + sides : sides + "@" + messageObj.sender.split("@")[0] + " " + altText + sides;
    if (mentionedId) {
      return await messageObj.bot.sendMessage(messageObj.chat, {
        video: videoBuffer,
        gifPlayback: true,
        mentions: [mentionedId, messageObj.sender],
        caption: captionText
      }, {
        quoted: messageObj,
        messageId: messageObj.bot.messageId()
      });
    } else {
      return await messageObj.bot.sendMessage(messageObj.chat, {
        video: videoBuffer,
        gifPlayback: true,
        mentions: [messageObj.sender],
        caption: captionText
      }, {
        quoted: messageObj,
        messageId: messageObj.bot.messageId()
      });
    }
  } catch (err) {
    return await messageObj.error(err + "\nERROR AT : /lib/asta.js/sendAnimeReaction()\n\ncommand: " + action);
  }
}

async function sendGImages(messageObj, query, cap = caption, body = "") {
  try {
    let gimage = require("async-g-i-s");
    let results = await gimage(query);
    let url = results[Math.floor(Math.random() * results.length)].url;
    let msg = {
      image: {
        url: url
      },
      caption: cap,
      contextInfo: {
        externalAdReply: {
          title: tlang().title,
          body: body,
          thumbnail: log0,
          mediaType: 1,
          mediaUrl: gurl,
          sourceUrl: gurl
        }
      }
    };
    return await messageObj.bot.sendMessage(messageObj.chat, msg, {
      quoted: messageObj,
      messageId: messageObj.bot.messageId()
    });
  } catch (err) {
    await messageObj.error(err);
    return console.log("./lib/asta.js/sendGImages()\n", err);
  }
}

async function AudioToBlackVideo(audioPath, outVideoPath) {
  try {
    try {
      fs.unlinkSync(outVideoPath);
    } catch (e) {}
    const ffprobeCmd = "ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 " + audioPath;
    const { stdout: durationStr } = await exec(ffprobeCmd);
    const duration = parseFloat(durationStr);
    let blackPath = "./temp/blackScreen.mp4";
    try {
      fs.unlinkSync(blackPath);
    } catch (e) {}
    const ffmpegBlackCmd = "ffmpeg -f lavfi -i color=c=black:s=1280x720:d=" + duration + " -vf \"format=yuv420p\" " + blackPath;
    await exec(ffmpegBlackCmd);
    const mergeCmd = "ffmpeg -i " + blackPath + " -i " + audioPath + " -c:v copy -c:a aac -map 0:v:0 -map 1:a:0 " + outVideoPath;
    await exec(mergeCmd);
    console.log("Audio converted to black screen video successfully!");
    return {
      result: true
    };
  } catch (err) {
    console.error("./lib/Aviator.js/AudioToBlackVideo()\n", err);
    return {
      result: false
    };
  }
}

async function textToLogoGenerator(messageObj, service = "", text1 = "", text2 = "ser", engine = "textpro", useFallback = true) {
  let textproResult = {};
  let webResult = {};
  let baseUrl = /1|ephoto|ephoto360/gi.test(engine) ? "https://ephoto360.com/" + service + ".html" : /2|potoxy|photooxy/gi.test(engine) ? "https://photooxy.com/" + service + ".html" : /3|enphoto|en360/gi.test(engine) ? "https://en.ephoto360.com/" + service + ".html" : "https://textpro.me/" + service + ".html";
  try {
    const { textpro } = require("mumaker");
    if (text1) {
      textproResult = await textpro(baseUrl, [text1, text2]);
    }
    let context = {} || {
      ...(await messageObj.bot.contextInfo("ᴛᴇxᴛ ᴛᴏ ʟᴏɢᴏ", "Hello " + messageObj.senderName))
    };
    return await messageObj.bot.sendMessage(messageObj.jid, {
      image: {
        url: textproResult.image
      },
      caption: caption,
      contextInfo: context
    }, {
      messageId: messageObj.bot.messageId()
    });
  } catch (err) {
    try {
      let apiUrl = global.api_smd + ("/api/maker?text1=" + text1 + "&text2=" + text2 + "&url=" + baseUrl);
      webResult = await fetchJson(apiUrl);
      if ((!webResult || !webResult.status || !webResult.img) && useFallback) {
        return messageObj.error(err + "\nWebinfo:" + (webResult.img || webResult) + "\n\nfileName: textToLogoGenerator->s.js", err);
      }
      await messageObj.bot.sendMessage(messageObj.jid, {
        image: {
          url: webResult.img
        }
      }, {
        messageId: messageObj.bot.messageId()
      });
    } catch (err2) {
      let fallbackImage = textproResult && textproResult.image ? textproResult.image : webResult && webResult.img ? webResult.img : false;
      if (useFallback) {
        messageObj.error(err + "\n\nAPI Error : " + err2 + "\n\nfileName: textToLogoGenerator->s.js", err, (fallbackImage ? "Here we go\n\n" + fallbackImage : "Error, Request Denied!").trim());
      }
    }
  }
}

async function photoEditor(messageObj, effect = "ad", captionText = "", notify = true) {
  let validTypes = ["imageMessage"];
  try {
    let targetMsg = validTypes.includes(messageObj.mtype) ? messageObj : messageObj.reply_message;
    if (!targetMsg || !validTypes.includes(targetMsg?.mtype || "null")) {
      return await messageObj.send("*_Uhh Dear, Reply to an image_*");
    }
    let savedPath = await messageObj.bot.downloadAndSaveMediaMessage(targetMsg);
    let telegraphUrl = await TelegraPh(savedPath);
    try {
      fs.unlinkSync(savedPath);
    } catch (e) {}
    return await messageObj.bot.sendMessage(messageObj.chat, {
      image: {
        url: "https://api.popcat.xyz/" + effect + "?image=" + telegraphUrl
      },
      caption: captionText
    }, {
      quoted: messageObj,
      messageId: messageObj.bot.messageId()
    });
  } catch (err) {
    if (notify) {
      await messageObj.error(err + "\n\ncommand: " + effect + "\nfileName: photoEditor->s.js", err);
    }
  }
}

async function plugins(contextObj, action, source = "", pluginDir = "") {
  let responseMessage = "";
  try {
    let botEntry = (await bot_.findOne({
      id: "bot_" + contextObj.user
    })) || (await bot_.new({
      id: "bot_" + contextObj.user
    }));
    let pluginsMap = botEntry.plugins;
    if (action.toLowerCase() === "install") {
      let installedTracker = "";
      for (let rawUrl of isUrl(source)) {
        var pluginUrl = new URL(rawUrl.replace(/[_*]+$/, ""));
        pluginUrl = pluginUrl.href.includes("raw") ? pluginUrl.href : pluginUrl.href + "/raw";
        const { data: pluginContent } = await axios.get(pluginUrl);
        let match = /pattern: ["'](.*)["'],/g.exec(pluginContent) || /cmdname: ["'](.*)["'],/g.exec(pluginContent) || /name: ["'](.*)["'],/g.exec(pluginContent);
        if (!match) {
          responseMessage += "*gist not found:* _" + pluginUrl + "_ \n";
          continue;
        }
        let nameCandidate = match[1].split(" ")[0] || Math.random().toString(36).slice(-5);
        let pluginName = nameCandidate.replace(/[^A-Za-z]/g, "");
        if (installedTracker.includes(pluginName)) {
          continue;
        } else {
          installedTracker = installedTracker + "[\"" + pluginName + "\"] ";
        }
        if (pluginsMap[pluginName]) {
          responseMessage += "*Plugin _'" + pluginName + "'_ already installed!*\n";
          continue;
        }
        let filePath = pluginDir + "/" + pluginName + ".smd";
        await fs.writeFileSync(filePath, pluginContent, "utf8");
        try {
          require(filePath);
        } catch (requireErr) {
          fs.unlinkSync(filePath);
          responseMessage += "*Invalid :* _" + pluginUrl + "_\n ```" + requireErr + "```\n\n ";
          continue;
        }
        if (!pluginsMap[pluginName]) {
          pluginsMap[pluginName] = pluginUrl;
          await bot_.updateOne({
            id: "bot_" + contextObj.user
          }, {
            plugins: pluginsMap
          });
          responseMessage += "*Plugin _'" + pluginName + "'_ Succesfully installed!*\n";
        }
      }
    } else if (action.toLowerCase() === "remove") {
      if (source === "all") {
        let removedNames = "";
        for (const name in pluginsMap) {
          try {
            fs.unlinkSync(pluginDir + "/" + name + ".smd");
            removedNames = "" + removedNames + name + ",";
          } catch (err) {
            console.log("❌ " + name + " ❌ NOT BE REMOVED", err);
          }
        }
        await bot_.updateOne({
          id: "bot_" + contextObj.user
        }, {
          plugins: {}
        });
        responseMessage = "*External plugins " + (removedNames ? removedNames : "all") + " removed!!!*";
      } else {
        try {
          if (pluginsMap[source]) {
            try {
              fs.unlinkSync(pluginDir + "/" + source + ".smd");
            } catch {}
            delete pluginsMap[source];
            await bot_.updateOne({
              id: "bot_" + contextObj.user
            }, {
              plugins: pluginsMap
            });
            responseMessage += "*Plugin _'" + source + "'_ Succesfully removed!*";
          } else {
            responseMessage += "*_plugin not exist in " + Config.botname + "_*";
          }
        } catch (err) {
          console.log("Error while removing plugins \n ", err);
        }
      }
    } else if (action.toLowerCase() === "plugins") {
      if (source) {
        responseMessage = pluginsMap[source] ? "*_" + source + ":_* " + pluginsMap[source] : false;
      } else {
        for (const name in pluginsMap) {
          responseMessage += "*" + (name + 1) + ":* " + name + " \n*Url:* " + pluginsMap[name] + "\n\n";
        }
      }
    }
    return responseMessage;
  } catch (err) {
    console.log("Plugins : ", err);
    return (responseMessage + " \n\nError: " + err).trim();
  }
}

async function updateProfilePicture(contextObj, jid, messageOrStream, type = "pp") {
  try {
    if (type === "pp" || type === "gpp") {
      let saved = await contextObj.bot.downloadAndSaveMediaMessage(messageOrStream);
      await contextObj.bot.updateProfilePicture(jid, {
        url: saved
      });
    } else {
      async function prepareImage(bufOrPath) {
        const image = await Jimp.read(bufOrPath);
        const width = image.getWidth();
        const height = image.getHeight();
        const cropped = image.crop(0, 0, width, height);
        return {
          img: await cropped.scaleToFit(324, 720).getBufferAsync(Jimp.MIME_JPEG),
          preview: await cropped.normalize().getBufferAsync(Jimp.MIME_JPEG)
        };
      }
      try {
        const fileBuffer = await messageOrStream.download();
        const queryFn = contextObj.bot.query;
        const { preview } = await prepareImage(fileBuffer);
        await queryFn({
          tag: "iq",
          attrs: {
            to: jid,
            type: "set",
            xmlns: "w:profile:picture"
          },
          content: [{
            tag: "picture",
            attrs: {
              type: "image"
            },
            content: preview
          }]
        });
      } catch (err) {
        let saved = await contextObj.bot.downloadAndSaveMediaMessage(messageOrStream);
        await contextObj.bot.updateProfilePicture(jid, {
          url: saved
        });
        return await contextObj.error(err + " \n\ncommand: update pp", err, false);
      }
    }
    return await contextObj.reply("*_Profile icon updated Succesfully!!_*");
  } catch (err) {
    return await contextObj.error(err + " \n\ncommand: " + (type ? type : "pp"), err);
  }
}

async function forwardMessage(destJid, contextMessage, flag = "") {
  let quotedType = contextMessage.quoted.mtype;
  let payload;
  if (quotedType === "videoMessage" && flag === "ptv") {
    payload = {
      ptvMessage: {
        ...contextMessage.quoted
      }
    };
  } else if (quotedType === "videoMessage") {
    payload = {
      videoMessage: {
        ...contextMessage.quoted
      }
    };
  } else if (quotedType === "imageMessage") {
    payload = {
      imageMessage: {
        ...contextMessage.quoted
      }
    };
  } else if (quotedType === "audioMessage") {
    payload = {
      audioMessage: {
        ...contextMessage.quoted
      }
    };
  } else if (quotedType === "documentMessage") {
    payload = {
      documentMessage: {
        ...contextMessage.quoted
      }
    };
  } else if (quotedType === "conversation" || quotedType === "extendedTextMessage") {
    return await contextMessage.send(contextMessage.quoted.text, {}, "", contextMessage, destJid);
  }
  if (payload) {
    try {
      await Suhail.bot.relayMessage(destJid, payload, {
        messageId: contextMessage.key.id
      });
    } catch (err) {
      console.log("Error in " + flag + "-cmd in forwardMessage \n", err);
      if (flag === "ptv" || flag === "save") {
        await contextMessage.error(err);
      }
    }
  }
}

async function generateSticker(contextObj, input, metadata = {
  pack: Config.packname,
  author: Config.author
}, notify = true) {
  try {
    const { Sticker } = require("wa-sticker-formatter");
    let sticker = new Sticker(input, {
      ...metadata
    });
    return await contextObj.bot.sendMessage(contextObj.chat, {
      sticker: await sticker.toBuffer()
    }, {
      quoted: contextObj,
      messageId: contextObj.bot.messageId()
    });
  } catch (err) {
    if (notify) {
      await contextObj.error(err + "\n\nfileName: generateSticker->s.js\n");
    }
  }
}

async function getRandom(ext = ".jpg", max = 10000) {
  return "" + Math.floor(Math.random() * max) + ext;
}

async function randomeFunfacts(type) {
  try {
    if (type === "question") {
      return await random_question();
    } else if (type === "truth") {
      return await truth();
    } else if (type === "dare") {
      return await dare();
    } else if (type === "joke") {
      const joke = await (await fetch("https://official-joke-api.appspot.com/random_joke")).json();
      return "*Joke :* " + joke.setup + "\n*Punchline:*  " + joke.punchline;
    } else if (type === "joke2") {
      const joke2 = await (await fetch("https://v2.jokeapi.dev/joke/Any?type=single")).json();
      return "*joke :* " + joke2.joke;
    } else if (type === "fact") {
      const { data } = await axios.get("https://nekos.life/api/v2/fact");
      return "*Fact:* " + data.fact;
    } else if (type === "quotes") {
      const { data } = await axios.get("https://favqs.com/api/qotd");
      return "╔════◇\n║ *🎗️Content:* " + data.quote.body + "\n║ *👤Author:* " + data.quote.author + "\n║\n╚════════════╝";
    }
  } catch (err) {
    msg.error(err);
    console.log("./lib/asta.js/randomeFunfacts()\n", err);
  }
}

async function audioEditor(contextObj, mode = "bass", fallback = "") {
  if (!contextObj.quoted) {
    return await contextObj.send("*_Uhh Dear, Reply to audio!!!_*");
  }
  let msgType = contextObj.quoted.mtype || contextObj.mtype;
  if (!/audio/.test(msgType)) {
    return await contextObj.send("*_Reply to the audio you want to change with_*", {}, "", fallback);
  }
  try {
    let ffmpegFilter = "-af equalizer=f=54:width_type=o:width=2:g=20";
    if (/bass/.test(mode)) {
      ffmpegFilter = "-af equalizer=f=54:width_type=o:width=2:g=20";
    }
    if (/blown/.test(mode)) {
      ffmpegFilter = "-af acrusher=.1:1:64:0:log";
    }
    if (/deep/.test(mode)) {
      ffmpegFilter = "-af atempo=4/4,asetrate=44500*2/3";
    }
    if (/earrape/.test(mode)) {
      ffmpegFilter = "-af volume=12";
    }
    if (/fast/.test(mode)) {
      ffmpegFilter = "-filter:a \"atempo=1.63,asetrate=44100\"";
    }
    if (/fat/.test(mode)) {
      ffmpegFilter = "-filter:a \"atempo=1.6,asetrate=22100\"";
    }
    if (/nightcore/.test(mode)) {
      ffmpegFilter = "-filter:a atempo=1.06,asetrate=44100*1.25";
    }
    if (/reverse/.test(mode)) {
      ffmpegFilter = "-filter_complex \"areverse\"";
    }
    if (/robot/.test(mode)) {
      ffmpegFilter = "-filter_complex \"afftfilt=real='hypot(re,im)*sin(0)':imag='hypot(re,im)*cos(0)':win_size=512:overlap=0.75\"";
    }
    if (/slow/.test(mode)) {
      ffmpegFilter = "-filter:a \"atempo=0.7,asetrate=44100\"";
    }
    if (/smooth/.test(mode)) {
      ffmpegFilter = "-filter:v \"minterpolate='mi_mode=mci:mc_mode=aobmc:vsbmc=1:fps=120'\"";
    }
    if (/tupai/.test(mode)) {
      ffmpegFilter = "-filter:a \"atempo=0.5,asetrate=65100\"";
    }
    let saved = await contextObj.bot.downloadAndSaveMediaMessage(contextObj.quoted);
    let outPath = "temp/" + (contextObj.sender.slice(6) + mode) + ".mp3";
    exec("ffmpeg -i " + saved + " " + ffmpegFilter + " " + outPath, async (execErr) => {
      try {
        fs.unlinkSync(saved);
      } catch {}
      if (execErr) {
        return contextObj.error(execErr);
      } else {
        let outBuffer = fs.readFileSync(outPath);
        try {
          fs.unlinkSync(outPath);
        } catch {}
        var contextInfo = {
          ...(await contextObj.bot.contextInfo("Hellow " + contextObj.senderName + " 🤍", "⇆ㅤ ||◁ㅤ❚❚ㅤ▷||ㅤ ⇆"))
        };
        return contextObj.bot.sendMessage(contextObj.chat, {
          audio: outBuffer,
          mimetype: "audio/mpeg",
          ptt: /ptt|voice/.test(contextObj.test || "") ? true : false,
          contextInfo: contextInfo
        }, {
          quoted: contextObj,
          messageId: contextObj.bot.messageId()
        });
      }
    });
  } catch (err) {
    await contextObj.error(err + "\n\ncmdName : " + mode + "\n");
    return console.log("./lib/asta.js/audioEditor()\n", err);
  }
}

async function send(contextObj, media, metadata = {
  packname: "",
  author: "Asta-Md"
}, quoted = "", type = "", dest = "") {
  if (!media || !contextObj) {
    return;
  }
  try {
    let target = dest ? dest : contextObj.chat;
    return await contextObj.send(media, metadata, quoted, type, target);
  } catch (err) {
    console.log("./lib/asta.js/send()\n", err);
  }
}

async function react(contextObj, emoji, msgObj = "") {
  try {
    if (!emoji || !contextObj) {
      return;
    }
    let key = msgObj && msgObj.key ? msgObj.key : contextObj.key;
    return await contextObj.bot.sendMessage(contextObj.chat, {
      react: {
        text: emoji,
        key: key
      }
    }, {
      messageId: contextObj.bot.messageId()
    });
  } catch (err) {
    console.log("./lib/asta.js/react()\n", err);
  }
}

let note = {
  info: "make sure to provide 1st parameter of bot number as {user:botNumber} ,and 2nd as note text|id"
};

note.addnote = async (contextObj, text) => {
  try {
    let botEntry = (await bot_.findOne({
      id: "bot_" + contextObj.user
    })) || (await bot_.new({
      id: "bot_" + contextObj.user
    }));
    let notes = botEntry.notes;
    let id = 0;
    while (notes[id] !== undefined) {
      id++;
    }
    notes[id] = text;
    await bot_.updateOne({
      id: "bot_" + contextObj.user
    }, {
      notes: notes
    });
    return {
      status: true,
      id: id,
      msg: "*New note added at ID: " + id + "*"
    };
  } catch (err) {
    console.log("note.addnote ERROR :  ", err);
    return {
      status: false,
      error: err,
      msg: "*Can't add new notes due to error!!*"
    };
  }
};

note.delnote = async (contextObj, id) => {
  try {
    let botEntry = (await bot_.findOne({
      id: "bot_" + contextObj.user
    })) || (await bot_.new({
      id: "bot_" + contextObj.user
    }));
    let notes = botEntry.notes;
    let msg = "*Please provide valid note id!*";
    if (notes[id]) {
      delete notes[id];
      await bot_.updateOne({
        id: "bot_" + contextObj.user
      }, {
        notes: notes
      });
      msg = "*Note with Id:" + id + " deleted successfully!*";
    }
    return {
      status: true,
      msg: msg
    };
  } catch (err) {
    console.log("note.delnote  ERROR :  ", err);
    return {
      status: false,
      error: err,
      msg: "*Can't delete notes due to error!!*"
    };
  }
};

note.delallnote = async (contextObj) => {
  try {
    await bot_.updateOne({
      id: "bot_" + contextObj.user
    }, {
      notes: {}
    });
    return {
      status: true,
      msg: "*All saved notes deleted from server!*"
    };
  } catch (err) {
    console.log("note.delnote  ERROR :  ", err);
    return {
      status: false,
      error: err,
      msg: "*Request not be proceed, Sorry!*"
    };
  }
};

note.allnotes = async (contextObj, which = "") => {
  try {
    let botEntry = (await bot_.findOne({
      id: "bot_" + contextObj.user
    })) || (await bot_.new({
      id: "bot_" + contextObj.user
    }));
    let notes = botEntry.notes;
    let result = "*Please provide valid note id!*";
    if (which == "all" || !which) {
      let out = "";
      for (const id in notes) {
        out += "*NOTE " + id + ":* " + notes[id] + "\n\n";
      }
      result = out ? out : "*No notes found!*";
    } else if (which && notes[which]) {
      result = "*Note " + which + ":* " + notes[which];
    }
    return {
      status: true,
      msg: result
    };
  } catch (err) {
    console.log("note.delnote  ERROR :  ", err);
    return {
      status: false,
      error: err,
      msg: "*Can't delete notes due to error!!*"
    };
  }
};

async function sendWelcome(contextObj, template = "", quoted = "", mentioned = "", mode = "msg", ctxInfo = false) {
  try {
    if (!global.AstroOfficial) {
      return "Get Ouut";
    }
    if (template) {
      if (contextObj.isGroup) {
        template = template.replace(/@gname|&gname/gi, contextObj.metadata.subject).replace(/@desc|&desc/gi, contextObj.metadata.desc).replace(/@count|&count/gi, contextObj.metadata.participants.length);
      }
      let text = template.replace(/@user|&user/gi, "@" + contextObj.senderNum).replace(/@name|&name/gi, contextObj.senderName || "_").replace(/@gname|&gname/gi, "").replace(/@desc|&desc/gi, "").replace(/@count|&count/gi, "1").replace(/@pp|&pp|@gpp|&gpp|@context|&context/g, "").replace(/@time|&time/gi, contextObj.time).replace(/@date|&date/gi, contextObj.date).replace(/@bot|&bot/gi, "" + Config.botname).replace(/@owner|&owner/gi, "" + Config.ownername).replace(/@caption|&caption/gi, caption).replace(/@gurl|@website|&gurl|&website|@link|&link/gi, gurl).replace(/@myyt|&myyt/gi, "https://github/Astropeda").replace(/@telegram|&telegram/gi, global.telegram || "https://t.me/Astropeda").replace(/@channel|@yt_channel|&channel|&yt_channel/gi, global.YT_PRODUCT || global.YT_CHANNEL || global.YT_PROMOTE || global.YT || "https://github/Astropeda").replace(/@runtime|&runtime|@uptime|&uptime/gi, "" + runtime(process.uptime())).trim();
      try {
        text = text.replace(/@line|&line/gi, (await fetchJson("https://api.popcat.xyz/pickuplines")).pickupline || "");
      } catch (e) {
        text = text.replace(/@line|&line/gi, "");
      }
      try {
        if (/@quote|&quote/gi.test(text)) {
          let { data } = await axios.get("https://favqs.com/api/qotd");
          if (data && data.quote) {
            text = text.replace(/@quote|&quote/gi, data.quote.body || "").replace(/@author|&author/gi, data.quote.author || "");
          }
        }
      } catch (e) {
        text = text.replace(/@quote|&quote|@author|&author/gi, "");
      }
      if (!mode || mode === "msg") {
        try {
          if (typeof ctxInfo === "string") {
            ctxInfo = ctxInfo.split(",");
          }
          if (/@user|&user/g.test(template) && !ctxInfo.includes(contextObj.sender)) {
            ctxInfo.push(contextObj.sender);
          }
        } catch (e) {
          console.log("ERROR : ", e);
        }
        var contextPayload = {
          ...(ctxInfo || /@context|&context/g.test(template) ? await contextObj.bot.contextInfo(Config.botname, contextObj.pushName) : {}),
          mentionedJid: ctxInfo
        };
        if (/@pp/g.test(template)) {
          return await contextObj.send(await contextObj.getpp(), {
            caption: text,
            mentions: ctxInfo,
            contextInfo: contextPayload
          }, "image", quoted);
        } else if (contextObj.jid && /@gpp/g.test(template)) {
          return await contextObj.send(await contextObj.getpp(contextObj.jid), {
            caption: text,
            mentions: ctxInfo,
            contextInfo: contextPayload
          }, "image", quoted);
        } else {
          return await contextObj.send(text, {
            mentions: ctxInfo,
            contextInfo: contextPayload
          }, "asta", quoted);
        }
      } else {
        return text;
      }
    }
  } catch (err) {
    console.log("./lib/asta.js/sendWelcome()\n", err);
  }
}

async function aitts(contextObj, textAndVoice = "", notify = true) {
  try {
    if (!global.AstroOfficial || global.AstroOfficial !== "yes") {
      return "u bloody, Get out from here!!";
    }
    if (!ELEVENLAB_API_KEY || !ELEVENLAB_API_KEY.length > 8) {
      return contextObj.reply("Dear, You Dont Have ELEVENLAB_API_KEY \nCreate ELEVENLAB KEY from below Link \nhttps://elevenlabs.io/\n\nAnd Set it in ELEVENLAB_API_KEY Var\n\n" + caption);
    }
    const voices = ["21m00Tcm4TlvDq8ikWAM", "2EiwWnXFnvU5JabPnv8n", "AZnzlk1XvdvUeBnXmlld", "CYw3kZ02Hs0563khs1Fj", "D38z5RcWu1voky8WS1ja", "EXAVITQu4vr4xnSDxMaL", "ErXwobaYiN019PkySvjV", "GBv7mTt0atIp3Br8iCZE", "IKne3meq5aSn9XLyUdCD", "LcfcDJNUP1GQjkzn1xUU", "MF3mGyEYCl7XYWbV9V6O", "N2lVS1w4EtoT3dr4eOWO", "ODq5zmih8GrVes37Dizd", "SOYHLrjzK2X1ezoPC6cr", "TX3LPaxmHKxFdv7VOQHJ", "ThT5KcBeYPX3keUQqHPh", "TxGEqnHWrfWFTfGW9XjX", "VR6AewLTigWG4xSOukaG", "XB0fDUnXU5powFXDhCwa", "XrExE9yKIg1WjnnlVkGX", "Yko7PKHZNXotIFUBG7I9", "ZQe5CZNOzWyzPSCn5a3c", "Zlb1dXrM653N07WRdFW3", "bVMeCyTHy58xNoL34h3p", "flq6f7yk4E4fJM5XTYuZ", "g5CIjZEefAph4nQFvHAz", "jBpfuIE2acCO8z3wKNLl", "jsCqWAovK2LkecY7zXl4", "oWAxZDx7w5VEj9dCyTzz", "onwK4e9ZLuTAKqWW03F9", "pMsXgVXv3BLzUgSXRplE", "pNInz6obpgDQGcFmaJgB", "piTKgcLEGmPE4e6mEKli", "t0jbNlBVZ17f02VDIeMI", "wViXBPUzp2ZZixB1xQuM", "yoZ06aMxZJJ28mfd3POQ", "z9fAnlkpzviPz146aGWa", "zcAOhNBS3c14rBihAFp1", "zrHiDhphv9ZnVXBqCLjz"];
    const configuredVoiceId = parseInt(aitts_Voice_Id);
    if (!textAndVoice && !contextObj.isCreator) {
      return contextObj.reply("*Uhh Dear, Please Provide text..!*\n*Example: _.aitts i am " + contextObj.pushName + "._*");
    } else if (!textAndVoice && contextObj.isCreator || textAndVoice === "setting" || textAndVoice === "info") {
      return contextObj.bot.sendMessage(contextObj.jid, {
        text: "*Hey " + contextObj.pushName + "!.*\n  _Please provide text!_\n  *Example:* _.aitts i am " + contextObj.pushName + "._\n\n  *You Currently " + (!isNaN(configuredVoiceId) && configuredVoiceId > 0 && configuredVoiceId <= 39 ? "set Voice Id: " + configuredVoiceId + "*\nUpdate" : "not set any Specific Voice*\nAdd Specific") + " Voice: _.addvar AITTS_ID:35/4/32,etc._\n\n\n  *Also use available voices*```\n\n  1: Rachel\n  2: Clyde\n  3: Domi\n  4: Dave\n  5: Fin\n  6: Bella\n  7: Antoni\n  8: Thomas\n  9: Charlie\n  10: Emily\n  11: Elli\n  12: Callum\n  13: Patrick\n  14: Harry\n  15: Liam\n  16: Dorothy\n  17: Josh\n  18: Arnold\n  19: Charlotte\n  20: Matilda\n  21: Matthew\n  22: James\n  23: Joseph\n  24: Jeremy\n  25: Michael\n  26: Ethan\n  27: Gigi\n  28: Freya\n  29: Grace\n  30: Daniel\n  31: Serena\n  32: Adam\n  33: Nicole\n  34: Jessie\n  35: Ryan\n  36: asta\n  37: Glinda\n  38: Giovanni\n  39: Mimi\n  ```" + ("\n\n  *Example:* _.aitts i am " + contextObj.pushName + "_:36 \n  *OR:* _.aitts i am " + contextObj.pushName + "_:asta     \n\n\n  " + caption).trim()
      }, {
        messageId: contextObj.bot.messageId()
      });
    }
    let text = textAndVoice;
    var voiceIndex = 0 || Math.floor(Math.random() * voices.length);
    let useConfiguredVoice = false;
    if (!isNaN(configuredVoiceId) && configuredVoiceId > 0 && configuredVoiceId < 39) {
      useConfiguredVoice = true;
      voiceIndex = configuredVoiceId;
    }
    if (textAndVoice && textAndVoice.includes(":")) {
      let parts = textAndVoice.split(":");
      let lastPart = parts[parts.length - 1].trim() || "";
      text = parts.slice(0, parts.length - 1).join(":");
      if (lastPart.toLowerCase() === "richel" || lastPart === "1") {
        voiceIndex = 0;
      } else if (lastPart.toLowerCase() === "clyde" || lastPart === "2") {
        voiceIndex = 1;
      } else if (lastPart.toLowerCase() === "domi" || lastPart === "3") {
        voiceIndex = 2;
      } else if (lastPart.toLowerCase() === "dave" || lastPart === "4") {
        voiceIndex = 3;
      } else if (lastPart.toLowerCase() === "fin" || lastPart === "5") {
        voiceIndex = 4;
      } else if (lastPart.toLowerCase() === "bella" || lastPart === "6") {
        voiceIndex = 5;
      } else if (lastPart.toLowerCase() === "antoni" || lastPart === "7") {
        voiceIndex = 6;
      } else if (lastPart.toLowerCase() === "thomas" || lastPart === "8") {
        voiceIndex = 7;
      } else if (lastPart.toLowerCase() === "charlie" || lastPart === "9") {
        voiceIndex = 8;
      } else if (lastPart.toLowerCase() === "emily" || lastPart === "10") {
        voiceIndex = 9;
      } else if (lastPart.toLowerCase() === "elli" || lastPart === "11") {
        voiceIndex = 10;
      } else if (lastPart.toLowerCase() === "callum" || lastPart === "12") {
        voiceIndex = 11;
      } else if (lastPart.toLowerCase() === "patrick" || lastPart === "13") {
        voiceIndex = 12;
      } else if (lastPart.toLowerCase() === "harry" || lastPart === "14") {
        voiceIndex = 13;
      } else if (lastPart.toLowerCase() === "liam" || lastPart === "15") {
        voiceIndex = 14;
      } else if (lastPart.toLowerCase() === "dorothy" || lastPart === "16") {
        voiceIndex = 15;
      } else if (lastPart.toLowerCase() === "josh" || lastPart === "17") {
        voiceIndex = 16;
      } else if (lastPart.toLowerCase() === "arnold" || lastPart === "18") {
        voiceIndex = 17;
      } else if (lastPart.toLowerCase() === "charlotte" || lastPart === "19") {
        voiceIndex = 18;
      } else if (lastPart.toLowerCase() === "matilda" || lastPart === "20") {
        voiceIndex = 19;
      } else if (lastPart.toLowerCase() === "matthew" || lastPart === "21") {
        voiceIndex = 20;
      } else if (lastPart.toLowerCase() === "james" || lastPart === "22") {
        voiceIndex = 21;
      } else if (lastPart.toLowerCase() === "joseph" || lastPart === "23") {
        voiceIndex = 22;
      } else if (lastPart.toLowerCase() === "jeremy" || lastPart === "24") {
        voiceIndex = 23;
      } else if (lastPart.toLowerCase() === "michael" || lastPart === "25") {
        voiceIndex = 24;
      } else if (lastPart.toLowerCase() === "ethan" || lastPart === "26") {
        voiceIndex = 25;
      } else if (lastPart.toLowerCase() === "gigi" || lastPart === "27") {
        voiceIndex = 26;
      } else if (lastPart.toLowerCase() === "freya" || lastPart === "28") {
        voiceIndex = 27;
      } else if (lastPart.toLowerCase() === "grace" || lastPart === "29") {
        voiceIndex = 28;
      } else if (lastPart.toLowerCase() === "daniel" || lastPart === "30") {
        voiceIndex = 29;
      } else if (lastPart.toLowerCase() === "serena" || lastPart === "31") {
        voiceIndex = 30;
      } else if (lastPart.toLowerCase() === "adam" || lastPart === "32") {
        voiceIndex = 31;
      } else if (lastPart.toLowerCase() === "nicole" || lastPart === "33") {
        voiceIndex = 32;
      } else if (lastPart.toLowerCase() === "jessie" || lastPart === "34") {
        voiceIndex = 33;
      } else if (lastPart.toLowerCase() === "ryan" || lastPart === "35") {
        voiceIndex = 34;
      } else if (lastPart.toLowerCase() === "asta" || lastPart === "36") {
        voiceIndex = 35;
      } else if (lastPart.toLowerCase() === "glinda" || lastPart === "37") {
        voiceIndex = 36;
      } else if (lastPart.toLowerCase() === "giovanni" || lastPart === "38") {
        voiceIndex = 37;
      } else if (lastPart.toLowerCase() === "mimi" || lastPart === "39") {
        voiceIndex = 38;
      } else {
        text = textAndVoice;
        voiceIndex = voiceIndex;
      }
    }
    const requestOptions = {
      method: "POST",
      url: "https://api.elevenlabs.io/v1/text-to-speech/" + voices[voiceIndex],
      headers: {
        accept: "audio/mpeg",
        "content-type": "application/json",
        "xi-api-key": "" + ELEVENLAB_API_KEY
      },
      data: {
        text: text
      },
      responseType: "arraybuffer"
    };
    const { data: audioData } = await axios.request(requestOptions);
    if (!audioData) {
      return await contextObj.send("*_Request not be proceed!_*");
    }
    await contextObj.sendMessage(contextObj.from, {
      audio: audioData,
      mimetype: "audio/mpeg",
      ptt: true
    }, {
      quoted: contextObj,
      messageId: contextObj.bot.messageId()
    });
  } catch (err) {
    if (notify) {
      await contextObj.error(err + "\n\ncommand: aitts", err);
    }
  }
}

let setMention = {
  mention: false
};

setMention.status = async (contextObj, enable = false) => {
  try {
    setMention.mention = false;
    let botEntry = (await bot_.findOne({
      id: "bot_" + contextObj.user
    })) || (await bot_.new({
      id: "bot_" + contextObj.user
    }));
    let mentionConfig = botEntry.mention || {};
    if (enable) {
      if (mentionConfig.status) {
        return await contextObj.reply("_Mention Already Enabled!_");
      }
      mentionConfig.status = true;
      await bot_.updateOne({
        id: "bot_" + contextObj.user
      }, {
        mention: mentionConfig
      });
      return await contextObj.reply("_Mention Enabled!_");
    } else {
      if (!mentionConfig.status) {
        return await contextObj.reply("_Mention Already Disabled!_");
      }
      mentionConfig.status = false;
      await bot_.updateOne({
        id: "bot_" + contextObj.user
      }, {
        mention: mentionConfig
      });
      return await contextObj.reply("_Mention Disabled!_");
    }
  } catch (err) {
    contextObj.error(err + "\n\nCommand: mention", err, false);
  }
};

setMention.get = async (contextObj) => {
  try {
    let botEntry = (await bot_.findOne({
      id: "bot_" + contextObj.user
    })) || (await bot_.new({
      id: "bot_" + contextObj.user
    }));
    let mentionConfig = botEntry.mention || {};
    if (mentionConfig.get) {
      return await contextObj.reply("*Status :* " + (mentionConfig.status ? "ON" : "OFF") + "\nUse on/off/get/test to enable and disable mention\n\n*Mention Info:* " + mentionConfig.get);
    } else {
      return await contextObj.reply("*You did'nt set mention message yet!*\n*please Check: https://github.com/SuhailTechInfo/Suhail-Md/wiki/mention*");
    }
  } catch (err) {
    contextObj.error(err + "\n\nCommand: mention", err, false);
  }
};

setMention.typesArray = (textBlock) => {
  try {
    const lines = textBlock.split("\n");
    let types = {
      text: []
    };
    let mediaTypes = ["gif", "video", "audio", "image", "sticker"];
    let currentType = null;
    for (const line of lines) {
      const parts = line.split(" ");
      if (parts.length >= 1) {
        const typeIndex = parts.findIndex(p => p.startsWith("type/"));
        if (typeIndex !== -1) {
          currentType = parts[typeIndex].slice(5).toLowerCase();
          let isAsta = /asta|smd|message|chat/gi.test(currentType);
          if (!types[isAsta ? "asta" : currentType]) {
            types[isAsta ? "asta" : currentType] = [];
          }
        }
        const contentParts = parts.filter(p => p !== "type/" + currentType && p !== "");
        currentType = /asta|smd|message|chat/gi.test(currentType) ? "asta" : currentType;
        if (contentParts.length > 0) {
          if (mediaTypes.includes(currentType)) {
            contentParts.forEach(p => {
              if (/http/gi.test(p)) {
                types[currentType].push(p);
              }
            });
          } else if (/react/gi.test(currentType)) {
            types.react.push(...contentParts);
          } else {
            types[/asta/gi.test(currentType) ? "asta" : "text"].push(contentParts.join(" "));
          }
        }
      }
      currentType = null;
    }
    return types || {};
  } catch (err) {
    console.log("Error in Mention typesArray\n", err);
  }
};

setMention.update = async (contextObj, newText) => {
  try {
    setMention.mention = false;
    let config = {
      status: true,
      get: newText
    };
    try {
      const jsonMatch = newText.match(/\{.*\}/);
      if (jsonMatch) {
        const jsonStr = jsonMatch[0];
        const parsed = JSON.parse(jsonStr);
        config.json = parsed;
        newText = newText.replace(/\{.*\}/, "");
      }
    } catch (err) {
      console.log("ERROR mention JSON parse", err);
    }
    config.text = newText;
    config.type = setMention.typesArray(newText) || {};
    await bot_.updateOne({
      id: "bot_" + contextObj.user
    }, {
      mention: config
    });
    return await contextObj.send("*Mention updated!*", {
      mentios: [contextObj.user]
    });
  } catch (err) {
    contextObj.error(err + "\n\nCommand: mention", err, false);
  }
};

setMention.cmd = async (contextObj, arg = "") => {
  try {
    let mentionCache = setMention.mention || false;
    if (!mentionCache) {
      let botEntry = (await bot_.findOne({
        id: "bot_" + contextObj.user
      })) || (await bot_.new({
        id: "bot_" + contextObj.user
      }));
      mentionCache = botEntry.mention || false;
      setMention.mention = mentionCache;
    }
    if (global.AstroOfficial !== "yes") {
      return;
    }
    if (arg === "get" || arg === "info" || !arg && mentionCache.status && mentionCache.get) {
      setMention.get(contextObj);
    } else if (!arg) {
      contextObj.reply("_Read wiki to set mention message https://github.com/SuhailTechInfo/Suhail-Md/wiki/mention_", {}, "smd");
    } else if (["off", "deact", "disable", "false"].includes(arg.toLowerCase() || arg)) {
      setMention.status(contextObj, false);
    } else if (["on", "act", "enable", "true", "active"].includes(arg.toLowerCase() || arg)) {
      setMention.status(contextObj, true);
    } else if (["check", "test", "me"].includes(arg.toLowerCase() || arg)) {
      setMention.check(contextObj, arg, true);
    } else {
      setMention.update(contextObj, arg);
    }
  } catch (err) {
    console.log("ERROR IN MENTION CMD \n ", err);
  }
};

setMention.randome = (mentionTypes) => {
  try {
    const keys = Object.keys(mentionTypes || {});
    if (keys.length > 1) {
      const typeKey = keys[Math.floor(Math.random() * (keys.length - 1)) + 1];
      const arr = mentionTypes[typeKey];
      if (arr && arr.length > 0) {
        const idx = Math.floor(Math.random() * arr.length);
        return {
          type: typeKey,
          url: arr[idx]
        };
      }
    }
    if (mentionTypes && mentionTypes.text) {
      return {
        url: mentionTypes.text.join(" ") || "",
        type: "smd"
      };
    } else {
      return undefined;
    }
  } catch (err) {
    console.log(err);
  }
};

global.mentionasta = process.env.MENTIONSUHAIL || true;

setMention.check = async (contextObj, text = "", forced = false) => {
  try {
    const shouldReact = forced || contextObj.mentionedJid.includes(contextObj.user) || text.includes("@" + contextObj.user.split("@")[0]) || global.mentionasta && (contextObj.mentionedJid.includes("@256754550399@s.whatsapp.net") || contextObj.mentionedJid.includes("@2349027862116@s.whatsapp.net") || /@2348039607375|@256754550399/g.test(text));
    if (shouldReact) {
      if (global.AstroOfficial !== "yes") {
        return;
      }
      let mentionConfig = setMention.mention || false;
      if (!mentionConfig) {
        let botEntry = (await bot_.findOne({
          id: "bot_" + contextObj.user
        })) || (await bot_.new({
          id: "bot_" + contextObj.user
        }));
        mentionConfig = botEntry.mention || false;
        setMention.mention = mentionConfig;
      }
      if (typeof mentionConfig !== "object" || !mentionConfig || !mentionConfig.status) {
        return;
      }
      const pick = setMention.randome(mentionConfig.type);
      if (pick) {
        let sendType = pick.type;
        const options = {};
        if (pick.type === "gif") {
          sendType = "video";
          options.gifPlayback = true;
        }
        try {
          const payloadOptions = {
            ...mentionConfig.json,
            ...options
          };
          if (payloadOptions.contextInfo && payloadOptions.contextInfo.externalAdReply && payloadOptions.contextInfo.externalAdReply.thumbnail) {
            payloadOptions.contextInfo.externalAdReply.thumbnail = (await getBuffer(payloadOptions.contextInfo.externalAdReply.thumbnail)) || log0;
          }
          await contextObj.send(pick.url, payloadOptions, sendType, contextObj);
        } catch (err) {
          console.log("Error Sending ContextInfo in mention ", err);
          try {
            contextObj.send(pick.url, {
              ...options
            }, sendType, contextObj);
          } catch (err2) {}
        }
      }
    }
  } catch (err) {
    console.log("Error in Mention Check\n", err);
  }
};

let mention = setMention;

let setFilter = {
  filter: false
};

setFilter.set = async (contextObj, arg = "") => {
  try {
    if (!arg) {
      return contextObj.send("*Use " + prefix + "filter word:reply_text!*");
    }
    let [word, reply] = arg.split(":").map(s => s.trim());
    if (!word || !reply) {
      return contextObj.send("*Use " + prefix + "filter " + (word || "word") + ": " + (reply || "reply_text") + "!*");
    }
    let botEntry = (await bot_.findOne({
      id: "bot_" + contextObj.user
    })) || (await bot_.new({
      id: "bot_" + contextObj.user
    }));
    let filters = botEntry.filter || {};
    filters[word] = reply;
    setFilter.filter = filters;
    await bot_.updateOne({
      id: "bot_" + contextObj.user
    }, {
      filter: filters
    });
    contextObj.send("*Successfully set filter to '" + word + "'!*");
  } catch (err) {
    contextObj.error(err + "\n\nCommand:filter", err, "_Can't set filter!_");
  }
};

setFilter.stop = async (contextObj, word = "") => {
  try {
    if (!word) {
      return contextObj.send("*Provide a word that set in filter!*\n*Use " + prefix + "flist to get list of filtered words!*");
    }
    let botEntry = (await bot_.findOne({
      id: "bot_" + contextObj.user
    })) || (await bot_.new({
      id: "bot_" + contextObj.user
    }));
    let filters = botEntry.filter || {};
    if (!filters[word]) {
      return contextObj.reply("*Given Word ('" + word + "') not set to any filter!*");
    }
    delete filters[word];
    setFilter.filter = filters;
    await bot_.updateOne({
      id: "bot_" + contextObj.user
    }, {
      filter: filters
    });
    contextObj.reply("*_Filter word '" + word + "' deleted!_*");
  } catch (err) {
    contextObj.error(err + "\n\nCommand:fstop", err, "*Can't delete filter!*");
  }
};

setFilter.list = async (contextObj) => {
  try {
    let botEntry = (await bot_.findOne({
      id: "bot_" + contextObj.user
    })) || (await bot_.new({
      id: "bot_" + contextObj.user
    }));
    let filters = botEntry.filter || {};
    let out = Object.entries(filters).map(([k, v]) => k + " : " + v).join("\n");
    if (botEntry.filter && out) {
      contextObj.reply("*[LIST OF FILTERED WORDS]*\n\n" + out);
    } else {
      contextObj.reply("*_You didn't set any filter!_*");
    }
  } catch (err) {
    contextObj.error(err + "\n\nCommand:flist", err, false);
  }
};

setFilter.check = async (contextObj, word = "") => {
  try {
    let filters = setFilter.filter || false;
    if (!filters) {
      let botEntry = (await bot_.findOne({
        id: "bot_" + contextObj.user
      })) || (await bot_.new({
        id: "bot_" + contextObj.user
      }));
      filters = botEntry.filter || {};
      setFilter.filter = botEntry.filter || {};
    }
    if (filters[word]) {
      contextObj.reply(filters[word], {}, "smd", contextObj);
    }
  } catch (err) {
    console.log(err);
  }
};

let filter = setFilter;

module.exports = {
  yt: yt,
  sendAnimeReaction: sendAnimeReaction,
  sendGImages: sendGImages,
  AudioToBlackVideo: AudioToBlackVideo,
  textToLogoGenerator: textToLogoGenerator,
  photoEditor: photoEditor,
  updateProfilePicture: updateProfilePicture,
  randomeFunfacts: randomeFunfacts,
  plugins: plugins,
  getRandom: getRandom,
  generateSticker: generateSticker,
  forwardMessage: forwardMessage,
  audioEditor: audioEditor,
  send: send,
  react: react,
  note: note,
  sendWelcome: sendWelcome,
  aitts: aitts,
  mention: mention,
  filter: filter
};