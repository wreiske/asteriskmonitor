/* First Run - Setup */

/* 
TODO:

Write registration verification for email, password length, etc. 

Disable\Enable the continue button when the form isn't valid.

Don't allow this form to be posted if there already is already >= 1 users.
*/

Meteor.subscribe('directory');

Template.setup.events = {
    'submit form': function(e) {
        e.preventDefault();

        var valid = true;
        var error_box = $("#errors");
        var email = $(e.target).find('[name=email]').val();
        var fullname = $(e.target).find('[name=fullname]').val();
        var username = $(e.target).find('[name=username]').val();
        var password = $(e.target).find('[name=password]').val();
        var password_verify = $(e.target).find('[name=password_verify]').val();

        error_box.html("");

        if (password != password_verify) {
            error_box.append('<p>Passwords don\'t match.</p>');
            valid = false;
        }
        if (password.length <= 5) {
            error_box.append('<p>Password must be more than 5 characters.</p>');
            valid = false;
        }
        if (fullname.trim().indexOf(' ') == -1) {
            error_box.append('<p>Please include your full name.</p>');
            valid = false;
        }
        if (username.trim().length <= 4) {
            error_box.append('<p>Username must be more than 4 characters.</p>');
            valid = false;
        }
        if (valid) {
            $("#error").fadeOut();

            var date = new Date();
            var registered = date.getTime();

            Accounts.createUser({
                email: email,
                password: password,
                username: username,
                registered: registered,
                profile: {
                    name: fullname,
                    admin: 1
                }
            }, function(err) {
                if (err) {
                    error_box.append('<p>Error registering user:</p>');
                    error_box.append('<p>' + err + '</p>');
                    $("#error").fadeIn();
                }
            });
            return false;
        } else {
            $("#error").fadeIn();
        }
    }
};