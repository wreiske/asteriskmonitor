Meteor.subscribe("MeetMe");
Template.meetme.helpers({
    bridge: function() {
        return MeetMe.find({
            'meetme': {
                $exists: true
            }
        }, {
            sort: {
                meetme: -1
            }
        });
    },
    conference: function() {
        return MeetMe.find({
            'meetme': {
                $exists: true
            }
        }, {
            sort: {
                meetme: -1
            }
        });
    },
    bridge_count: function() {
        return MeetMe.find({
            'meetme': {
                $exists: true
            }
        }).count();
    }
});
