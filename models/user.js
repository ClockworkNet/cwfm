exports.build = function(mongoose) {
	var name = 'User';
	var schema = mongoose.Schema({
		username: String,
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
		}
	});

	return mongoose.model(name, schema);
}
