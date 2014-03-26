Template.header.helpers({
    active: function(page, currentpage) {
        //console.log('page:'+ page);
        //console.log('currentpage:'+ currentpage);
        if (page == currentpage) {
            return ' class=active ';
        }
        return '';
    }
});
