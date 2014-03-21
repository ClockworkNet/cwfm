exports.build = function(mongoose, toJSON) {
	var name = 'Playlist';
	var schema = mongoose.Schema({
		name: String,
		description: String,
		owners: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
		songs: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Song' }]
	});

	schema.methods.toJSON = function() {
		var obj = this.toObject();

		// Limit the song information
		if (obj.songs) {
			obj.songs.forEach(function(song, i) {
				if (!song._id) return;
				obj.songs[i] = {
					_id         : song._id,
					title       : song.title,
					artist      : song.artist,
					album       : song.album,
					year        : song.year,
					type        : song.type,
					filename    : song.filename,
					duration    : song.duration,
					score       : song.score,
					upvotes     : song.upvotes,
					downvotes   : song.downvotes,
					modified    : song.modified,
					failures    : song.failures
				};
			});
		}
		obj.owners = toJSON(obj.owners);
		return obj;
	};

	// Pops the first song in the list and shifts it to the end of the list
	schema.methods.rotate = function() {
		if (!this.songs || this.songs.length < 1) {
			return this;
		}
		var song = this.songs.shift();
		this.songs.splice(-1, 0, song);
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
		if (this.indexOf(song) >= 0) {
			console.info("Song already exists, skipping add", this, song);
			return this;
		}

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
