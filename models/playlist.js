exports.build = function(mongoose) {
	var name = 'Playlist';
	var schema = mongoose.Schema({
		name: String,
		description: String,
		owners: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
		songs: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Song' }]
	});

	// Pops the first song in the list and shifts it to the end of the list
	schema.methods.rotate = function() {
		var song = this.songs.shift();
		this.songs.push(song);
		return this;
	};

	schema.methods.songAt = function(i) {
		if (i < 0 || i >= this.songs.length) {
			return null;
		}
		return this.songs[i];
	};

	return mongoose.model(name, schema);
}
