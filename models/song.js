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
		type: String, // ogg, wav, mp4, mp3, fla
		path: String,
		pictures: [{
			type: String,
			path: String
		}],
		waveform: String,
		duration: Number,
		upvotes: Number,
		downvotes: Number,
		added: Date,
		modified: Date,
		failures: Number
	});

	schema.virtual('score').get(function() {
		return this.upvotes - this.downvotes;
	});

	schema.methods.remaining = function(start) {
		if (!this.duration) return 0;

		var end = Date.parse(start) + (this.duration * 1000);
		var now = Date.now();

		return end - now;
	};

	return mongoose.model(name, schema);
}
