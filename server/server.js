var asterisk = new Meteor.require('asterisk-manager');

Meteor.publish("AmiLog", function() {
    return AmiLog.find();
});

Meteor.publish("ServerSettings", function() {
    return ServerSettings.find();
});

Meteor.publish("MeetMe", function() {
    return MeetMe.find();
});

Meteor.publish("AmiStatus", function() {
    return AmiStatus.find();
});


/* TODO: Remove ability for users to change profile.admin */
Meteor.users.allow({
    update: function(userId, user, fields, modifier) {
        if (user._id === userId) {
            Meteor.users.update({
                _id: userId
            }, modifier);
            return true;
        } else return false;
    }
});

Meteor.publish("directory", function() {
    return Meteor.users.find({}, {
        fields: {
            emails: 1,
            profile: 1
        }
    });
});

Meteor.startup(function() {
    Meteor.methods({
        save_ami: function(host, port, user, pass) {
            check(host, String);
            check(port, String);
            check(user, String);
            check(pass, String);


            var ami = new asterisk(
                port,
                host,
                user,
                pass,
                true); // This parameter determines whether events are emited.

            console.log(ami);
            if (ami) {
                ami.action({
                        'action': 'ping'
                    },
                    Meteor.bindEnvironment(function(err, res) {
                        if (err) {
                            console.log("Ping error.");
                            return 'error:' + err;
                        }
                        if (res) {
                            console.log("Ping result.");

                            if (ServerSettings.find({
                                'module': 'ami'
                            }).count() == 0) {

                                ServerSettings.insert({
                                    'module': 'ami',
                                    'host': host,
                                    'port': port,
                                    'user': user,
                                    'pass': pass
                                });
                                console.log("Inserted AMI Server settings...");
                            } else {
                                ServerSettings.update({
                                    'module': 'ami'
                                }, {
                                    $set: {
                                        'host': host,
                                        'port': port,
                                        'user': user,
                                        'pass': pass
                                    }
                                });
                                console.log("Updated AMI Server settings...");
                            }
                            StartAMI();
                        }
                    }));
            } else {
                return 'Invalid server info';
            }
        },
        StartAMI: function() {
            // .. do other stuff ..
            return "baz";
        }
    });

    AmiStatus.remove({});
    StartAMI();
});


var amiStarted = false;

function StartAMI() {
    var amiserver = ServerSettings.find({
        'module': 'ami'
    }).fetch()[0];

    if (amiserver) {
        if (amiserver.port && amiserver.host && amiserver.user && amiserver.pass) {
            var ami = new asterisk(
                amiserver.port,
                amiserver.host,
                amiserver.user,
                amiserver.pass,
                true); // This parameter determines whether events are emited.


            ami.on('managerevent', Meteor.bindEnvironment(function(evt) {
                evt.starmon_timestamp = Date.now();
                console.log(evt);
                AmiLog.insert(evt);
            }));

            /*
TODO:
Create different collections for each event type or use the AmiLog for everything and then filter events?

A list of event names can be found at
https://wiki.asterisk.org/wiki/display/AST/Asterisk+11+AMI+Events
*/

            //
            // Conferencing Hooks
            //
            ami.on('meetmejoin', Meteor.bindEnvironment(function(evt) {
                evt.starmon_timestamp = Date.now();
                console.log(evt);
                MeetMe.insert(evt);
            }));

            ami.on('meetmeleave', Meteor.bindEnvironment(function(evt) {
                evt.starmon_timestamp = Date.now();
                console.log(evt);
                MeetMe.remove({
                    uniqueid: evt.uniqueid
                });
            }));

            ami.on('meetmeend', Meteor.bindEnvironment(function(evt) {
                evt.starmon_timestamp = Date.now();
                console.log(evt);
                MeetMe.remove({
                    meetme: evt.meetme
                });
            }));

            ami.on('meetmeend', Meteor.bindEnvironment(function(evt) {
                evt.starmon_timestamp = Date.now();
                console.log(evt);
                MeetMe.remove({
                    meetme: evt.meetme
                });
            }));

            //
            // AMI Connection status
            // TODO: Detect when AMI goes away
            //
            ami.on('fullybooted', Meteor.bindEnvironment(function(evt) {
                evt.starmon_timestamp = Date.now();
                console.log(evt);

                if (AmiStatus.find().count() > 0) {
                    AmiStatus.update({}, evt);
                } else {
                    AmiStatus.insert(evt);
                }
            }));
        }
    } else {
        console.log("AMI is not yet configured && is not listening for events. Please login to the Administration Panel from the web interface and setup your asterisk server.");
    }
}
