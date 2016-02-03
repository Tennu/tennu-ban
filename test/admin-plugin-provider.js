var mockClient = require('./mock-client');

var imports = {
    'user': {
        'isIdentifiedAs': function() {
            return undefined;
        }
    }
};

var plugin = require('tennu-admin');

module.exports = plugin.init(mockClient, imports).exports;