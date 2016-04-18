var Backbone = require('backbone');
var $ = require('jquery');
var Handlebars = require('handlebars');
var PouchDB = require('pouchdb');
var EditorView = require('./editor');
var mainTemplate = require('../../template/main.html');

module.exports = Backbone.View.extend({
   mainTemplate: mainTemplate,
   events: {
      'click #main_tabs a': 'handleTabLinkClick'
   },
   initialize: function(options) {
      this.options = options;

      this.db = new PouchDB(this.options.adminDBName);
   },
   render: function() {
      var mainTemplate = Handlebars.compile(this.mainTemplate);
      this.$el.html(mainTemplate());

      this.editorView = new EditorView({
         el: '#main',
         adminDBName: this.options.adminDBName,
         appDBName: this.options.appDBName,
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
   }

});
