if ( typeof cwfm == 'undefined' ) var cwfm  =  {};

cwfm.roomlist = {};

cwfm.roomlist.ctrl  =  function( $scope, $http, $user ) {

	$scope.rooms  =  [];
	$scope.user   =  $user.get();

	$user.change(function(user) {
		$scope.user = user;
	});

	var init  =  function( ) {
		$scope.load_rooms();
	};

	var handle_error = function(e) {
		console.error(e);
	};

	var set_rooms = function( rsp ) {
		console.info(rsp);
		$scope.rooms = rsp && rsp.rooms ? rsp.rooms : [];
	};

	$scope.load_rooms  =  function( ) {
		$http.get('/room/list')
			.success(set_rooms);
	};

	$scope.make_room  =  function( ) {
		$http.post('/room/create', $scope.new_room)
			.success(set_rooms)
			.error(handle_error);
	}

	$scope.delete_room = function(room) {
		$http.post('/room/delete/' + room.abbr, {})
			.success(set_rooms)
			.error(handle_error);
	}

	init( );
};
