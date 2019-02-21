

Template.warnings.helpers({
  notificationsDisabled: function () {
      return ((NotificationStatus.get() != "granted") ? true : false);
  }
});