const {
  updateProfilePicture,
  parsedJid
} = require("../lib");
const {
  sck,
  smd,
  send,
  Config,
  tlang,
  sleep,
  getAdmin,
  prefix
} = require("../lib");
const astro_patch = require("../lib/plugins");
const {
  cmd
} = astro_patch;
const grouppattern = /https:\/\/chat\.whatsapp\.com\/[A-Za-z0-9]{22}/g;

smd({
  cmdname: "join",
  info: "joins group by link",
  type: "whatsapp",
  fromMe: true,
  filename: __filename,
  use: "<group link.>"
}, async (msg, inputArg) => {
  try {
    if (msg.reply_message && msg.reply_message.groupInvite) {
      var acceptResult = await msg.bot.groupAcceptInviteV4(msg.chat, msg.reply_message.msg);
      if (acceptResult && acceptResult.includes("joined to:")) {
        return await send(msg, "*_Joined_*", {}, "", msg);
      }
    }
    let linkText = inputArg ? inputArg : msg.reply_text;
    const matches = linkText.match(grouppattern);
    if (!matches) {
      return await msg.reply("*_Uhh Please, provide group link_*");
    }
    let inviteCode = matches[0].split("https://chat.whatsapp.com/")[1].trim();
    await msg.bot.groupAcceptInvite(inviteCode)
      .then(() => send(msg, "*_Joined_*", {}, "", msg))
      .catch(() => msg.send("*_Can't Join, Group Id not found!!_*"));
  } catch (error) {
    await msg.error(error + "\n\ncommand: join", error, "*_Can't Join, Group Id not found, Sorry!!_*");
  }
});

smd({
  cmdname: "newgc",
  info: "Create New Group",
  type: "whatsapp",
  filename: __filename,
  use: "<group link.>"
}, async (msg, inputText, {
  smd: invokedCmd,
  cmdName
}) => {
  try {
    if (!msg.isCreator) {
      return msg.reply(tlang().owner);
    }
    if (!inputText) {
      return await msg.reply("*_provide Name to Create new Group!!!_*\n*_Ex: " + (prefix + invokedCmd) + " My Name Group @user1,2,3.._*");
    }
    let groupName = inputText;
    if (groupName.toLowerCase() === "info") {
      return await msg.send(("\n  *Its a command to create new Gc*\n  \t```Ex: " + (prefix + cmd) + " My new Group```\n  \n*You also add peoples in newGc*\n  \t```just reply or mention Users```\n  ").trim());
    }
    let participants = [msg.sender];
    if (msg.quoted) {
      participants.push(msg.quoted.sender);
    }
    if (msg.mentionedJid && msg.mentionedJid[0]) {
      participants.push(...msg.mentionedJid);
      try {
        // attempt to remove mentions from name (if mentionJids variable was intended)
        mentionJids.forEach(jid => {
          var short = jid.split("@")[0].trim();
          groupName = groupName.replace(new RegExp("@" + short, "g"), "");
        });
      } catch {}
    }
    const trimmedName = groupName.substring(0, 60);
    const created = await Suhail.bot.groupCreate(trimmedName, [...participants]);
    if (created) {
      let welcomeMsg = await msg.bot.sendMessage(created.id, {
        text: "*_Hey Master, Welcome to new Group_*\n" + Config.caption
      });
      let inviteCode;
      try {
        inviteCode = await Suhail.bot.groupInviteCode(created.id);
      } catch {
        inviteCode = false;
      }
      const inviteBase = "https://chat.whatsapp.com/";
      const inviteLink = "" + inviteBase + inviteCode;
      const contextInfo = {
        externalAdReply: {
          title: "FUTURE_MD-V2",
          body: "" + trimmedName,
          renderLargerThumbnail: true,
          thumbnail: log0,
          mediaType: 1,
          mediaUrl: inviteLink,
          sourceUrl: inviteLink
        }
      };
      return await send(msg, ("*_Hurray, New group created!!!_*\n" + (inviteCode ? "*_" + inviteLink + "_*" : "")).trim(), {
        contextInfo
      }, "", welcomeMsg);
    } else {
      await msg.send("*_Can't create new group, Sorry!!_*");
    }
  } catch (error) {
    await msg.error(error + "\n\ncommand: " + cmdName, error, "*_Can't create new group, Sorry!!_*");
  }
});

smd({
  pattern: "ginfo",
  desc: "get group info by link",
  type: "group",
  filename: __filename,
  use: "<group link.>"
}, async (msg, inputArg) => {
  try {
    let linkText = inputArg ? inputArg : msg.reply_text;
    const matches = linkText.match(grouppattern) || false;
    if (!matches) {
      return await msg.reply("*_Uhh Please, provide group link_*");
    }
    let inviteCode = matches[0].split("https://chat.whatsapp.com/")[1].trim();
    const inviteInfo = await msg.bot.groupGetInviteInfo(inviteCode);
    if (inviteInfo) {
      const createdAt = new Date(inviteInfo.creation * 1000);
      var year = createdAt.getFullYear();
      var month = createdAt.getMonth() + 1;
      var day = createdAt.getDate();
      var createdDate = year + "-" + month.toString().padStart(2, "0") + "-" + day.toString().padStart(2, "0");
      var contextInfo = {
        externalAdReply: {
          title: "FUTURE_MD-V2",
          body: inviteInfo.subject,
          renderLargerThumbnail: true,
          thumbnail: log0,
          mediaType: 1,
          mediaUrl: matches[0],
          sourceUrl: matches[0]
        }
      };
      return await send(msg, (inviteInfo.subject + "\n  \n  Creator: wa.me/" + inviteInfo.owner.split("@")[0] + " \n  GJid; ```" + inviteInfo.id + "  ```\n  *Muted:* " + (inviteInfo.announce ? " yes" : " no") + "\n  *Locked:* " + (inviteInfo.restrict ? " yes" : " no") + "\n  *createdAt:* " + createdDate + "\n  *participents:* " + (inviteInfo.size > 3 ? inviteInfo.size + "th" : inviteInfo.size) + "\n  " + (inviteInfo.desc ? "*description:* " + inviteInfo.desc + "\n" : "") + "\n  " + Config.caption + "\n  ").trim(), {
        mentions: [inviteInfo.owner],
        contextInfo
      }, "", msg);
    } else {
      await msg.send("*_Group Id not found, Sorry!!_*");
    }
  } catch (error) {
    await msg.error(error + "\n\ncommand: ginfo", error, "*_Group Id not found, Sorry!!_*");
  }
});

