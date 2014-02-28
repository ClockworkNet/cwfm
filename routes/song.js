exports.Controller = function(dir, Song, User, fs, path, mm) {
	var allowed = ['.mp3', '.m4a', '.ogg', '.flac', '.wma', '.wmv'];

	var updateSong = function(filename) {
		if (!filename || filename.length == 0) return;

		if (allowed.indexOf(path.extname(filename)) < 0) {
			return;
		}

		var stream = fs.createReadStream(filename);

		stream.on('error', function(e) {
			console.error("Error opening stream", e);
			return false;
		});

		var parser = mm(stream, {duration: true});
		parser.on('metadata', function(result) {
			console.info(result);

			if (!result || !result.duration) {
				console.error("Could not read duration metadata for file", filename, result);
				return;
			}

			Song.findOne({path: filename}, function(e, song) {

				if (e) {
					console.error("Error seeking song", e);
					return;
				}

				if (!song) {
					song = new Song();
					song.added = Date.now();
				}

				for (var key in result) {
					if (!result.hasOwnProperty(key)) continue;
					song[key] = result[key];
				}

				song.modified = Date.now();
				song.path     = filename;

				console.info("Saving song", song);
				song.save();
			});
		});
	};

	// Recursively scans directories for media files
	var scan = function(dir, filename) {
		var fullpath = path.join(dir, filename);
		fs.stat(filename, function(e, stats) {
			if (e) {
				console.error("Error getting stats for", path, e);
				return;
			}
			if (stats.isFile()) {
				return updateSong(fullpath);
			}
			if (stats.isDirectory()) {
				fs.readdir(fullpath, function(e, paths) {
					if (e) {
						console.error("Error reading", filename, e);
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
			console.error("Received weird search", req.query, e);
			return res.jsonp([]);
		}
		var query = Song.find({path: terms})
		.or({title: terms})
		.or({album: terms})
		.or({artist: terms}) 
		.or({albumartist: terms});
		query.exec(function(e, a) {
			if (e) {
				console.error(e);
				return res.jsonp(500, {error: "Error searching songs"});
			}
			res.jsonp({songs: a});
		});
	};

	this.detail = function(req, res, next) {
		Song.findById(req.params.id, function(e, song) {
			if (e) {
				console.error(e);
				return res.jsonp(500, {error: "Error finding song"});
			}
			res.jsonp(song);
		});
	};

	this.scan = function(req, res, next) {
		User.findOne({username: req.session.username}, function(e, user) {
			if (e) {
				console.error(e);
				return res.jsonp(500, {error: "Error scanning directory"});
			}
			if (!user || !user.admin) {
				return res.jsonp(401, {error: "Not authorized"});
			}
			console.info('Starting scan', dir);
			scan(dir, '');
		});
	};

	this.stream = function(req, res, next) {
		Song.findById(req.params.id, function(e, song) {
			if (e) {
				console.error(e);
				return res.send(500, "Error sending file");
			}
			if (!song || !song.path) {
				return res.send(404, "Song not found");
			}
			res.sendfile(song.path, function(e) {
				console.error("Error sending song", song, e);
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
