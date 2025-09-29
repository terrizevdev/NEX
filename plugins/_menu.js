const os = require('os');
const Config = require('../config');
const { fancytext, tiny, runtime, formatp, prefix } = require('../lib');
const plugins = require('../lib/plugins');

const LTR_MARK = String.fromCharCode(0x200e);
const readmore = LTR_MARK.repeat(4001);


const trend_usage = (() => {

  const a = 1;
  const b = 0x63; // 99
  const rand = Math.floor(Math.random());

  return (Math.floor(Math.random() * (b - a + 1)) + a).toString();
})();

const database_info = (() => {

  const a = 1;
  const b = 0x1f3; // 499
  return (Math.floor(Math.random() * (b - a + 1)) + a).toString();
})();

plugins.use({
  cmdname: 'menu',
  desc: 'Help list',
  react: '📃',

  desc_long: '*💁Description:* \n      ┌┤✑  Thanks for Choosing .   ANONYMOUS-MD\n│└────────────┈ ⳹       \n│*©2025 TERRIZEV🇺🇬*\n└─────────────────┈ ⳹\n',
  type: 'user',
  filename: __filename
}, async (message, args) => {
  try {
    // Expect ../lib to export `commands` (array)
    const { commands } = require('../lib');

    const requested = (typeof args === 'string' ? args.split(' ')[0] : '').trim();


    if (requested) {
      const matched = commands.find(c => c.pattern === requested.toLowerCase());
      if (matched) {
        const details = [];
        details.push('```' + matched.pattern + '```');
        if (matched.category) details.push('*💁Category:* ' + matched.category);
        if (matched.alias && matched.alias.length) details.push('*💁Alias:* ' + matched.alias.join(', '));
        if (matched.desc) details.push('*💁Description:* ' + matched.desc);
        if (matched.usage) details.push('*〽️Usage:*\n ```' + matched.usage + '```');
        
        await message.reply(details.join('\n'));
        return;
      }
    }


    const categoriesMap = {};
    for (const cmd of commands) {

      if (cmd.dontAddCommandList === true) continue;
      if (cmd.pattern === undefined) continue;
      const cat = cmd.category || 'Misc';
      if (!categoriesMap[cat]) categoriesMap[cat] = [];
      categoriesMap[cat].push(cmd.pattern);
    }

    let styleChoice;
    if (!Config.menu || (typeof Config.menu === 'string' && Config.menu.trim() === '')) {
      styleChoice = Math.floor(Math.random() * 3) + 1;
    } else {
      const cfg = String(Config.menu).trim().toLowerCase();
      if (cfg.includes('menu1') || cfg === '1') styleChoice = 1;
      else if (cfg.includes('menu2') || cfg === '2') styleChoice = 2;
      else styleChoice = 3;
    }

    let headerPrefix, itemPrefix, openCat, closeCat, footerBorder;
    if (styleChoice === 1) {
      headerPrefix = '┏﹝ *' + Config.botname + '*  ﹞';
      itemPrefix = '┃ ✗';
      openCat = '┌『';
      closeCat = '』';
      footerBorder = '════════════▪︎';
    } else if (styleChoice === 2) {
      headerPrefix = '☆│▸ ' + Config.botname + ' ─';
      itemPrefix = '☆│▸';
      openCat = '┌〈';
      closeCat = '〉';
      footerBorder = '═══════════════》';
    } else {
      headerPrefix = '╭〘  ' + Config.botname + '  〙';
      itemPrefix = '│';
      openCat = '┌═[ ';
      closeCat = ' * ]';
      footerBorder = '╰════════════》';
    }

    
    const usedMem = formatp(os.totalmem() - os.freemem());
    const up = runtime(process.uptime());
    const currentDate = new Date().toLocaleString();
    const totalCmds = commands.length;

    let menuText = '';
    menuText += '\n' + headerPrefix + '\n';
    menuText += itemPrefix + '  *OWNER:* ' + (Config.ownername || 'Unknown') + '\n';
    menuText += itemPrefix + '  *TIME:* ' + up + '\n';
    menuText += itemPrefix + '  *RAM USAGE:* ' + usedMem + '\n';
    menuText += itemPrefix + '  *DATE:* ' + currentDate + '\n';
    menuText += itemPrefix + '  *TOTAL COMMANDS:* ' + totalCmds + '\n';
    menuText += itemPrefix + '  *USAGE TREND:* ' + trend_usage + '\n';
    menuText += itemPrefix + '  *DATABASE:* ' + database_info + '\n';
    menuText += footerBorder + '\n' + readmore + '\n';

    
    for (const catName in categoriesMap) {
      menuText += openCat + ' *' + tiny(catName) + '* ' + closeCat + '\n';

      
      if (requested.toLowerCase() === catName.toLowerCase()) {
        for (const p of categoriesMap[catName]) {
          menuText += itemPrefix + ' ' + fancytext(p, 1) + '\n';
        }
        menuText += footerBorder + '\n';
        break;
      } else {
        for (const p of categoriesMap[catName]) {
          menuText += itemPrefix + ' ' + fancytext(p, 1) + '\n';
        }
        menuText += footerBorder + '\n';
      }
    }


    if (Config.caption) menuText += '\n' + Config.caption;

    
    const payload = { caption: menuText, ephemeralExpiration: 3000 };
    if (typeof message.sendUi === 'function') {
      await message.sendUi(message.chat, payload, message);
    } else if (typeof message.send === 'function') {
      await message.send(message.chat, payload.caption);
    } else if (typeof message.reply === 'function') {
      await message.reply(payload.caption);
    }
  } catch (err) {
    
    if (typeof message.reply === 'function') {
      await message.reply(err + '\nCommand: menu');
    } else {
      console.error(err);
    }
  }
});