Meteor.subscribe("AmiStatus");

Handlebars.registerHelper('notloggedin', function() {
    if (Meteor.user()) {
        return false;
    } else {
        return true;
    }
});

Handlebars.registerHelper('ami_connected', function() {
    if (AmiStatus.find({
            'status': 'Fully Booted'
        }).count() == 1) {
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

Template.registerHelper('reactiveTime', function(time) {
    if (typeof time === "undefined") {
        time = this.starmon_timestamp;
    }

    return moment(time).from(TimeSync.serverTime());
});

Handlebars.registerHelper('moment', function(time) {
    return moment(time).fromNow();
});

Handlebars.registerHelper('isadmin', function() {
    if (Meteor.user().admin) {
        try {
            if (Meteor.user().admin == 1) {
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
