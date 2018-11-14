Meteor.subscribe('UserCount');

Template.login.helpers({
    setupComplete: function () {
        return ((Counts.get("user-count") >= 1) ? true : false);
    }
});