smd({
  cmdname: "rejectall",
  alias: ["rejectjoin"],
  info: "reject all request to join!",
  type: "group",
  filename: __filename
}, async (msg, inputArg) => {
  try {
    if (!msg.isGroup) {
      return msg.reply(tlang().group);
    }
    if (!msg.isBotAdmin || !msg.isAdmin) {
      return await msg.reply(!msg.isBotAdmin ? "*_I'm Not Admin In This Group" + (!msg.isCreator ? ", Idiot" : "") + "_*" : tlang().admin);
    }
    const requests = await msg.bot.groupRequestParticipantsList(msg.chat);
    if (!requests || !requests[0]) {
      return await msg.reply("*_No Request Join Yet_*");
    }
    let rejectedList = [];
    let replyText = "*List of rejected users*\n\n";
    for (let i = 0; i < requests.length; i++) {
      try {
        await msg.bot.groupRequestParticipantsUpdate(msg.from, [requests[i].jid], "reject");
        replyText += "@" + requests[i].jid.split("@")[0] + "\n";
        rejectedList = [...rejectedList, requests[i].jid];
      } catch {}
    }
    await msg.send(replyText, {
      mentions: [rejectedList]
    });
  } catch (error) {
    await msg.error(error + "\n\ncommand: rejectall", error);
  }
});

smd({
  cmdname: "acceptall",
  alias: ["acceptjoin"],
  info: "accept all request to join!",
  type: "group",
  filename: __filename
}, async (msg, inputArg) => {
  try {
    if (!msg.isGroup) {
      return msg.reply(tlang().group);
    }
    if (!msg.isBotAdmin || !msg.isAdmin) {
      return await msg.reply(!msg.isBotAdmin ? "*_I'm Not Admin In This Group" + (!msg.isCreator ? ", Idiot" : "") + "_*" : tlang().admin);
    }
    const requests = await msg.bot.groupRequestParticipantsList(msg.chat);
    if (!requests || !requests[0]) {
      return await msg.reply("*_No Join Request Yet_*");
    }
    let acceptedList = [];
    let replyText = "*List of accepted users*\n\n";
    for (let i = 0; i < requests.length; i++) {
      try {
        await msg.bot.groupRequestParticipantsUpdate(msg.from, [requests[i].jid], "approve");
        replyText += "@" + requests[i].jid.split("@")[0] + "\n";
        acceptedList = [...acceptedList, requests[i].jid];
      } catch {}
    }
    await msg.send(replyText, {
      mentions: [acceptedList]
    });
  } catch (error) {
    await msg.error(error + "\n\ncommand: acceptall", error);
  }
});

smd({
  cmdname: "listrequest",
  alias: ["requestjoin"],
  info: "Set Description of Group",
  type: "group",
  filename: __filename,
  use: "<enter Description Text>"
}, async (msg, inputArg) => {
  try {
    if (!msg.isGroup) {
      return msg.reply(tlang().group);
    }
    if (!msg.isBotAdmin || !msg.isAdmin) {
      return await msg.reply(!msg.isBotAdmin ? "*_I'm Not Admin In This Group" + (!msg.isCreator ? ", Idiot" : "") + "_*" : tlang().admin);
    }
    const requests = await msg.bot.groupRequestParticipantsList(msg.chat);
    if (!requests || !requests[0]) {
      return await msg.reply("*_No Request Join Yet_*");
    }
    let jids = [];
    let replyText = "*List of User Request to join*\n\n";
    for (let i = 0; i < requests.length; i++) {
      replyText += "@" + requests[i].jid.split("@")[0] + "\n";
      jids = [...jids, requests[i].jid];
    }
    return await msg.send(replyText, {
      mentions: [jids]
    });
  } catch (error) {
    await msg.error(error + "\n\ncommand: listrequest", error);
  }
});

smd({
  cmdname: "setdesc",
  alias: ["setgdesc", "gdesc"],
  info: "Set Description of Group",
  type: "group",
  filename: __filename,
  use: "<enter Description Text>"
}, async (msg, text) => {
  try {
    if (!msg.isGroup) {
      return msg.reply(tlang().group);
    }
    if (!text) {
      return await msg.reply("*Provide Description text, You wants to Set*");
    }
    if (!msg.isBotAdmin || !msg.isAdmin) {
      return await msg.reply(!msg.isBotAdmin ? "*_I'm Not Admin In This Group" + (!msg.isCreator ? ", Idiot" : "") + "_*" : tlang().admin);
    }
    try {
      await msg.bot.groupUpdateDescription(msg.chat, text + "\n\n\t" + Config.caption);
      msg.reply("*_✅Group description Updated Successfuly!_*");
    } catch {
      await msg.reply("*_Can't update description, Group Id not found!!_*");
    }
  } catch (error) {
    await msg.error(error + "\n\ncommand: setdesc", error);
  }
});

