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
const fwd = require("../plugins/fwd");

describe("Contact tests", function () {
    it("registers events in bot", function () {
        let spy = sinon.spy();
        let f = fwd({on: spy}, null);

        spy.should.have.been.calledOnce;
        spy.should.have.been.calledWith('message', f.message);
    });

    it("ignores the message if it is not forwarded", function () {
        let on = sinon.spy();
        let f = fwd({on}, null);

        f.message({})
    });

    it("responds with 'dontFwdChannel' if message forwarded from channel", function (done) {
        let on = sinon.spy();
        let sendMessage = sinon.spy();
        let addUser = sinon.stub().returns(Promise.resolve(true));
        let getUser = sinon.stub();
        let f = fwd({on, sendMessage}, {addUser, getUser});

        getUser.onCall(0).returns(Promise.resolve({lang: 'en'}));
        getUser.onCall(1).returns(Promise.resolve({lang: 'ar'}));

        Promise.all([
            f.message({from: {id: 123, first_name: 'a'}, chat: {id: 123}, forward_from_chat: {id: -1}}),
            f.message({from: {id: 124, first_name: 'b'}, chat: {id: 124}, forward_from_chat: {id: -1}})
        ]).then(() => {
            sendMessage.should.have.been.calledTwice;
            sendMessage.should.have.been.calledWith(123, util.getText('en', 'dontFwdChannel'));
            sendMessage.should.have.been.calledWith(124, util.getText('ar', 'dontFwdChannel'));
        })
            .then(done)
            .catch(done);
    });

    it("saves contact correctly", function (done) {
        let on = sinon.spy();
        let sendMessage = sinon.spy();
        let addUser = sinon.stub().returns(Promise.resolve(true));
        let getUser = sinon.stub().returns(Promise.resolve({lang: 'en'}));
        let addContact = sinon.stub().returns(Promise.resolve(true));
        let f = fwd({on, sendMessage}, {addUser, getUser, addContact});

        let a = {id: 123, first_name: 'a'};
        let b = {id: 124, first_name: 'b'};

        f.message({chat: {id: 123}, from: a, forward_from: b})
            .then(() => {
                addUser.should.have.been.calledOnce;
                addUser.should.have.been.calledWith(a.id, util.lang(a), util.name(a), a.username);
                addContact.should.have.been.calledOnce;
                addContact.should.have.been.calledWith(a.id, b);
            })
            .then(done)
            .catch(done);
    });
});
