const languages = require('./langs');

let self = module.exports = {
    /**
     * returns user's name (first+last)
     * @param user {object}, given by telegram (msg.from)
     * @returns {string}
     */
    name(user) {
        let name = user.first_name;
        if (user.name)
            return user.name;
        if (user.last_name)
            name += " " + user.last_name;
        return name.slice(0, 250) + (name.length > 250 ? '...' : '');
    },
    /**
     * gives user's name, if he has a username it will be a markdown link
     * @param user {object}, given by telegram (msg.from)
     * @returns {string}
     */
    linkName(user) {
        return self.name(user).replace(/([_\[*`])/g, '\\$1');
         // user.username ?
         //    `[${self.name(user).replace(/([\]])/g, '')}](https://t.me/${user.username})`
         //    : self.name(user).replace(/([_\[*`])/g, '\\$1');
    },
    /**
     * get's the first two letters of user's language (en, fa, ar)
     * @param user {object}, given by telegram (msg.from)
     * @returns {string}
     */
    lang(user) {
        return (user.language_code || "en-US").substring(0, 2)
    },
    /**
     * returns a function for selected language
     * @param lang {string} (en, fa, ar)
     * @returns {function(string): string}
     */
    getLang(lang) {
        return (text) => self.getText(lang, text)
    },
    /**
     * gets a text from languages
     * @param {string} lang
     * @param {string} text
     * @returns {string}
     */
    getText(lang, text) {
        if (languages[lang]) {
            return languages[lang][text];
        }
        return languages['en'][text];
    },
    /**
     * parses a query to separate username|user_id from text
     * @param {string} query
     * @returns {{toId:number|string|null, txt:string}}
     */
    parseMessage(query) {
        let match = query.match(/^([\s\S]*?)\s*@(\w+)$/);
        if(match && match[1].trim().length>0)
            return {
                toId: match[2].toLowerCase(),
                txt: match[1]
            };

        match = query.match(/^([\s\S]*?)\s(\d+)$/);

        if(match && match[1].trim().length>0)
            return {
                toId: parseInt(match[2]),
                txt: match[1]
            };

        return {
            toId: null,
            txt: query
        };
    },
    /**
     * Creates a uuid
     * @returns {string}
     */
    uuid() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            let r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    },
    /**
     * parses string if it is json, otherwise returns as-is
     * @param {string} callback_data
     * @returns {*}
     */
    tryJson(callback_data) {
        try {
            return JSON.parse(callback_data);
        } catch (err) {
            return callback_data;
        }
    },
    /**
     * Removes spaces in the left side of text, so you can indent text inside back ticks without space appearing in result
     * @param {string[]} t
     * @param {Array} p
     */
    lt: (t, ...p) => self.merge(t.map(p => p.split('\n')
        .map(l => l.trimLeft()).join('\n')), p).join('').trim(),
    merge(a, b) {
        let r = [];
        while (b.length > 0) r.push(a.shift(), b.shift());
        r.push(a.shift());
        return r;
    },
    /**
     * Creates an inline keyboard object
     * @param {({text:string, callback_data:string}|string)[]} btn array of buttons
     * @param {boolean} markdown
     * @constructor
     */
    keyboard: function (btn, markdown) {
        if (markdown)
            this.parse_mode = "Markdown";
        this.disable_web_page_preview = true;
        if (btn) {
            this.reply_markup = {inline_keyboard: [[]]};
            let r = 0;
            for (let i of btn) {
                if (typeof (i) === "object")
                    this.reply_markup.inline_keyboard[r].push(i);
                else {
                    this.reply_markup.inline_keyboard.push([]);
                    r++;
                }
            }
        }
    },
};