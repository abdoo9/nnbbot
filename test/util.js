"use strict";

// Test framework includes
const chai = require("chai");
const sinon = require("sinon");

const sinonChai = require("sinon-chai");
chai.use(sinonChai);
const chaiAsPromised = require("chai-as-promised");
chai.use(chaiAsPromised);

const should = chai.should();

// Code Includes
const util = require("../plugins/util");

describe("Util tests", function () {
    describe("util.name", function () {
        it("returns first_name", function () {
            util.name({first_name: 'aaa'}).should.equal('aaa')
        });
        it("returns first_name + last_name", function () {
            util.name({first_name: 'aaa', last_name: 'bbb'}).should.equal('aaa bbb')
        });
        it("returns name", function () {
            util.name({name: 'ccc'}).should.equal('ccc')
        });
    });

    describe("util.linkname", function () {
        it("returns name if no username", function () {
            util.linkName({name: 'aaa'}).should.equal("aaa");
        });
        it("returns markdown if user has username", function () {
            util.linkName({name: 'aaa', username: 'bbb'}).should
                .equal('[aaa](https://t.me/bbb)');
        });
        it("escapes markdown correctly", function () {
            util.linkName({name: 'a_*[`]'}).should.equal('a\\_\\*\\[\\`]');
            util.linkName({name: 'a_*[`]', username: 'b_b'}).should
                .equal('[a_*[`](https://t.me/b_b)');
        })
    });

    describe("util.lang", function () {
        it("returns first two letters of language code", function () {
            util.lang({language_code: 'en-US'}).should.equal('en');
            util.lang({language_code: 'fa-IR'}).should.equal('fa');
            util.lang({language_code: 'ar'}).should.equal('ar');
        });

        it("returns en if language is not defined", function () {
            util.lang({}).should.equal('en');
        });
    });

    describe("util.parseMessage", function () {
        it("detects usernames", function () {
            let {toId} = util.parseMessage("text @aaa");
            toId.should.equal("aaa");
        });

        it("detects user_id", function () {
            let {toId} = util.parseMessage("text 159263523");
            toId.should.equal(159263523);
        });

        it("returns null if no recipients", function () {
            let {toId} = util.parseMessage("text");
            should.equal(toId, null);
        });

        it("returns text without toId", function () {
            let {txt} = util.parseMessage("text @aaa");
            txt.should.equal("text");
        });
    });

    describe("util.tryJson", function () {
        it("returns text as is if not json", function () {
            util.tryJson("goat").should.equal("goat");
        });
        it("parses string as json", function () {
            util.tryJson('"goat"').should.equal("goat");
        });
    });

    describe("util.lt", function () {
        it("removes indents from multi-line string", function () {
            util.lt`
                a
                b
            `.should.equal("a\nb");
        });

        it("preserves newlines", function () {
            util.lt`
            a
            
            b
            `.should.equal('a\n\nb')
        })
    });

    describe("util.keyboard", function () {
        it("returns a valid telegram reply_markup", function () {
            new (util.keyboard)([], false).should.deep.equal({
                disable_web_page_preview: true,
                reply_markup: {inline_keyboard: [[]]}
            })
        });

        it("returns a key", function () {
            let key = {text: 'aaa', callback_data: 'bbb'};
            new (util.keyboard)([key], false)
                .reply_markup.inline_keyboard
                .should.deep.equal([[key]])
        });

        it("returns keys", function () {
            let key = {text: 'aaa', callback_data: 'bbb'};
            new (util.keyboard)([key, key], false)
                .reply_markup.inline_keyboard
                .should.deep.equal([[key, key]])
        });

        it("returns keys in multiple rows", function () {
            let key = {text: 'aaa', callback_data: 'bbb'};
            new (util.keyboard)([key, "<br>", key], false)
                .reply_markup.inline_keyboard
                .should.deep.equal([[key], [key]])
        });
    });
});
