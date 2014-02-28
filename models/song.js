exports.build = function(mongoose) {
	var name = 'Song';
	var schema = mongoose.Schema({
		title: String,
		artist: [String],
		albumartist: [String],
		album: String,
		year: Number,
		track: {
			no: Number,
			of: Number
		},
		disk: {
			no: Number,
			of: Number
		},
		picture: {
			format: String,
			data: Buffer
		},
		type: String, // ogg, wav, mp4, mp3, fla
		path: String,
		duration: Number,
		upvotes: Number,
		downvotes: Number,
		added: Date,
		modified: Date
	});

	schema.virtual('score').get(function() {
		return this.upvotes - this.downvotes;
	});

	return mongoose.model(name, schema);
}
