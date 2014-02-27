exports.build = function(mongoose) {
	var name = 'Song';
	var schema = mongoose.Schema({
		name: String,
		artist: String,
		album: String,
		type: String, // ogg, wav, mp4, mp3, fla
		length: Number,
		upvotes: Number,
		downvotes: Number
	});

	schema.virtual('score').get(function() {
		return this.upvotes - this.downvotes;
	});

	return mongoose.model(name, schema);
}
