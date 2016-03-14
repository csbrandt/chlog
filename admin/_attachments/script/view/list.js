var Backbone = require('backbone');
var $ = window.jQuery = require('jquery');
var Masonry = require('masonry-layout');
var Handlebars = require('handlebars');
var PouchDB = require('pouchdb');
var marked = require('marked');
var EditorView = require('./editor');
var listTemplate = require('../../template/list.html');
require('../../node_modules/bootstrap/js/modal');
require('../helpers');

module.exports = Backbone.View.extend({
   Masonry: Masonry,
   listTemplate: listTemplate,
   collection: new Backbone.Collection(),
   events: {
      'click ul#list-view-list .delete-icon': 'handlePostDelete',
      'click #delete_confirm_modal .delete': 'handlePostDeleteConfirm',
      'click ul#list-view-list .edit-icon': 'handlePostEdit',
      'click ul#list-view-list .publish-icon': 'handlePostPublish',
      'click #publish_confirm_modal .publish': 'handlePostPublishConfirm',
      'click .done': 'handleDoneEdit',

      'click ul.pills li': 'handlePillsClick',
      'click ul.pills li.all': 'showAll',
      'click ul.pills li.drafts': 'showDrafts',
      'click ul.pills li.published': 'showPublished'
   },
   initialize: function(options) {
      this.options = options;

      this.db = new PouchDB(this.options.adminDBName);
      this.publicDB = new PouchDB(this.options.publicDBName);

      // get all posts from DB
      this.db.query('chlog/byCreatedDate', {
         include_docs: true
      }, this.resetPosts.bind(this));

      // sort all posts by created date descending
      this.collection.comparator = function(a, b) {
         if (a.get('created') < b.get('created')) {
            return 1;
         }

         if (a.get('created') > b.get('created')) {
            return -1;
         }

         return 0;
      };
   },
   render: function() {
      var listTemplate = Handlebars.compile(this.listTemplate);

      this.createContentPreview();

      this.$el.html(listTemplate(this.collection.toJSON()));

      this.editorView = new EditorView({
         el: '#main',
         adminDBName: this.options.adminDBName,
         publicDBName: this.options.publicDBName,
         hostName: this.options.hostName
      });

      // Masonry
      this.masonry = new this.Masonry(document.querySelector('#list-view-list'), {
         itemSelector: '.masonry-item'
      });

      this.masonry.layout();

      this.collection.on({
         'reset': this.render
      }, this);
   },
   handlePostEdit: function(event) {
      // stop listeneing to collection while editing
      this.collection.off('reset');
      // get post filename
      var postID = $(event.target).closest('li').attr('id');

      // get the selected post
      this.db.get(postID, function(err, doc) {
         // set the model with the current edit selection
         this.editorView.model.set(doc);
         // show post editor with the post to edit
         this.editorView.render();

      }.bind(this));
   },
   handlePostPublishConfirm: function(event) {
      // get post id to delete
      var $modal = $(event.target).closest('.modal');
      var postID = $modal.data().postid;

      this.db.get(postID, function(err, doc) {
         // add published date to post
         doc.published = Date.now();
         // update post in database
         this.db.put(doc, this.handleDBDocUpdate);
         // push post to public database
         this.publicDB.put(doc);
      }.bind(this));

      // close modal
      $modal.modal('hide');
   },
   handlePostPublish: function(event) {
      // get post filename
      var postID = $(event.target).closest('li').attr('id');
      // set data on dialog attrib for post id to delete if confirmed
      $('#publish_confirm_modal').data('postid', postID);
      // show a preview of the post to delete
      var $previewNodes = $($('#' + postID).html());
      // do not show control icons for edit/delete
      $previewNodes.find('i').remove();

      $('#publish_confirm_modal .preview').html($previewNodes.html());
   },
   handleDoneEdit: function(event) {
      // remove editor
      this.editorView.remove();

      this.render();
   },
   handleDBDocUpdate: function(err, response) {
      // todo
   },
   handlePostDelete: function(event) {
      // get post filename
      var postID = $(event.target).closest('li').attr('id');
      // set data on dialog attrib for post id to delete if confirmed
      $('#delete_confirm_modal').data('postid', postID);
      // show a preview of the post to delete
      var $previewNodes = $($('#' + postID).html());
      // do not show control icons for edit/delete
      $previewNodes.find('i').remove();

      $('#delete_confirm_modal .preview').html($previewNodes.html());
   },
   handlePostDeleteConfirm: function(event) {
      // get post id to delete
      var $modal = $(event.target).closest('.modal');
      var postID = $modal.data().postid;

      this.db.get(postID, function(err, doc) {
         this.db.remove(doc, function(err, response) {

         }.bind(this));
      }.bind(this));

      // close modal
      $modal.modal('hide');
   },
   resetPosts: function(err, response) {
      this.collection.reset(_.map(_.pick(response, 'rows').rows, 'doc'));
   },
   createContentPreview: function() {
      this.collection.forEach(function(post, index, list) {
         marked(post.get('input'), function(err, content) {
            // pick the first header from this content
            var firstHeaderHTML = $('<div />').html(content).children('h1:first').wrap('<div />').parent().html();

            // todo: include image if present on post

            post.set('preview', firstHeaderHTML);
         });
      });
   },
   showAll: function() {
      var elements = this.$el.find('.masonry-item');
      var items = [];

      $.each(elements, function(index, value) {
         items.push(this.masonry.getItem(value));

      }.bind(this));

      this.masonry.reveal(items);
   },
   hideDrafts: function() {
      var elements = this.$el.find(':not(.published-ribbon)').closest('.masonry-item');
      var items = [];

      $.each(elements, function(index, value) {
         items.push(this.masonry.getItem(value));

      }.bind(this));

      this.masonry.hide(items);
      this.masonry.layout();
   },
   showDrafts: function() {
      this.hidePublished();

      var elements = this.$el.find('.masonry-item:not(:has(.published-ribbon))');
      var items = [];

      $.each(elements, function(index, value) {
         items.push(this.masonry.getItem(value));

      }.bind(this));

      this.masonry.reveal(items);
      this.masonry.layout();
   },
   hidePublished: function() {
      var elements = this.$el.find('.published-ribbon').closest('.masonry-item');
      var items = [];

      $.each(elements, function(index, value) {
         items.push(this.masonry.getItem(value));

      }.bind(this));

      this.masonry.hide(items);
      this.masonry.layout();
   },
   showPublished: function() {
      this.hideDrafts();

      var elements = this.$el.find('.published-ribbon').closest('.masonry-item');
      var items = [];

      $.each(elements, function(index, value) {
         items.push(this.masonry.getItem(value));

      }.bind(this));

      this.masonry.reveal(items);
      this.masonry.layout();
   },
   handlePillsClick: function(event) {
      this.$el.find('ul.pills li').removeClass('active');
      $(event.currentTarget).addClass('active');
   }

});
