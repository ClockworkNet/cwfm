module.exports = function(config, fs, path, User) {
	var filterFiles = function(v, i, a) {
		return config.pattern.test(v);
	};

	this.user = function(req, res, next) {
		User.findOne({username: req.params.username}, function(e, user) {
			if (e || !user) {
				return res.jsonp(404, {error: "User not found"});
			}
			var img = user.avatar || config.default;
			res.sendfile(img, {root: config.dir});
		});
	};

	this.list = function(req, res, next) {
		fs.readdir(config.dir, function(e, files) {
			var list = files ? files.filter(filterFiles) : [];
			res.jsonp(list);
		});
	};

	this.show = function(req, res, next) {
		var img = req.params.name || config.default;
		res.sendfile(img, {root: config.dir});
	}
}
