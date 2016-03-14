var Backbone = require('backbone');
var $ = require('jquery');
var Handlebars = require('handlebars');
var PouchDB = require('pouchdb');
var EditorView = require('./editor');
var mainTemplate = require('../../template/main.html');
var pubIndexTemplate = require('../../template/pubindex.html');

module.exports = Backbone.View.extend({
   mainTemplate: mainTemplate,
   pubIndexTemplate: pubIndexTemplate,
   events: {
      'click #main_tabs a': 'handleTabLinkClick'
   },
   initialize: function(options) {
      this.options = options;

      this.db = new PouchDB(this.options.adminDBName);
      this.publicDB = new PouchDB(this.options.publicDBName);
   },
   render: function() {
      var mainTemplate = Handlebars.compile(this.mainTemplate);
      this.$el.html(mainTemplate());

      this.editorView = new EditorView({
         el: '#main',
         adminDBName: this.options.adminDBName,
         publicDBName: this.options.publicDBName,
         hostName: this.options.hostName
      });

      this.editorView.render();
   },
   handleTabLinkClick: function(e) {
      $('.tabs-nav > li').removeClass('active');
      $(e.currentTarget).parent().addClass('active');
   },
   indicateSuccess: function(response, textStatus, jqXHR) {
      this.$el.find('#status_ok').show();
      this.$el.find('#status_txt').text(textStatus);
   },
   indicateError: function(jqXHR, textStatus, errorThrown) {
      this.$el.find('#status_error').show();
      this.$el.find('#status_txt').text(textStatus);
   },
   updatePubIndex: function(settings) {
      var pubIndexTemplate = Handlebars.compile(this.pubIndexTemplate);

      // get latest revision of _design/chlog
      this.publicDB.get('_design/chlog', function(err, response) {
         // update index.html with latest settings
         var indexText = [pubIndexTemplate(settings)];
         var blob = new Blob(indexText, {
            type: 'text/html'
         });

         this.publicDB.putAttachment('_design/chlog', 'index.html', response._rev, blob, 'text/html', function(err, response) {
            PouchDB.replicate(this.options.publicDBName, this.options.hostName + '/' + this.options.publicDBName);

         }.bind(this));
      }.bind(this));
   }

});
