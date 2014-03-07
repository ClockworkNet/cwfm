exports.Controller = function(config, fs, path) {
	var filterFiles = function(v, i, a) {
		return config.pattern.test(v);
	};

	this.list = function(req, res, next) {
		fs.readdir(config.dir, function(e, files) {
			var list = files ? files.filter(filterFiles) : [];
			res.jsonp(list);
		});
	};

	this.show = function(req, res, next) {
		res.sendfile(req.params.name, {root: config.dir});
	}
}
