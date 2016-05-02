var _         = require('lodash');
var Generator = require('./static-generator');
var util = exports;

util.mapDocs = function(response) {
   return _.map(_.pick(response, 'rows').rows, 'doc');
};

util.mergeSettings = function(response) {
   return _.reduce(_.map(response.rows, 'doc'), function(result, value) {
      return Object.assign({}, result, value);
   });
};

util.getPosts = function(db, cb) {
   // get all posts from DB
   db.query('chlog/byCreatedDate', {
      include_docs: true
   }, function(err, response) {
      if (err) {
         cb(err, null);
      } else {
         cb(err, this.mapDocs(response));
      }
   }.bind(this));
};

util.updateSite = function(db, settings) {
   // get all posts from DB
   this.getPosts(db, function(err, posts) {
      var publicDoc = Generator.generateDoc(posts, settings);
      publicDoc._id = '_design/chlog';

      var sequence = Promise.resolve();
      // update public site
      _.forEach(publicDoc._attachments, function(value, key) {
         sequence = sequence.then(function() {
            return db.get(publicDoc._id);
         }).then(function(doc) {
            return db.removeAttachment(publicDoc._id, key, doc._rev);
         }).then(function() {
            return db.get(publicDoc._id);
         }).then(function(doc) {
            return db.putAttachment(publicDoc._id, key, doc._rev, value.data, value.content_type);
         }).catch(function(err) {
            console.log(err);
         });
      });
   });
};
