exports.build = function(mongoose) {
	var name = 'Playlist';
	var schema = mongoose.Schema({
		name: String,
		description: String,
		owners: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
		songs: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Song' }]
	});

	return mongoose.model(name, schema);
}
