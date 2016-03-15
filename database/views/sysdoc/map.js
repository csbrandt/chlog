function(doc) {
   if (doc['type'] === 'sysdoc') {
      emit(doc.name, doc);
   }
}
