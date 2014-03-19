module.exports = function(User, Auth) {
	this.list = function(req, res, next){
		User.find({}, function(e, arr) {
			res.jsonp({users: arr});
		});
	};

	this.detail = function(req, res, next) {
		User.findOne({username: req.params.username}, function(e, user) {
			if (e) {
				console.trace(e);
				return res.jsonp(500, {error: "Error getting detail"});
			}
			res.jsonp(user);
		});
	};

	this.me = function(req, res, next) {
		return res.jsonp(req.user);
	};

	this.create = function(req, res, next) {
		var data = req.body;

		if (data.password1 !== data.password2) {
			res.jsonp({error: "Passwords don't match"});
		}

		var auth = new Auth();
		auth.password = data.password1;
		auth.save(function(e) {
			if (e) {
				console.trace("Error saving auth", e);
				return res.jsonp(500, {error: "Error saving credentials"});
			}
		});

		var user = new User(data);
		user.auth = auth._id;

		User.count({admin: true}, function(e, c) {
			if (c == 0) user.admin = true;
			user.save(function(e) {
				if (e) {
					console.trace(e);
					return res.jsonp(500, {error: "Error saving new account"});
				}
				req.user = user;
				return res.jsonp(user);
			});
		});
	};

	this.update = function(req, res, next) {
		User.findById(req.user._id, function(e, user) {
				if (e) {
					console.trace("Error finding user", user, e);
					return res.jsonp(404, {error: e});
				}
			user.merge(req.body);
			user.save(function(e) {
				if (e) {
					console.trace("Error saving user", user, e);
					return res.jsonp(400, {error: e});
				}
				return res.jsonp(user);
			});
		});
	};
};
