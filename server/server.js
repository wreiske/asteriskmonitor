import asterisk from 'asterisk-manager';
import { libphonenumber } from 'libphonenumber-js';
import { FastRender } from 'meteor/staringatlights:fast-render';
import { Roles } from 'meteor/alanning:roles';

//Temp Cleanup
//ConferenceEvents.update({'event': 'begin'}, {$set: {'message': 'Conference has begun.'}},{multi: true});

/* 
TODO: Remove ability for users to change profile.admin 
TODO: Make the mute, unmute, kick, etc commands generic instead of having separate commands
for meetme / confbridge. Also need to make a generic function for running AMI commands instead of
checking the settings and connecting for every individual meteor method.
*/

Meteor.startup(() => {
    WebApp.rawConnectHandlers.use(
        Meteor.bindEnvironment((req, res, next) => {
            req.dynamicHead = `${(req.dynamicHead || '')}
            <script src="https://cdnjs.cloudflare.com/ajax/libs/jquery/3.4.1/jquery.min.js" integrity="sha256-CSXorXvZcTkaix6Yvo6HppcZGetbYMGWSFlBw8HfCJo=" crossorigin="anonymous"></script>
            <script src="https://cdnjs.cloudflare.com/ajax/libs/twitter-bootstrap/4.2.1/js/bootstrap.bundle.min.js" integrity="sha256-MSYVjWgrr6UL/9eQfQvOyt6/gsxb6dpwI1zqM5DbLCs=" crossorigin="anonymous"></script>
            <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.10.2/css/all.css" integrity="sha256-piqEf7Ap7CMps8krDQsSOTZgF+MU/0MPyPW2enj5I40=" crossorigin="anonymous" />
            `;
            req.dynamicBody = `
            <style>
            .longer-than-usual {
                display:none;
            }
            </style>
            <script>
            fullyLoaded = false;
            setTimeout(function () {
                document.getElementById('loading-error').style.display = 'block';
            }, 5000);
            if (!fullyLoaded) {
                setTimeout(function () {
                    document.getElementById('loading-error-message').innerHTML = 'Something is terribly wrong... Let\\'s try refreshing...';
                    setTimeout(function () {
                        if (!fullyLoaded) {
                            location.reload(true);
                        }
                    }, 2000);
                }, 15000);
            }
            </script>
			<div class="preloader preloader-first">
                <h2>
                Loading PBX Monitor <span class="fas fa-spinner fa-spin"></span>
                <span id="loading-error" class="longer-than-usual">
                <br />
                <small id="loading-error-message">This is taking longer than usual... Sorry about that!</small>
                </span>
                </h2>

				<object type="image/svg+xml" data="/images/logo.svg">
					<!-- Fall back to image tag if svg fails -->
					<img src="/images/logo.svg" />
				</object>
			</div>`;
            next();
        })
    );
});

const allowedFields = ['profile', 'username'];
Meteor.users.allow({
    update: function (userId, user, fields, modifier) {
        let good = true;
        fields.forEach(function (field) {
            if (!allowedFields.includes(field)) {
                console.log('has field not allowed');
                good = false;
            }
        });
        if (!good) {
            return false;
        }
        if (user._id === userId) {
            Meteor.users.update({
                _id: userId
            }, modifier);
            return true;
        } else return false;
    }
});
Meteor.publish('userInfo', function () {
    if (this.userId) {
        return Meteor.users.find(this.userId, {
            fields: {
                emails: 1,
                profile: 1
            }
        });
    } else {
        this.ready();
    }
});

Meteor.publish('Directory', function () {
    if (this.userId) {
        return Directory.find();
    } else {
        this.ready();
    }
});

Meteor.publish('UserCount', function () {
    Counts.publish(this, 'user-count', Meteor.users.find());
});

Meteor.publish('ActiveConferencesCount', function () {
    if (this.userId) {
        Counts.publish(this, 'active-conferences-count', Conferences.find({
            end_timestamp: {
                $exists: false
            }
        }));
    } else {
        this.ready();
    }
});

Meteor.publish('CompleteConferencesCount', function () {
    if (this.userId) {
        Counts.publish(this, 'complete-conferences-count', Conferences.find({
            end_timestamp: {
                $exists: true
            }
        }));
    } else {
        this.ready();
    }
});

