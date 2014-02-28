if ( typeof cwfm == 'undefined' ) var cwfm  =  {};

cwfm.playlist       =  {};
cwfm.playlist.ctrl  =  function( $scope, $http, $socket, $room, $user ) {

	this.minQueryLength  = 3;
	this.searchRequest   = null;
	this.searchThrottle  = 200;

	$scope.me           = $user.get();
	$scope.playlists    = [];
	$scope.room         = $room.get();
	$scope.results      = [];
	$scope.new_playlist = {};
	$scope.error        = '';

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

	$scope.select = function(playlist) {
		if (!playlist) return;
		$http.post('/playlist/select/' + playlist._id)
		.success(function(playlist) {
			$scope.me.playlist = playlist;
		})
		.error(function(e) {
			$scope.error = e.error;
		});
	};

	$scope.search = function() {
		console.info('kyup', arguments);
		if ($scope.query.length < this.minQueryLength) {
			console.info('tiny');
			return;
		}

		if (this.searchRequest) {
			// If a search is already running, delay the next call
			setTimeout($scope.search, this.searchThrottle);
			console.info('throttling search');
		}

		console.info('searching', $scope.query);
		this.searchRequest = $http.get('/song/search/?q=' + $scope.query);
		this.searchRequest.success(angular.bind(this, function(songs) {
			console.info(songs);
			$scope.results = songs;
			this.searchRequest = null;
		}));
		this.searchRequest.error(angular.bind(this, function(e) {
			$scope.results = [];
			$scope.error = e.error;
			this.searchRequest = null;
		}));
	};

	$scope.save = function() {
		
	};

	$scope.create = function() {
		$http.post('/playlist/create', $scope.new_playlist)
		.success(function(playlist) {
			$scope.playlists.unshift(playlist);
			$scope.me.playlist = playlist;
			$scope.error = '';
		})
		.error(function(e) {
			console.error('error', e);
			$scope.error = e.error;
		});
	};
}
