if ( typeof cwfm == 'undefined' ) var cwfm  =  {};

cwfm.player = {};

cwfm.player.ctrl = function($scope, $http, $socket, $room) {
	$scope.room = {};
	$scope.song = {};

	// Wrapper for calling jPlayer functions
	$scope.player = function() {
		$.fn.jPlayer.apply( $('#jplayer'), arguments );
	}

	$scope.player({canplay: $scope.playSong});


	$room.change(function(room) {
		$scope.room = room;
		$scope.song = room.song;
	});

	$socket.on('song', function(song) {
		$scope.song = song;
		if (!$scope.muted) {
			$scope.playSong();
		}
		else {
			$scope.player('clearMedia');
		}
	});

	var get_filetype  =  function( path ) {
		var ext  =  path.substr( path.lastIndexOf( '.' ) + 1 );
		switch ( ext ) {
			case 'mp3':
				return 'mp3';
			case 'mp4':
			case 'aac':
				return 'mp4';
			case 'ogg':
				return 'oga';
			case 'fla':
			case 'flv':
				return 'fla';
			case 'wav':
				return 'wav';
			default:
				return 0
		}
	};

	$scope.stopSong = function( ) {
		$scope.player( 'stop' );
	};

	$scope.playSong = function( ) {
		if (!$scope.song) return;
		var type = get_filetype(path);
		var data = {
			path: $scope.song.path,
			type: get_filetype($scope.song.path)
		};
		$scope.player('setMedia', data);
	};

	$scope.song_title  =  function( ) {
		var song  =  $scope.song;
		if ( ! song ) return '...';
		if ( song.title != '' ) return song.title;
		var path  =  song.relpath;
		return path;
	};

	$scope.song_played  =  function( ) {
		var song  =  $scope.room.song;
		if ( ! song || ! song.length ) return 0;
		var now  =  Date.now() / 1000.0;
		return now - song.started;
	};

	$scope.song_remaining  =  function( ) {
		var song  =  $scope.room.song;
		if ( ! song || ! song.length ) return 0;
		var now  =  Date.now() / 1000.0;
		var end  =  song.started + song.length;
		return end - now;
	};

	$scope.toggle_muting  =  function( ) {
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
};
