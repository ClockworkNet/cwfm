exports.Controller = function(dir, Song, User, fs, path, mm) {

	var updateSong = function(filename) {
		if (!filename || filename.length == 0) return;

		var allowed = ['.mp3', '.m4a', '.ogg', '.flac', '.wma', '.wmv'];
		if (allowed.indexOf(path.extname(filename)) < 0) {
			return;
		}

		fs.open(filename, 'r', function(e, fd) {
			if (e || !fd) {
				console.error("Error opening file", filename, e);
				return;
			}
			var parser = mm(fd, {duration: true});
			parser.on('metadata', function(result) {
				Song.find({path: filename}, function(e, song) {
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
						song[key] = result.key;
					}
					song.modified = Date.now();
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
		var users = Song.find(req.query, function(arr, data) {
			res.jsonp({songs: arr});
		});
	};

	this.detail = function(req, res, next) {
		var id = req.params.id;
		var song = Song.findById(id, function(song) {
			res.jsonp(song);
		});
	};

	this.create = function(req, res, next) {
		Song.create(req.body, function(e, user) {
			res.jsonp(user);
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
		throw {error: "Not implemented"};
	};

	this.startWatch = function() {
		fs.exists(dir, function(exists) {
			if (!exists) {
				console.error("Song directory does not exist", dir);
				return;
			}
			console.info("Watching song directory", dir);
			fs.watch(dir, function(event, filename) {
				updateSong(path.join(dir, filename));
			});
		});
	};
};
