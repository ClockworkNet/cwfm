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

	schema.methods.isOwner = function(user) {
		if (!user || !this.owners) return false;
		var uid = user._id ? user._id.toString() : user.toString();
		return this.owners.some(function(o) {
			var oid = o._id ? o._id.toString() : o.toString();
			return uid == oid;
		});
	};

	schema.methods.songAt = function(i) {
		if (i < 0 || i >= this.songs.length) {
			return null;
		}
		return this.songs[i];
	};

	schema.methods.indexOf = function(song) {
		if (!this.songs) return -1;
		var findId = song._id ? song._id.toString() : song.toString();
		for (var id=0; ix<this.songs.length; ix++) {
			var item = this.songs[ix];
			if (!item) continue;
			var itemId = item._id ? item._id.toString() : item.toString();
			if (findId == itemId) {
				return ix;
			}
		}
		return -1;
	};

	schema.methods.insertSong = function(song, ix) {
		if (!ix) ix = 0;
		this.songs.splice(ix, 0, song);
		return this;
	};

	schema.methods.removeSong = function(song) {
		var index = this.indexOf(song);
		if (index >= 0) {
			this.songs.splice(index, 1);
		}
		return this;
	};

	return mongoose.model(name, schema);
}
