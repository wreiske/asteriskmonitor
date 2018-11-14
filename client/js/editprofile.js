Template.editprofile.events = {
    'submit form': function (e) {
        e.preventDefault();
        Meteor.users.update({
            _id: Meteor.user()._id
        }, {
            $set: {
                "profile.name": $(e.target).find('[name=fullname]').val(),
                "username": $(e.target).find('[name=username]').val()
            }
        });
    },
};