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
const admin = require("../plugins/admin");

describe("Admin tests", function () {
    it("registers events in bot", function () {
        let spy = sinon.spy();
        let a = admin({onText: spy}, null, null);

        spy.should.have.been.calledTwice;
        spy.should.have.been.calledWith(/^\/stats$/, a.stats);
        spy.should.have.been.calledWith(/^\/stats perday/, a.perDay);
    });

    describe("stats", function () {
        it("does not respond to non-admins", function () {
            let onText = sinon.spy();
            let sendMessage = sinon.spy();
            let a = admin({onText, sendMessage}, null, [123]);

            a.stats({from: {id: 321}});

            sendMessage.should.have.not.been.called;
        });

        it("calls the database method", function () {
            let onText = sinon.spy();
            let sendMessage = sinon.spy();
            let stats = sinon.stub().returns(new Promise(() => {}));
            let a = admin({onText, sendMessage}, {stats}, [123]);

            a.stats({from: {id: 123}});

            stats.should.have.been.called;
        });

        it("responds to admin", function (done) {
            let onText = sinon.spy();
            let sendMessage = sinon.spy();
            let stats = sinon.stub().returns(Promise.resolve({}));
            let a = admin({onText, sendMessage}, {stats}, [123]);

            a.stats({from: {id: 123}, chat: {id: 123}})
                .then(()=>sendMessage.should.have.been.called)
                .then(()=>done())
                .catch(err=>done(err));
        });
    });

    describe("perday", function () {
        it("does not respond to non-admins", function () {
            let onText = sinon.spy();
            let sendMessage = sinon.spy();
            let a = admin({onText, sendMessage}, null, [123]);

            a.perDay({from: {id: 321}});

            sendMessage.should.have.not.been.called;
        });

        it("calls the database method", function () {
            let onText = sinon.spy();
            let sendMessage = sinon.spy();
            let messagePerDay = sinon.stub().returns(new Promise(() => {}));
            let a = admin({onText, sendMessage}, {messagePerDay}, [123]);

            a.perDay({from: {id: 123}});

            messagePerDay.should.have.been.calledWith(10);
        });

        it("gives appropriate message if no data", function (done) {
            let onText = sinon.spy();
            let sendMessage = sinon.spy();
            let messagePerDay = sinon.stub().returns(Promise.resolve([]));
            let a = admin({onText, sendMessage}, {messagePerDay}, [123]);

            a.perDay({from: {id: 123}, chat: {id: 123}})
                .then(()=>sendMessage.should.have.been.calledWith(123, "No data :("))
                .then(()=>done())
                .catch(err=>done(err));
        });

        it("displays data", function (done) {
            let onText = sinon.spy();
            let sendMessage = sinon.spy();
            let messagePerDay = sinon.stub().returns(Promise.resolve([
                {date: new Date("10/30/2017"), count: 5}
            ]));
            let a = admin({onText, sendMessage}, {messagePerDay}, [123]);

            a.perDay({from: {id: 123}, chat: {id: 123}})
                .then(()=>sendMessage.should.have.been.calledWith(123, "10/30/2017 -  5"))
                .then(()=>done())
                .catch(err=>done(err));
        });

        it("can display more than one line", function (done) {
            let onText = sinon.spy();
            let sendMessage = sinon.spy();
            let messagePerDay = sinon.stub().returns(Promise.resolve([
                {date: new Date("10/28/2017"), count: 5},
                {date: new Date("10/29/2017"), count: 10},
                {date: new Date("10/30/2017"), count: 8},
            ]));
            let a = admin({onText, sendMessage}, {messagePerDay}, [123]);

            a.perDay({from: {id: 123}, chat: {id: 123}})
                .then(()=>sendMessage.should.have.been.calledWith(123, util.lt`
                    10/28/2017 -  5
                    10/29/2017 -  10
                    10/30/2017 -  8
                `))
                .then(()=>done())
                .catch(err=>done(err));
        });
    });
});
