var Backbone = require('backbone');
var PouchDB = require('pouchdb');
var MainView = require('./view/main');
var ListView = require('./view/list');
var SettingsView = require('./view/settings');
var StatsView = require('./view/stats');

var host = window.location.origin;
var appDBName = 'chlog';
var publicDBName = 'chlog-public';
var adminDBName = 'chlog-admin';

module.exports = Backbone.Router.extend({
   routes: {
      '': 'index',
      'settings': 'settings',
      'edit_post': 'list',
      'stats': 'stats'
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
            adminDBName: adminDBName,
            publicDBName: publicDBName
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
            publicDBName: publicDBName,
            hostName: host
         });
      }
   },
   stats: function() {
      if (!this.statsView) {
         this.statsView = new StatsView({
            el: '#main',
            appDBName: appDBName,
            adminDBName: adminDBName,
            publicDBName: publicDBName,
            hostName: host
         });
      }
   }

});
