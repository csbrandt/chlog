var Backbone = require('backbone');
var $ = require('jquery');
var Handlebars = require('handlebars');
var PouchDB = require('pouchdb');
var marked = require('marked');
var _ = require('lodash');
var mainTemplate = require('../../template/main.html');
var tileTemplate = require('../../template/posttile.html');
require('../helpers');

module.exports = Backbone.View.extend({
   mainTemplate: mainTemplate,
   tileTemplate: tileTemplate,
   collection: new Backbone.Collection(),
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

      this.collection.on({
         'reset': this.render
      }, this);
   },
   render: function() {
      var tileTemplate = Handlebars.compile(this.tileTemplate);
      Handlebars.registerPartial("tileTemplate", tileTemplate);
      var mainTemplate = Handlebars.compile(this.mainTemplate);

      this.createContentPreview();

      this.$el.html(mainTemplate(this.collection.toJSON()));
      // set title text
      this.$el.find('.top-menu a').text(document.title);
   },
   renderMain: function() {
      // just render the main template without any data
      var mainTemplate = Handlebars.compile(this.mainTemplate);
      this.$el.html(mainTemplate());

      // set title text
      this.$el.find('.top-menu a').text(document.title);
   },
   getPosts: function() {
      // get all posts from DB
      this.publicDB.query('chlog/byCreatedDate', {
         include_docs: true
      }, this.resetPosts.bind(this));
   },
   resetPosts: function(err, response) {
      this.collection.reset(_.map(_.pick(response, 'rows').rows, 'doc'));
   },
   createContentPreview: function() {
      this.collection.forEach(function(post, index, list) {
         marked(post.get('input'), function(err, content) {
            var $parsed = $('<div />').html(content);
            // pick the first header from this content
            var firstHeaderHTML = $parsed.children('h1:first').wrap('<div />').parent().html();

            // include image if present on post
            var $firstImg = $parsed.children().find('img:first');

            if ($firstImg.length) {
               post.set('bgImgUrl', $firstImg.attr('src'));
            }

            post.set('preview', firstHeaderHTML);
         });
      });
   }

});
