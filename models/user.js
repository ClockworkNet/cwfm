exports.build = function(mongoose) {
	var name = 'User';
	var schema = mongoose.Schema({
		username: {
			type: String,
			unique: true
		},
		admin: Boolean,
		realname: String,
		avatar: String,
		urls: [{
			name: String,
			url: String
		}],
		authType: String,
		auth: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'Auth'
		},
		score: Number,
		playlist: {
			type: mongoose.Schema.Types.ObjectId, 
			ref: 'Playlist'
		},
		socketId: String 
	});

	var blacklist = ['username', 'admin', 'authType', 'auth', 'score', 'playlist', 'socketId'];

	schema.methods.toJSON = function() {
		var obj  = this.toObject();
		obj.auth = true;
		return obj;
	};

	// Helper method to prevent tampering with important bits
	schema.methods.merge = function(data) {
		for (var key in data) {
			if (!data.hasOwnProperty(key)) continue;
			if (blacklist.indexOf(key) >= 0) continue;
			this[key] = data[key];
		}
		return this;
	};

	return mongoose.model(name, schema);
}
