var Backbone = require('backbone');
var PouchDB = require('pouchdb');
var MainView = require('./view/main');
var PostView = require('./view/post');

var host = window.location.origin;
var publicDBName = 'chlog-public';

module.exports = Backbone.Router.extend({
   routes: {
      '': 'index',
      'post/:id': 'post'
   },
   initialize: function() {
      var publicDB = new PouchDB(publicDBName);

      // initial sync with host database
      // sync to local public from remote
      PouchDB.sync(host + '/' + publicDBName, publicDBName).on('error', function(info)
      {

      });
   },
   index: function() {
      if (!this.mainView) {
         this.mainView = new MainView({
            el: 'body',
            publicDBName: publicDBName
         });
      }

      this.mainView.getPosts();
      this.mainView.render();
   },
   post: function(id) {
      if (!this.mainView) {
         this.mainView = new MainView({
            el: 'body',
            publicDBName: publicDBName
         });

         this.mainView.renderMain();
      }

      this.postView = new PostView({
         el: '#content',
         publicDBName: publicDBName
      });

      this.postView.render(id);
   }

});
