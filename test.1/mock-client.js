var _ = require('lodash');

var logger = {
    'notice': _.noop,
    'debug': _.noop,
    'note': _.noop,
    'error': _.noop
};

var configurationObject = {
    'banned': [{
        'hostname': 'a.b.c'
    }],
    'admins': [{
        'hostname': 'h.i.j'
    }],
};

function config(value) {
    return configurationObject[value];
}

function updateConfig(defaultConfig){
    configurationObject = _.assign({}, defaultConfig, configurationObject);
}

var exportObject = {
    'updateConfig': updateConfig,
    'config': config,
    '_logger': logger
};

_.mapKeys(logger, function(value, key) {
    exportObject[key] = value;
});

module.exports = exportObject;
