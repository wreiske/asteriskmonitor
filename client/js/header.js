Template.header.helpers({
    active: function (page) {
        if (page == currentpage) {
            return ' class=nav-item active ';
        }
        return ' class=nav-item';
    }
});