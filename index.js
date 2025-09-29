
const bot = require(__dirname + '/lib/amd');
const { VERSION } = require(__dirname + '/config');

function hi() {
    console.log('Hello World!');
}

hi();

const start = async () => {
    Debug.info('INSTALLING NEX...');
    try {
        await bot.init();
        await bot.DATABASE.sync();
        await bot.connect();
    } catch (error) {
        Debug.error(error);
        start();
    }
};

start();