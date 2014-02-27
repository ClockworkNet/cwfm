if ( typeof cwfm == 'undefined' ) var cwfm  =  {};

cwfm.playlist       =  {};
cwfm.playlist.ctrl  =  function( $scope, $http, $socket, $room, $user ) {

	$scope.me   = $user.get();
	$scope.room = $room.get();

	$user.change(function(user) {
		$scope.me = user;
	});

	$room.change(function(room) {
		$scope.room = room;
	});
}
