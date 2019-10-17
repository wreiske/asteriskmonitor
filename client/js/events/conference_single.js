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
      talkCounter = this.talkTime + Math.abs((moment(TimeSync.serverTime() || Date.now()) - this.speak_timestamp) / 1000);
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
        speak_timestamp: -1,
        calleridname: 1
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
        calleridname: 1
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
  'change #switch-lock-conference': function (event) {
    var error_box = $('#errors');

    if (this.meetme == null) {
      toastr.error('Sorry, locking conferences has not been fully implemented yet.');
    } else {
      // meetme
      if ($("#switch-lock-conference").is(':checked')) {
      Meteor.call('meetme_lock',
        this.bridgeuniqueid,
        this.meetme,
        function (error, result) {
          if (error) {
            toastr.error(error, 'Error locking conference');
            error_box.append('<p>Error locking conference:</p>');
            error_box.append('<p>' + error + '</p>');
            $('#error').fadeIn();
          } else {
            $('#error').fadeOut();
          }
        });
      }
      else{
        Meteor.call('meetme_unlock',
        this.bridgeuniqueid,
        this.meetme,
        function (error, result) {
          if (error) {
            toastr.error(error, 'Error unlocking conference');
            error_box.append('<p>Error unlocking conference:</p>');
            error_box.append('<p>' + error + '</p>');
            $('#error').fadeIn();
          } else {
            $('#error').fadeOut();
          }
        });
      }
    }
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
            $('#error').fadeOut();
          }
        });
    }
  },
  'click .conf-unmute-member': function (event) {
    var error_box = $('#errors');
    if (event.currentTarget.parentElement.dataset.meetme == null) {
      // confbridge

      Meteor.call('conference_unmute_user',
        this.bridgeuniqueid,
        event.currentTarget.parentElement.dataset.conference,
        event.currentTarget.parentElement.dataset.channel,
        function (error, result) {
          if (error) {
            toastr.error(error, 'Error unmuting user');
            error_box.append('<p>Error unmuting user:</p>');
            error_box.append('<p>' + error + '</p>');
            $('#error').fadeIn();
          } else {
            $('#error').fadeOut();
          }
        });
    } else {
      // Meet ME
      Meteor.call('meetme_unmute_user',
        this.bridgeuniqueid,
        event.currentTarget.parentElement.dataset.meetme,
        event.currentTarget.parentElement.dataset.usernum,
        function (error, result) {
          if (error) {
            toastr.error(error, 'Error unmuting user');
            error_box.append('<p>Error unmuting user:</p>');
            error_box.append('<p>' + error + '</p>');
            $('#error').fadeIn();
          } else {
            $('#error').fadeOut();
          }
        });
    }
  }
});
let activeConfObserver = null;
Template.ConferenceSingle.onRendered(function () {
  if (activeConfObserver) {
    // Stop any previously active observers
    activeConfObserver.stop();
    activeConfObserver = null;
  }
  const confEvents = ConferenceEvents.find({
    starmon_timestamp: {
      $gt: TimeSync.serverTime() || Date.now()
    }
  });
  activeConfObserver = confEvents.observe({
    added: function (message) {
      switch (message.event) {
        case "leave":
          if ($("#switch-notification-sounds").is(':checked')) {
            $('#sound-leave')[0].currentTime = 0;
            $('#sound-leave')[0].volume = 1;
            $('#sound-leave')[0].play();
          }
          toastr.error(message.message);
          break;
        case "join":
          if ($("#switch-notification-sounds").is(':checked')) {
            $('#sound-join')[0].currentTime = 0;
            $('#sound-join')[0].volume = 1;
            $('#sound-join')[0].play();
          }
          toastr.success(message.message);
          break;
        default:
          toastr.info(message.message);
          break;
      }
      NotificationWrapper('/images/logo-512.png', 'Asterisk Monitor', message.message);
    },
    removed: function (rm) {
      console.log('RM', rm);
    }
  });
});

Template.ConferenceSingle.onDestroyed(function(){
  activeConfObserver.stop();
  activeConfObserver = null;
})