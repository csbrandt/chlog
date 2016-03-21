var _                   = require('lodash');
var Handlebars          = require('handlebars');
var marked              = require('marked');
var tileTemplateSrc     = require('../template/public/tiles.html');
var postTileTemplateSrc = require('../template/public/posttile.html');
var postTemplateSrc     = require('../template/public/post.html');
var rewrites            = require('../../public-rewrites.json');
var cssText             = require('../../../dist/admin/_attachments/css/public/style.css');
var POSTS_PER_PAGE      = 10;
var generator           = exports;

generator.generateDoc = function(posts, settings) {
   var doc = {
      '_attachments': {
         'css/style.css': {
            'content_type': 'text/css',
            'data': new Blob([cssText], {type: 'text/css'})
         }
      },
      'rewrites': rewrites
   };

   Object.assign(doc._attachments, this.generateTiles(posts, settings));

   posts.forEach(function(post, name) {
      var postMap = this.generatePost(post, settings);
      doc._attachments[Object.keys(postMap)[0]] = postMap[Object.keys(postMap)[0]];

   }.bind(this));

   return doc;
};

generator.generatePost = function(doc, settings) {
   var postTemplate = Handlebars.compile(postTemplateSrc);
   var post = {};

   marked(doc.input, function(err, content) {
      doc.content = content;
      var page = postTemplate(Object.assign({}, doc, settings));

      post[doc._id + '.html'] = {
         "content_type": "text/html",
         "data": new Blob([page], {type: 'text/html'})
      };

   }.bind(this));

   return post;
};

generator.generateTiles = function(posts, settings) {
   var tileTemplate;
   var postTileTemplate;
   var page;
   var pages = _.range(1, Math.ceil(posts.length / POSTS_PER_PAGE));
   var tiles = {};

   posts.sort(function(a, b) {
      if (a.published < b.published) {
         return 1;
      }

      if (a.published > b.published) {
         return -1;
      }

      return 0;
   });

   // for each page generate tiles
   pages.forEach(function(pageNum) {
      postTileTemplate = Handlebars.compile(postTileTemplateSrc);
      Handlebars.registerPartial("postTileTemplate", postTileTemplate);
      tileTemplate = Handlebars.compile(tileTemplateSrc);

      page = tileTemplate(Object.assign({
         nextPageNum: pageNum + 1,
         prevPageNum: pageNum - 1,
         firstPage: (pageNum === 1),
         lastPage: (pageNum === pages.length),
         post: posts.slice(POSTS_PER_PAGE * (pageNum - 1), POSTS_PER_PAGE * pageNum)
      }, settings));

      tiles[pageNum + '.html'] = {
         "content_type": "text/html",
         "data": new Blob([page], {type: 'text/html'})
      };

   });

   return tiles;
};
