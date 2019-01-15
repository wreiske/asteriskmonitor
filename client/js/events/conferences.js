Template.conferences.helpers({
    active_conference: function () {
        return Conferences.find({
            'end_timestamp': {
                $exists: false
            }
        }, {
            sort: {
                conference: -1
            }
        });
    },
    active_conf_count: function () {
        return Conferences.find({
            'end_timestamp': {
                $exists: false
            }
        }).count();
    },
    completed_conference: function () {
        return Conferences.find({
            'end_timestamp': {
                $exists: true
            }
        }, {
            sort: {
                conference: -1
            }
        });
    },
    completed_conf_count: function () {
        return Conferences.find({
            'end_timestamp': {
                $exists: true
            }
        }).count();
    },
});