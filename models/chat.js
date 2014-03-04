exports.build = function(mongoose, config) {
	var name = 'Chat';
	var schema = mongoose.Schema({
		author: { 
			type: mongoose.Schema.Types.ObjectId, 
			ref: 'User' 
		},
		room: { 
			type: mongoose.Schema.Types.ObjectId, 
			ref: 'Room' 
		},
		content: String,
		posted: {
			type: Date,
			default: Date.now
		}
	});

	return mongoose.model(name, schema);
}
