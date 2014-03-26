Handlebars.registerHelper('amiblock', function(context) {
    var html = '<form class="form-horizontal" role="form">';

    for (var key in context) {

        if (key == "starmon_timestamp") {
            context[key] = moment(context[key]).format('MMMM Do YYYY, h:mm:ss a');
        }

        html = html + '<div class="form-group">';
        html = html + '		<label for="' + key + '"><strong>' + key + '</strong></label>';
        html = html + '		<input type="text" class="form-control" id="' + key + '" disabled value="' + context[key] + '">';
        html = html + '</div>';
    }

    html = html + '</form>';
    return html;
});