Meteor.startup(function () {
    const roles = Roles.getAllRoles().fetch();

    if (!roles.find(i => i.name === 'user')) {
        Roles.createRole('user', {
            unlessExists: true
        });
    }
    if (!roles.find(i => i.name === 'admin')) {
        Roles.createRole('admin', {
            unlessExists: true
        });
    }

    const users = Meteor.users.find().fetch();
    users.forEach(function (user) {
        // Make sure all users are part of the users group
        if (!Roles.userIsInRole(user._id, ['user'], GlobalSettings.LoginRestrictions.Domain)) {
            Roles.addUsersToRoles(user._id, ['user'], GlobalSettings.LoginRestrictions.Domain);
        }
        if (user.admin) {
            // Make sure old asterisk monitor admins get the new roles
            if (!Roles.userIsInRole(user._id, ['admin'], GlobalSettings.LoginRestrictions.Domain)) {
                Roles.addUsersToRoles(user._id, ['admin'], GlobalSettings.LoginRestrictions.Domain);
            }
        }
    });

    FastRender.onAllRoutes(function () {
        this.subscribe('AmiStatus');
        this.subscribe('userInfo');
        this.subscribe('UserCount');
    });

    FastRender.route('/admin', function () {
        this.subscribe('ServerSettings');
    });

    FastRender.route('/events/calls', function () {
        this.subscribe('AmiLog');
    });

    FastRender.route('/events/amilog', function () {
        this.subscribe('AmiLog');
    });

    FastRender.route('/directory', function () {
        this.subscribe('Directory');
    });

    FastRender.route('/conferences', function () {
        this.subscribe('ActiveConferences');
        this.subscribe('ActiveConferencesCount');

        this.subscribe('CompleteConferences');
        this.subscribe('CompleteConferencesCount');
    });

    FastRender.route('/conference/:_bridgeuniqueid', function (params) {
        this.subscribe('ConferenceEvents', params._bridgeuniqueid);
        this.subscribe('ConferenceSingle', params._bridgeuniqueid);
        this.subscribe('ConferenceMembers', params._bridgeuniqueid);
    });

    FastRender.route('/events/queue', function () {
        this.subscribe('Queue');
    });

    Directory._ensureIndex({
        phoneNumber: 1,
        type: 1,
    });

    Directory._ensureIndex({
        phoneNumber: 1,
    }, {
        unique: true
    });

    Conferences._ensureIndex({
        bridgeuniqueid: 1,
    }, {
        unique: true
    });


    Meteor.publish('AmiLog', function () {
        if (this.userId) {
            return AmiLog.find({}, {
                limit: 50,
                sort: {
                    starmon_timestamp: -1
                }
            });
        } else {
            this.ready();
        }
    });

    Meteor.publish('ServerSettings', function () {
        if (this.userId && Roles.userIsInRole(this.userId, ['admin'])) {
            return ServerSettings.find();
        } else {
            this.ready();
        }
    });

    Meteor.publish('ActiveConferences', function () {
        if (this.userId) {
            return Conferences.find({
                end_timestamp: {
                    $exists: false
                }
            }, {
                fields: {
                    bridgeuniqueid: 1,
                    conference: 1,
                    memberTotal: 1,
                    end_timestamp: 1,
                    starmon_timestamp: 1
                },
                sort: {
                    starmon_timestamp: -1
                }
            });
        } else {
            this.ready();
        }
    });

    Meteor.publish('CompleteConferences', function () {
        if (this.userId) {
            return Conferences.find({
                end_timestamp: {
                    $exists: true
                }
            }, {
                fields: {
                    bridgeuniqueid: 1,
                    conference: 1,
                    memberTotal: 1,
                    end_timestamp: 1,
                    starmon_timestamp: 1
                },
                sort: {
                    end_timestamp: -1
                },
                limit: 100
            });
        } else {
            this.ready();
        }
    });

    Meteor.publish('ConferenceSingle', function (id) {
        if (this.userId) {
            return Conferences.find({
                'bridgeuniqueid': id
            });
        } else {
            this.ready();
        }
    });

    Meteor.publish('ConferenceEvents', function (id) {
        if (this.userId) {
            return ConferenceEvents.find({
                'bridgeuniqueid': id
            });
        } else {
            this.ready();
        }
    });

    Meteor.publish('ConferenceMembers', function (id) {
        if (this.userId) {
            return ConferenceMembers.find({
                'bridgeuniqueid': id
            });
        } else {
            this.ready();
        }
    });

    Meteor.publish('AmiStatus', function () {
        if (this.userId) {
            return AmiStatus.find();
        } else {
            this.ready();
        }
    });

    Meteor.publish('Queue', function () {
        if (this.userId) {
            return Queue.find();
        } else {
            this.ready();
        }
    });

    Accounts.loginServiceConfiguration.remove({
        service: 'google'
    })
    Accounts.loginServiceConfiguration.insert({
        service: 'google',
        clientId: GlobalSettings.Google.clientId,
        secret: GlobalSettings.Google.secret
    });
    Meteor.methods({
        'Directory-UpdateAllCID': function () {
            if (!Meteor.userId()) {
                throw new Meteor.Error("not-authorized");
            }
            // Run through all the old CID information and update it with new if we have it.
            const dirPhones = Directory.find().fetch();
            dirPhones.forEach(function (item) {
                AmiStatus.update({
                    calleridnum: item.phoneNumber
                }, {
                    $set: {
                        calleridname: item.name
                    }
                }, {
                    multi: true
                });
                Queue.update({
                    calleridnum: item.phoneNumber
                }, {
                    $set: {
                        calleridname: item.name
                    }
                }, {
                    multi: true
                });
                ConferenceMembers.update({
                    calleridnum: item.phoneNumber
                }, {
                    $set: {
                        calleridname: item.name
                    }
                }, {
                    multi: true
                });
                AmiLog.update({
                    calleridnum: item.phoneNumber
                }, {
                    $set: {
                        calleridname: item.name
                    }
                }, {
                    multi: true
                });
            });
            return 'Updated all Caller ID names.';
        },
        'Directory-ImportCSV': function (csvObject) {
            if (!Meteor.userId()) {
                throw new Meteor.Error("not-authorized");
            }
            check(csvObject, Match.Any);
            // Directory.remove({});
            // TODO: Add checking on rows / cols == null...
            // TODO: this was added quick n dirty under a time crunch

            csvObject.forEach(function (item) {
                check(item, Match.ObjectIncluding({
                    Name: String,
                    Home: String,
                    Work: String,
                    Cell: String
                }));

                // if Last, First make it First Last
                if (item.Name.indexOf(',') > -1) {
                    const splitName = item.Name.split(',');
                    item.Name = `${splitName[1].trim()} ${splitName[0].trim()}`.trim();
                }

                // Add Home Phone for user
                if (item.Home != "") {
                    Directory.update({
                        "phoneNumber": item.Home
                    }, {
                        $set: {
                            "name": item.Name,
                            "phoneNumber": item.Home,
                            "type": "home",
                            "starmon_timestamp": Date.now(),
                            "addedBy": Meteor.userId()
                        }
                    }, {
                        upsert: true
                    });
                }
                // Add Work Phone for user
                if (item.Work != "") {
                    Directory.update({
                        "phoneNumber": item.Work
                    }, {
                        $set: {
                            "name": item.Name,
                            "phoneNumber": item.Work,
                            "type": "work",
                            "starmon_timestamp": Date.now(),
                            "addedBy": Meteor.userId()
                        }
                    }, {
                        upsert: true
                    });
                }
                // Add Cell Phone for user
                if (item.Cell != "") {
                    Directory.update({
                        "phoneNumber": item.Cell
                    }, {
                        $set: {
                            "name": item.Name,
                            "phoneNumber": item.Cell,
                            "type": "cell",
                            "starmon_timestamp": Date.now(),
                            "addedBy": Meteor.userId()
                        }
                    }, {
                        upsert: true
                    });
                }
            });

            return 'Successfully imported CSV into Directory!';

        },
        save_ami: function (host, port, user, pass) {
            if (!Meteor.userId() || !Roles.userIsInRole(Meteor.userId(), ['admin'])) {
                throw new Meteor.Error("not-authorized");
            }
            check(host, String);
            check(port, String);
            check(user, String);
            check(pass, String);

            const ami = new asterisk(
                port,
                host,
                user,
                pass,
                true); // This parameter determines whether events are emitted.

            if (ami) {
                ami.keepConnected();
                ami.on('error', function (err) {
                    console.log('ERROR', err);
                });
                ami.action({
                        'action': 'ping'
                    },
                    Meteor.bindEnvironment((err, res) => {
                        if (err) {
                            console.log('Ping error: ', err);
                            throw new Meteor.Error('ami-ping-error', err);
                        }
                        if (res) {
                            console.log('Ping result.');

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
                                console.log('Inserted AMI Server settings...');
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
                                console.log('Updated AMI Server settings...');
                            }
                            StartAMI();
                        }
                    }));
            } else {
                throw new Meteor.Error('invalid-ami-info', 'Invalid AMI info.');
            }
        },
        StartAMI: function () {
            if (!Meteor.userId() || !Roles.userIsInRole(Meteor.userId(), ['admin'])) {
                throw new Meteor.Error("not-authorized");
            }
            // .. do other stuff ..
            return 'baz';
        },
        meetme_lock: function (bridgeuniqueid, bridge) {
            if (!Meteor.userId()) {
                throw new Meteor.Error("not-authorized");
            }
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
                        'Command': 'meetme lock ' + bridge,
                    }, Meteor.bindEnvironment(function (err, res) {
                        if (err) {
                            throw new Meteor.Error('conf-lock-error', err);
                        }
                        ConferenceEvents.insert({
                            'message': `Conference is now locked.`,
                            'event': 'lock',
                            'starmon_timestamp': Date.now(),
                            'bridgeuniqueid': bridgeuniqueid
                        });
                        return res;
                    }));
                }
            } else {
                throw new Meteor.Error('invalid-ami-info', 'Invalid AMI info.');
            }
        },
        meetme_unlock: function (bridgeuniqueid, bridge) {
            if (!Meteor.userId()) {
                throw new Meteor.Error("not-authorized");
            }
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
                        'Command': 'meetme unlock ' + bridge,
                    }, Meteor.bindEnvironment(function (err, res) {
                        if (err) {
                            throw new Meteor.Error('conf-ulock-error', err);
                        }
                        ConferenceEvents.insert({
                            'message': `Conference is now open.`,
                            'event': 'unlock',
                            'starmon_timestamp': Date.now(),
                            'bridgeuniqueid': bridgeuniqueid
                        });
                        return res;
                    }));
                }
            } else {
                throw new Meteor.Error('invalid-ami-info', 'Invalid AMI info.');
            }
        },
        meetme_mute_user: function (bridgeuniqueid, bridge, user_id) {
            if (!Meteor.userId()) {
                throw new Meteor.Error("not-authorized");
            }
            var amiserver = ServerSettings.find({
                'module': 'ami'
            }).fetch()[0];

            const member = ConferenceMembers.findOne({
                'bridgeuniqueid': bridgeuniqueid,
                'usernum': user_id,
                'meetme': bridge
            });
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
                    }, Meteor.bindEnvironment(function (err, res) {
                        if (err) {
                            throw new Meteor.Error('conf-mute-error', err);
                        }
                        ConferenceMembers.update({
                            'bridgeuniqueid': bridgeuniqueid,
                            'usernum': user_id,
                            'meetme': bridge
                        }, {
                            $set: {
                                'muted': true
                            }
                        });
                        ConferenceEvents.insert({
                            'message': `${member.calleridname} ${member.calleridnum} is now muted.`,
                            'event': 'mute',
                            'starmon_timestamp': Date.now(),
                            'bridgeuniqueid': bridgeuniqueid
                        });
                        return res;
                    }));
                }
            } else {
                throw new Meteor.Error('invalid-ami-info', 'Invalid AMI info.');
            }
        },
        meetme_unmute_user: function (bridgeuniqueid, bridge, user_id) {
            if (!Meteor.userId()) {
                throw new Meteor.Error("not-authorized");
            }

            var amiserver = ServerSettings.find({
                'module': 'ami'
            }).fetch()[0];
            const member = ConferenceMembers.findOne({
                'bridgeuniqueid': bridgeuniqueid,
                'usernum': user_id,
                'meetme': bridge
            });
            if (amiserver) {
                if (amiserver.port && amiserver.host && amiserver.user && amiserver.pass) {
                    var ami = new asterisk(
                        amiserver.port,
                        amiserver.host,
                        amiserver.user,
                        amiserver.pass,
                        true);
                    ami.action({
                        'action': 'MeetmeUnmute',
                        'Meetme': bridge,
                        'Usernum': user_id,
                    }, Meteor.bindEnvironment(function (err, res) {
                        if (err) {
                            throw new Meteor.Error('conf-unmute-error', err);
                        }
                        ConferenceMembers.update({
                            'bridgeuniqueid': bridgeuniqueid,
                            'usernum': user_id,
                            'meetme': bridge
                        }, {
                            $set: {
                                'muted': false
                            }
                        });
                        ConferenceEvents.insert({
                            'message': `${member.calleridname} ${member.calleridnum} is no longer muted.`,
                            'event': 'unmute',
                            'starmon_timestamp': Date.now(),
                            'bridgeuniqueid': bridgeuniqueid
                        });
                        return res;
                    }));
                }
            } else {
                throw new Meteor.Error('invalid-ami-info', 'Invalid AMI info.');
            }
        },
        meetme_kick_user: function (bridgeuniqueid, bridge, user_id) {
            if (!Meteor.userId()) {
                throw new Meteor.Error("not-authorized");
            }

            var amiserver = ServerSettings.find({
                'module': 'ami'
            }).fetch()[0];
            const member = ConferenceMembers.findOne({
                'bridgeuniqueid': bridgeuniqueid,
                'usernum': user_id,
                'meetme': bridge
            });
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
                    }, Meteor.bindEnvironment(function (err, res) {
                        if (err) {
                            throw new Meteor.Error('conf-kick-error', err);
                        }

                        ConferenceEvents.insert({
                            'message': `${member.calleridname} ${member.calleridnum} has been kicked from the conference.`,
                            'event': 'kick',
                            'starmon_timestamp': Date.now(),
                            'bridgeuniqueid': bridgeuniqueid
                        });
                        return res;
                    }));
                }
            } else {
                throw new Meteor.Error('invalid-ami-info', 'Invalid AMI info.');
            }
        },
        // TODO: Make generic...
        conference_mute_user: function (bridgeuniqueid, bridge, channel) {
            if (!Meteor.userId()) {
                throw new Meteor.Error("not-authorized");
            }
            check(bridge, Number);
            check(channel, String);

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
                        'action': 'confbridgemute',
                        'conference': bridge,
                        'channel': channel,
                    }, Meteor.bindEnvironment(function (err, res) {
                        if (err) {
                            throw new Meteor.Error('conf-mute-error', err);
                        }
                        ConferenceMembers.update({
                            'bridgeuniqueid': bridgeuniqueid,
                            'usernum': user_id,
                            'meetme': bridge
                        }, {
                            $set: {
                                'muted': true
                            }
                        });
                        return res;
                    }));
                }
            } else {
                throw new Meteor.Error('invalid-ami-info', 'Invalid AMI info.');
            }
        },
        conference_unmute_user: function (bridgeuniqueid, bridge, channel) {
            if (!Meteor.userId()) {
                throw new Meteor.Error("not-authorized");
            }
            check(bridge, Number);
            check(channel, String);

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
                        'action': 'confbridgeunmute',
                        'conference': bridge,
                        'channel': channel,
                    }, Meteor.bindEnvironment(function (err, res) {
                        if (err) {
                            throw new Meteor.Error('conf-unmute-error', err);
                        }
                        ConferenceMembers.update({
                            'bridgeuniqueid': bridgeuniqueid,
                            'usernum': user_id,
                            'meetme': bridge
                        }, {
                            $set: {
                                'muted': false
                            }
                        });
                        return res;
                    }));
                }
            } else {
                throw new Meteor.Error('invalid-ami-info', 'Invalid AMI info.');
            }
        },
        conference_kick_user: function (bridgeuniqueid, bridge, channel) {
            if (!Meteor.userId()) {
                throw new Meteor.Error("not-authorized");
            }
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
                        'action': 'confbridgekick',
                        'conference': bridge,
                        'channel': channel,
                    }, Meteor.bindEnvironment(function (err, res) {
                        if (err) {
                            throw new Meteor.Error('conf-kick-error', err);
                        }
                        return res;
                    }));
                }
            } else {
                throw new Meteor.Error('invalid-ami-info', 'Invalid AMI info.');
            }
        },
        registerAdminUser: function (userAdmin) {
            const usersCount = Meteor.users.find({}).count();
            if (usersCount >= 1) {
                throw new Meteor.Error('error-setup-completed', 'This system has already been setup with a first time user.');
                return;
            }
            if (!validateEmail(userAdmin.email)) {
                throw new Meteor.Error('error-setup-invalid-email', userAdmin.email + ' is not a valid email address.');
            }
            const userId = Accounts.createUser({
                email: userAdmin.email,
                username: userAdmin.username,
                password: userAdmin.password
            });
            Roles.addUsersToRoles(userId, ['admin', 'user']);
            Meteor.users.update(userId, {
                $set: {
                    profile: {
                        name: userAdmin.profile.name,
                    }
                }
            });
        }
    });

    AmiStatus.remove({});
    StartAMI();
});

