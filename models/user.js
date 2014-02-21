exports.build = function(mongoose) {
	var name = 'User';
	var schema = mongoose.Schema({
		username: String,
		realname: String,
		avatar: String,
		score: Number,
		playlist: {type: mongoose.Schema.Types.ObjectId, ref: 'Playlist'},
		urls: [{
			name: String,
			url: String
		}]
	});

	return mongoose.model(name, schema);
}
