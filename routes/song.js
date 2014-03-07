exports.Controller = function(dir, Song, User, fs, path, mm) {
	var allowed = ['.mp3', '.m4a', '.ogg', '.flac', '.wma', '.wmv'];
	var maxFails = 5;

	var processSongMeta = function(song, meta) {
		for (var key in meta) {
			if (!meta.hasOwnProperty(key)) continue;
			song[key] = meta[key];
		}
	}

	var generateWaveform = function(song, callback) {
		// @TODO: add waveform processing
		callback(null, song);
	};

	var updateSong = function(filename) {
		if (!filename || filename.length == 0) return;

		if (allowed.indexOf(path.extname(filename)) < 0) {
			return;
		}

		var stream = fs.createReadStream(filename);

		stream.on('error', function(e) {
			console.trace("Error opening stream", e);
			return false;
		});

		var parser = mm(stream, {duration: true});
		parser.on('metadata', function(result) {
			console.info("Found song metadata", result);

			if (!result || !result.duration) {
				console.error("Could not read duration metadata for file", filename, result);
				return;
			}

			Song.findOne({path: filename}, function(e, song) {

				if (e) {
					console.trace("Error seeking song", e);
					return;
				}

				if (!song) {
					song = new Song();
					song.added = Date.now();
				}
				song.modified = Date.now();
				song.path     = filename;

				processSongMeta(song, result);
				generateWaveform(song, function(e, song) {
					console.info("Saving song", song);
					song.save();
				});
			});
		});
	};

	// Recursively scans directories for media files
	var scan = function(dir, filename) {
		var fullpath = path.join(dir, filename);
		fs.stat(filename, function(e, stats) {
			if (e) {
				console.trace("Error getting stats for", path, e);
				return;
			}
			if (stats.isFile()) {
				return updateSong(fullpath);
			}
			if (stats.isDirectory()) {
				fs.readdir(fullpath, function(e, paths) {
					if (e) {
						console.trace("Error reading", filename, e);
						return;
					}
					if (!paths) return;
					paths.forEach(function(p) {
						scan(fullpath, p);
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
		var query = Song.find({path: terms})
		.or({title: terms})
		.or({album: terms})
		.or({artist: terms}) 
		.or({albumartist: terms});
		query.exec(function(e, a) {
			if (e) {
				console.trace(e);
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
		scan(dir, '');
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

	this.startWatch = function() {
		fs.exists(dir, function(exists) {
			if (!exists) {
				console.error("Song directory does not exist", dir);
				return;
			}
			console.info("Watching song directory", dir);
			fs.watch(dir, function(event, filename) {
				if (!filename) return;
				updateSong(path.join(dir, filename));
			});
		});
	};
};
