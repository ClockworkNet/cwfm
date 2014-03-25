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

	this.search = function(req, res, next) {
		var terms = null;
		try {
			terms = new RegExp(req.query.q, 'i');
		}
		catch (e) {
			console.trace("Received weird search", req.query, e);
			return res.jsonp([]);
		}

		var fields = ['username', 'realname'];

		var like = [];
		fields.forEach(function(field) {
			var c = {};
			c[field] = terms;
			like.push(c);
		});

		var query = User.where({$or: like})

		query.exec(function(e, a) {
			if (e) {
				console.trace("Error searching users", e, query);
				return res.jsonp(500, {error: "Error searching users"});
			}
			res.jsonp({users: a});
		});
	};

	this.me = function(req, res, next) {
		var user = req.user || {};
		return res.jsonp(user);
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

	this.boot = function(req, res, next) {
		var un = req.body.username;
		User.update({username: un}, {authToken: null}, function(e, c) {
			if (e) {
				console.trace("Error updating user", un, e);
				return res.jsonp(500, {error: "Error booting user"});
			}
			if (c < 1) {
				return res.jsonp(404, {error: "User not found"});
			}
			return res.jsonp({info: "User booted"});
		});
	};

	this.adminify = function(req, res, next) {
		var un  = req.body.username;
		var set = req.body.demoted ? false : true;
		User.update({username: un}, {admin: set}, function(e, c) {
			if (e) {
				console.trace("Error updating user", un, e);
				return res.jsonp(500, {error: "Error updating user"});
			}
			if (c < 1) {
				return res.jsonp(404, {error: "User not found"});
			}
			return res.jsonp({info: "User updated"});
		});
	};
};
