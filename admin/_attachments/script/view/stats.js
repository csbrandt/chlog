var Backbone = require('backbone');
var Handlebars = require('handlebars');
var PouchDB = require('pouchdb');
var _ = require('lodash');
var d3 = require('d3');
var statsTemplate = require('../../template/stats.html');
var d3MultiSeriesLine = require('../chart/d3MultiSeriesLine');

module.exports = Backbone.View.extend({
   statsTemplate: statsTemplate,
   initialize: function(options) {
      this.options = options;

      this.appDB = new PouchDB(this.options.hostName + '/' + this.options.appDBName);
      this.db = new PouchDB(this.options.adminDBName);
      this.publicDB = new PouchDB(this.options.publicDBName);

      // get each sysdoc from adminDB
      this.appDB.query('chlog-admin/sysdoc', {
         include_docs: true
      }, this.render.bind(this));
   },
   render: function(err, response) {
      var statsTemplate = Handlebars.compile(this.statsTemplate);

      if (!err) {
         this.generalSettings = _.filter(_.map(response.rows, 'doc'), {
            name: 'general'
         });
      }

      if (this.generalSettings.length) {
         this.generalSettings = this.generalSettings[0];
      }

      this.$el.html(statsTemplate());
   }
});
