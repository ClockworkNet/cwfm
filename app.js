var config         = require('./config').settings;
var express        = require('express');
var http           = require('http');
var path           = require('path');
var logger         = require('morgan');
var io             = require('socket.io');
var fs             = require('fs');
var mm             = require('musicmetadata');
var encrypt        = require('sha1');
var cookies        = require('cookies').express(config.cookieKeys);

var app    = express();
var router = express.Router();

app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use('/public', express.static(path.join(__dirname, 'public')));
app.use(logger('dev'));
app.use(cookies);
app.use(require('static-favicon')());
app.use(require('body-parser')());
app.use(require('method-override')());

var server = http.createServer(app);

var registerRoutes = function() {

	var inject = require('./lib/util').inject;

	console.log("Building models");
	var Auth     = require('./models/auth').build(mongoose, encrypt, config);
	var User     = require('./models/user').build(mongoose);
	var Song     = require('./models/song').build(mongoose);
	var Playlist = require('./models/playlist').build(mongoose);
	var Room     = require('./models/room').build(mongoose, config);
	var Chat     = require('./models/chat').build(mongoose, config);

	console.log("Loading routes");
	var routes = {
		home: require('./routes/home'),
		room: require('./routes/room'),
		song: require('./routes/song'),
		user: require('./routes/user'),
		auth: require('./routes/auth'),
		avatar: require('./routes/avatar'),
		chat: require('./routes/chat'),
		playlist: require('./routes/playlist')
	};

	console.log("Loading controllers");
	var controllers = {
		home: new routes.home(Room, User),
		room: new routes.room(Room, User, Playlist, Song, io),
		song: new routes.song(config.songDir, Song, User, fs, path, mm),
		user: new routes.user(User, Auth),
		auth: new routes.auth(config, User, Auth),
		avatar: new routes.avatar(config.avatar, fs, path, User),
		chat: new routes.chat(Room, User, Chat, io),
		playlist: new routes.playlist(Playlist, Song, User)
	};

	// Make sure the user is loaded on these requests
	router.use(controllers.auth.loadUser);

	// Public views 
	router.get('/', controllers.home.home);
	router.get('/room', controllers.home.room);

	// Public Room API
	router.get('/room/list', controllers.room.list);
	router.get('/room/detail/:abbr', controllers.room.detail);

	// Public User API
	router.post('/user/create', controllers.user.create);
	router.post('/user/login', controllers.auth.login);

	// Public Avatars API
	router.get('/avatar/list', controllers.avatar.list);
	router.get('/avatar/user/:username', controllers.avatar.user);
	router.get('/avatar/:name', controllers.avatar.show);
	router.get('/avatar/', controllers.avatar.show);


	// Restrict some routes
	var restrict = controllers.auth.restrict;

	// Restricted User API
	router.use('/user', restrict);
	router.get('/user', controllers.user.list);
	router.get('/user/list', controllers.user.list);
	router.get('/user/detail/:username', controllers.user.detail);
	router.get('/user/me', controllers.user.me);
	router.post('/user/update', controllers.user.update);
	router.post('/user/logout', controllers.auth.logout);

	// Restricted Song API
	router.use('/song', restrict);
	router.get('/song/search', controllers.song.search);
	router.get('/song/detail/:id', controllers.song.detail);
	router.get('/song/:id', controllers.song.stream);
	router.post('/song/scan', controllers.song.scan);

	// Restricted Playlist API
	router.use('/playlist', restrict);
	router.get('/playlist/list', controllers.playlist.list);
	router.get('/playlist/detail/:id', controllers.playlist.detail);
	router.post('/playlist/create', controllers.playlist.create);
	router.delete('/playlist/delete/:id', controllers.playlist.delete);
	router.post('/playlist/select/:id', controllers.playlist.select);
	router.post('/playlist/update/:id', controllers.playlist.update);

	// Restricted Room API
	router.use('/room', restrict);
	router.post('/room/create', controllers.room.create);
	router.post('/room/delete/:abbr', controllers.room.delete);
	router.post('/room/join/:abbr', controllers.room.join);
	router.post('/room/dj/:abbr', controllers.room.dj);
	router.post('/room/undj/:abbr', controllers.room.undj);
	router.post('/room/skip/:abbr', controllers.room.skip);
	router.post('/room/upvote/:abbr', controllers.room.upvote);
	router.post('/room/downvote/:abbr', controllers.room.downvote);

	// Restricted Chat API
	router.use('/chat', restrict);
	router.get('/chat/list/:abbr', controllers.chat.list);
	router.post('/chat/say/:abbr', controllers.chat.say);

	console.log("Routes registered");

	// Sockets
	console.log("Setting up session sockets");

	var SocketCookies = require('./lib/cookies.socket.io'),
		socketCookies = new SocketCookies(io, cookies);

	io.sockets.on('connection', function(socket) {
		socketCookies.attach(socket, controllers.auth.loadUserOnSocket);
		socket.on('listen', inject(controllers.room.listen, socket));
		socket.on('leave', inject(controllers.room.leave, socket));
		socket.on('disconnect', inject(controllers.room.exit, socket));
	});

	console.log("Socket routing registered");
};


// Set up the database connection. Once the connection is established,
// we can generate the routes for all of the API calls.
var mongoose = require('mongoose');
mongoose.connect(config.database);

var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));

db.on('open', function() {

	console.log("Connected to mongodb");

	io = io.listen(server);

	server.listen(app.get('port'), function(){
		console.log('Express server listening on port', app.get('port'));
		registerRoutes();
		app.use(router);
	});
});