Meteor.methods({
    'userExists': function (username) {
        return !!Meteor.users.findOne({
            username: username
        });
    },
});

Accounts.validateNewUser(function (user) {
    const emailAddress = user.emails[0].address.toLowerCase();
    const idx = emailAddress.lastIndexOf('@');
    if (idx > -1 && emailAddress.slice(idx) === '@' + GlobalSettings.LoginRestrictions.Domain) {
        return true;
    } else {
        throw new Meteor.Error(403, 'Only domains from ' + GlobalSettings.LoginRestrictions.Domain + ' are allowed.');
    }
});

Accounts.onCreateUser(function (options, user) {
    if (Meteor.users.find().count() == 0) {
        user.roles = ['admin', 'user'];
    }
    if (typeof user.services.google !== 'undefined') {
        user.emails = [{
            address: user.services.google.email
        }];
        user.profile = {};
        user.profile.name = user.services.google.name;
        user.username = emailUsername(user.services.google.email).toLowerCase();
    }
    return user;
});

function CIDLookup(name, phone) {
    const resDirectory = Directory.findOne({
        phoneNumber: phone
    });
    if (resDirectory) {
        return resDirectory.name;
    } else {
        return name;
    }
}

function emailUsername(emailAddress) {
    return emailAddress.match(/^(.+)@/)[1];
}
let amiStarted = false;

