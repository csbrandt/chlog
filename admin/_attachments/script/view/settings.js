var $ = require('jquery');
var Backbone = require('backbone');
var Handlebars = require('handlebars');
var PouchDB = require('pouchdb');
var _ = require('lodash');
var Generator = require('../static-generator');
var dataUtil = require('../data-util.js');
var settingsTemplate = require('../../template/settings.html');

module.exports = Backbone.View.extend({
   settingsTemplate: settingsTemplate,
   model: new Backbone.Model(),
   collection: new Backbone.Collection(),
   events: {
      'keyup input': 'handleFormChange',
      'keyup textarea': 'handleFormChange'
   },
   initialize: function(options) {
      this.options = options;

      this.appDB = new PouchDB(this.options.hostName + '/' + this.options.appDBName);
      this.db = new PouchDB(this.options.adminDBName);

      // get each sysdoc from adminDB
      this.db.query('chlog/sysdoc', {
         include_docs: true
      }, this.render.bind(this));

      // setup handlers for modelEvents
      // callback is delayed to avoid multiple calls for duplicate events
      this.model.on({
         'change': _.debounce(this.handleModelChange, 500)
      }, this);
   },
   render: function(err, response) {
      var settingsTemplate = Handlebars.compile(this.settingsTemplate);
      var settings = [];

      this.$el.html(settingsTemplate());

      if (!err) {
         settings = this.getSettings(_.map(response.rows, 'doc'));
      }

      // populate settings
      for (var c = 0; c < settings.length; c++) {
         // populate form
         /*jshint -W083 */
         $('#' + settings[c].name).find('input, textarea').each(function(index, value) {
            if (value.id.length > 0) {
               this.$el.find('#' + value.id).val(settings[c][value.id]);
            }

         }.bind(this));

         // populate model
         this.model.set(settings[c].name, settings[c], {
            silent: true
         });
      }
   },
   handleFormChange: function(event) {
      var value = $(event.target).val();
      var attrID = $(event.target).attr('id');
      var formID = $(event.target).closest('form').attr('id');
      var formData = this.model.get(formID);
      var change = {};
      change[attrID] = value;

      if (formData) {
         formData = _.extend(formData, change);
      } else {
         formData = change;
      }

      this.model.set(formID, formData).trigger('change');
   },
   handleModelChange: function(event) {
      var sysdoc = _.map(this.model.toJSON(), function(sysdoc, index, collection) {
         sysdoc.type = 'sysdoc';
         sysdoc.name = index;

         return sysdoc;
      });

      // update collection
      this.collection.reset(sysdoc);

      // save sysdocs to database
      this.db.bulkDocs(sysdoc, this.updateSite.bind(this));
   },
   getSettings: function(rows) {
      var formIDs = [];

      this.$el.find('form').each(function(index, element) {
         formIDs.push(element.id);
      });

      // get sysdoc (sysdoc.name) that match formIDs
      var settings = _.filter(rows, function(doc) {
         for (var c = 0; c < formIDs.length; c++) {
            if (doc.name === formIDs[c]) {
               return doc;
            }
         }
      });

      return settings;
   },
   updateSite: function(err) {
      this.db.query('chlog/sysdoc', {
         include_docs: true
      }, function(err, sysdocs) {
         var settings = {};
         dataUtil.mapDocs(sysdocs).forEach(function (sysdoc) {
            Object.assign(settings, sysdoc);
         });
         // get all posts from DB
         dataUtil.getPosts(this.appDB, function(err, posts) {
            var publicDoc = Generator.generateDoc(posts, settings);
            publicDoc._id = '_design/chlog';
            // get latest revision of _design/chlog
            this.appDB.get(publicDoc._id, function(err, response) {
               publicDoc._rev = response._rev;
               // update public site
               this.appDB.put(publicDoc);
            }.bind(this));
         }.bind(this));
      }.bind(this));
   }

});
