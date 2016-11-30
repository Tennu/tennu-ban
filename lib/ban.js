var moment = require('moment');
var _ = require('lodash');

var _toTennuHostmask = function(hostname) {
    return {
        'hostname': hostname
    };
};

function _forceArray(items) {
    if (!_.isArray(items)) {
        items = [items];
    }
    return items;
}

var _alreadyExists = function(banned, hostnames) {
    var any = false;
    _.map(banned, function(item) {
        return _.pick(item, ['hostname']).hostname;
    }).forEach(function(bannedHostname) {
        var matcher = new RegExp(bannedHostname);
        _.each(hostnames, function(hostname) {
            if (matcher.test(hostname)) {
                any = true;
            }
        });
    });
    return any;
};

/**
 * Adds ban(s) to the global ban list.
 * @param {Array<String>|String} hostnames.
 * @return {Object} newly banned item(s).
 */
function addBans(hostnames) {
    var self = this;

    hostnames = _forceArray(hostnames);

    if (_alreadyExists(self.banned, hostnames)) {
        throw new Error('host(s) already banned.');
    }

    var newBans = self.initalizeAdmins(hostnames.map(_toTennuHostmask));
    self.banned = self.banned.concat(newBans);
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
    var self = this;

    hostnames = _forceArray(hostnames);

    if (_alreadyExists(self.banned, hostnames)) {
        throw new Error('host(s) already banned.');
    }

    var duration = moment.duration(parseInt(durationValue, 10), key);
    var newBans = self.initalizeAdmins(hostnames.map(_toTennuHostmask));
    var newTempBans = newBans.map(function(ban) {
        ban.timestamp = new Date();
        ban.duration = duration;
        return ban;
    });
    self.banned = self.banned.concat(newTempBans);
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
    var self = this;

    hostnames = _forceArray(hostnames);

    var maybeNewBanned = [];
    var removed = [];
    _.each(hostnames, function(hostname) {
        maybeNewBanned = _.reject(self.banned, function(item) {
            var match = new RegExp(item.hostname);
            var matchResult = match.test(hostname);
            if (matchResult) {
                removed.push(item);
            }
            return matchResult;
        });
    });

    if (maybeNewBanned.length !== (self.banned.length - hostnames.length)) {
        throw new Error('Invalid match for search criteria.'); // TODO: Ownix: errors.js throw RemoveMatchFailedError({});
    }

    self.banned = maybeNewBanned;

    return removed;
}

/**
 * Retrieve the global ban list
 * @return {Array} The global ban list.
 */
function getBanned() {
    return this.banned;
}

/**
 * Clear the global ban list (used mainly for testing and debugging)
 * @return {Array} The global ban list.
 */
function clearBans() {
    var self = this;
    var removedBans = _.cloneDeep(self.banned);
    self.banned = [];
    return removedBans;
}

/**
 * Compares the hostname against the banned users until a hit is found
 * @param {Object} a hostname
 * @return {Strng|undefined} a ban, or undefined.
 */
function getFirstHostname(hostname) {
    var self = this;
    return _.find(self.banned, function(bannedItem) {
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

    var timestampPlusDuration = moment(bannedItem.timestamp).add(bannedItem.duration);
    if (timestampPlusDuration > moment()) {
        return bannedItem.duration.humanize(true);
    }

    return false;
}

module.exports = function(banned, initalizeAdmins) {
    return {
        banned: banned,
        initalizeAdmins: initalizeAdmins,

        addBans: addBans,
        addTempBans: addTempBans,
        removeBans: removeBans,
        getBanned: getBanned,
        clearBans: clearBans,
        isExpired: isExpired,
        getFirstHostname: getFirstHostname
    };
};
