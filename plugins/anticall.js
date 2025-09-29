let antiCallMessage = process.env.ANTICALL_MESSAGE ||  
"```Hii this is MAXTECH_MD-V2 a Personal Assistant!!\n\n\tSorry for now, we cannot receive calls, whether in a group or personal \n\n if you need help or request features please chat owner\n\n\nPowered by MAXTECH_MD-V2 Chatbot```";

const { smd, botpic, send, Config, tlang, sleep, smdBuffer, prefix, bot_ } = require('../lib');

let antiCallCountries = [],
    antiCallusers = {},
    bots = false;

smd({
    'pattern': 'anticall',
    'desc': 'Detects calls and decline them.',
    'category': 'owner',
    'use': '<on | off>',
    'filename': __filename
}, async (m, text) => {
    let bots = await bot_.findOne({'id': 'anticall_' + m.user}) || await bot_.updateOne({'id': 'anticall_' + m.user});
    let inputText = text ? text.toLowerCase().trim() : '';
    
    if (inputText.startsWith('off') || inputText.startsWith('deact') || inputText.includes('disable')) {
        if (bots.anticall === 'false') return await m.send('*anticall Already Disabled In Current Chat!*');
        return await bot_.updateOne({'id': 'anticall_' + m.user}, {'anticall': 'false'}), await m.send('*anticall Disable Succesfully!*');
    } else {
        if (!text) return await m.send('*anticall *' + (bots.anticall === 'false' ? 'Not set to any' : 'set to "' + bots.anticall + '"') + ' Country Code!*\n *Provide Country code to Update Status*\n*Eg: _.anticall all | 212, 91_*');
    }
    
    let countryCodes = inputText.includes('all') ? 'all' : text ? text.split(',').map(code => parseInt(code)).filter(code => !isNaN(code)).join(',') : false;
    
    if (!text || !countryCodes) return await m.send('*_Please provide country code to block calls_*\n*_eg: _.anticall all,212,91,231_*');
    else {
        if (countryCodes) return await bot_.updateOne({'id': 'anticall_' + m.user}, {'anticall': '' + countryCodes}), await m.send('*anticall Succesfully set to "' + countryCodes + '"!*');
        else return await m.send('*_Please provide a Valid country code_*\n*example: _.anticall all | 92_*');
    }
});

smd({
    'call': true
}, async call => {
    try {
        if (!bots) bots = await bot_.findOne({'id': 'anticall_' + call.user});
        if (call.fromMe || !bots || !bots.anticall || bots.anticall === 'false') return;
        
        (!antiCallCountries || !antiCallCountries[0]) && (antiCallCountries = bots.anticall ? bots.anticall.split(',') : [], antiCallCountries = antiCallCountries.filter(code => code.trim() !== ''));
        
        let callStatus = ('' + bots.anticall).includes('all') ? 'all' : '';
        let shouldBlockCall = callStatus === 'all' ? true : antiCallCountries.some(code => call.from?.trim()?.startsWith(code));
        
        if (shouldBlockCall || call.isGroup) try {
            if (!antiCallusers || !antiCallusers[call.from]) {
                antiCallusers[call.from] = {'warn': 0};
            }
            if (antiCallusers[call.from].warn < 2) {
                await call.send(antiCallMessage);
            }
            antiCallusers[call.from].warn++;
            await call.send('*_' + antiCallusers[call.from].warn + ' Call rejected From User @' + call.from.split('@')[0] + '!!_*', {'mentions': [call.from]}, '', '', call.user);
            await call.decline();
        } catch (error) {
            // Handle error
        }
    } catch (error) {
        // Handle error
    }
});