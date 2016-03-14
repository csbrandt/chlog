var Backbone = require('backbone');
var $ = require('jquery');
var Handlebars = require('handlebars');
var marked = require('marked');
var PouchDB = require('pouchdb');
var _ = require('lodash');
var postTemplate = require('../../template/post.html');

module.exports = Backbone.View.extend({
   postTemplate: postTemplate,
   events: {

   },
   initialize: function(options) {
      this.options = options;
      this.publicDB = new PouchDB(this.options.publicDBName);

      marked.setOptions({
         renderer: new marked.Renderer(),
         gfm: true,
         tables: true,
         breaks: true,
         sanitize: true
      });
   },
   render: function(id) {
      var postTemplate = Handlebars.compile(this.postTemplate);

      this.publicDB.get(id, function(err, doc) {
         marked(doc.input, function(err, content) {
            doc.content = content;
            this.$el.html(postTemplate(doc));

         }.bind(this));

      }.bind(this));
   }

});
