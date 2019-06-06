const libphonenumber = require('libphonenumber-js');

const _areaCodes = require('areacodes/lib/data.json');

Handlebars.registerHelper('amiblock', function (context) {
    var html = '<form class="form-horizontal" role="form">';

    for (var key in context) {

        if (key == "starmon_timestamp") {
            //context[key] = moment(context[key]).format('MMMM Do YYYY, h:mm:ss a');
            //context[key] = moment(context[key]).from(TimeSync.serverTime());
        }

        html = html + '<div class="form-group">';
        html = html + '     <label for="' + key + '"><strong>' + key + '</strong></label>';
        html = html + '     <input type="text" class="form-control" id="' + key + '" disabled value="' + context[key] + '">';
        html = html + '</div>';
    }

    html = html + '</form>';
    return html;
});
Handlebars.registerHelper('amitable', function (context) {
    var html = '<div class="table-responsive"><table class="table table-hover"><thead><tr>';

    for (var key in context) {
        if (key == "_id") continue;

        html = html + '<th>' + key + '</th>';
    }
    html = html + '</tr></thead><tbody><tr>';


    for (var key in context) {
        if (key == "_id") continue;

        if (key == "starmon_timestamp") {
            html = html + '<td>' + moment(context[key]).format('MMMM Do YYYY, h:mm:ss a') + '</td>';
        } else {
            html = html + '<td>' + context[key] + '</td>';
        }
    }

    html = html + '</tr></tbody></table></div>';
    return html;
});
copyToClipboard = str => {
    const el = document.createElement('textarea'); // Create a <textarea> element
    el.value = str; // Set its value to the string that you want copied
    el.setAttribute('readonly', ''); // Make it readonly to be tamper-proof
    el.style.position = 'absolute';
    el.style.left = '-9999px'; // Move outside the screen to make it invisible
    document.body.appendChild(el); // Append the <textarea> element to the HTML document
    const selected =
        document.getSelection().rangeCount > 0 // Check if there is any content selected previously
        ?
        document.getSelection().getRangeAt(0) // Store selection if found
        :
        false; // Mark as false to know no selection existed before
    el.select(); // Select the <textarea> content
    document.execCommand('copy'); // Copy - only works as a result of a user action (e.g. click events)
    document.body.removeChild(el); // Remove the <textarea> element
    if (selected) { // If a selection existed before copying
        document.getSelection().removeAllRanges(); // Unselect everything on the HTML document
        document.getSelection().addRange(selected); // Restore the original selection
    }
};

Template.registerHelper('prettyTime', function (time = Date.now()) {
    return moment(time).format('MMMM Do YYYY, h:mm:ss a');
});
Template.registerHelper('prettyDateShort', function (time = Date.now()) {
    return moment(time).format('MMM Do YYYY');
});
Template.registerHelper('prettyTimeShort', function (time = Date.now()) {
    return moment(time).format('h:mm:ss a');
});

Handlebars.registerHelper('currentYear', function () {
    return moment(TimeSync.serverTime() || Date.now()).year();
});

// TODO: Make i18n....
Handlebars.registerHelper('getPhoneNumberCityState', function (phone) {
    const phoneNumber = libphonenumber.parsePhoneNumberFromString(phone, "US");
    if (phoneNumber && phoneNumber.isValid()) {
        phone = phone.replace(/^\+?[10]/, '').replace(/[^0-9]/g, '').match(/^([0-9]{3})/);
        if (!phone) {
            return 'Location Unknown';
        }
        phone = phone[1];
        if (_areaCodes.hasOwnProperty(phone)) {
            return `${_areaCodes[phone].city}, ${_areaCodes[phone].state}`.toUpperCase();

        }
    }
    return '';
});

// TODO: Add administrator option to set local ("US", etc..)
Handlebars.registerHelper('formatPhoneNumber', function (phone) {
    if (phone) {
        const p = libphonenumber.parsePhoneNumberFromString(phone, "US");
        if (p) {
            return p.formatNational();
        }
    } else {
        return '';
    }
});

Handlebars.registerHelper('getPhoneNumberURI', function (phone) {
    const phoneNumber = libphonenumber.parsePhoneNumberFromString(phone, "US");
    if (phoneNumber && phoneNumber.isValid()) {
        return libphonenumber.parsePhoneNumberFromString(phone, "US").getURI();
    } else {
        return 'tel:' + phone;
    }
});

Handlebars.registerHelper('phoneTypeIcon', function (phone) {
    const phoneNumber = libphonenumber.parsePhoneNumberFromString(phone, "US");
    if (phoneNumber && phoneNumber.isValid()) {
        switch (phoneNumber.getType()) {
            case "MOBILE":
                return '<i class="fa fa-mobile"></i>';
                break;
            case "FIXED_LINE_OR_MOBILE":
                // maybe not assume mobile?
                return '<i class="fa fa-mobile"></i>';
                break;
            case "VOIP":
                return '<i class="fa fa-phone-square"></i>';
                break;
            default:
                return '<i class="fa fa-phone"></i>';
                break;
        }
    } else {
        return '<i class="fa fa-phone"></i>';
    }
});