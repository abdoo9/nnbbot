const util = require("./util");

module.exports = function (bot, database, admins) {
    let self = {
        stats(msg) {
            if (admins.includes(msg.from.id)) {
                return database.stats()
                    .then(stats => {
                        return bot.sendMessage(msg.chat.id, util.lt`
                        users_count: ${stats.users_count}
                        users_started: ${stats.users_started}
                        messages_count: ${stats.messages_count}
                        messages_seen: ${stats.messages_seen}
                        users_7: ${stats.users_7}
                        messages_7: ${stats.messages_7}
                        messages_seen_7: ${stats.messages_seen_7}
                        users_active: ${stats.users_active}
                    `);
                    }).catch((err) => {
                        console.trace("Error: a10 ", err.stack)
                    });
            }

        },
        perDay(msg) {
            if (admins.includes(msg.from.id)) {
                return database.messagePerDay(10)
                    .then(days => {
                        let data = days.map(d => `${d.date.toLocaleDateString('en-US')} -  ${d.count}`).join("\n");
                        return bot.sendMessage(msg.chat.id, data.length ? data : "No data :(");
                    }).catch((err) => {
                        console.trace("Error: a10 ", err.stack)
                    });
            }
        }
    };

    bot.onText(/^\/stats$/, self.stats);
    bot.onText(/^\/stats perday/, self.perDay);

    return self;
};