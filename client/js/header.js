Template.header.helpers({
    active: function (page, currentpage) {
        if (page == currentpage) {
            return ' class=active ';
        }
        return '';
    }
});