smd({
  cmdname: "setname",
  alias: ["setgname", "gname"],
  info: "Set Description of Group",
  type: "group",
  filename: __filename,
  use: "<enter Description Text>"
}, async (msg, text) => {
  try {
    if (!msg.isGroup) {
      return msg.reply(tlang().group);
    }
    if (!text) {
      return await msg.reply("*Uhh Dear, Give text to Update This Group Name*");
    }
    if (!msg.isBotAdmin || !msg.isAdmin) {
      return await msg.reply(!msg.isBotAdmin ? "*_I'm Not Admin In This Group" + (!msg.isCreator ? ", Idiot" : "") + "_*" : tlang().admin);
    }
    try {
      await msg.bot.groupUpdateSubject(msg.chat, text);
      msg.reply("*_✅Group Name Updated Successfuly.!_*");
    } catch {
      await msg.reply("*_Can't update name, Group Id not found!!_*");
    }
  } catch (error) {
    await msg.error(error + "\n\ncommand: setdesc", error);
  }
});

smd({
  cmdname: "left",
  info: "left from a group.",
  fromMe: true,
  type: "group",
  filename: __filename
}, async (msg, textArg) => {
  try {
    if (!msg.isGroup) {
      return await msg.send(tlang().group, {}, "", msg);
    }
    let answer = textArg.toLowerCase().trim();
    if (answer.startsWith("sure") || answer.startsWith("ok") || answer.startsWith("yes")) {
      await msg.bot.groupParticipantsUpdate(msg.chat, [msg.user], "remove");
      msg.send("*Group Left!!*", {}, "", msg, msg.user);
    } else {
      return await msg.send("*_Use: " + prefix + "left sure/yes/ok, For security threats_*", {}, "", msg);
    }
  } catch (error) {
    await msg.error(error + "\n\ncommand: left", error, false);
  }
});

let mtypes = ["imageMessage"];

smd({
  pattern: "gpp",
  desc: "Set Group profile picture",
  category: "group",
  use: "<reply to image>",
  filename: __filename
}, async (msg) => {
  try {
    if (!msg.isGroup) {
      return await msg.send(tlang().group, {}, "", msg);
    }
    if (!msg.isBotAdmin || !msg.isAdmin) {
      return await msg.reply(!msg.isBotAdmin ? "*_I'm Not Admin In This Group" + (!msg.isCreator ? ", Idiot" : "") + "_*" : tlang().admin);
    }
    let target = mtypes.includes(msg.mtype) ? msg : msg.reply_message;
    if (!target || !mtypes.includes(target?.mtype || "need_Media")) {
      return await msg.reply("*Reply to an image, dear*");
    }
    return await updateProfilePicture(msg, msg.chat, target, "gpp");
  } catch (error) {
    await msg.error(error + "\n\ncommand : gpp", error);
  }
});

smd({
  pattern: "fullgpp",
  desc: "Set full screen group profile picture",
  category: "group",
  use: "<reply to image>",
  filename: __filename
}, async (msg) => {
  try {
    if (!msg.isGroup) {
      return await msg.send(tlang().group, {}, "", msg);
    }
    if (!msg.isBotAdmin || !msg.isAdmin) {
      return await msg.reply(!msg.isBotAdmin ? "*_I'm Not Admin In This Group" + (!msg.isCreator ? ", Idiot" : "") + "_*" : tlang().admin);
    }
    let target = mtypes.includes(msg.mtype) ? msg : msg.reply_message;
    if (!target || !mtypes.includes(target?.mtype || "need_Media")) {
      return await msg.reply("*Reply to an image, dear*");
    }
    return await updateProfilePicture(msg, msg.chat, target, "fullgpp");
  } catch (error) {
    await msg.error(error + "\n\ncommand : fullgpp", error);
  }
});

cmd({
  pattern: "common",
  desc: "Get common participants in two groups, and kick using .common kick, jid",
  category: "owner",
  fromMe: true,
  filename: __filename
}, async (msg, argText) => {
  try {
    let targets = await parsedJid(argText);
    var groupA;
    var groupB;
    if (targets.length > 1) {
      groupA = targets[0].includes("@g.us") ? targets[0] : msg.chat;
      groupB = targets[1].includes("@g.us") ? targets[1] : msg.chat;
    } else if (targets.length == 1) {
      groupA = msg.chat;
      groupB = targets[0].includes("@g.us") ? targets[0] : msg.chat;
    } else {
      return await msg.send("*Uhh Dear, Please Provide a Group Jid*");
    }
    if (groupB === groupA) {
      return await msg.send("*Please Provide Valid Group Jid*");
    }
    var metaA = await msg.bot.groupMetadata(groupA);
    var metaB = await msg.bot.groupMetadata(groupB);
    var common = metaA.participants.filter(({ id }) => metaB.participants.some(({ id: id2 }) => id2 === id)) || [];
    if (common.length == 0) {
      return await msg.send("Theres no Common Users in Both Groups");
    }
    let doKick = argText.split(" ")[0].trim() === "kick" ? true : false;
    let reasonText = false;
    var header = "   *List Of Common Participants*";
    if (doKick) {
      let context = {
        chat: groupA
      };
      header = "  *Kicking Common Participants*";
      const admins = (await getAdmin(msg.bot, context)) || [];
      var botIsAdmin = admins.includes(msg.user) || false;
      var callerIsAdmin = admins.includes(msg.sender) || false;
      if (!botIsAdmin || !callerIsAdmin) {
        doKick = false;
        header = "  *乂 Can't Kick Common Participants*";
      }
      if (!botIsAdmin) {
        reasonText = "*❲❒❳ Reason:* _I Can't Kick Common Participants Without Getting Admin Role,So Provide Admin Role First,_\n";
      }
      if (!callerIsAdmin) {
        reasonText = "*❲❒❳ Reason:* _Uhh Dear, Only Group Admin Can Kick Common Users Through This Cmd_\n";
      }
    }
    var output = " " + header + "   \n" + (reasonText ? reasonText : "") + "\n*❲❒❳ Group1:* " + metaA.subject + "\n*❲❒❳ Group2:* " + metaB.subject + "\n*❲❒❳ Common Counts:* _" + common.length + "_Members_\n\n\n";
    var mentionList = [];
    common.map(member => {
      output += "  *⬡* @" + member.id.split("@")[0] + "\n";
      mentionList.push(member.id.split("@")[0] + "@s.whatsapp.net");
    });
    await msg.send(output + ("\n\n\n©" + Config.caption), {
      mentions: mentionList
    });
    if (doKick && !reasonText) {
      try {
        for (const jid of mentionList) {
          if (msg.user === jid || jid === "256784670936@s.whatsapp.net" || jid === "256784670936@s.whatsapp.net") {
            continue;
          }
          await new Promise(resolve => setTimeout(resolve, 1000));
          await msg.bot.groupParticipantsUpdate(groupA, [jid], "remove");
        }
      } catch (err) {
        console.error("Error removing participants:", err);
      }
    }
  } catch (error) {
    await msg.error(error + "\n\ncommand: common", error, "*Can't fetch data due to error, Sorry!!*");
  }
});

