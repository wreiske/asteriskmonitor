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

Template.meetme.meetme_mute_user = function(bridge, user_id) {
    var error_box = $("#errors");
    Meteor.call('meetme_mute_user',
        bridge,
        user_id,
        function(error, result) {
            console.log(error);
            console.log(result);

            if (error) {
                error_box.append('<p>Error muting user:</p>');
                error_box.append('<p>' + error + '</p>');
                $("#error").fadeIn();
            } else {
                $("#error").fadeOut();
                //console.log(result);
            }
        });
};
Template.meetme.meetme_kick_user = function(bridge, user_id) {
    var error_box = $("#errors");
    Meteor.call('meetme_kick_user',
        bridge,
        user_id,
        function(error, result) {
            console.log(error);
            console.log(result);

            if (error) {
                error_box.append('<p>Error kicking user:</p>');
                error_box.append('<p>' + error + '</p>');
                $("#error").fadeIn();
            } else {
                $("#error").fadeOut();
                // console.log(result.message);
            }
        });
};
