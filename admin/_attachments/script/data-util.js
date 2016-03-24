var _    = require('lodash');
var util = exports;

util.mapDocs = function(response) {
   return _.map(_.pick(response, 'rows').rows, 'doc');
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
