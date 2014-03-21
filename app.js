var config         = require('./config').settings;
var express        = require('express');
var http           = require('http');
var path           = require('path');
var logger         = require('morgan');
var io             = require('socket.io');
var fs             = require('fs');
var mm             = require('musicmetadata');
var encrypt        = require('sha1');
var Cookies        = require('cookies');

var app    = express();
var server = http.createServer(app);
var io     = require('socket.io').listen(server);

app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use('/public', express.static(path.join(__dirname, 'public')));
app.use(logger('dev'));
app.use(Cookies.express(config.cookieKeys));
app.use(require('static-favicon')());
app.use(require('body-parser')());
app.use(require('method-override')());


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

	var loadUser = controllers.auth.loadUser;
	var restrict = controllers.auth.restrict;

	// Public Avatars API
	app.get('/avatar/list'             , controllers.avatar.list);
	app.get('/avatar/user/:username'   , controllers.avatar.user);
	app.get('/avatar/:name'            , controllers.avatar.show);
	app.get('/avatar/'                 , controllers.avatar.show);

	// Public views 
	app.get('/'                        , loadUser, controllers.home.home);
	app.get('/room'                    , loadUser, controllers.home.room);

	// Public Room API
	app.get('/room/list'               , controllers.room.list);
	app.get('/room/detail/:abbr'       , controllers.room.detail);

	// Public User API
	app.post('/user/create'            , controllers.user.create);
	app.post('/user/login'             , controllers.auth.login);

	// Restricted Routes

	// Restricted User API
	app.get('/user'                    , restrict, controllers.user.list);
	app.get('/user/list'               , restrict, controllers.user.list);
	app.get('/user/detail/:username'   , restrict, controllers.user.detail);
	app.get('/user/me'                 , restrict, controllers.user.me);
	app.post('/user/update'            , restrict, controllers.user.update);
	app.post('/user/logout'            , restrict, controllers.auth.logout);

	// Restricted Song API
	app.get('/song/search'             , restrict, controllers.song.search);
	app.get('/song/detail/:id'         , restrict, controllers.song.detail);
	app.get('/song/:id'                , restrict, controllers.song.stream);
	app.post('/song/scan'              , restrict, controllers.song.scan);

	// Restricted Playlist API
	app.get('/playlist/list'           , restrict, controllers.playlist.list);
	app.get('/playlist/detail/:id'     , restrict, controllers.playlist.detail);
	app.post('/playlist/create'        , restrict, controllers.playlist.create);
	app.delete('/playlist/delete/:id'  , restrict, controllers.playlist.delete);
	app.post('/playlist/select/:id'    , restrict, controllers.playlist.select);
	app.post('/playlist/update/:id'    , restrict, controllers.playlist.update);

	// Restricted Room API
	app.post('/room/create'            , restrict, controllers.room.create);
	app.post('/room/delete/:abbr'      , restrict, controllers.room.delete);
	app.post('/room/join/:abbr'        , restrict, controllers.room.join);
	app.post('/room/dj/:abbr'          , restrict, controllers.room.dj);
	app.post('/room/undj/:abbr'        , restrict, controllers.room.undj);
	app.post('/room/skip/:abbr'        , restrict, controllers.room.skip);
	app.post('/room/upvote/:abbr'      , restrict, controllers.room.upvote);
	app.post('/room/downvote/:abbr'    , restrict, controllers.room.downvote);

	// Restricted Chat API
	app.get('/chat/list/:abbr'         , restrict, controllers.chat.list);
	app.post('/chat/say/:abbr'         , restrict, controllers.chat.say);

	console.log("Routes registered");

	// Sockets
	console.log("Setting up session sockets");

	io.sockets.on('connection', function(socket) {
		socket.cookies = new Cookies(socket.request, {}, config.cookieKeys);
		console.info('socket connected', socket.id);

		controllers.auth.loadUserOnSocket(socket, function(e, socket) {
			if (e) {
				console.error("Error loading user on socket", e);
				return;
			}
			socket.on('listen', inject(controllers.room.listen, socket));
			socket.on('leave', inject(controllers.room.leave, socket));
			socket.on('disconnect', inject(controllers.room.exit, socket));
		});
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

	server.listen(app.get('port'), function(){
		console.log('Express server listening on port', app.get('port'));
		registerRoutes();
	});
});
