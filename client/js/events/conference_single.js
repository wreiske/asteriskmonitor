Template.ConferenceSingle.helpers({
  event: function () {
    return ConferenceEvents.find({}, {
      sort: {
        starmon_timestamp: -1
      }
    });
  },
  confShareUrl: function () {
    return `${Meteor.absoluteUrl()}conference/${this.bridgeuniqueid}`;
  },
  timeSpeaking: function () {
    Session.get("secondTicker");
    let talkCounter = this.talkTime;
    if (this.talking) {
      talkCounter = this.talkTime + Math.abs((moment(TimeSync.serverTime()) - this.speak_timestamp) / 1000);
    }
    return moment().startOf('day')
      .seconds(talkCounter)
      .format('H:mm:ss');
  },
  active_members: function () {
    return ConferenceMembers.find({
      'leave_timestamp': {
        $exists: false
      }
    }, {
      sort: {
        starmon_timestamp: -1
      }
    });
  },
  total_bridge_count: function () {
    return ConferenceMembers.find().count();
  },
  active_bridge_count: function () {
    return ConferenceMembers.find({
      'leave_timestamp': {
        $exists: false
      }
    }).count();
  },
  hangup_members: function () {
    return ConferenceMembers.find({
      'leave_timestamp': {
        $exists: true
      }
    }, {
      sort: {
        starmon_timestamp: -1
      }
    });
  },
  hangup_bridge_count: function () {
    return ConferenceMembers.find({
      'leave_timestamp': {
        $exists: true
      }
    }).count();
  }
});
Template.ConferenceSingle.events({
  'click #permalink': function (event) {
    copyToClipboard(event.target.value);
    toastr.success('Copied conference link to clipboard');
  }
});
Template.ConferenceSingle.conference_mute_user = function (bridge, channel) {
  var error_box = $('#errors');
  Meteor.call('conference_mute_user',
    bridge,
    channel,
    function (error, result) {
      // console.log(error);
      // console.log(result);

      if (error) {
        toastr.error(error, 'Error muting user');
        error_box.append('<p>Error muting user:</p>');
        error_box.append('<p>' + error + '</p>');
        $('#error').fadeIn();
      } else {
        toastr.success('Muted!');
        $('#error').fadeOut();
      }
    });
};
Template.ConferenceSingle.conference_kick_user = function (bridge, user_id) {
  var error_box = $('#errors');
  Meteor.call('conference_kick_user',
    bridge,
    user_id,
    function (error, result) {
      // console.log(error);
      // console.log(result);

      if (error) {
        toastr.error(error, 'Error kicking user');
        error_box.append('<p>Error kicking user:</p>');
        error_box.append('<p>' + error + '</p>');
        $('#error').fadeIn();
      } else {
        $('#error').fadeOut();
      }
    });
};