exports.search = function(req, res, next, Song){
	var users = Song.find(req.query, function(arr, data) {
		res.json({songs: arr});
	});
};

exports.detail = function(req, res, next, Song) {
	var id = req.params.id;
	var song = Song.findById(id, function(song) {
		res.json(song);
	});
};

exports.create = function(req, res, next, Song) {
	Song.create(req.body, function(e, user) {
		res.json(user);
	});
};
