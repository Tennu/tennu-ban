var format = require('util').format;

var TennuBan = {
    name: 'ban',
    role: 'ban',
    requiresRoles: ['admin'],
    configDefaults: {
        'ban': {
            'denied-response': {
                intent: 'notice',
                query: true,
                message: 'Permission denied, you are banned from running bot commands.'
            }
        }
    },
    init: function(client, imports) {

        var banConfig = client.config('ban');

        var deniedResponse = banConfig['denied-response'];

        var ban = require('./lib/ban')(imports.admin.initalizeAdmins(client.config('banned')), imports.admin.initalizeAdmins);

        return {
            commandMiddleware: function(command) {

                // Admin override
                return imports.admin.isAdmin(command.hostmask)
                    .then(function(isAdmin) {
                        if (isAdmin) {
                            return command; // user is an admin.
                        }

                        // Banned check
                        return imports.admin.isAdmin(command.hostmask, ban.banned)
                            .then(function(isBanned) {

                                if (!isBanned) {
                                    return command; // not banned
                                }

                                var bannedUser = ban.getFirstHostname(command.hostmask.hostname);
                                if (!bannedUser) {
                                    throw new Error('User is banned, but unable to find a match for the hostname.');
                                }

                                // Temp ban check
                                if (bannedUser.hasOwnProperty('expires') && !ban.isExpired(bannedUser)) {
                                    return command;
                                }

                                client.note('PluginAdmin', format('banned user "%s" tried to run command "%s"', command.nickname, command.command));

                                return deniedResponse;
                            });
                    });
            },
            exports: ban
        };
    }
};

module.exports = TennuBan;
