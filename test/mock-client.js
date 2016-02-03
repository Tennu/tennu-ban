var _ = require('lodash');

    var logger =  {
        "notice": function(text) {
            //console.info(text);
        },
        "debug": function(text) {
            //console.info(text);
        },
        "note": function(pretext, text) {
            //console.info(pretext, text);
        },
        "error": function(text) {
            //console.error(text);
        }
    };

function config(value) {
    var cfg = {
        "banned": [{
            "hostname": "a.b.c"
        }],
        "admins": [{
            "hostname": "h.i.j"
        }],
    };
    return cfg[value];
}

var exportObject = {
    "config": config,
    "_logger": logger
};

_.mapKeys(logger, function(value, key) {
    exportObject[key] = value;
});

module.exports = exportObject;