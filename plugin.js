var format = require("util").format;
var moment = require("moment");
var Promise = require('bluebird');
var _ = require('lodash');

const defaultDeniedResponse = {
    intent: 'notice',
    query: true,
    message: "Permission denied, you are banned from running bot commands."
};

const _toTennuHostmask = function(hostname) {
    return {
        "hostname": hostname
    };
};

const _forceArray = function(cb) {
    return function(items) {
        if (!_.isArray(items)) {
            items = [items];
        }
        return cb.apply(this, arguments);
    }
}

const _alreadyExists = function(banned, hostnames) {
    var any = false;
    _.map(banned, function(item) {
        return _.pick(item, ['hostname']).hostname;
    }).forEach(function(bannedHostname) {
        var matcher = new RegExp(bannedHostname);
        _.each(hostnames, function(hostname) {
            if (matcher.test(hostname)) {
                any = true;
            };
        });
    });
    return any;
}

var TennuBan = {
    requiresRoles: ['admin'],
    init: function(client, imports) {

        var banConfig = client.config("banned");

        var banned = imports.admin.initalizeAdmins(banConfig);

        const deniedResponse = (client.config("banned-attempt-response") || defaultDeniedResponse);

        /**
         * Adds ban(s) to the global ban list.
         * @param {Array<String>|String} hostnames.
         * @return {Object} newly banned item(s).
         */
        function addBans(hostnames) {

            if (_alreadyExists(banned, hostnames)) {
                throw new Error('host(s) already banned.');
            }

            var newBans = imports.admin.initalizeAdmins(hostnames.map(_toTennuHostmask));
            banned = banned.concat(newBans);
            return newBans;
        }

        /**
         * Adds temporary ban(s) to the global ban list.
         * @param {Array<String>|String} hostnames.
         * @param {Array|duration} int.
         * @param {Array|String} duration key ('seconds'|'s'|'minutes'|'m'|'months'|'M'). 
         * @return {Object} newly temp banned item(s).
         */
        function addTempBans(hostnames, durationValue, key) {

            if (_alreadyExists(banned, hostnames)) {
                throw new Error('host(s) already banned.');
            }
            
            var duration = moment.duration(parseInt(durationValue), key);
            var newBans = imports.admin.initalizeAdmins(hostnames.map(_toTennuHostmask));
            var newTempBans = newBans.map(function(ban) {
                ban.timestamp = new Date();
                ban.duration = duration;
                return ban;
            });
            banned = banned.concat(newTempBans);
            return newTempBans;
        }

        /**
         * Remove bans from the global ban list.
         * @param {Array<String>|String} hostnames.
         *     {nickname: "^havvy$", username: "^havvy$", identifiedas: "havvy"},
         *     {identifiedas: "botmaster"}
         * @return {Object} newly temp banned item(s).
         */
        function removeBans(hostnames) {
            var maybeNewBanned = [];
            var removed = [];
            _.each(hostnames, function(hostname) {
                maybeNewBanned = _.reject(banned, function(item) {
                    var match = new RegExp(item.hostname);
                    var matchResult = match.test(hostname);
                    if (matchResult) {
                        removed.push(item);
                    };
                    return matchResult;
                });
            });

            if (maybeNewBanned.length !== (banned.length - hostnames.length)) {
                throw new Error('Invalid match for search criteria.'); // TODO: Ownix: errors.js throw RemoveMatchFailedError({});
            }

            banned = maybeNewBanned;

            return removed;
        }

        /**
         * Retrieve the global ban list
         * @return {Array} The global ban list.
         */
        function getBanned() {
            return banned;
        }

        /**
         * Clear the global ban list (used mainly for testing and debugging)
         * @return {Array} The global ban list.
         */
        function clearBans() {
            var removedBans = _.cloneDeep(banned);
            banned = [];
            return removedBans;
        }

        /**
         * Compares the hostname against the banned users until a hit is found
         * @param {Object} a hostname
         * @return {Strng|undefined} a ban, or undefined.
         */
        function getFirstHostname(hostname) {
            return _.find(banned, function(bannedItem) {
                var matcher = new RegExp(bannedItem.hostname);
                return (matcher.test(hostname));
            });
        }

        /**
         * Get a countdown or false if banned cache item is now expired
         * @param {Object} an object from the banned cache
         * @return {Strng|false} a countdown, or false if not yet expired.
         */
        function isExpired(bannedItem) {
            if (!bannedItem.hasOwnProperty('timestamp') || !bannedItem.hasOwnProperty('duration')) {
                throw new Error('Located ban is not a temp ban.'); // TODO: Ownix: errors.js throw RemoveMatchFailedError({});
            }

            // Math
            var timestampPlusDuration = moment(bannedItem.timestamp).add(bannedItem.duration);
            if(timestampPlusDuration > moment()){
                return bannedItem.duration.humanize(true);
            }

            return false;
        }

        return {
            commandMiddleware: function(command) {
                // Admin override
                return imports.admin.isAdmin(command.hostmask)
                    .then(function(isAdmin) {
                        if (isAdmin) {
                            return command; // user is an admin.
                        }

                        // Banned check
                        return imports.admin.isAdmin(command.hostmask, banned)
                            .then(function(isBanned) {
                                if (!isBanned) {
                                    return command; // not banned
                                }

                                var bannedUser = getFirstHostname(command.hostmask.hostname);
                                if (!bannedUser) {
                                    throw new Error('User is banned, but unable to find a match for the hostname.');
                                }

                                // Temp ban check
                                if (bannedUser.hasOwnProperty('duration')) {
                                    var expireTimeLeft = isExpired(bannedUser);
                                    if (expireTimeLeft) {
                                        client.notice(command.nickname, expireTimeLeft);
                                    }
                                    else {
                                        return command;
                                    }
                                }

                                client.note("PluginAdmin", format("banned user '%s' tried to run command '%s'", command.nickname, command.command));

                                return deniedResponse;
                            });
                    });
            },
            exports: {
                addBans: _forceArray(addBans),
                addTempBans: _forceArray(addTempBans),
                removeBans: _forceArray(removeBans),
                getBanned: getBanned,
                clearBans: clearBans,
                isExpired: isExpired,
                getFirstHostname: getFirstHostname
            }
        }
    }
};

module.exports = TennuBan;