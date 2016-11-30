var _ = require('lodash');
var moment = require('moment');

function assertions(shouldContext){

    shouldContext.Assertion.add('banned', function() {
        this.params = {
            operator: 'to be banned'
        };
        this.obj.should.have.property('intent').which.is.equal('notice');
        this.obj.should.have.property('query').which.is.equal(true);
    });
    
    shouldContext.Assertion.add('banobjectarray', function() {
        this.params = {
            operator: 'to be an array of banned objects'
        };
        this.obj.should.be.Array();
        _.each(this.obj, function(item) {
            item.should.have.property('nickname');
            item.should.have.property('username');
            item.should.have.property('hostname');
            item.should.have.property('identifiedas');
        });
    });
    
    shouldContext.Assertion.add('containHostname', function(hostname) {
        this.params = {
            operator: 'to contain the hostmask'
        };
        var hits = _.filter(this.obj, function(bannedItem){
            var matcher = new RegExp(bannedItem.hostname);
            //console.log('Does ' + hostname + ' match ' + matcher.toString() + ' : ' + matcher.test(hostname) );
            return matcher.test(hostname);
        });
        hits.should.have.length(1);
    });
    
    shouldContext.Assertion.add('tempban', function() {
        this.params = {
            operator: 'to be a tempban object'
        };
        _.each(this.obj, function(item) {
            item.should.have.property('timestamp');
            item.should.have.property('duration');
            moment.isDuration(item.duration).should.be.equal(true);
        });
    });
}

module.exports = assertions;