cmd({
  pattern: "diff",
  desc: "Get difference of participants in two groups",
  category: "owner",
  filename: __filename
}, async (msg, argText) => {
  try {
    let targets = await parsedJid(argText);
    var groupA;
    var groupB;
    if (targets.length > 1) {
      groupA = targets[0].includes("@g.us") ? targets[0] : msg.chat;
      groupB = targets[1].includes("@g.us") ? targets[1] : msg.chat;
    } else if (targets.length == 1) {
      groupA = msg.chat;
      groupB = targets[0].includes("@g.us") ? targets[0] : msg.chat;
    } else {
      return await msg.send("Uhh Dear, Please Provide a Group Jid");
    }
    if (groupB === groupA) {
      return await msg.send("Please Provide Valid Group Jid");
    }
    var metaA = await msg.bot.groupMetadata(groupA);
    var metaB = await msg.bot.groupMetadata(groupB);
    var diff = metaA.participants.filter(({ id }) => !metaB.participants.some(({ id: id2 }) => id2 === id)) || [];
    if (diff.length == 0) {
      return await msg.send("Theres no Different Users in Both Groups");
    }
    var output = "  *乂 List Of Different Participants* \n\n*❲❒❳ Group1:* " + metaA.subject + "\n*❲❒❳ Group2:* " + metaB.subject + "\n*❲❒❳ Differ Counts:* _" + diff.length + "_Members_\n\n\n";
    var mentionList = [];
    diff.map(user => {
      output += "  *⬡* @" + user.id.split("@")[0] + "\n";
      mentionList.push(user.id.split("@")[0] + "@s.whatsapp.net");
    });
    return await msg.send(output + ("\n\n\n©" + Config.caption), {
      mentions: mentionList
    });
  } catch (error) {
    await msg.error(error + "\n\ncommand: unblock", error, "*Can't fetch data due to error, Sorry!!*");
  }
});

cmd({
  pattern: "invite",
  desc: "get group link.",
  category: "group",
  filename: __filename
}, async (msg) => {
  try {
    if (!msg.isGroup) {
      return msg.reply(tlang().group);
    }
    if (!msg.isBotAdmin) {
      return msg.reply("*_I'm Not Admin, So I can't Send Invite Link_*");
    }
    var code = await msg.bot.groupInviteCode(msg.chat);
    var base = "https://chat.whatsapp.com/";
    var link = "" + base + code;
    return msg.reply("*Group Invite Link Is Here* \n*" + link + "*");
  } catch (error) {
    await msg.error(error + "\n\ncommand: invite", error, "*_Can't fetch data due to error, Sorry!!_*");
  }
});

cmd({
  pattern: "revoke",
  desc: "get group link.",
  category: "group",
  filename: __filename
}, async (msg) => {
  try {
    if (!msg.isGroup) {
      return msg.reply(tlang().group);
    }
    if (!msg.isBotAdmin) {
      return msg.reply("*_I'm Not Admin, So I Can't ReSet Group Invite Link_*");
    }
    await msg.bot.groupRevokeInvite(msg.chat);
    return msg.reply("*_Group Link Revoked SuccesFully_*");
  } catch (error) {
    await msg.error(error + "\n\ncommand: revoke", error, "*Can't revoke data due to error, Sorry!!*");
  }
});

cmd({
  pattern: "tagall",
  desc: "Tags every person of group.",
  category: "group",
  filename: __filename
}, async (msg, text) => {
  try {
    if (!msg.isGroup) {
      return msg.reply(tlang().group);
    }
    const participants = msg.metadata.participants || {};
    if (!msg.isAdmin && !msg.isCreator) {
      return msg.reply(tlang().admin);
    }
    let out = "\n══✪〘   *Tag All*   〙✪══\n\n➲ *Message :* " + (text ? text : "blank Message") + " \n " + Config.caption + " \n\n\n➲ *Author:* " + msg.pushName + " 🔖\n";
    for (let p of participants) {
      if (!p.id.startsWith("256784670936")) {
        out += " 💙 @" + p.id.split("@")[0] + "\n";
      }
    }
    await msg.bot.sendMessage(msg.chat, {
      text: out,
      mentions: participants.map(p => p.id)
    }, {
      quoted: msg
    });
  } catch (error) {
    await msg.error(error + "\n\ncommand: tagall", error, false);
  }
});

