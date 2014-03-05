if ( typeof cwfm == 'undefined' ) var cwfm  =  {};

cwfm.playlist       =  {};
cwfm.playlist.ctrl  =  function( $scope, $http, $socket, $util, $room, $user ) {

	var minQueryLength  = 3;
	var searchRequest   = null;
	var searchThrottle  = 200;

	$scope.me           = $user.get();
	$scope.playlists    = [];
	$scope.room         = $room.get();
	$scope.result       = {};
	$scope.new_playlist = {};
	$scope.message      = '';

	$http.get('/playlist/list')
	.success(function(playlists) {
		$scope.playlists = playlists;
	});

	$user.change(function(user) {
		$scope.me = user;
		$scope.select(user.playlist);
	});

	$room.change(function(room) {
		$scope.room = room;
	});

	$socket.on('song.changed', function(song) {
		if (!$scope.me.playlist) return;

		var meId = $scope.me._id;
		$scope.room.djs.some(function(dj) {
			var djId = dj._id ? dj._id : dj;
			// If you're a DJ, let's refresh your playlist
			if (meId == djId) {
				$scope.load();
				return true;
			}
			return false;
		});
	});

	$scope.load = function(playlist) {
		if (!playlist) playlist = $scope.me.playlist;
		if (!playlist) return;

		var plid = playlist._id ? playlist._id : playlist;

		$http.get('/playlist/detail/' + plid)
		.success(function(playlist) {
			$scope.me.playlist = playlist;
		});
	};

	$scope.select = function(playlist) {
		if (!playlist) return;
		$http.post('/playlist/select/' + playlist._id)
		.success(function(playlist) {
			$scope.me.playlist = playlist;
		})
		.error(function(e) {
			$scope.message = e;
		});
	};

	$scope.search = function() {
		if ($scope.query.length < minQueryLength) {
			return;
		}

		if (this.searchRequest) {
			// If a search is already running, delay the next call
			setTimeout($scope.search, this.searchThrottle);
			console.info('throttling search');
		}

		var data = $util.querystring.encode({q: $scope.query});
		var url  = '/song/search/?' + data;
		searchRequest = $http.get(url);

		searchRequest.success(function(result) {
			console.info(url, result);
			$scope.result = result;
			searchRequest = null;
		});

		searchRequest.error(function(e) {
			$scope.message = e;
			searchRequest = null;
		});
	};

	$scope.clearSearch = function() {
		$scope.query = '';
		$scope.result = [];
	};

	$scope.add = function(song) {
		if (!$scope.me.playlist) {
			$scope.message = {error: "Select a playlist first"};
			return;
		}
		if (!$scope.me.playlist.songs) {
			$scope.me.playlist.songs = [];
		}
		$scope.me.playlist.songs.unshift(song);
		$scope.save();
	};

	$scope.save = function() {
		if (!$scope.me.playlist) {
			$scope.message = {error: "Select a playlist first"};
			return;
		}
		$http.post('/playlist/update/' + $scope.me.playlist._id, $scope.me.playlist)
		.success(function(playlist) {
			$scope.message = {info: "Saved playlist!"};
		})
		.error(function(e) {
			console.error('error saving playlist', e);
			$scope.message = e;
		});
	};

	$scope.create = function() {
		$http.post('/playlist/create', $scope.new_playlist)
		.success(function(playlist) {
			$scope.playlists.unshift(playlist);
			$scope.me.playlist = playlist;
			$scope.message = {};
		})
		.error(function(e) {
			console.error('error', e);
			$scope.message = e;
		});
	};

	$scope.songName = function(song) {
		if (song.title) {
			return song.title;
		}
		if (song.path) {
			var slash = song.path.lastIndexOf('/');
			var dot   = song.path.lastIndexOf('.');
			return song.path.substr(slash + 1, dot - slash - 1);
		}
		return song._id;
	};

	$scope.notInPlaylist = function(song) {
		return ! $scope.inPlaylist(song);
	};

	$scope.inPlaylist = function(song) {
		if (!$scope.me.playlist || !$scope.me.playlist.songs) return false;
		return $scope.me.playlist.songs.some(function(ps) {
			return ps._id == song._id;
		});
	};

	$scope.active = function(playlist) {
		return $scope.me.playlist && playlist._id == $scope.me.playlist._id;
	};
}
