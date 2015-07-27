Handlebars.registerHelper('amiblock', function(context) {
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
Handlebars.registerHelper('amitable', function(context) {
    var html = '<div class="table-responsive"><table class="table table-hover"><thead><tr>';

    for (var key in context) {
        if (key == "_id") continue;
        
        html = html + '<th>' + key + '</th>';
    }
    html = html + '</tr></thead><tbody><tr>';


    for (var key in context) {
        if (key == "_id") continue;

        if (key == "starmon_timestamp") {
             html = html + '<td>' +  moment(context[key]).format('MMMM Do YYYY, h:mm:ss a') + '</td>';
        }
        else
        {
             html = html + '<td>' + context[key] + '</td>';
        }       
    }

    html = html + '</tr></tbody></table></div>';
    return html;
});