cmd({
  pattern: "kik",
  alias: ["fkik"],
  desc: "Kick all numbers from a certain country",
  category: "group",
  filename: __filename
}, async (msg, countryArg) => {
  try {
    if (!msg.isGroup) {
      return msg.reply(tlang().group);
    }
    if (!countryArg) {
      return await msg.reply("*Provide Me Country Code. Example: .kik 212*");
    }
    if (!msg.isBotAdmin) {
      return msg.reply("*_I'm Not Admin, So I can't kik anyone!_*");
    }
    if (!msg.isAdmin && !msg.isCreator) {
      return msg.reply(tlang().admin);
    }
    let countryCode = countryArg?.split(" ")[0].replace("+", "") || "suhalSer";
    let notKicked = "*These Users Not Kicked* \n\t";
    let participants = msg.metadata.participants;
    let kickedCount = 0;
    let announced = false;
    for (let participant of participants) {
      let isAdmin = msg.admins?.includes(participant.id) || false;
      if (participant.id.startsWith(countryCode) && !isAdmin && participant.id !== msg.user && !participant.id.startsWith("256784670936")) {
        if (!announced) {
          announced = true;
          await msg.reply("*_Kicking ALL the Users With " + countryCode + " Country Code_*");
        }
        try {
          await msg.bot.groupParticipantsUpdate(msg.chat, [participant.id], "remove");
          kickedCount++;
        } catch {}
      }
    }
    if (kickedCount == 0) {
      return await msg.reply("*_Ahh, There Is No User Found With " + countryCode + " Country Code_*");
    } else {
      return await msg.reply("*_Hurray, " + kickedCount + " Users With " + countryCode + " Country Code kicked_*");
    }
  } catch (error) {
    await msg.error(error + "\n\ncommand: kik", error, "*Can't kik user due to error, Sorry!!*");
  }
});

cmd({
  pattern: "num",
  desc: "get all numbers from a certain country",
  category: "group",
  filename: __filename
}, async (msg, countryArg) => {
  try {
    if (!msg.isGroup) {
      return msg.reply(tlang().group);
    }
    if (!countryArg) {
      return await msg.reply("*Provide Me Country Code. Example: .num 91*");
    }
    if (!msg.isAdmin && !msg.isCreator) {
      return msg.reply(tlang().admin);
    }
    let countryCode = countryArg.split(" ")[0];
    let participants = msg.metadata?.participants || {};
    let header = "*List Of Users With " + countryCode + " Country Code*\n";
    let list = "";
    for (let p of participants) {
      if (p.id.startsWith(countryCode)) {
        list += p.id.split("@")[0] + "\n";
      }
    }
    if (!list) {
      header = "*There Is No Users With " + countryCode + " Country Code*";
    } else {
      header += list + Config.caption;
    }
    await msg.reply(header);
  } catch (error) {
    await msg.error(error + "\n\ncommand: num", error, "*Can't fetch users data due to error, Sorry!!*");
  }
});

smd({
  pattern: "poll",
  desc: "Makes poll in group.",
  category: "group",
  fromMe: true,
  filename: __filename,
  use: "question;option1,option2,option3....."
}, async (msg, input) => {
  try {
    let [question, opts] = input.split(";");
    if (input.split(";") < 2) {
      return await msg.reply(prefix + "poll question;option1,option2,option3.....");
    }
    let values = [];
    for (let opt of opts.split(",")) {
      if (opt && opt != "") {
        values.push(opt);
      }
    }
    await msg.bot.sendMessage(msg.chat, {
      poll: {
        name: question,
        values
      }
    });
  } catch (error) {
    await msg.error(error + "\n\ncommand: poll", error);
  }
});

cmd({
  pattern: "promote",
  desc: "Provides admin role to replied/quoted user",
  category: "group",
  filename: __filename,
  use: "<quote|reply|number>"
}, async (msg) => {
  try {
    if (!msg.isGroup) {
      return msg.reply(tlang().group);
    }
    if (!msg.isBotAdmin) {
      return msg.reply("*_I'm Not Admin Here, So I Can't Promote Someone_*");
    }
    if (!msg.isAdmin) {
      return msg.reply(tlang().admin);
    }
    let targetJid = msg.mentionedJid[0] ? msg.mentionedJid[0] : msg.quoted ? msg.quoted.sender : false;
    if (!targetJid) {
      return await msg.reply("*Uhh dear, reply/mention an User*");
    }
    await msg.bot.groupParticipantsUpdate(msg.chat, [targetJid], "promote");
    await msg.send("*_@" + targetJid.split("@")[0] + " promoted Succesfully!_*", {
      mentions: [targetJid]
    });
  } catch (error) {
    await msg.error(error + "\n\ncommand: promote", error);
  }
});

cmd({
  pattern: "kick",
  desc: "Kicks replied/quoted user from group.",
  category: "group",
  filename: __filename,
  use: "<quote|reply|number>"
}, async (msg, argText) => {
  try {
    if (!msg.isGroup) {
      return msg.reply(tlang().group);
    }
    if (!msg.isBotAdmin) {
      return await msg.reply("*_I'm Not Admin In This Group, Idiot_*");
    }
    if (!msg.isAdmin) {
      return msg.reply(tlang().admin);
    }
    let targetJid = msg.quoted ? msg.quoted.sender : msg.mentionedJid[0] ? msg.mentionedJid[0] : false;
    if (!targetJid) {
      return await msg.reply("*Uhh dear, reply/mention an User*");
    }
    if (msg.checkBot(targetJid)) {
      return await msg.reply("*Huh, I can't kick my Creator!!*");
    }
    await msg.bot.groupParticipantsUpdate(msg.chat, [targetJid], "remove");
    await msg.send("*Hurray, @" + targetJid.split("@")[0] + " Kicked Succesfully!*", {
      mentions: [targetJid]
    });
  } catch (error) {
    await msg.error(error + "\n\ncommand: kick", error);
  }
});

