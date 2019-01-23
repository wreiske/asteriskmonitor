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
    return ((Counts.get('user-count') === 0) ? true : false);
});
Handlebars.registerHelper('log', function (obj) {
    console.log(obj.fetch());
});

Handlebars.registerHelper('currentRoute', function () {
    return (Router.current().route.options.title()) ? Router.current().route.options.title() : '';
});

Template.registerHelper('reactiveTime', function (time) {
    if (typeof time === 'undefined') {
        time = this.starmon_timestamp;
    }
    return moment(time).from(TimeSync.serverTime());
});

Template.registerHelper('elapsedTime', function (time, time2) {
    return moment(time).from(time2, true);
});
Template.registerHelper('elapsedHMS', function (time1 = Date.now(), time2 = Date.now()) {
    Session.get('secondTicker');
    return moment().startOf('day')
        .seconds(Math.abs((time2 - time1) / 1000))
        .format('H:mm:ss');
});
Template.registerHelper('hms', function (time = Date.now()) {
    return moment().startOf('day')
        .seconds(time)
        .format('H:mm:ss');
});
Handlebars.registerHelper('moment', function (time) {
    if (typeof time === 'undefined') {
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
Meteor.setInterval(function () {
    Session.set('secondTicker', new Date().getTime());
}, 1000);