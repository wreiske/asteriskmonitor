Meteor.subscribe("Queue");
Template.queue.helpers({
    caller: function() {
        return Queue.find({
            'uniqueid': {
                $exists: true
            }
        }, {
            sort: {
                starmon_timestamp: -1
            }
        });
    },
    caller_count: function() {
        return Queue.find({
            'uniqueid': {
                $exists: true
            }
        }).count();
    }
});
