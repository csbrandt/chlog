var Handlebars = require('handlebars');
var timeAgo = require('simple-timeago');

Handlebars.registerHelper('compare', function(lvalue, rvalue, options) {
   if (arguments.length < 3) {
      throw new Error("Handlerbars Helper 'compare' needs 2 parameters");
   }

   var operator = options.hash.operator || "===";

   var operators = {
      '===': function(l, r) {
         return l === r;
      },
      '!==': function(l, r) {
         return l !== r;
      },
      '<': function(l, r) {
         return l < r;
      },
      '>': function(l, r) {
         return l > r;
      },
      '<=': function(l, r) {
         return l <= r;
      },
      '>=': function(l, r) {
         return l >= r;
      },
      'typeof': function(l, r) {
         return typeof l === r;
      }
   };

   if (!operators[operator]) {
      throw new Error("Handlerbars Helper 'compare' doesn't know the operator " + operator);
   }

   var result = operators[operator](lvalue, rvalue);

   if (result) {
      return options.fn(this);
   } else {
      return options.inverse(this);
   }

});

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
