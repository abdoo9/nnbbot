const util = require("./util");
const Opts = util.keyboard;

class Result {
    constructor(title, message_text, description, reply_markup, id) {
        this.type = "article";
        this.id = id || util.uuid();
        this.title = title;
        this.message_text = message_text;
        this.description = description;
        this.reply_markup = reply_markup;
        //this.parse_mode = "Markdown";
        this.disable_web_page_preview = true;
    }
}

function WhisperMessage(_, recipient, callback_data, id) {
    const title = _('title1') + util.name(recipient);
    const message_text = _('title1') + util.linkName(recipient) + _('title2');
    const description = _('description2');
    const reply_markup = {
        inline_keyboard: [[{
            text: _('showMsg'),
            callback_data: JSON.stringify(callback_data)
        }]]
    };

    return new Result(title, message_text, description, reply_markup, id);
}

module.exports = function (bot, database) {
    bot.on('inline_query', function (query) {
        database.addUser(query.from.id, util.lang(query.from), util.name(query.from), query.from.username)
            .then(() => database.getUser(query.from.id))
            .then((sender) => {
                let _ = util.getLang(sender.lang);

                const {toId, txt} = util.parseMessage(query.query);
                if (txt.trim().length > 200) {

                    return bot.answerInlineQuery(query.id, results = [], {
                        switch_pm_text: _('queryTooLong'),
                        switch_pm_parameter: 'queryTooLongDescription',
                        cache_time: 0,
                        is_personal: true
                    });
                }

                if (toId !== null) {
                    return Promise.resolve(toId)
                        .then((toId) => {
                            if (typeof (toId) === "string")
                                return {username: toId, first_name: toId};
                            else
                                return database.getUser(toId)
                                    .then(user => user || {name: toId})
                        }).then((recipient) => {
                            const callback_data = [toId.toString(), query.from.id.toString()];
                            const results = [WhisperMessage(_, recipient, callback_data)];
                            return bot.answerInlineQuery(query.id, results, {cache_time: 0, is_personal: true});
                        })
                } else {
                    let results = [new Result(_('missingInfo'), _('missingInfo'), _('description'), {
                        inline_keyboard: [[{
                            text: _('howToUseButton'),
                            url: 'https://t.me/nnbbot?start=start'
                        }]]
                    })];
                    return database.getContacts(query.from.id)
                        .then(contacts => {
                            if (txt.trim().length > 0)
                                results = results.concat(contacts.map(c =>
                                    WhisperMessage(_, c, [c.user_id.toString(), query.from.id.toString()], '@toId:' + c.user_id)));
                            return bot.answerInlineQuery(query.id, results.reverse(), {
                                switch_pm_text: _('switch_pm_text'),
                                switch_pm_parameter: 'start',
                                cache_time: 0,
                                is_personal: true
                            });
                        });
                }
            }).catch((err) => {
            console.trace("Error: 170 ", err.stack)
        });
    });

    bot.on('chosen_inline_result', function (query) {
        let {toId, txt} = util.parseMessage(query.query);
        if (query.result_id.startsWith("@toId:"))
            toId = query.result_id.substring("@toId:".length);

        if (toId !== null) {
            const username = typeof (toId) === "string" ? toId : null;
            const user_id = typeof (toId) === "number" ? toId : null;

            database.addMsg(query.inline_message_id, query.from.id, username, user_id, txt);
        }
    });

    bot.on('callback_query', query => {
        database.addUser(query.from.id, util.lang(query.from), util.name(query.from), query.from.username)
            .then(() => database.getUser(query.from.id))
            .then((receiver) => {
                let _ = util.getLang(receiver.lang);
                let data = util.tryJson(query.data);

                if (typeof(data) === "string" && query.message) {
                    let action = {
                        "howToUse": (chat_id) => bot.sendMessage(chat_id, _('howToUse'), new Opts([
                            {text: _('testItNow'), switch_inline_query: _('switch_inline_query')},
                            "<br>",
                            {text: _('howToNoUsername'), callback_data: "noUsername"}
                        ], true)),
                        "noUsername": (chat_id) => bot.sendMessage(chat_id, _('noUsername'), {parse_mode: "Markdown"}),
                        "aboutMsg": (chat_id) => bot.sendMessage(chat_id, _('aboutMsg').replace("%credit%", _('credits'))),
                        "changeLng": (chat_id) => bot.sendMessage(chat_id, _('chooseLang'), new Opts([
                            {text: _('en'), callback_data: "en"},
                            {text: _('ar'), callback_data: "ar"},
                            "<br>",
                            {text: _('it'), callback_data: "it"},
                            {text: _('de'), callback_data: "de"},
                            "<br>",
                            {text: _('fa'), callback_data: "fa"},
                            {text: _('ku'), callback_data: "ku"},
                            "<br>",
                            {text: _('fr'), callback_data: "fr"},
                            {text: _('ru'), callback_data: "ru"},
                        ], true)),
                    }[data];
                    if (action)
                        return action(query.message.chat.id);
                    else if (['ar', 'en', 'fa', 'it', 'de', 'ku', 'fr', 'ru'].includes(data)) {
                        return database.changeLang(query.from.id, data)
                            .then(() => bot.sendMessage(query.message.chat.id, _(data) + " ✅\n /start"));
                    }
                } else if (Array.isArray(data)) {
                    data = data.map(x=>x.toString());
                    let x = [query.from.id.toString()];
                    if (query.from.username)
                        x.push(query.from.username.toLowerCase());
                    if (x.some(x => data.includes(x.toString()))) {
                        return database.findMsg(query.inline_message_id)
                            .then(message => {
                                if (message) {
                                    // check for Davide
                                    let dbdata = [message.sender_id, message.username, parseInt(message.username), message.receiver_id];
                                    //console.log(dbdata, data);
                                    if (!(data.every(x => dbdata.includes(x.toString()))))
                                        return bot.answerCallbackQuery(query.id, {
                                            text: _("mismatchMessageRecipient"),
                                            show_alert: false
                                        });

                                    let p = bot.answerCallbackQuery(query.id, {text:message.message, show_alert: true});
                                    if (query.from.id.toString() === message.sender_id && message.sender_id !== message.receiver_id)
                                        return p;
                                    else
                                        return p.then(() => database.setSeen(query.inline_message_id, query.from.id));
                                }
                                else
                                    return bot.answerCallbackQuery(query.id,{text: _("missingMessage"), show_alert: false});
                            });
                    } else {
                        return bot.answerCallbackQuery(query.id,{text: _('notToU'), show_alert: true});
                    }
                }
            }).catch((err) => {
            console.trace("Error: 200 ", err.stack)
        });
    });
};