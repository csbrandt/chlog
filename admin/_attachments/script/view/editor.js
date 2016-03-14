var marked = require('marked');
var Backbone = require('backbone');
var Handlebars = require('handlebars');
var PouchDB = require('pouchdb');
var _ = require('lodash');
var editorTemplate = require('../../template/editor.html');

var droppableContentType = /image.*/;
var pasteHtmlAtCaret = function(html, selectPastedContent) {
   var sel, range;
   if (window.getSelection) {
      // IE9 and non-IE
      sel = window.getSelection();
      if (sel.getRangeAt && sel.rangeCount) {
         range = sel.getRangeAt(0);
         range.deleteContents();

         // Range.createContextualFragment() would be useful here but is
         // only relatively recently standardized and is not supported in
         // some browsers (IE9, for one)
         var el = document.createElement("div");
         el.innerHTML = html;
         var frag = document.createDocumentFragment(),
            node, lastNode;
         while ((node = el.firstChild)) {
            lastNode = frag.appendChild(node);
         }
         var firstNode = frag.firstChild;
         range.insertNode(frag);

         // Preserve the selection
         if (lastNode) {
            range = range.cloneRange();
            range.setStartAfter(lastNode);
            if (selectPastedContent) {
               range.setStartBefore(firstNode);
            } else {
               range.collapse(true);
            }
            sel.removeAllRanges();
            sel.addRange(range);
         }
      }
   } else if ((sel = document.selection) && sel.type !== "Control") {
      // IE < 9
      var originalRange = sel.createRange();
      originalRange.collapse(true);
      sel.createRange().pasteHTML(html);
      if (selectPastedContent) {
         range = sel.createRange();
         range.setEndPoint("StartToStart", originalRange);
         range.select();
      }
   }
};

module.exports = Backbone.View.extend({
   model: new Backbone.Model({
      created: Date.now()
   }),
   editorTemplate: editorTemplate,
   events: {
      'keyup .editor': 'handleEditorKeyup'
   },
   initialize: function(options) {
      this.options = options;

      this.db = new PouchDB(this.options.adminDBName);
      this.publicDB = new PouchDB(this.options.publicDBName);

      marked.setOptions({
         renderer: new marked.Renderer(),
         gfm: true,
         tables: true,
         breaks: true,
         sanitize: true
      });


   },
   render: function() {
      var editorTemplate = Handlebars.compile(this.editorTemplate);
      this.$el.html(editorTemplate());

      // Setup the dnd listeners.
      this.dropZone = this.$el.find('.editor')[0];

      this.dropZone.addEventListener('dragover', this.handleDragover, false);
      this.dropZone.addEventListener('drop', this.handleDrop.bind(this), false);

      if (this.model.get('input') && this.model.get('input').length > 0) {
         this.handleInputChange();
         this.handleContentChange();
      }
   },
   handleEditorKeyup: function(event) {
      _.debounce(this.handleEditorChange.bind(this), 5000)(event);
   },
   handleEditorChange: function(event) {
      event.stopPropagation();

      var markdownString = event.currentTarget.innerText;

      this.model.set({
         input: markdownString
      });

      this.handleInputChange();
      this.handleContentChange();
   },
   handleInputChange: function() {
      // create and update markdown content
      marked(this.model.get('input'), this.updatePreviewContent.bind(this));

      // pick what is to be saved in the db
      var toDB = _.omit(this.model.toJSON(), 'content');

      if (!this.model.get('_id')) {
         // create doc for this post
         this.db.post(toDB, function(err, response) {
            this.model.set('_id', response.id, {
               silent: true
            });

            // save input to database
            this.db.put(toDB, response.id, response.rev, this.handleDBDocUpdate.bind(this));
         }.bind(this));
      } else {
         // update the input if given an existing doc and the editor is empty
         if (this.$el.find('.editor').text().length === 0) {
            this.$el.find('.editor').html(this.model.get('input'));
         }

         // before updating, get most current revision for this doc
         this.db.get(toDB._id, function(err, response) {
            // update latest revision
            toDB._rev = response._rev;

            // save input to database
            this.db.put(toDB, this.handleDBDocUpdate.bind(this));
         }.bind(this));
      }
   },
   updatePreviewContent: function(err, content) {
      this.model.set({
         content: content
      });
   },
   handleContentChange: function() {
      this.$el.find('.preview').html(this.model.get('content'));
   },
   handleDBDocUpdate: function(err, response) {
      // todo
   },
   handleDragover: function(event) {
      event.stopPropagation();
      event.preventDefault();

      // Explicitly show this is a copy.
      event.dataTransfer.dropEffect = 'copy';
   },
   handleDrop: function(event) {
      event.stopPropagation();
      event.preventDefault();

      var file;
      var reader;
      var imgMarkdown;

      var onImageLoad = function(file) {
         // images are saved on the public and admin databases

         // get latest revision of _design/chlog
         this.db.get('_design/chlog', function(err, response) {
            this.db.putAttachment('_design/chlog', 'image/' + file.name, response._rev, file, file.type, function(err, response) {
               PouchDB.replicate(this.options.adminDBName, this.options.hostName + '/' + this.options.adminDBName);

            }.bind(this));
         }.bind(this));

         // get latest revision of _design/chlog
         this.publicDB.get('_design/chlog', function(err, response) {
            this.publicDB.putAttachment('_design/chlog', 'image/' + file.name, response._rev, file, file.type, function(err, response) {
               PouchDB.replicate(this.options.publicDBName, this.options.hostName + '/' + this.options.publicDBName);

            }.bind(this));
         }.bind(this));
      }.bind(this);

      for (var c = 0; c < event.dataTransfer.files.length; c++) {
         file = event.dataTransfer.files[c];
         // only save items of a type that is in the droppableContentType array
         if (file.type.match(droppableContentType)) {
            reader = new FileReader();
            reader.readAsArrayBuffer(file);

            /*jshint -W083 */
            reader.onload = function() {
               onImageLoad(file);
            };

            // append at drop point the markdown for the image
            imgMarkdown = "![Alt text](asset/image/" + file.name + " \"Optional title\")";
            pasteHtmlAtCaret(imgMarkdown, true);
         }
      }
   }

});
