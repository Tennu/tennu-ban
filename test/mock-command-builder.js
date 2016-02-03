module.exports = function(message, hostmask){
    var args = message.split(/ +/);
    return {
        message: message,
        hostmask: hostmask,
        nickname: hostmask.nickname,
        args: args,
        command: args.shift().toLowerCase().replace('!', '')
    };
};