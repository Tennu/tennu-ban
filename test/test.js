var _ = require('lodash');
var should = require('should');
require('./assertions')(should);
var Promise = require('bluebird');

var mockClient = require('./mock-client');
var mockImports = require('./mock-imports');
var mockCommandBuilder = require('./mock-command-builder');

var plugin = require('../plugin')
mockClient.updateConfig(plugin.configDefaults);
plugin = plugin.init(mockClient, mockImports);

var pluginExports = plugin.exports;

var bannedUser = {
    nickname: 'test123',
    hostname: 'a.b.c'
};

var nonBannedUser = {
    nickname: 'test456',
    hostname: 'd.f.g'
};

var adminUser = {
    nickname: 'test789',
    hostname: 'h.i.j'
};

var tempBannedUser = {
    nickname: 'test101112',
    hostname: 'k.l.m'
};

describe('tennu-ban', function() {

    // beforeEach(function(){
    //     pluginExports.clearBans();
    // });

    describe('basic usage', function() {
        it('Should stop a banned user from running a command', function(done) {
            var command = mockCommandBuilder('!sayr', bannedUser);
            plugin.commandMiddleware(command).then(function(result) {
                result.should.be.banned();
                done();
            });
        });
        it('Should stop a temp banned user from running a command', function(done) {
            pluginExports.addTempBans('k.l.m', 100, 'ms');
            var command = mockCommandBuilder('!sayr', tempBannedUser);
            plugin.commandMiddleware(command).then(function(result) {
                result.should.be.banned();
                done();
            });
        });
        it('Should allow a non-banned user to run commands', function(done) {
            var command = mockCommandBuilder('!sayr', nonBannedUser);
            plugin.commandMiddleware(command).then(function(result) {
                result.should.be.equal(command);
                done();
            });
        });
        it('Should allow a temp banned user from running a command after expire', function(done) {
            var command = mockCommandBuilder('!sayr', tempBannedUser);
            Promise.delay(150)
                .then(function() {
                    return plugin.commandMiddleware(command);
                })
                .then(function(result) {
                    result.should.be.equal(command);
                })
                .then(function() {
                    done();
                });
        });
        it('Should allow admins through', function(done) {
            var command = mockCommandBuilder('!sayr', adminUser);
            plugin.commandMiddleware(command).then(function(result) {
                result.should.be.equal(command);
                done();
            });
        });
    });

    describe('exports', function() {
        describe('#addBans()', function() {
            it('Should add and return a new banned user', function() {
                var bannedUsers = pluginExports.addBans('banned.host.1');
                should(bannedUsers).be.a.banobjectarray();
                pluginExports.getBanned().should.containHostname(bannedUsers[0].hostname);
            });
            it('Should throw on adding duplicate bans', function(done) {
                Promise
                    .try(function() {
                        pluginExports.addBans('banned.host.1');
                    })
                    .catch(function(err) {
                        err.should.Error('host(s) already banned.');
                    })
                    .then(function() {
                        done();
                    });
            });
            it('Should add multiple bans and return banned those new banned users', function() {
                var bannedUsers = ['banned.host.2', 'banned.host.3'];

                var addedBannedUsers = pluginExports.addBans(bannedUsers);

                addedBannedUsers.should.be.a.banobjectarray();

                // getBanned has them?
                pluginExports.getBanned().should.containHostname(bannedUsers[0]);
                pluginExports.getBanned().should.containHostname(bannedUsers[1]);
            });
        });
        describe('#addTempBans()', function() {
            it('Should add and return a new temp banned user', function() {
                var bannedUsers = pluginExports.addTempBans('banned.host.4', 2, 'm');
                should(bannedUsers).be.a.banobjectarray();
                pluginExports.getBanned().should.containHostname(bannedUsers[0].hostname);
                bannedUsers.should.be.a.tempban();
            });
        });
        describe('#removeBans()', function() {
            it('Should remove and return the removed banned user', function() {
                var bannedUsers = pluginExports.removeBans('banned.host.3');
                pluginExports.getBanned().should.not.containHostname(bannedUsers[0].hostname);
            });
        });
        describe('#getBanned()', function() {
            it('Should return an array', function() {
                pluginExports.getBanned().should.have.length(5);
                pluginExports.getBanned().should.be.a.Array();
            });
        });
        describe('#clearBans()', function() {
            it('Should clear all bans and return all deleted', function() {
                pluginExports.clearBans().should.be.Array();
            });
        });
        describe('#isExpired()', function() {
            it('Should not yet be expired', function() {
                var bannedUsers = pluginExports.addTempBans('banned.host.5', 20, 'minutes');
                pluginExports.isExpired(bannedUsers[0]).should.be.equal('in 20 minutes');
            });
            it('Should throw on hostname not a tempban', function(done) {
                Promise
                    .try(function() {
                        pluginExports.addBans('banned.host.1');
                    })
                    .catch(function(err) {
                        err.should.Error('Located ban is not a temp ban.');
                    })
                    .then(function() {
                        done();
                    });
            });
            it('Should be expired', function(done) {
                var bannedUsers = pluginExports.addTempBans('banned.host.7', 100, 'ms');
                Promise.delay(150).then(function() {
                    pluginExports.isExpired(bannedUsers[0]).should.be.equal(false);
                }).then(function() {
                    done();
                });
            });
        });

    });
});
