var Backbone = require('backbone');
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
      /*
      var publicDB = new PouchDB(publicDBName);

      // initial sync with host database
      // continually sync to local public from remote
      PouchDB.sync(host + '/' + publicDBName, publicDBName,
      {
         live: true
      }).on('error', function(info)
      {
         // handle complete
      });*/
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
