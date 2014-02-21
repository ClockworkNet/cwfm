exports.build = function(mongoose) {
	var name = 'Song';
	var schema = mongoose.Schema({
		name: String,
		artist: String,
		album: String,
		started: Date,
		length: Number
	});

	return mongoose.model('Room', schema);
}
