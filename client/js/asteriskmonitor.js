Meteor.subscribe("AmiStatus");

Handlebars.registerHelper('notloggedin', function() {
    if (Meteor.user()) {
        return false;
    } else {
        return true;
    }
});

Handlebars.registerHelper('ami_connected', function() {
    if (AmiStatus.find({'status':'Fully Booted'}).count() == 1) {
        return true;
    } else {
        return false;
    }
});

Handlebars.registerHelper('firstrun', function() {
    if (Meteor.users.find().count() != 0) {
        return false;
    } else {
        return true;
    }
});

Handlebars.registerHelper('moment', function(time) {
    return moment(time).fromNow();
});

Handlebars.registerHelper('isadmin', function() {
    if (Meteor.user()) {
        try {
            if (Meteor.user().profile.admin == 1) {
                return true;
            } else {
                return false;
            }
        } catch (err) {}
    }
});

Handlebars.registerHelper('inbox_count', function() {
    if (Meteor.userId()) {
        return Messages.find().count();
    }
});

Handlebars.registerHelper('md5', function(string) {
    return CryptoJS.MD5(string).toString();
});

Meteor.Router.add({
    '/': 'home',
    '/home': 'home',
    '/about': 'about',
    '/setup': 'setup',
    '/admin': 'admin',
    '/events/calls': 'calls',
    '/events/amilog': 'amilog',
    '/events/meetme': 'meetme',
    '/events/queue': 'queue'
});

Meteor.Router.filters({
    requireLogin: function(page) {
        if (Meteor.users.find().count() == 0) {
            return 'setup';
        }
        var skip_auth = 'about';

        if (skip_auth == page) {
            return page;
        }
        if (Meteor.loggingIn()) {
            return 'loading';
        } else if (Meteor.user()) {
            return page;
        } else {
            return 'login';
        }
    }
});

Meteor.Router.filter('requireLogin')
