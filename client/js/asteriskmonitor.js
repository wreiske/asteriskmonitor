Handlebars.registerHelper('notloggedin', function () {
    if (Meteor.user()) {
        return false;
    } else {
        return true;
    }
});

Meteor.subscribe('AmiStatus');
Handlebars.registerHelper('ami_connected', function () {
    if (AmiStatus.find({
            'status': 'Fully Booted'
        }).count() === 1) {
        return true;
    } else {
        return false;
    }
});

Handlebars.registerHelper('firstrun', function () {
    return ((Counts.get("user-count") === 0) ? true : false);
});

Handlebars.registerHelper('currentRoute', function () {
    return Router.current().route.getName();
});

Template.registerHelper('reactiveTime', function (time) {
    if (typeof time === "undefined") {
        time = this.starmon_timestamp;
    }
    return moment(time).from(TimeSync.serverTime());
});

Template.registerHelper('elapsedTime', function (time, time2) {
    return moment(time).from(time2, true);
});

Handlebars.registerHelper('moment', function (time) {
    if (typeof time === "undefined") {
        time = this.starmon_timestamp;
    }
    return moment(time).from(TimeSync.serverTime());
});

Handlebars.registerHelper('isadmin', function () {
    if (Meteor.user() && Meteor.user().admin) {
        try {
            if (Meteor.user().admin == 1) {
                return true;
            } else {
                return false;
            }
        } catch (err) {
            return false;
        }
    }
});

Handlebars.registerHelper('inbox_count', function () {
    if (Meteor.userId()) {
        return Messages.find().count();
    }
});

Handlebars.registerHelper('md5', function (string) {
    return CryptoJS.MD5(string).toString();
});