function StartAMI() {
    const amiserver = ServerSettings.find({
        'module': 'ami'
    }).fetch()[0];

    if (amiserver) {
        if (amiserver.port && amiserver.host && amiserver.user && amiserver.pass) {
            const ami = new asterisk(
                amiserver.port,
                amiserver.host,
                amiserver.user,
                amiserver.pass,
                true); // This parameter determines whether events are emited.
            ami.keepConnected();
            /*
            TODO:
            Create different collections for each event type or use the AmiLog for everything and then filter events?

            A list of event names can be found at
            https://wiki.asterisk.org/wiki/display/AST/Asterisk+11+AMI+Events
            */

            //AmiLog._ensureIndex( { 'starmon_timestamp': 1 }, { expireAfterSeconds: 60 } );
            ami.on('managerevent', Meteor.bindEnvironment(function (evt) {
                evt.starmon_timestamp = Date.now();
                if (evt.event == 'MeetmeTalking' || evt.event == 'ConfbridgeTalking' || evt.event == 'RTCPSent' || evt.event == 'RTCPReceived' || evt.event == 'VarSet') {
                    return;
                } else {
                    AmiLog.insert(evt);
                }
            }));

            //
            // Queue Hooks
            //
            ami.on('join', Meteor.bindEnvironment(function (evt) {
                evt.starmon_timestamp = Date.now();
                evt.calleridname = CIDLookup(evt.calleridname, evt.calleridnum);
                Queue.insert(evt);
            }));

            ami.on('leave', Meteor.bindEnvironment(function (evt) {
                Queue.remove({
                    uniqueid: evt.uniqueid
                });
            }));

            ami.on('confbridgetalking', Meteor.bindEnvironment(function (evt) {
                let talking = false;
                let talkTime = 0;
                if (evt.talkingstatus == 'on') {
                    talking = true;
                } else {
                    const member = ConferenceMembers.findOne({
                        uniqueid: evt.uniqueid,
                        leave_timestamp: {
                            $exists: false
                        }
                    });
                    talkTime = Math.abs((new Date().getTime() - member.speak_timestamp) / 1000);
                }
                ConferenceMembers.update({
                    uniqueid: evt.uniqueid,
                    leave_timestamp: {
                        $exists: false
                    }
                }, {
                    $set: {
                        speak_timestamp: Date.now(),
                        talking: talking,
                    },
                    $inc: {
                        talkTime: talkTime
                    }
                });
            }));

            ami.on('confbridgejoin', Meteor.bindEnvironment(function (evt) {
                evt.starmon_timestamp = Date.now();
                evt.calleridname = CIDLookup(evt.calleridname, evt.calleridnum);
                // Update Conference Users Count
                Conferences.update({
                    'bridgeuniqueid': evt.bridgeuniqueid
                }, {
                    $inc: {
                        memberTotal: 1
                    }
                });

                // Add caller to member list
                ConferenceMembers.insert(evt);

                // Push a message to the conference events
                // TODO: Add administrator option to set local ("US", etc..)
                const formatedPhone = libphonenumber.parsePhoneNumberFromString(evt.calleridnum, "US").formatNational();

                const callerInfo = `${CIDLookup(evt.calleridname, evt.calleridnum)} ${formatedPhone}`.trim();
                ConferenceEvents.insert({
                    'message': `${callerInfo} joined the conference.`,
                    'event': 'join',
                    'starmon_timestamp': Date.now(),
                    'bridgeuniqueid': evt.bridgeuniqueid
                });
            }));

            ami.on('confbridgeleave', Meteor.bindEnvironment(function (evt) {
                evt.starmon_timestamp = Date.now();
                evt.calleridname = CIDLookup(evt.calleridname, evt.calleridnum);
                // Update Conference Users Count
                Conferences.update({
                    'bridgeuniqueid': evt.bridgeuniqueid
                }, {
                    $inc: {
                        memberTotal: -1
                    }
                });

                // Remove member from list
                ConferenceMembers.update({
                    uniqueid: evt.uniqueid,
                    leave_timestamp: {
                        $exists: false
                    }
                }, {
                    $set: {
                        leave_timestamp: Date.now(),
                        talking: false,
                    }
                });

                // Post leave message to the conf
                const callerInfo = `${CIDLookup(evt.calleridname, evt.calleridnum)} ${evt.calleridnum}`.trim();
                ConferenceEvents.insert({
                    'message': `${callerInfo} left the conference.`,
                    'event': 'leave',
                    'starmon_timestamp': Date.now(),
                    'bridgeuniqueid': evt.bridgeuniqueid
                });
            }));

            ami.on('confbridgeend', Meteor.bindEnvironment(function (evt) {
                Conferences.update({
                    'bridgeuniqueid': evt.bridgeuniqueid
                }, {
                    $set: {
                        end_timestamp: new Date()
                    }
                });
                ConferenceEvents.insert({
                    'message': `Conference has ended.`,
                    'event': 'end',
                    'starmon_timestamp': Date.now(),
                    'bridgeuniqueid': evt.bridgeuniqueid
                });
            }));

            ami.on('confbridgestart', Meteor.bindEnvironment(function (evt) {
                evt.starmon_timestamp = Date.now();

                evt.memberTotal = 0;
                Conferences.insert(evt);
                ConferenceEvents.insert({
                    'message': `Conference has begun.`,
                    'event': 'begin',
                    'starmon_timestamp': Date.now(),
                    'bridgeuniqueid': evt.bridgeuniqueid
                });
            }));

            //
            // Conferencing Hooks
            //
            ami.on('meetmejoin', Meteor.bindEnvironment(function (evt) {
                evt.starmon_timestamp = Date.now();
                evt.calleridname = CIDLookup(evt.calleridname, evt.calleridnum);
                // Check if this meet me has started yet.. 
                // meetme doesn't have a "Start" event like confbridge does
                let conf = Conferences.findOne({
                    'conference': evt.meetme,
                    end_timestamp: {
                        $exists: false
                    }
                });
                if (conf == null) {
                    evt.memberTotal = 0;
                    evt.bridgeuniqueid = Random.id();
                    evt.conference = evt.meetme;
                    Conferences.insert(evt);
                    ConferenceEvents.insert({
                        'message': `Conference has begun.`,
                        'event': 'begin',
                        'starmon_timestamp': Date.now(),
                        'bridgeuniqueid': evt.bridgeuniqueid
                    });
                } else {
                    evt.bridgeuniqueid = conf.bridgeuniqueid;
                    evt.conference = conf.conference;
                }

                // Update Conference Users Count
                Conferences.update({
                    'bridgeuniqueid': evt.bridgeuniqueid
                }, {
                    $inc: {
                        memberTotal: 1
                    }
                });

                // Add caller to member list
                ConferenceMembers.insert(evt);

                // Push a message to the conference events
                const callerInfo = `${CIDLookup(evt.calleridname, evt.calleridnum)} ${evt.calleridnum}`.trim();
                ConferenceEvents.insert({
                    'message': `${callerInfo} joined the conference.`,
                    'event': 'join',
                    'starmon_timestamp': Date.now(),
                    'bridgeuniqueid': evt.bridgeuniqueid
                });
            }));

            ami.on('meetmetalking', Meteor.bindEnvironment(function (evt) {
                let talking = false;
                let talkTime = 0;
                if (evt.status == 'on') {
                    talking = true;
                } else {
                    const member = ConferenceMembers.findOne({
                        uniqueid: evt.uniqueid,
                        leave_timestamp: {
                            $exists: false
                        }
                    });
                    if (member) {
                        talkTime = Math.abs((new Date().getTime() - member.speak_timestamp) / 1000);
                    }
                }
                ConferenceMembers.update({
                    uniqueid: evt.uniqueid,
                    leave_timestamp: {
                        $exists: false
                    }
                }, {
                    $set: {
                        speak_timestamp: Date.now(),
                        talking: talking,
                    },
                    $inc: {
                        talkTime: talkTime
                    }
                });
            }));

            ami.on('meetmeleave', Meteor.bindEnvironment(function (evt) {
                evt.starmon_timestamp = Date.now();
                evt.calleridname = CIDLookup(evt.calleridname, evt.calleridnum);

                const conf = Conferences.findOne({
                    'conference': evt.meetme,
                    end_timestamp: {
                        $exists: false
                    }
                });
                if (conf) {
                    // Update Conference Users Count
                    Conferences.update({
                        'bridgeuniqueid': conf.bridgeuniqueid
                    }, {
                        $inc: {
                            memberTotal: -1
                        }
                    });

                    // Remove member from list
                    ConferenceMembers.update({
                        uniqueid: evt.uniqueid,
                        leave_timestamp: {
                            $exists: false
                        }
                    }, {
                        $set: {
                            leave_timestamp: Date.now(),
                            talking: false,
                        }
                    });

                    // Post leave message to the conf
                    const callerInfo = `${CIDLookup(evt.calleridname, evt.calleridnum)} ${evt.calleridnum}`.trim();
                    ConferenceEvents.insert({
                        'message': `${callerInfo} left the conference.`,
                        'event': 'leave',
                        'starmon_timestamp': Date.now(),
                        'bridgeuniqueid': conf.bridgeuniqueid
                    });
                }
            }));

            ami.on('meetmeend', Meteor.bindEnvironment(function (evt) {
                const conf = Conferences.findOne({
                    'conference': evt.meetme,
                    end_timestamp: {
                        $exists: false
                    }
                });
                if (conf) {
                    Conferences.update({
                        'bridgeuniqueid': conf.bridgeuniqueid
                    }, {
                        $set: {
                            end_timestamp: new Date()
                        }
                    });
                    ConferenceEvents.insert({
                        'message': `Conference has ended.`,
                        'event': 'end',
                        'starmon_timestamp': Date.now(),
                        'bridgeuniqueid': conf.bridgeuniqueid
                    });
                } else {
                    console.log('Error ending meetme.. couldn\'t find a matching conference.');
                }
            }));

            //
            // AMI Connection status
            // TODO: Detect when AMI goes away
            //
            ami.on('fullybooted', Meteor.bindEnvironment(function (evt) {
                evt.starmon_timestamp = Date.now();
                if (AmiStatus.find().count() > 0) {
                    AmiStatus.update({}, evt);
                } else {
                    AmiStatus.insert(evt);
                }
            }));
        }
    } else {
        console.log('AMI is not yet configured && is not listening for events. Please login to the Administration Panel from the web interface and setup your asterisk server.');
    }
}
/*
Meteor.setInterval(function() {
    //Check every 5 seconds if we are still connected to AMI

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
        }
    } else {
        return;
    }
    if (ami) {
        ami.action({
                'action': 'ping'
            },
            Meteor.bindEnvironment(function(err, res) {
                if (err) {
                    console.log('Can't talk to AMI...is it running? Trying to start AMI....');
                    StartAMI();
                    return 'error:' + err;
                }
                if (res) {
                    console.log('Ping result.');
                    ami.action({
                        'action': 'logout'
                    });
                }
            }));
    } else {
        console.log('Please setup Asterisk AMI settings in admin console.');
        return 'Invalid server info';
    }
}, 10000);

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