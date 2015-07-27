var asterisk = new Meteor.npmRequire('asterisk-manager');

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
            profile: 1,
            admin: 1
        }
    });
});

Meteor.startup(function() {
    Meteor.publish("AmiLog", function() {
        return AmiLog.find({}, {
            limit: 25,
            sort: {
                starmon_timestamp: -1
            }
        });
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

    Meteor.publish("Queue", function() {
        return Queue.find();
    });

    Accounts.loginServiceConfiguration.remove({
        service: "google"
    })
    Accounts.loginServiceConfiguration.insert({
        service: "google",
        clientId: GlobalSettings.Google.clientId,
        secret: GlobalSettings.Google.secret
    });
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
                ami.keepConnected();
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
        },
        meetme_mute_user: function(bridge, user_id) {
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
                        true);
                    ami.action({
                        'action': 'MeetmeMute',
                        'Meetme': bridge,
                        'Usernum': user_id,
                    }, function(err, res) {
                        if (err) {
                            return err;
                        }
                        return res;
                    });
                }
            } else {
                return 'Invalid ami info.';
            }
        },
        meetme_kick_user: function(bridge, user_id) {
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
                        true);
                    ami.action({
                        'action': 'Command',
                        'Command': 'meetme kick ' + bridge + ' ' + user_id,
                    }, function(err, res) {
                        if (err) {
                            return err;
                        }
                        return res;
                    });
                }
            } else {
                return 'Invalid ami info.';
            }
        }
    });

    AmiStatus.remove({});
    StartAMI();
});

Meteor.methods({
    "userExists": function(username) {
        return !!Meteor.users.findOne({
            username: username
        });
    },
});
Accounts.validateNewUser(function(user) {
    var emailAddress = user.emails[0].address.toLowerCase();
    var idx = emailAddress.lastIndexOf('@');
    if (idx > -1 && emailAddress.slice(idx) === GlobalSettings.LoginRestrictions.Domain) {
        return true;
    } else {
        throw new Meteor.Error(403, "Only domains from " + GlobalSettings.LoginRestrictions.Domain + " are allowed.");
    }
});

Accounts.onCreateUser(function(options, user) {
    if (Meteor.users.find().count() == 0) {
        user.admin = true;
    }
    if (typeof user.services.google !== "undefined") {
        user.emails = [{
            address: user.services.google.email
        }];
        user.profile = {};
        user.profile.name = user.services.google.name;
        user.username = emailUsername(user.services.google.email).toLowerCase();
    }
    return user;
});

