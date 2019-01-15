Template.ConferenceSingle.helpers({
  members: function() {
      return ConferenceMembers.find();
  },
  bridges: function() {
      var people = ConferenceMembers.find({
          'conference': {
              $exists: true
          }
      }, {
          sort: {
              conference: -1
          }
      }).fetch();
      var actualBridges = [];

      $.each(people, function(key, val) {
          var bridge = {
              bridge: val.conference
          }
          var loc = -1;
          $.each(actualBridges, function(key, ee) {
              if (ee.bridge == val.conference) {
                  loc = key;
                  return false;
              }
          });
          if (loc == -1) {
              loc = actualBridges.push(bridge) - 1;
          }
          var person = {
              person: val
          }
          if (typeof actualBridges[loc].people === "undefined") {
              actualBridges[loc].people = [];
              actualBridges[loc].count = 0;
          }

          actualBridges[loc].people.push(val);
          actualBridges[loc].count++;
      });
      return actualBridges;
  },
  conference: function() {
      return ConferenceMembers.find({
          'conference': {
              $exists: true
          }
      }, {
          sort: {
              conference: -1
          }
      });
  },
  bridge_count: function() {
      return ConferenceMembers.find({
          'conference': {
              $exists: true
          }
      }).count();
  }
});

Template.ConferenceSingle.conference_mute_user = function(bridge, channel) {
  var error_box = $("#errors");
  Meteor.call('conference_mute_user',
      bridge,
      channel,
      function(error, result) {
          // console.log(error);
          // console.log(result);

          if (error) {
              error_box.append('<p>Error muting user:</p>');
              error_box.append('<p>' + error + '</p>');
              $("#error").fadeIn();
          } else {
              toastr.success('Muted!');
              $("#error").fadeOut();
          }
      });
};
Template.ConferenceSingle.conference_kick_user = function(bridge, user_id) {
  var error_box = $("#errors");
  Meteor.call('conference_kick_user',
      bridge,
      user_id,
      function(error, result) {
          // console.log(error);
          // console.log(result);

          if (error) {
              error_box.append('<p>Error kicking user:</p>');
              error_box.append('<p>' + error + '</p>');
              $("#error").fadeIn();
          } else {
              $("#error").fadeOut();
          }
      });
};
