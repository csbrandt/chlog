var Handlebars = require('handlebars');
var timeAgo = require('simple-timeago');

Handlebars.registerHelper("timeago", function(date) {
   return timeAgo(new Date(date));
});

// HELPER: #key_value
//
// Usage: {{#key_value obj}} Key: {{key}} // Value: {{value}} {{/key_value}}
//
// Iterate over an object, setting 'key' and 'value' for each property in
// the object.
Handlebars.registerHelper("key_value", function(obj, context) {
   var buffer = "",
      key;

   for (key in obj) {
      if (obj.hasOwnProperty(key)) {
         buffer += context.fn({
            key: key,
            value: obj[key]
         });
      }
   }

   return buffer;
});

Handlebars.registerHelper("locale_date_string", function(date) {
   return new Date(date).toLocaleDateString();
});

Handlebars.registerHelper("ifOdd", function(index, options) {
   return (index % 2 === 0 ? options.inverse(this) : options.fn(this));
});
