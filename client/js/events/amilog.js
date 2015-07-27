Template.amilog.helpers({
    event: function() {
        return AmiLog.find({}, {
            sort: {
                starmon_timestamp: -1
            },
            limit: 25
        });
    }
});
