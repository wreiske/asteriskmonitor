Template.conferences.helpers({
    bridge: function() {
        return Conferences.find({
            'meetme': {
                $exists: true
            }
        }, {
            sort: {
                meetme: -1
            }
        });
    },
    bridges: function() {
        var people = Conferences.find({
            'meetme': {
                $exists: true
            }
        }, {
            sort: {
                meetme: -1
            }
        }).fetch();
        var actualBridges = [];

        $.each(people, function(key, val) {
            var bridge = {
                bridge: val.meetme
            }
            var loc = -1;
            $.each(actualBridges, function(key, ee) {
                if (ee.bridge == val.meetme) {
                    loc = key;
                    return false;
                }
            });
            if (loc == -1) {
                loc = actualBridges.push(bridge) - 1;
            }
            var person = {
                person: val
            }
            if (typeof actualBridges[loc].people === "undefined") {
                actualBridges[loc].people = [];
                actualBridges[loc].count = 0;
            }

            actualBridges[loc].people.push(val);
            actualBridges[loc].count++;
        });
        return actualBridges;
    },
    conference: function() {
        return Conferences.find({
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
        return Conferences.find({
            'meetme': {
                $exists: true
            }
        }).count();
    }
});

Template.conferences.meetme_mute_user = function(bridge, user_id) {
    var error_box = $("#errors");
    Meteor.call('meetme_mute_user',
        bridge,
        user_id,
        function(error, result) {
            // console.log(error);
            // console.log(result);

            if (error) {
                error_box.append('<p>Error muting user:</p>');
                error_box.append('<p>' + error + '</p>');
                $("#error").fadeIn();
            } else {
                $("#error").fadeOut();
            }
        });
};
Template.conferences.meetme_kick_user = function(bridge, user_id) {
    var error_box = $("#errors");
    Meteor.call('meetme_kick_user',
        bridge,
        user_id,
        function(error, result) {
            // console.log(error);
            // console.log(result);

            if (error) {
                error_box.append('<p>Error kicking user:</p>');
                error_box.append('<p>' + error + '</p>');
                $("#error").fadeIn();
            } else {
                $("#error").fadeOut();
            }
        });
};
