const {Pool} = require('pg');
const util = require('./util');

module.exports = ({host, port, user, password, database}) => {
    const pool = new Pool({user, host, database, password, port});

    const self = {
        /**
         * adds a new message to database
         * @param message_id {string} inline_message_id
         * @param from {number} user_id of sender
         * @param to_username {string} username of receiver (optional)
         * @param to_id {number} user_id of receiver (optional)
         * @param text {string} message text
         * @returns {Promise<{message_id:number}>}
         */
        addMsg(message_id, from, to_username, to_id, text) {
            return pool.query(
                "INSERT INTO messages (sender_id, receiver_id, username, message, inline_message_id, seen) VALUES ($1, $2, $3, $4, $5, false)",
                [from, to_id, to_username, text, message_id]);
        },
        /**
         * Searches for a message using it's id
         * @param {string} id inline_message_id
         * @returns {Promise<{message:string, receiver_id:number|null, username:string|null}>}
         */
        findMsg(id) {
            return pool.query("SELECT sender_id,receiver_id, username, message FROM messages WHERE inline_message_id = $1", [id])
                .then(r => r.rows[0])
        },
        /**
         *
         * @param {string} message_id inline_message_id
         * @param {number} user_id telegram callback_query.from.id
         * @returns {Promise}
         */
        setSeen(message_id, user_id) {
            return pool.query(
                "UPDATE messages SET seen = true, receiver_id = $1 WHERE inline_message_id = $2",
                [user_id, message_id]
            );
        },
        /**
         * adds a contact
         * @param user_id {number} user_id of contact owner
         * @param contact {object} content of "forward_from"
         * @returns {Promise}
         */
        addContact(user_id, contact) {
            return self.addUser(contact.id, util.lang(contact), util.name(contact), contact.username)
                .then(() =>
                    pool.query(
                        "INSERT INTO contacts (user_id, contact_id) VALUES ($1, $2) " +
                        "ON CONFLICT(user_id, contact_id) DO UPDATE set created_at = CURRENT_TIMESTAMP",
                        [user_id, contact.id]
                    ));
        },
        /**
         * gets list of users, which either the user has sent message to, or user forwarded their pm to the bot
         * @param {number} user_id
         * @returns {Promise.<{user_id:number, name:string, username:string, time:date}>}
         */
        getContacts(user_id) {
            return pool.query(`SELECT * FROM (
                SELECT DISTINCT ON (user_id) user_id, name, username, time FROM 
                (
                        (SELECT u.user_id, u.name, u.username, created_at as time FROM contacts c 
                            LEFT JOIN users u ON u.user_id = c.contact_id WHERE c.user_id = $1
                            ORDER BY created_at desc LIMIT $2)
                    UNION
                        (SELECT u.user_id, u.name, u.username, m.sent_at as time from messages m 
                            RIGHT JOIN users u ON m.receiver_id = u.user_id WHERE m.sender_id = $1
                            ORDER BY sent_at desc LIMIT $2)
                ) t
                ORDER BY user_id
                ) g ORDER BY time desc LIMIT $2`, [user_id, 5])
                .then(r => r.rows);
        },
        /**
         * adds a user to database, if already exists update's his info
         * @param user_id {number}
         * @param lang {string} (2chars)[en|ar|fa]
         * @param name {string}
         * @param username {string}
         * @returns {Promise}
         */
        addUser(user_id, lang, name, username) {
            return pool.query("INSERT INTO users (user_id, lang, name, username) VALUES ($1, $2, $3, $4) " +
                "ON CONFLICT(user_id) DO UPDATE SET name=$3, username=$4", [user_id, lang, name, username])
        },
        /**
         * Changes a user's language
         * @param {number} user_id
         * @param {string} lang (2chars)[en|ar|fa]
         * @returns {Promise}
         */
        changeLang(user_id, lang) {
            return pool.query("UPDATE users SET lang=$1 WHERE user_id=$2", [lang, user_id])
        },
        /**
         * Gets a user
         * @param {number} user_id
         * @returns {Promise<{lang:string,name:string,username:string}>}
         */
        getUser(user_id) {
            return pool.query("SELECT lang,name,username FROM users WHERE user_id=$1", [user_id])
                .then(res => res.rows[0]);
        },
        /**
         * Gets some stats for admin from database, e.g. users_count, ...
         * @returns {Promise}
         */
        stats() {
            return pool.query(`SELECT
                (SELECT count(*) FROM users) as users_count,
                (SELECT count(*) FROM users WHERE can_send = true) as users_started,
                (SELECT count(*) FROM messages) as messages_count,
                (SELECT count(*) FROM messages WHERE seen = true) as messages_seen,
                (SELECT count(*) FROM users WHERE first_msg > CURRENT_DATE - INTERVAL '7 days') as users_7,
                (SELECT count(*) FROM messages WHERE sent_at > CURRENT_DATE - INTERVAL '7 days') as messages_7,
                (SELECT count(*) FROM messages WHERE seen = true and sent_at > CURRENT_DATE - INTERVAL '7 days') as messages_seen_7,
                (SELECT count(*) FROM (SELECT DISTINCT sender_id FROM messages WHERE sent_at > CURRENT_DATE - INTERVAL '7 days') AS temp) as users_active
            `).then(r => r.rows[0]);
        },
        /**
         * shows a list of days with number of messages each day (only for days with at least 1 message)
         * @param {number} days, how many days?
         * @returns {Promise}
         */
        messagePerDay(days) {
            return pool.query("SELECT date(sent_at), count(*) FROM messages" +
                " GROUP BY date(sent_at) order by date(sent_at) desc limit $1", [days])
                .then(r => r.rows)
        },
        pool    // used by tests
    };
    return self;
};