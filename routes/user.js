exports.list = function(req, res, next, User){
	var users = User.find({}, function(arr, data) {
		res.json({users: arr});
	});
};

exports.detail = function(req, res, next, User) {
	var id = req.params.id;
	var user = User.findById(id, function(user) {
		res.json(user);
	});
};

exports.create = function(req, res, next, User) {
	User.create(req.body, function(e, user) {
		res.json(user);
	});
};
