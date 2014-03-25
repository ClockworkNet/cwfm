exports.build = function(mongoose, toJSON) {
	var name = 'Song';
	var schema = mongoose.Schema({
		title: String,
		artist: [String],
		albumartist: [String],
		album: String,
		year: Number,
		genre: [String],
		type: String, // ogg, wav, mp4, mp3, fla
		path: String,
		duration: Number,
		upvotes: Number,
		downvotes: Number,
		added: Date,
		modified: Date,
		failures: Number
	});

	// Overridden to remove binary data from output
	schema.methods.toJSON = function() {
		return {
			_id         : this.id,
			title       : this.title,
			name        : this.name,
			artist      : this.artist,
			album       : this.album,
			year        : this.year,
			type        : this.type,
			filename    : this.filename,
			duration    : this.duration,
			score       : this.score,
			upvotes     : this.upvotes,
			downvotes   : this.downvotes,
			modified    : this.modified,
			failures    : this.failures,
		};
	};

	schema.virtual('name').get(function() {
		if (this.title) return this.title;
		var filename = this.filename;
		var name     = filename.substring(0, filename.lastIndexOf('.'));
		return name;
	});

	schema.virtual('filename').get(function() {
		return this.path.substring(this.path.lastIndexOf('/') + 1);
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
