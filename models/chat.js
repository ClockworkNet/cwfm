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
		},
    msg_type: {
      type: String,
      default: 'message'
    }
	});

	return mongoose.model(name, schema);
}
