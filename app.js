var config         = require('./config').settings;
var express        = require('express');
var http           = require('http');
var path           = require('path');
var logger         = require('morgan');
var io             = require('socket.io');
var fs             = require('fs');
var mm             = require('musicmetadata');
var encrypt        = require('sha1');

var SessionSockets = require('session.socket.io');
var cookieParser   = require('cookie-parser')(config.cookieSecret);
var cookieSession  = require('express-session')({key: config.sessionKey});

var app    = express();
var router = express.Router();

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(require('static-favicon')());
app.use(require('body-parser')());
app.use(require('method-override')());
app.use(cookieParser);
app.use(cookieSession);
app.use('/public', express.static(path.join(__dirname, 'public')));
app.use(router);

var registerRoutes = function() {

	var inject = require('./util/inject');

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
		avatar: new routes.avatar(config.avatar, fs, path, User),
		chat: new routes.chat(Room, User, Chat, io),
		playlist: new routes.playlist(Playlist, Song, User)
	};

	var secure = controllers.user.verify;

	router.get('/', controllers.home.home);
	router.get('/room', controllers.home.room);

	router.get('/user', secure, controllers.user.list);
	router.get('/user/list', secure, controllers.user.list);
	router.get('/user/detail/:username', secure, controllers.user.detail);
	router.get('/user/me', secure, controllers.user.me);
	router.post('/user/create', controllers.user.create);
	router.post('/user/login', controllers.user.login);
	router.post('/user/logout', secure, controllers.user.logout);
	router.post('/user/update', secure, controllers.user.update);

	router.get('/avatar/list', controllers.avatar.list);
	router.get('/avatar/user/:username', controllers.avatar.user);
	router.get('/avatar/:name', controllers.avatar.show);
	router.get('/avatar/', controllers.avatar.show);

	router.get('/song/search', secure, controllers.song.search);
	router.get('/song/detail/:id', secure, controllers.song.detail);
	router.get('/song/:id', secure, controllers.song.stream);
	router.post('/song/scan', secure, controllers.song.scan);

	router.get('/playlist/list', secure, controllers.playlist.list);
	router.get('/playlist/detail/:id', secure, controllers.playlist.detail);
	router.post('/playlist/create', secure, controllers.playlist.create);
	router.delete('/playlist/delete/:id', secure, controllers.playlist.delete);
	router.post('/playlist/select/:id', secure, controllers.playlist.select);
	router.post('/playlist/update/:id', secure, controllers.playlist.update);

	router.get('/room/list', controllers.room.list);
	router.get('/room/detail/:abbr', controllers.room.detail);
	router.post('/room/create', secure, controllers.room.create);
	router.post('/room/delete/:abbr', secure, controllers.room.delete);
	router.post('/room/join/:abbr', secure, controllers.room.join);
	router.post('/room/dj/:abbr', secure, controllers.room.dj);
	router.post('/room/undj/:abbr', secure, controllers.room.undj);
	router.post('/room/skip/:abbr', secure, controllers.room.skip);
	router.post('/room/upvote/:abbr', secure, controllers.room.upvote);
	router.post('/room/downvote/:abbr', secure, controllers.room.downvote);

	router.get('/chat/list/:abbr', secure, controllers.chat.list);
	router.post('/chat/say/:abbr', secure, controllers.chat.say);

	console.log("Routes registered");

	console.log("Setting up session sockets");
	var sessionSockets = new SessionSockets(io, cookieSession, cookieParser, config.sessionKey);
	sessionSockets.on('connection', function(e, socket, session) {
		if (e) {
			console.trace("Error connecting socket", e);
			return;
		}
		socket.on('listen', inject(controllers.room.listen, socket, session));
		socket.on('leave', inject(controllers.room.leave, socket, session));
		socket.on('disconnect', inject(controllers.room.exit, socket, session));
	});

	console.log("Ready!");
};


// Set up the database connection. Once the connection is established,
// we can generate the routes for all of the API calls.
var mongoose = require('mongoose');
mongoose.connect(config.database);

var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));

db.on('open', function() {

	console.log("Connected to mongodb");

	var server = http.createServer(app);

	io = io.listen(server);

	server.listen(app.get('port'), function(){
	  console.log('Express server listening on port', app.get('port'));
	  registerRoutes();
	});
});
