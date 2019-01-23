Template.header.helpers({
    active: function (page) {
        if (page && page == Router.current().route.getName()) {
            return 'active';
        }
        return '';
    }
});