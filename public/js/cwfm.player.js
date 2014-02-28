if ( typeof cwfm == 'undefined' ) var cwfm  =  {};

cwfm.player = {};

cwfm.player.ctrl = function($scope, $http, $socket, $room, $user) {
	$scope.room = {};
	$scope.me   = {};

	// Wrapper for calling jPlayer functions
	$scope.player = function() {
		$.fn.jPlayer.apply( $('#jplayer'), arguments );
	}

	$scope.player({canplay: $scope.playSong});

	$room.change(function(room) {
		$scope.room = room;
		$scope.playSong();
	});

	$user.change(function(user) {
		$scope.me = user;
	});

	var oops = function(e) {
		console.error(e);
	};

	var addMe = function() {
		$scope.room.djs.push($scope.me);
	};

	var removeMe = function() {
		$scope.room.djs.some(function(dj, ix) {
			if (dj.username == $scope.me.username) {
				$scope.room.djs = $scope.room.djs.splice(ix, 1);
				return true;
			}
			return false;
		});
	};

	$socket.on('song', function(song) {
		$scope.room.song = song;
		if (!$scope.muted) {
			$scope.playSong();
		}
		else {
			$scope.player('clearMedia');
		}
	});

	$scope.djing = function(who) {
		if (!$scope.room || !$scope.room.djs) return false;
		if (!who) who = $scope.me;
		var un = who && who.username ? who.username : who;
		return $scope.room.djs.some(function(dj) {
			return dj.username == un;
		});
	};

	$scope.stopSong = function( ) {
		$scope.player( 'stop' );
	};

	$scope.playSong = function(song) {
		song = song ? song : $scope.song;
		if (!song) return;
		var data = {
			path: '/song/' + song._id,
			type: song.type
		};
		var start = $scope.songPlayed();
		$scope.player('setMedia', data);
		$scope.player('play', start);
	};

	$scope.songPlayed  =  function( ) {
		var song  =  $scope.room.song;
		if ( ! song || ! song.duration ) return 0;
		var now  =  Date.now() / 1000.0;
		return now - song.started;
	};

	$scope.songRemaining  =  function( ) {
		var song  =  $scope.room.song;
		if ( ! song || ! song.duration ) return 0;
		var now  =  Date.now() / 1000.0;
		var end  =  song.started + song.duration;
		return end - now;
	};

	$scope.toggleMuting  =  function( ) {
		if ( $scope.muted ) {
			$scope.stopSong( );
		}
		else {
			$scope.playSong( );
		}
	};

	$scope.not  =  function( func ) {
		return function( item ) {
			return ! func( item );
		};
	};

	$scope.dj = function() {
		$http.post('/room/dj/' + $scope.room.abbr, {})
			.success(addMe);
	};

	$scope.undj = function() {
		$http.post('/room/undj/' + $scope.room.abbr, {})
			.success(removeMe);
	};

	$scope.skipSong = function() {
		$http.post('/room/skip/' + $scope.room.abbr, {});
	};
};
