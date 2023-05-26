#!/usr/bin/env nodejs

process.env.NTBA_FIX_319 = '1'
// imports
const TelegramBot = require('node-telegram-bot-api');
const express = require('express');
const bodyParser = require('body-parser');

// replace the value below with the Telegram token you receive from @BotFather
const TOKEN = process.env.TELEGRAM_TOKEN || '40536821:AAE99sPV2TRpGl6Dp0VPiosO1TVJCMHh8';
const port = process.env.PORT || 8070;
const url = process.env.URL || 'https://www.example.com/whisper3';
const db_info = {
    host: process.env.PGHOST || "127.0.0.1",
    port: process.env.PGPORT || 5432,
    user: process.env.PGUSER || "whisper",
    password: process.env.PGPASSWORD || "pgpass",
    database: process.env.PGDATABASE || "whisper"
};

const util = require("./plugins/util");
const database = require('./plugins/database.js')(db_info);
const Opts = util.keyboard;

const app = express();
const bot = new TelegramBot(TOKEN /*,options */);

require('./plugins/fwd.js')(bot, database);
require('./plugins/admin.js')(bot, database, [159263523, 61478054]);
require('./plugins/whisper.js')(bot, database);
console.log(`${url}/bot${TOKEN}`)
bot.setWebHook(`${url}/bot${TOKEN}`)
    .catch((err) => {
        console.trace("Error: 40 ", err.stack)
    });

// express plugins
app.use(bodyParser.json());

// express routes
app.post(`/whisper3/bot${TOKEN}`, (req, res) => {
    bot.processUpdate(req.body);
    //console.log(req.params);
    res.sendStatus(200);
});

app.post(`/bot${TOKEN}`, (req, res) => {
    bot.processUpdate(req.body);
    //console.log(req.params);
    res.sendStatus(200);
});

app.get('/', (req, res) => {
    res.send('<h1>hello</h1>');
});

app.listen(port, () => {
    console.log(`Express server is listening on ${port}`);
});

bot.onText(/^\/start(.*)/, (msg, match) => {
    database.addUser(msg.from.id, util.lang(msg.from), util.name(msg.from), msg.from.username)
        .then(() => database.getUser(msg.from.id))
        .then((user) => {
            let _ = util.getLang(user.lang);
            let param = match[1].trim();

            if (param === "queryTooLongDescription") {
                return bot.sendMessage(msg.from.id, _('queryTooLongDescription'), new Opts([
                    { text: _('testItNow'), switch_inline_query: _("testItNowInline") }
                ], true));
            }
            if (param === "howToUse") {
                return bot.sendMessage(msg.from.id, _('howToUse'), new Opts([
                    { text: _('testItNow'), switch_inline_query: _("testItNowInline") }
                ], true));
            } else {
                return bot.sendMessage(msg.chat.id, _('start').replace(/@x/g, util.linkName(user)), new Opts([
                    { text: _('lang'), callback_data: "changeLng" },
                    { text: _('about'), callback_data: "aboutMsg" },
                    "<br>",
                    { text: _('startBtn'), callback_data: "howToUse" }
                ], true));
            }
        }).catch((err) => {
            console.trace("Error: 100 ", err.stack)
        });
});

/*
TODO:
1 - LANGUAGE USER CONTROLE
2 - get user id
*/