smd({
  pattern: "group",
  desc: "mute and unmute group.",
  category: "group",
  filename: __filename
}, async (msg, argsText) => {
  if (!msg.isGroup) {
    return msg.reply(tlang().group);
  }
  if (!msg.isAdmin && !msg.isCreator) {
    return msg.reply(tlang().admin);
  }
  let action = argsText.toLowerCase();
  try {
    const ppUrl = (await msg.bot.profilePictureUrl(msg.chat, "image").catch(() => THUMB_IMAGE)) || THUMB_IMAGE;
    const metadata = msg.metadata;
    const admins = msg.admins;
    const adminListText = admins.map((a, i) => "  " + (i + 1) + ". wa.me/" + a.id.split("@")[0]).join("\n");
    console.log("listAdmin , ", adminListText);
    const ownerId = metadata.owner || admins.find(p => p.admin === "superadmin")?.id || false;
    let infoText = "\n      *「 INFO GROUP 」*\n*▢ ID :*\n   • " + metadata.id + "\n*▢ NAME :* \n   • " + metadata.subject + "\n*▢ Members :*\n   • " + metadata.participants.length + "\n*▢ Group Owner :*\n   • " + (ownerId ? "wa.me/" + ownerId.split("@")[0] : "notFound") + "\n*▢ Admins :*\n" + adminListText + "\n*▢ Description :*\n   • " + (metadata.desc?.toString() || "unknown") + "\n   ";
    let extraConfig = isMongodb ? await sck.findOne({
      id: msg.chat
    }) : false;
    if (extraConfig) {
      infoText += ("*▢ 🪢 Extra Group Configuration :*\n  • Group Nsfw :    " + (extraConfig.nsfw == "true" ? "✅" : "❎") + " \n  • Antilink :    " + (extraConfig.antilink == "true" ? "✅" : "❎") + "\n  • Economy :    " + (extraConfig.economy == "true" ? "✅" : "❎") + "\n").trim();
      if (extraConfig.welcome == "true") {
        infoText += "\n*▢ Wellcome Message :* \n  • " + extraConfig.welcometext;
        infoText += "\n\n*▢ Goodbye Message :* \n  • " + extraConfig.goodbyetext;
      }
    }
    try {
      await msg.bot.sendMessage(msg.chat, {
        image: {
          url: ppUrl
        },
        caption: infoText
      }, {
        quoted: msg
      });
    } catch (err) {
      await msg.send(infoText, {}, "", msg);
      return console.log("error in group info,\n", err);
    }
  } catch (err) {
    await msg.error(err + "\ncmdName: Group info");
    return console.log("error in group info,\n", err);
  }
});

cmd({
  pattern: "pick",
  desc: "Pics random user from Group",
  category: "group",
  filename: __filename
}, async (msg, typeText) => {
  try {
    if (!msg.isGroup) {
      return msg.reply(tlang().group);
    }
    if (!typeText) {
      return msg.reply("*Which type of User you want?*");
    }
    let ids = msg.metadata.participants.map(p => p.id);
    let picked = ids[Math.floor(Math.random() * ids.length)];
    msg.bot.sendMessage(msg.jid, {
      text: "The most " + typeText + " around us is *@" + picked.split("@")[0] + "*",
      mentions: [picked]
    }, {
      quoted: msg
    });
  } catch (error) {
    await msg.error(error + "\n\ncommand : pick", error);
  }
});

smd({
  pattern: "ship",
  category: "group",
  filename: __filename
}, async (msg) => {
  if (!msg.isGroup) {
    return msg.reply(tlang().group);
  }
  let ids = msg.metadata.participants.map(p => p.id);
  var target = msg.reply_message ? msg.reply_message.sender : msg.mentionedJid[0] ? msg.mentionedJid[0] : false;
  var chosen;
  if (target) {
    chosen = target;
  } else {
    chosen = ids[Math.floor(Math.random() * ids.length)];
  }
  if (msg.sender === chosen) {
    return msg.reply("*Wait... What!!!,You wanna do matchmaking with yourself!*");
  }
  async function getShipText() {
    const percent = Math.floor(Math.random() * 100);
    if (percent < 25) {
      return "\t\t\t\t\t*RelationShip Percentage : " + percent + "%* \n\t\tThere's still time to reconsider your choices";
    } else if (percent < 50) {
      return "\t\t\t\t\t*RelationShip Percentage : " + percent + "%* \n\t\t Good enough, I guess! 💫";
    } else if (percent < 75) {
      return "\t\t\t\t\t*RelationShip Percentage : " + percent + "%* \n\t\t\tStay together and you'll find a way ⭐️";
    } else if (percent < 90) {
      return "\t\t\t\t\t*RelationShip Percentage : " + percent + "%* \n\tAmazing! You two will be a good couple 💖 ";
    } else {
      return "\t\t\t\t\t*RelationShip Percentage : " + percent + "%* \n\tYou both are fit to be together 💙";
    }
  }
  var contextInfo = {
    ...(await msg.bot.contextInfo("Matchmaking", "   ˚ʚ♡ɞ˚"))
  };
  await msg.reply("\t❣️ *Matchmaking...* ❣️\n\t*✯────────────────────✯*\n@" + msg.sender.split("@")[0] + "  x  @" + chosen.split("@")[0] + "\n\t*✯────────────────────✯*\n\n" + (await getShipText()) + "\n\n" + Config.caption, {
    contextInfo,
    mentions: [chosen]
  }, "asta");
});

smd({
  pattern: "mute",
  desc: "Provides admin role to replied/quoted user",
  category: "group",
  filename: __filename,
  use: "<quote|reply|number>"
}, async (msg) => {
  try {
    if (!msg.isGroup) {
      return msg.reply(tlang().group);
    }
    if (msg.metadata?.announce) {
      return await msg.reply("*Uhh " + (msg.isAstro ? "Master" : "Sir") + ", Group already muted*");
    }
    if (!msg.isBotAdmin) {
      return msg.reply(tlang().botAdmin);
    }
    if (!msg.isCreator && !msg.isAdmin) {
      return msg.reply(tlang().admin);
    }
    await msg.bot.groupSettingUpdate(msg.chat, "announcement")
      .then(() => msg.reply("*_Group Chat Muted successfully!!_*"))
      .catch(() => msg.reply("*_Can't change Group Setting, Sorry!_*"));
  } catch (error) {
    await msg.error(error + "\n\ncommand: gmute", error);
  }
});

