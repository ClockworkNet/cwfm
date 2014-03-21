module.exports = function(config, User, Auth) {

	var userIdKey = config.userIdKey;
	var userTokenKey = config.userAuthTokenKey;

	var clearUser = function(res) {
		res.cookies.set(userIdKey, null);
		res.cookies.set(userTokenKey, null);
	};

	var setUser = function(res, user) {
		user.createAuthToken();
		console.info("Setting user credentials in cookie", user._id, user.authToken);
		res.cookies.set(userIdKey, user._id);
		res.cookies.set(userTokenKey, user.authToken);
		user.save();
	};

	this.loadUserOnSocket = function(socket, next) {
		next = next || function() {};
		socket.user = null;

		if (!socket.cookies) {
			console.info("Could not load user on socket", e, socket.cookies);
			return next(new Error("Cookies not found on socket"), socket);
		}

		var uid = socket.cookies.get(userIdKey);
		var ut = socket.cookies.get(userTokenKey);

		if (!uid || !ut) {
			console.info("No cookie information available");
			return next(null, socket);
		}

		User.findById(uid)
		.populate('playlist')
		.exec(function(e, user) {
			if (e || ! user) {
				console.trace("Error finding user", uid, e);
				return next(new Error("Could not find user " + uid), socket);
			}
			if (!user.authToken || user.authToken != ut) {
				console.error("Invalid credentials", user);
				return next(new Error("Invalid credentials for user " + uid), socket);
			}
			socket.user = user;
			next(null, socket);
		});
	};

	var loadUser = this.loadUser = function(req, res, next) {
		next = next || function() {};

		if (req.user) {
			return next();
		}

		var uid = req.cookies.get(userIdKey);
		var ut = req.cookies.get(userTokenKey);

		if (!uid || !ut) {
			clearUser(res);
			console.info("Invalid auth", uid, ut);
			return next();
		}

		User.findById(uid)
		.populate('playlist')
		.exec(function(e, user) {
			if (e || ! user) {
				clearUser(res);
				console.error("Could not find user", uid);
				return next();
			}
			if (!user.authToken || user.authToken != ut) {
				clearUser(res);
				console.error("Invalid credentials", user);
				return next();
			}
			req.user = user;
			return next();
		});
	};

	this.restrict = function(req, res, next) {
		loadUser(req, res, function() {
			if (!req.user) {
				console.info("No user found for secure request");
				return res.jsonp(401, {error: "Please log in"});
			}
			return next();
		});
	};

	this.login = function(req, res, next) {
		var password = req.body.password;
		User.findOne({username: req.body.username})
		.populate('auth playlist')
		.exec(function(e, user) {
			if (e) {
				console.trace("Error on login", e, req.body.username);
				return res.jsonp(500, {error: "Error logging in"});
			}

			if (!user) {
				console.info("Invalid username", req.body.username);
				clearUser(res);
				return res.jsonp(401, {error: "Bad credentials"});
			}

			var auth = user.auth;

			if (!auth) {
				console.error("Missing authentication mechanisim for user", user);
				return res.jsonp(401, {error: "Bad credentials"});
			}

			if (auth.isLocked()) {
				res.jsonp(401, {error: "Maximum login attempts exceeded"});
			}
			else {
				auth.resetLock();
			}

			if (auth.matches(password)) {
				// Succsessful login. Reset failures, last login, password hash, and the salt.
				auth.password = password;
				auth.lastLogin = Date.now();
				auth.failures  = 0;
				auth.save();

				setUser(res, user);
				res.jsonp(user);
			}
			else {
				auth.failures++;
				auth.lastFailure = Date.now();
				auth.save();
				clearUser(res);
				res.jsonp(401, {error: "Bad credentials"});
			}
		});
	};

	this.logout = function(req, res, next) {
		clearUser(res);
		if (!req.user) return res.jsonp({});
		User.update({lastLogout: Date.now(), authToken: null}, {_id: req.user._id}, function(e, n) {
			return res.jsonp({});
		});
	};
};