function emailUsername(emailAddress) {
    return emailAddress.match(/^(.+)@/)[1];
}
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

            /*
            TODO:
            Create different collections for each event type or use the AmiLog for everything and then filter events?

            A list of event names can be found at
            https://wiki.asterisk.org/wiki/display/AST/Asterisk+11+AMI+Events
            */

            //AmiLog._ensureIndex( { "starmon_timestamp": 1 }, { expireAfterSeconds: 60 } );
            ami.on('managerevent', Meteor.bindEnvironment(function(evt) {
                evt.starmon_timestamp = Date.now();
                console.log(evt);
                AmiLog.update(evt, {
                    upsert: true
                });
            }));

            //
            // Queue Hooks
            //
            ami.on('join', Meteor.bindEnvironment(function(evt) {
                evt.starmon_timestamp = Date.now();
                //console.log(evt);
                Queue.insert(evt);
            }));

            ami.on('leave', Meteor.bindEnvironment(function(evt) {
                evt.starmon_timestamp = Date.now();
                //console.log(evt);
                Queue.remove({
                    uniqueid: evt.uniqueid
                });
            }));

            //
            // Conferencing Hooks
            //
            ami.on('meetmejoin', Meteor.bindEnvironment(function(evt) {
                evt.starmon_timestamp = Date.now();
                //console.log(evt);
                MeetMe.insert(evt);
            }));

            ami.on('meetmetalking', Meteor.bindEnvironment(function(evt) {
                evt.starmon_timestamp = Date.now();
                //console.log(evt);
                var talking = false;
                if (evt.status == "on") {
                    talking = true;
                }
                MeetMe.update({
                    uniqueid: evt.uniqueid
                }, {
                    $set: {
                        talking: talking
                    }
                });
            }));

            ami.on('meetmeleave', Meteor.bindEnvironment(function(evt) {
                evt.starmon_timestamp = Date.now();
                // console.log(evt);
                MeetMe.remove({
                    uniqueid: evt.uniqueid
                });
            }));

            ami.on('meetmeend', Meteor.bindEnvironment(function(evt) {
                evt.starmon_timestamp = Date.now();
                // console.log(evt);
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
/*
Here's a list of available asterisk commands we might want to implement.
asterisk*CLI> manager show commands
  Action           Privilege        Synopsis
  ------           ---------        --------
  WaitEvent        <none>           Wait for an event to occur.
  QueueReset       <none>           Reset queue statistics.
  QueueReload      <none>           Reload a queue, queues, or any sub-section of a queue o
  QueueRule        <none>           Queue Rules.
  QueuePenalty     agent,all        Set the penalty for a queue member.
  QueueLog         agent,all        Adds custom entry in queue_log.
  QueuePause       agent,all        Makes a queue member temporarily unavailable.
  QueueRemove      agent,all        Remove interface from queue.
  QueueAdd         agent,all        Add interface to queue.
  QueueSummary     <none>           Show queue summary.
  QueueStatus      <none>           Show queue status.
  Queues           <none>           Queues.
  PlayDTMF         call,all         Play DTMF signal on a specific channel.
  MixMonitorMute   <none>           Mute / unMute a Mixmonitor recording.
  MuteAudio        system,all       Mute an audio stream
  VoicemailUsersL  call,reporting,  List All Voicemail User Information.
  MeetmeList       reporting,all    List participants in a conference.
  MeetmeUnmute     call,all         Unmute a Meetme user.
  MeetmeMute       call,all         Mute a Meetme user.
  IAXregistry      system,reportin  Show IAX registrations.
  IAXnetstats      system,reportin  Show IAX Netstats.
  IAXpeerlist      system,reportin  List IAX Peers.
  IAXpeers         system,reportin  List IAX peers.
  AgentLogoff      agent,all        Sets an agent as no longer logged in.
  Agents           agent,all        Lists agents and their status.
  DAHDIRestart     <none>           Fully Restart DAHDI channels (terminates calls).
  DAHDIShowChanne  <none>           Show status of DAHDI channels.
  DAHDIDNDoff      <none>           Toggle DAHDI channel Do Not Disturb status OFF.
  DAHDIDNDon       <none>           Toggle DAHDI channel Do Not Disturb status ON.
  DAHDIDialOffhoo  <none>           Dial over DAHDI channel while offhook.
  DAHDIHangup      <none>           Hangup DAHDI Channel.
  DAHDITransfer    <none>           Transfer DAHDI Channel.
  SKINNYshowline   system,reportin  Show SKINNY line (text format).
  SKINNYlines      system,reportin  List SKINNY lines (text format).
  SKINNYshowdevic  system,reportin  Show SKINNY device (text format).
  SKINNYdevices    system,reportin  List SKINNY devices (text format).
  SIPnotify        system,all       Send a SIP notify.
  SIPshowregistry  system,reportin  Show SIP registrations (text format).
  SIPqualifypeer   system,reportin  Qualify SIP peers.
  SIPshowpeer      system,reportin  show SIP peer (text format).
  SIPpeers         system,reportin  List SIP peers (text format).
  LocalOptimizeAw  system,call,all  Optimize away a local channel when possible.
  AGI              agi,all          Add an AGI command to execute by Async AGI.
  UnpauseMonitor   call,all         Unpause monitoring of a channel.
  PauseMonitor     call,all         Pause monitoring of a channel.
  ChangeMonitor    call,all         Change monitoring filename of a channel.
  StopMonitor      call,all         Stop monitoring a channel.
  Monitor          call,all         Monitor a channel.
  DBDelTree        system,all       Delete DB Tree.
  DBDel            system,all       Delete DB entry.
  DBPut            system,all       Put DB entry.
  DBGet            system,reportin  Get DB Entry.
  Bridge           call,all         Bridge two channels already in the PBX.
  Park             call,all         Park a channel.
  ParkedCalls      <none>           List parked calls.
  ShowDialPlan     config,reportin  Show dialplan contexts and extensions
  AOCMessage       aoc,all          Generate an Advice of Charge message on a channel.
  ModuleCheck      system,all       Check if module is loaded.
  ModuleLoad       system,all       Module management.
  CoreShowChannel  system,reportin  List currently active channels.
  Reload           system,config,a  Send a reload event.
  CoreStatus       system,reportin  Show PBX core status variables.
  CoreSettings     system,reportin  Show PBX core settings (version etc).
  UserEvent        user,all         Send an arbitrary event.
  UpdateConfig     config,all       Update basic configuration.
  SendText         call,all         Send text message to channel.
  ListCommands     <none>           List available manager commands.
  MailboxCount     call,reporting,  Check Mailbox Message Count.
  MailboxStatus    call,reporting,  Check mailbox.
  AbsoluteTimeout  system,call,all  Set absolute timeout.
  ExtensionState   call,reporting,  Check Extension Status.
  Command          command,all      Execute Asterisk CLI Command.
  Originate        originate,all    Originate a call.
  Atxfer           call,all         Attended transfer.
  Redirect         call,all         Redirect (transfer) a call.
  ListCategories   config,all       List categories in configuration file.
  CreateConfig     config,all       Creates an empty file in the configuration directory.
  Status           system,call,rep  List channel status.
  GetConfigJSON    system,config,a  Retrieve configuration (JSON format).
  GetConfig        system,config,a  Retrieve configuration.
  Getvar           call,reporting,  Gets a channel variable.
  Setvar           call,all         Set a channel variable.
  Ping             <none>           Keepalive command.
  Hangup           system,call,all  Hangup channel.
  Challenge        <none>           Generate Challenge for MD5 Auth.
  Login            <none>           Login Manager.
  Logoff           <none>           Logoff Manager.
  Events           <none>           Control Event Flow.
  DataGet          <none>           Retrieve the data api tree.
*/
