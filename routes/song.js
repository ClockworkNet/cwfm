module.exports = function(dir, Song, User, fs, path, mm) {
	var allowed = ['.mp3', '.m4a', '.ogg', '.flac', '.wma', '.wmv'];
	var maxFails = 5;

	var processSongTags = function(song, stats, done) {
		var songStream = fs.createReadStream(song.path);

		songStream.on('error', function(e) {
			return done(e, song);
		});

		var parser = mm(songStream, {duration: true});

		parser.on('done', function(e) {
			if (e) return done(e, song);
			songStream.destroy();
		});

		parser.on('metadata', function(tags) {
			console.info("Found song metadata. Song:", song, " Tags:", tags);

			if (!tags || !tags.duration) {
				return done(new Error("Could not read duration metadata for file"), song);
			}

			var keys = ['title', 'artist', 'album', 'genre', 'albumartist', 'year', 'track', 'disk', 'picture', 'duration'];

			keys.forEach(function(key) {
				song[key] = tags[key];
			});

			done(null, song);
		});
	}

	var updateSong = function(filename, stats, force) {
		if (!filename || filename.length == 0) {
			return false;
		}

		if (allowed.indexOf(path.extname(filename)) < 0) {
			return false;
		}

		Song.findOne({path: filename}, function(e, song) {
			if (e) {
				console.trace("Error seeking song", e);
				return false;
			}

			if (!song) {
				song = new Song();
				song.added = Date.now();
			}
			else if (!force && song.modified && song.modified.getTime() >= stats.ctime.getTime()) {
				return false;
			}

			song.modified = Date.now();
			song.path     = filename;

			processSongTags(song, stats, function(e, song) {
				if (e) {
					console.error("Error processing song metadata", song, e);
					return false;
				}
				song.save(function(e) {
					if (e) {
						console.error("Error saving song", song, e);
					}
					return true;
				});
			});
		});
	};

	// Recursively scans directories for media files
	var scan = function(dir, filename, force) {
		var fullpath = path.join(dir, filename);
		fs.stat(fullpath, function(e, stats) {
			if (e) {
				console.trace("Error getting stats for", fullpath, e);
				return;
			}
			if (stats.isFile()) {
				return updateSong(fullpath, stats, force);
			}
			if (stats.isDirectory()) {
				fs.readdir(fullpath, function(e, paths) {
					if (e) {
						console.trace("Error reading", filename, e);
						return;
					}
					if (!paths) return;
					paths.forEach(function(p) {
						scan(fullpath, p, force);
					});
				});
			}
		});
	}

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

		if (req.session.user.playlist) {
			query.and({_id: {$nin: req.session.user.playlist.songs}});
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

	this.scan = function(req, res, next) {
		if (!req.session.user.admin) {
			return res.jsonp(401, {error: "Not authorized"});
		}

		console.info('Starting scan', dir);
		scan(dir, '', req.body.force);
		return res.jsonp({success: true});
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
