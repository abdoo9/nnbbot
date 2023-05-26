const util = require("./util");

module.exports = function (bot, database) {
    let self = {
        message(msg) {
            if (msg.forward_from_chat && msg.forward_from_chat.id < 0) {
                return database.addUser(msg.from.id, util.lang(msg.from), util.name(msg.from), msg.from.username)
                    .then(() => database.getUser(msg.from.id))
                    .then((user) => {
                        let _ = util.getLang(user.lang);
                        return bot.sendMessage(msg.chat.id, _('dontFwdChannel'));
                    }).catch((err) => {
                    console.trace("Error: 5 ", err.stack)
                });
            } else if (msg.forward_from)
                return database.addUser(msg.from.id, util.lang(msg.from), util.name(msg.from), msg.from.username)
                    .then(() => database.getUser(msg.from.id))
                    .then((user) => {
                        let _ = util.getLang(user.lang);

                        let contact = msg.forward_from;
                        return database.addContact(msg.from.id, contact)
                            .then(() => {
                                return bot.sendMessage(msg.chat.id, util.lt`
                                    ${_('id')} = ${contact.id}
                                    ${_('firstName')} = ${contact.first_name}
                                    ${_('lastName')} = ${contact.last_name || "🚫"}
                                    ${_('username')} = @${contact.username || "🚫"}
            
                                    ${_('fwd')}
                            -`, new (util.keyboard)([
                                        {text: _('sendUsingId'), switch_inline_query: `\n${_('test')}\n${contact.id}`},
                                    ].concat(contact.username ? [
                                        "<br>",
                                        {
                                            text: _('sendUsingUsername'),
                                            switch_inline_query: `\n${_('test')}\n @${contact.username}`
                                        }
                                    ] : []), false)
                                );
                            });
                    })
                    .catch((err) => {
                        console.trace("Error: 10 ", err.stack)
                    });
        }
    };

    bot.on('message', self.message);
    return self;
};
