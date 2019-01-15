Template.adminstart.helpers({
    ami: function () {
        return ServerSettings.find({
            'module': 'ami'
        }).fetch()[0];
    }
});

Template.adminstart.events = {
    'submit form': function (e) {
        e.preventDefault();

        let valid = true;
        const error_box = $("#errors");
        const host = $(e.target).find('[name=ami_host]').val();
        const port = $(e.target).find('[name=ami_port]').val();
        const user = $(e.target).find('[name=ami_user]').val();
        const pass = $(e.target).find('[name=ami_pass]').val();

        error_box.html("");

        if (host.trim().length == 0) {
            error_box.append('<p>Hostname can\'t be blank.</p>');
            valid = false;
        }
        if (port.trim().length == 0) {
            error_box.append('<p>Port can\'t be blank.</p>');
            valid = false;
        }
        if (user.trim().length == 0) {
            error_box.append('<p>Username can\'t be blank.</p>');
            valid = false;
        }
        if (pass.trim().length == 0) {
            error_box.append('<p>Password can\'t be blank.</p>');
            valid = false;
        }
        if (valid) {
            Meteor.call('save_ami',
                host,
                port,
                user,
                pass,
                function (error, result) {
                    if (error) {
                        error_box.append('<p>Error saving server settings:</p>');
                        error_box.append('<p>' + error + '</p>');
                        toastr.error(error, 'Error!');
                        $("#error").fadeIn();
                    } else {
                        $("#error").fadeOut();
                        console.log(result);
                        toastr.success(result, 'Saved!');
                    }
                });
            return false;
        } else {
            $("#error").fadeIn();
        }
    }
};
