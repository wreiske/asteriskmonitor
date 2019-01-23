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
    if (talkCounter) {
      return moment().startOf('day')
        .seconds(talkCounter)
        .format('H:mm:ss');
    }
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
  total_member_count: function () {
    return ConferenceMembers.find().count();
  },
  active_member_count: function () {
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
  hangup_member_count: function () {
    return ConferenceMembers.find({
      'leave_timestamp': {
        $exists: true
      }
    }).count();
  },
  topCaller: function () {
    return ConferenceMembers.find({
      'leave_timestamp': {
        $exists: true
      }
    }, {
      sort: {
        talkTime: -1
      }
    }).fetch()[0];
  }
});

Template.ConferenceSingle.events({
  'click #permalink': function (event) {
    copyToClipboard(event.target.value);
    toastr.success('Copied conference link to clipboard');
  },
  'click .conf-kick-member': function (event) {
    var error_box = $('#errors');
    if (event.currentTarget.parentElement.dataset.meetme == null) {
      // confbridge
      Meteor.call('conference_kick_user',
        this.bridgeuniqueid,
        event.currentTarget.parentElement.dataset.conference,
        event.currentTarget.parentElement.dataset.channel,
        function (error, result) {
          if (error) {
            toastr.error(error, 'Error kicking user');
            error_box.append('<p>Error kicking user:</p>');
            error_box.append('<p>' + error + '</p>');
            $('#error').fadeIn();
          } else {
            toastr.success('Kicked user from conference.');
            $('#error').fadeOut();
          }
        });
    } else {
      // Meet ME
      Meteor.call('meetme_kick_user',
        this.bridgeuniqueid,
        event.currentTarget.parentElement.dataset.meetme,
        event.currentTarget.parentElement.dataset.usernum,
        function (error, result) {
          if (error) {
            toastr.error(error, 'Error kicking user');
            error_box.append('<p>Error kicking user:</p>');
            error_box.append('<p>' + error + '</p>');
            $('#error').fadeIn();
          } else {
            toastr.success('Kicked user from conference.');
            $('#error').fadeOut();
          }
        });
    }
  },
  'click .conf-mute-member': function (event) {
    var error_box = $('#errors');
    if (event.currentTarget.parentElement.dataset.meetme == null) {
      // confbridge

      Meteor.call('conference_mute_user',
        this.bridgeuniqueid,
        event.currentTarget.parentElement.dataset.conference,
        event.currentTarget.parentElement.dataset.channel,
        function (error, result) {
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
    } else {
      // Meet ME
      Meteor.call('meetme_mute_user',
        this.bridgeuniqueid,
        event.currentTarget.parentElement.dataset.meetme,
        event.currentTarget.parentElement.dataset.usernum,
        function (error, result) {
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
    }
  }
});