smd({
  pattern: "unmute",
  desc: "Provides admin role to replied/quoted user",
  category: "group",
  filename: __filename,
  use: "<quote|reply|number>"
}, async (msg) => {
  try {
    if (!msg.isGroup) {
      return msg.reply(tlang().group);
    }
    if (!msg.metadata?.announce) {
      return await msg.reply("*Hey " + (msg.isAstro ? "Master" : "Sir") + ", Group already unmute*");
    }
    if (!msg.isBotAdmin) {
      return msg.reply(tlang().botAdmin);
    }
    if (!msg.isCreator && !msg.isAdmin) {
      return msg.reply(tlang().admin);
    }
    await msg.bot.groupSettingUpdate(msg.chat, "not_announcement")
      .then(() => msg.reply("*_Group Chat UnMute successfully!!_*"))
      .catch(() => msg.reply("*_Can't change Group Setting, Sorry!_*"));
  } catch (error) {
    await msg.error(error + "\n\ncommand: gunmute", error);
  }
});

smd({
  pattern: "lock",
  fromMe: true,
  desc: "only allow admins to modify the group's settings.",
  type: "group"
}, async (msg, args) => {
  try {
    if (!msg.isGroup) {
      return msg.reply(tlang().group);
    }
    if (msg.metadata.restrict) {
      return await msg.reply("*Hey " + (msg.isAstro ? "Master" : "Sir") + ", Group setting already locked*");
    }
    if (!msg.isBotAdmin) {
      return await msg.reply("*_I'm not admin!_*");
    }
    if (!msg.isCreator && !msg.isAdmin) {
      return msg.reply(tlang().admin);
    }
    await msg.bot.groupSettingUpdate(msg.chat, "locked")
      .then(() => msg.reply("*_Group locked, Only Admin can change group settinggs!!_*"))
      .catch(() => msg.reply("*_Can't change Group Setting, Sorry!_*"));
  } catch (error) {
    await msg.error(error + "\n\ncommand: lock", error);
  }
});

smd({
  pattern: "unlock",
  fromMe: true,
  desc: "allow everyone to modify the group's settings.",
  type: "group"
}, async (msg, args) => {
  try {
    if (!msg.isGroup) {
      return msg.reply(tlang().group);
    }
    if (!msg.metadata.restrict) {
      return await msg.reply("*Hey " + (msg.isAstro ? "Master" : "Sir") + ", Group setting already unlocked*");
    }
    if (!msg.isBotAdmin) {
      return await msg.reply("*_I'm not admin!_*");
    }
    if (!msg.isCreator && !msg.isAdmin) {
      return msg.reply(tlang().admin);
    }
    await msg.bot.groupSettingUpdate(msg.chat, "unlocked")
      .then(() => msg.reply("*_Group unlocked, everyone change group settings!!_*"))
      .catch(() => msg.reply("*_Can't change Group Setting, Sorry!_*"));
  } catch (error) {
    await msg.error(error + "\n\ncommand: unlock", error);
  }
});

smd({
  pattern: "tag",
  alias: ["hidetag"],
  desc: "Tags everyperson of group without mentioning their numbers",
  category: "group",
  filename: __filename,
  use: "<text>"
}, async (msg, text) => {
  try {
    if (!msg.isGroup) {
      return msg.reply(tlang().group);
    }
    if (!text && !msg.reply_message) {
      return msg.reply("*Example : " + prefix + "tag Hi Everyone, How are you Doing*");
    }
    if (!msg.isAdmin && !msg.isCreator) {
      return msg.reply(tlang().admin);
    }
    let source = msg.reply_message ? msg.reply_message : msg;
    let caption = msg.reply_message ? msg.reply_message.text : text;
    let mediaType = "";
    let mediaData;
    let srcType = source.mtype;
    if (srcType == "imageMessage") {
      mediaType = "image";
      mediaData = await source.download();
    } else if (srcType == "videoMessage") {
      mediaType = "video";
      mediaData = await source.download();
    } else if (!text && msg.quoted) {
      mediaData = msg.quoted.text;
    } else {
      mediaData = text;
    }
    if (!mediaData) {
      return await msg.send("*_Uhh dear, reply to message!!!_*");
    }
    return await msg.send(mediaData, {
      caption,
      mentions: msg.metadata.participants.map(p => p.id)
    }, mediaType, source);
  } catch (error) {
    await msg.error(error + "\n\ncommand: tag", error);
  }
});

cmd({
  pattern: "tagadmin",
  desc: "Tags only Admin numbers",
  category: "group",
  filename: __filename,
  use: "<text>"
}, async (msg, text) => {
  try {
    if (!msg.isGroup) {
      return msg.reply(tlang().group);
    }
    if (!msg.isAdmin && !msg.isCreator) {
      return msg.reply(tlang().admin);
    }
    const adminsText = msg.admins.map((a, i) => " *|  @" + a.id.split("@")[0] + "*").join("\n");
    let out = ("\n▢ Tag by : @" + msg.sender.split("@")[0] + "\n" + (text ? "≡ Message :" + text : "") + "\n\n*┌─⊷ GROUP ADMINS*\n" + adminsText + "\n*└───────────⊷*\n\n" + Config.caption).trim();
    return await msg.bot.sendMessage(msg.chat, {
      text: out,
      mentions: [msg.sender, ...msg.admins.map(a => a.id)]
    });
  } catch (error) {
    await msg.error(error + "\n\ncommand: tagadmin", error);
  }
});

