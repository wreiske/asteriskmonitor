Meteor.subscribe("AmiLog");
Template.calls.helpers({
    call: function() {
        return AmiLog.find({
            'uniqueid': {
                $exists: true
            }
        }, {
            sort: {
                starmon_timestamp: -1
            },
            limit: 10
        });
    },
    call_count: function() {
        return AmiLog.find({
            'uniqueid': {
                $exists: true
            }
        }).count();
    }
});
