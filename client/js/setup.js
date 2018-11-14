/* First Run - Setup */
/* 
TODO:

Write registration verification for email, password length, etc. 

Disable\Enable the continue button when the form isn't valid.

Don't allow this form to be posted if there already is already >= 1 users.
*/

Template.setup.events = {
    'submit form': function (e) {
        e.preventDefault();
        var valid = true;

        const error_box = $("#errors");
        const adminUser = {
            email: $(e.target).find('[name=email]').val().trim(),
            password: $(e.target).find('[name=password]').val().trim(),
            username: $(e.target).find('[name=username]').val().trim(),
            profile: {
                name: $(e.target).find('[name=fullname]').val().trim(),
            }
        }
        const password_verify = $(e.target).find('[name=password_verify]').val();
        error_box.html("");

        if (adminUser.password != password_verify) {
            error_box.append('<p>Passwords don\'t match.</p>');
            valid = false;
        }
        if (adminUser.password.length <= 8) {
            error_box.append('<p>Password must 8 or more characters.</p>');
            valid = false;
        }
        if (adminUser.username.trim().length <= 4) {
            error_box.append('<p>Username must be more than 4 characters.</p>');
            valid = false;
        }
        if (valid) {
            $("#error").fadeOut();
            Meteor.call("registerAdminUser", adminUser, function (err, res) {
                if (err) {
                    error_box.append('<p>Error registering user:</p>');
                    error_box.append('<p>' + err + '</p>');
                    $("#error").fadeIn();
                } else {
                    toastr.success("Account created. Please login with your new account!", "Setup Successful!");
                    window.location = '/';
                }
            });
        } else {
            $("#error").fadeIn();
        }
    }
};