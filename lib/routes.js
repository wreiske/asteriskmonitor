Router.configure({
    progress: true,
    loadingTemplate: 'loading',
    layoutTemplate: 'layout',
    fastRender: true
});

AccountsTemplates.configureRoute('ensureSignedIn', {
    template: 'login'
});

AccountsTemplates.configure({
    onSubmitHook: function (error, state) {
        if (!error) {
            if (state === "signIn") {
                // Successfully logged in
                // ...
            }
            if (state === "signUp") {
                // Successfully registered
                // ...
            }
        }
    },
    showAddRemoveServices: true,
    showForgotPasswordLink: true,
    lowercaseUsername: true,
    forbidClientAccountCreation: false
});

AccountsTemplates.addField({
    _id: 'username',
    type: 'text',
    required: true,
    func: function (value) {
        if (Meteor.isClient) {
            console.log("Validating username...");
            var self = this;
            Meteor.call("userExists", value, function (err, userExists) {
                if (!userExists)
                    self.setSuccess();
                else
                    self.setError(userExists);
                self.setValidating(false);
            });
            return;
        }
        // Server
        return Meteor.call("userExists", value);
    }
});

AccountsTemplates.addField({
    _id: 'name',
    type: 'text',
    displayName: "Full Name",
    func: function (value) {
        if (value.trim().indexOf(' ') == -1) {
            this.setSuccess();
        }
        this.setError("Please include your full name.");
        this.setValidating(false);
        return false;
    },
    errStr: 'Please include your full name.'
});

Router.plugin('ensureSignedIn', {
    except: ['login', 'setup', 'about']
});

Router.route('/', {
    name: 'home',
    waitOn: function () {
        return [Meteor.subscribe('userInfo')];
    },
    fastRender: true
});

Router.route('/about', {
    name: 'about',
    fastRender: true
});

Router.route('/setup', {
    name: 'setup',
    fastRender: true
});

Router.route('/admin', {
    name: 'admin',
    waitOn: function () {
        return [Meteor.subscribe('ServerSettings'), Meteor.subscribe('userInfo')];
    },
    fastRender: true
});

Router.route('/events/calls', {
    name: 'calls',
    waitOn: function () {
        return [Meteor.subscribe('AmiLog'), Meteor.subscribe('userInfo')];
    },
    fastRender: true
});

Router.route('/events/amilog', {
    name: 'amilog',
    waitOn: function () {
        return [Meteor.subscribe('AmiLog'), Meteor.subscribe('userInfo')];
    },
    fastRender: true
});

Router.route('/events/conferences', {
    name: 'conferences',
    waitOn: function () {
        return [Meteor.subscribe('Conferences'), Meteor.subscribe('userInfo')];
    },
    fastRender: true
});

Router.route('/events/conference/:_conference', {
    name: 'ConferenceSingle',
    data: function () {
        return Conferences.find({
            'conference': this.params._conference
        });
    },
    waitOn: function () {
        return [Meteor.subscribe('ConferenceEvents', this.params._conference),Meteor.subscribe('ConferenceSingle', this.params._conference), Meteor.subscribe('ConferenceMembers', this.params._conference), Meteor.subscribe('userInfo')];
    },
    fastRender: true
});
Router.route('/events/queue', {
    name: 'queue',
    waitOn: function () {
        return [Meteor.subscribe('Queue'), Meteor.subscribe('userInfo')];
    },
    fastRender: true
});