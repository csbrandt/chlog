function(doc) {
	if (doc.input && doc.created) {
	   emit(doc.created, doc);
	}
}
