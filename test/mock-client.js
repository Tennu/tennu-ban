var _ = require('lodash');

var logger = {
    'notice': _.noop,
    'debug': _.noop,
    'note': _.noop,
    'error': _.noop
};

function config(value) {
    var cfg = {
        'banned': [{
            'hostname': 'a.b.c'
        }],
        'admins': [{
            'hostname': 'h.i.j'
        }],
    };
    return cfg[value];
}

var exportObject = {
    'config': config,
    '_logger': logger
};

_.mapKeys(logger, function(value, key) {
    exportObject[key] = value;
});

module.exports = exportObject;
