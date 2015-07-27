Router.configure({
    loadingTemplate: 'loading',
    layoutTemplate: 'layout'
});
AccountsTemplates.configureRoute('ensureSignedIn', {
    template: 'login'
});
AccountsTemplates.configure({
    onSubmitHook: function(error, state) {
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
    lowercaseUsername: true
});

AccountsTemplates.addField({
    _id: 'username',
    type: 'text',
    required: true,
    func: function(value) {
        if (Meteor.isClient) {
            console.log("Validating username...");
            var self = this;
            Meteor.call("userExists", value, function(err, userExists) {
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
    func: function(value) {
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
    waitOn: function() {
        return Meteor.subscribe('ServerSettings');
    },
    fastRender: true
});
Router.route('/events/calls', {
    name: 'calls',
    waitOn: function() {
        return Meteor.subscribe('AmiLog');
    },
    fastRender: true
});
Router.route('/events/amilog', {
    name: 'amilog',
    waitOn: function() {
        return Meteor.subscribe('AmiLog');
    },
    fastRender: true
});
Router.route('/events/meetme', {
    name: 'meetme',
    waitOn: function() {
        return Meteor.subscribe('MeetMe');
    },
    fastRender: true
});
Router.route('/events/queue', {
    name: 'queue',
    waitOn: function() {
        return Meteor.subscribe('Queue');
    },
    fastRender: true
});
