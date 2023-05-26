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
const testDb = {
    host: '127.0.0.1',
    port: 5432,
    user: 'test',
    password: 'test',
    database: 'test'
};

describe("db tests", function () {
    const database = require("../plugins/database")(testDb);
    const schema = require('fs').readFileSync(
        require('path').join(__dirname, '../public.sql'), {encoding: 'utf-8'});

    beforeEach(function () {
        // Delete database and import public.sql file
        return database.pool
            .query("DROP SCHEMA IF EXISTS public CASCADE")
            .then(() => {
                let p = database.pool.query("CREATE SCHEMA public");
                schema.split(';').forEach(q =>
                    p = p.then(() => database.pool.query(q)));
                return p;
            })
    });

    describe("addMessage", function () {
        it("gives error if sender is not in database", function () {
            return database.addMsg("1", 1, undefined, 2, "test")
                .should.be.rejected;
        });

        it("should add without error", function () {
            return database.addUser(123, 'en', 'a', undefined)
                .then(() => database.addMsg("1", 123, undefined, 321, "test"))
                .should.be.fulfilled;
        });
    });

    describe("findMessage", function () {
        it("returns undefined if message does not exist", function () {
            return database.findMsg("x").should.eventually.equal(undefined)
        });

        it("returns the message", function () {
            return database.addUser(123, 'en', 'a', undefined)
                .then(() => database.addMsg("2", 123, undefined, 321, "test"))
                .then(() => database.findMsg("2"))
                .should.eventually.deep.equal({receiver_id: 321, username: null, message: "test"})
        });

        it("returns the username", function () {
            return database.addUser(123, 'en', 'a', undefined)
                .then(() => database.addMsg("2", 123, 'a_b', 321, "test"))
                .then(() => database.findMsg("2"))
                .should.eventually.deep.equal({receiver_id: 321, username: 'a_b', message: "test"})
        });
    });
});
