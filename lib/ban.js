var moment = require('moment');
var _ = require('lodash');

var _toTennuHostmask = function(hostname) {
    return {
        'hostname': hostname
    };
};

var banProperties = [
    'nickname',
    'username',
    'hostname',
    'identifiedas'
];

// bans: [property, pattern, flags]
var bans = {
    'nickname': "abc"
};
// !ban hostname -r "[k|K]id.*" -f "ig"
function addBan(hostmask) {
    var self = this;
    var newBan = self.initalizeAdmins([hostmask]);
    self.banned.push(newBan);
    return newBan;
};

function addTempBan(hostmask, durationValue, durationKey) {
    var self = this;
    var now = moment();
    var duration = moment.duration(parseInt(durationValue, 10), durationKey);
    var newBan = self.initalizeAdmins([hostmask]);
    newBan.expires = now.add(duration);
    self.banned.push(newBan);
    return newBan;
};

function removeBan(hostmask) {
    var self = this;
    var banToRemove = self.initalizeAdmins([hostmask]);
    self.isAdmin(hostmask, {
        customAdmins: self.banned
    })
    .then(function(isMatch){
        if(isMatch){
            
        }
    })
}

function clearBans() {
    var self = this;
    var removedBans = _.cloneDeep(self.banned);
    self.banned = [];
    return removedBans;
}

function isExpired(bannedItem) {
    
    if (!bannedItem.hasOwnProperty('expires')) {
        throw new Error('Located ban is not a temp ban.'); // TODO: Ownix: errors.js throw RemoveMatchFailedError({});
    }
 
    if (moment() < moment(bannedItem.expires)) {
        return bannedItem.expires.from();
    }
 
    return false;
}

module.exports = function(banned, initalizeAdmins, isAdmin) {
    return {
        banned: banned,
        initalizeAdmins: initalizeAdmins,
        isAdmin: isAdmin,

        addBans: addBan,
        addTempBans: addTempBan,
        removeBans: removeBan,
        clearBans: clearBans,
        isExpired: isExpired
    };
};
