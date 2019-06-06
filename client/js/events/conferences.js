Template.conferences.helpers({
    active_conference: function () {
        return Conferences.find({
            'end_timestamp': {
                $exists: false
            }
        }, {
            sort: {
                starmon_timestamp: -1
            }
        });
    },
    active_conf_count: function () {
        return Counts.get('active-conferences-count');
    },
    completed_conference: function () {
        return Conferences.find({
            'end_timestamp': {
                $exists: true
            }
        }, {
            sort: {
                end_timestamp: -1
            }
        });
    },
    completed_conf_count: function () {
        return Counts.get('complete-conferences-count');
    },
});