Template.editprofile.events = {
    'submit form': function (e) {
        e.preventDefault();
        // TODO: Move to server side method instead of updating directly from the client!
        // TODO: Server side method should also check validation (length, etc);
        // TODO: Restrict client updates

        const fullname = $(e.target).find('[name=fullname]').val().trim();
        const username = $(e.target).find('[name=username]').val().trim();

        Meteor.users.update({
            _id: Meteor.user()._id
        }, {
            $set: {
                "profile.name": fullname,
                "username": username,
            }
        });
    },
};