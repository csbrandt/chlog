var _ = require('lodash');
var $ = require('jquery');
var Handlebars = require('handlebars');
var marked = require('marked');
var rss = require('rss');
var tileTemplateSrc = require('../template/public/tiles.html');
var postTileTemplateSrc = require('../template/public/posttile.html');
var postTemplateSrc = require('../template/public/post.html');
var cssText = require('../../../dist/admin/_attachments/css/public/style.css');
var POSTS_PER_PAGE = 8;
var generator = exports;

generator.generateDoc = function(posts, settings) {
   var doc = {
      '_attachments': {
         'css/style.css': {
            'content_type': 'text/css',
            'data': new Blob([cssText], {
               type: 'text/css'
            })
         },
         'feed.rss': {
            'content_type': 'application/rss+xml',
            'data': new Blob([this.generateFeed(posts, settings)], {
               type: 'application/rss+xml'
            })
         }
      }
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

   marked.setOptions({
      highlight: function (code) {
         return require('highlight.js').highlightAuto(code).value;
      }
   });

   marked(doc.input, function(err, content) {
      var $parsed = $('<div />').html(content);
      $parsed.children('h1:first').remove();
      $parsed.find('p > img').first().parent().remove();

      doc.content = $parsed.html();
      doc.published = (new Date(doc.published)).toLocaleDateString();
      var page = postTemplate(Object.assign({}, doc, settings));

      post[doc._id + '.html'] = {
         "content_type": "text/html",
         "data": new Blob([page], {
            type: "text/html"
         })
      };
   });

   return post;
};

generator.generateTiles = function(posts, settings) {
   var tileTemplate = Handlebars.compile(tileTemplateSrc);
   var postTileTemplate = Handlebars.compile(postTileTemplateSrc);
   var pages = _.range(1, Math.max(2, Math.ceil(posts.length / POSTS_PER_PAGE)));
   var page;
   var tiles = {};
   var postsMarkup = '';

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
      posts.slice(POSTS_PER_PAGE * (pageNum - 1), POSTS_PER_PAGE * pageNum).forEach(function(post, index) {
         post.index = index;
         post.published = (new Date(post.published)).toLocaleDateString();
         postsMarkup += postTileTemplate(generator.generateContentPreview(post));
      });

      page = tileTemplate(Object.assign({
         nextPageNum: pageNum + 1,
         prevPageNum: pageNum - 1,
         firstPage: (pageNum === 1),
         lastPage: (pageNum === pages.length),
         posts: postsMarkup
      }, settings));

      tiles[pageNum + '.html'] = {
         "content_type": "text/html",
         "data": new Blob([page], {
            type: "text/html"
         })
      };

   });

   return tiles;
};

generator.generateContentPreview = function(post) {
   var content = marked(post.input);
   var $parsed = $('<div />').html(content);
   // pick the first header from this content
   var firstHeaderHTML = $parsed.children('h1:first').wrap('<div />').parent().html();

   // include image if present on post
   var $firstImg = $parsed.children().find('img:first');

   if ($firstImg.length) {
      post.bgImgUrl = $firstImg.attr('src');
   }

   post.preview = firstHeaderHTML;
   return post;
};

generator.generateFeed = function(posts, settings) {
   var feed = new rss({
      title: settings.title,
      description: settings.description,
      generator: "RSS for Node",
      feed_url: window.location.host + "/feed.rss",
      site_url: window.location.host
   });

   posts.forEach(function(post, name) {
      feed.item({
         //title:
         //description:
         url: window.location.host + "/" + post._id + ".html",
         guid: post._id,
         author: settings.author,
         date: post.published
      });
   });

   return feed.xml();
};