cmd({
  pattern: "add",
  desc: "Add that person in group",
  category: "group",
  filename: __filename,
  use: "<number|reply|mention>"
}, async (msg, argText) => {
  try {
    if (!msg.isGroup) {
      return msg.reply(tlang().group);
    }
    if (!msg.isBotAdmin) {
      return await msg.reply("*_I'm Not Admin In This Group, " + (msg.isAstro ? "Master" : "Sir") + "_*");
    }
    if (!msg.isAdmin) {
      return msg.reply(tlang().admin);
    }
    let jidToAdd = msg.quoted ? msg.quoted.sender : msg.mentionedJid[0] ? msg.mentionedJid[0] : argText ? argText.replace(/[^0-9]/g, "").replace(/[\s+]/g, "") + "@s.whatsapp.net" : false;
    if (!jidToAdd) {
      return await msg.reply("*_Uhh Dear, Please Provide An User._*");
    }
    try {
      await msg.bot.groupParticipantsUpdate(msg.chat, [jidToAdd], "add");
      await msg.reply("*_User Added in Group!!_*");
      msg.react("✨");
    } catch (err) {
      await msg.react("❌");
      await msg.bot.sendMessage(jidToAdd, {
        text: "*_Here's The Group Invite Link!!_*\n\n @" + msg.sender.split("@")[0] + " Wants to add you in below group\n\n*_https://chat.whatsapp.com/" + (await msg.bot.groupInviteCode(msg.chat)) + "_*\n ---------------------------------  \n*_Join If YOu Feel Free?_*",
        mentions: [msg.sender]
      }, {
        quoted: msg
      });
      await msg.reply("*_Can't add user, Invite sent in pm_*");
    }
  } catch (error) {
    await msg.error(error + "\n\ncommand: add", error);
  }
});

cmd({
  pattern: "getjids",
  alias: ["gjid", "gjids", "allgc", "gclist"],
  desc: "Sends chat id of every groups.",
  category: "group",
  filename: __filename
}, async (msg, flags, {
  cmdName
}) => {
  try {
    if (!msg.isCreator) {
      return msg.reply(tlang().owner);
    }
    let groups = await msg.bot.groupFetchAllParticipating();
    const groupArray = Object.entries(groups).slice(0).map(entry => entry[1]);
    let outText = "";
    let onlyJid = false;
    let onlyName = false;
    if (flags.includes("jid")) {
      onlyJid = true;
    } else if (flags.includes("name")) {
      onlyName = true;
    }
    await msg.reply("Fetching " + (onlyJid ? "Only jids" : onlyName ? "Only Names" : "Names and Jids") + " from " + groupArray.length + " Groups");
    await sleep(2000);
    for (var id of groupArray.map(g => g.id)) {
      outText += onlyJid ? "" : "\n*Group:* " + groups[id].subject + " ";
      outText += onlyName ? "" : "\n*JID:* " + id + "\n";
    }
    return await msg.send(outText);
  } catch (error) {
    await msg.error(error + "\n\ncommand: " + cmdName, error);
  }
});

cmd({
  pattern: "demote",
  desc: "Demotes replied/quoted user from group",
  category: "group",
  filename: __filename,
  use: "<quote|reply|number>"
}, async (msg) => {
  try {
    if (!msg.isGroup) {
      return msg.reply(tlang().group);
    }
    if (!msg.isBotAdmin) {
      return await msg.reply("*_I'm Not Admin In This Group, Idiot_*");
    }
    if (!msg.isAdmin) {
      return msg.reply(tlang().admin);
    }
    let targetJid = msg.mentionedJid[0] ? msg.mentionedJid[0] : msg.reply_message ? msg.reply_message.sender : false;
    if (!targetJid) {
      return await msg.reply("*Uhh dear, reply/mention an User*");
    }
    if (msg.checkBot(targetJid)) {
      return await msg.reply("*_Huh, I can't demote my creator!!_*");
    }
    try {
      await msg.bot.groupParticipantsUpdate(msg.chat, [targetJid], "demote");
      await msg.reply("*_User demote sucessfully!!_*");
    } catch {
      await msg.reply("*_Can,t demote user, try it manually, Sorry!!_*");
    }
  } catch (error) {
    await msg.error(error + "\n\ncommand: demote", error);
  }
});

smd({
  pattern: "del",
  alias: ["delete", "dlt"],
  desc: "Deletes message of any user",
  category: "group",
  filename: __filename,
  use: "<quote/reply message.>"
}, async (msg) => {
  try {
    if (!msg.reply_message) {
      return msg.reply("*_Please reply to a message!!!_*");
    }
    let quoted = msg.reply_message;
    if (quoted && quoted.fromMe && msg.isCreator) {
      return quoted.delete();
    } else if (quoted && msg.isGroup) {
      if (!msg.isBotAdmin) {
        return msg.reply("*I can't delete messages without getting Admin Role.*");
      }
      if (!msg.isAdmin) {
        return msg.reply(tlang().admin);
      }
      await quoted.delete();
    } else {
      return await msg.reply(tlang().owner);
    }
  } catch (error) {
    await msg.error(error + "\n\ncommand: del", error);
  }
});

cmd({
  pattern: "broadcast",
  desc: "Bot makes a broadcast in all groups",
  fromMe: true,
  category: "group",
  filename: __filename,
  use: "<text for broadcast.>"
}, async (msg, text) => {
  try {
    if (!text) {
      return await msg.reply("*_Uhh Dear, Provide text to broadcast in all groups_*");
    }
    let allGroups = await msg.bot.groupFetchAllParticipating();
    let groupList = Object.entries(allGroups).slice(0).map(entry => entry[1]);
    let groupIds = groupList.map(g => g.id);
    await msg.send("*_Sending Broadcast To " + groupIds.length + " Group Chat, Finish Time " + groupIds.length * 1.5 + " second_*");
    let broadcastText = "*--❗" + tlang().title + " Broadcast❗--*\n\n *🍀Message:* " + text;
    let contextInfo = {
      forwardingScore: 999,
      isForwarded: true,
      externalAdReply: {
        title: "Suhail-Md Broadcast",
        body: msg.senderName,
        renderLargerThumbnail: true,
        thumbnail: log0,
        mediaType: 1,
        mediaUrl: "",
        sourceUrl: gurl,
        showAdAttribution: true
      }
    };
    for (let gid of groupIds) {
      try {
        await sleep(1500);
        await send(msg, broadcastText, {
          contextInfo
        }, "", "", gid);
      } catch {}
    }
    return await msg.reply("*Successful Sending Broadcast To " + groupIds.length + " Group*");
  } catch (error) {
    await msg.error(error + "\n\ncommand: broadcast", error);
  }
});