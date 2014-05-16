module.exports = function(Song, User) {
	var maxFails = 5;

	this.search = function(req, res, next){
		var terms = null;
		try {
			terms = new RegExp(req.query.q, 'i');
		}
		catch (e) {
			console.trace("Received weird search", req.query, e);
			return res.jsonp([]);
		}

		var fields = [];
		switch (req.query.f) {
			case ('song'):
				fields = ['title'];
				break;
			case ('album'):
				fields = ['album'];
				break;
			case ('artist'):
				fields = ['artist', 'albumartist'];
				break;
			default:
				fields = ['path', 'title', 'album', 'artist', 'albumartist'];
				break;
		}

		var like = [];
		fields.forEach(function(field) {
			var c = {};
			c[field] = terms;
			like.push(c);
		});

		var query = Song.where({$or: like})

		if (req.user.playlist) {
			query.and({_id: {$nin: req.user.playlist.songs}});
		}

		query.exec(function(e, a) {
			if (e) {
				console.trace("Error searching songs", e, query);
				return res.jsonp(500, {error: "Error searching songs"});
			}
			res.jsonp({songs: a});
		});
	};

	this.detail = function(req, res, next) {
		Song.findById(req.params.id, function(e, song) {
			if (e) {
				console.trace(e);
				return res.jsonp(500, {error: "Error finding song"});
			}
			res.jsonp(song);
		});
	};

	this.stream = function(req, res, next) {
		Song.findById(req.params.id, function(e, song) {
			if (e) {
				console.trace(e);
				return res.send(500, "Error sending file");
			}
			if (!song || !song.path) {
				return res.send(404, "Song not found");
			}
			res.sendfile(song.path, function(e) {
				if (e) {
					console.trace("Error sending song", e, song);
					if (!song.failures) song.failures = 0;
					song.failures++;
					if (song.failures > maxFails) {
						song.remove();
					}
					else {
						song.save();
					}
				}
			});
		});
	};
};
