var Backbone = require('backbone');
var PouchDB = require('pouchdb');
var MainView = require('./view/main');
var ListView = require('./view/list');
var SettingsView = require('./view/settings');

var host = window.location.origin;
var appDBName = 'chlog';
var publicDBName = 'chlog-public';
var adminDBName = 'chlog-admin';

module.exports = Backbone.Router.extend({
   routes: {
      '': 'index',
      'settings': 'settings',
      'edit_post': 'list'
   },
   initialize: function() {
      var db = new PouchDB(adminDBName);

      // initial sync with host database
      // sync to local admin from remote
      PouchDB.sync(host + '/' + adminDBName, adminDBName)
         .on('error', function(info) {
            // handle complete
         });

      // initial sync with host database
      // replicate to remote public from local
      PouchDB.sync(publicDBName, host + '/' + publicDBName)
         .on('error', function(info) {
            // handle complete
         });

   },
   index: function() {
      if (!this.mainView) {
         this.mainView = new MainView({
            el: 'body',
            adminDBName: adminDBName,
            publicDBName: publicDBName,
            hostName: host
         });
      }

      this.mainView.render();
   },
   list: function() {
      if (!this.listView) {
         this.listView = new ListView({
            el: '#main',
            appDBName: appDBName,
            adminDBName: adminDBName,
            publicDBName: publicDBName,
            hostName: host
         });
      }

      this.listView.render();
   },
   settings: function() {
      if (!this.settingsView) {
         this.settingsView = new SettingsView({
            el: '#main',
            appDBName: appDBName,
            adminDBName: adminDBName,
            hostName: host
         });
      }
   }

});
