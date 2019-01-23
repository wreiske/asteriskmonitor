const csvParse = require('csv-parse');

Template.directory.helpers({
  directory_listing: function () {
    return Directory.find({}, {
      sort: {
        name: 1
      },
      // TODO: pagination limit: 1000
    });
  },
  numberCount: function () {
    return Directory.find().count();
  }
});

Template.directory.events({
  'click #show_import': function (event) {
    $("#import_csv_wrap").fadeToggle();
  },
  'click #sync_caller_names': function (event) {
    Meteor.call('Directory-UpdateAllCID', function (err, res) {
      if (err) {
        toastr.error(err, 'Error!');
      } else {
        toastr.success(res, 'Success!');
      }
    });
  },
  'click #import_csv': function (event) {
    // TODO: Clean this up... this is hacked together for a quick proof of concept 
    // meeting for boss man
    let output = [];
    csvParse($("#csv").val().trim(), {
        trim: true,
        skip_empty_lines: true,
        columns: true
      })
      // Use the readable stream api
      .on('readable', function () {
        let record;
        while (record = this.read()) {
          output.push(record)
        }
      })
      // When we are done, test that the parsed output matched what expected
      .on('end', function () {
        //send to server.
        Meteor.call('Directory-ImportCSV', output, function (err, res) {
          if (err) {
            toastr.error(err, 'Error importing CSV');
          } else {
            toastr.success(res, 'Success!');
          }
        });
      });
  }
});