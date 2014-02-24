if ( typeof cwfm == 'undefined' ) var cwfm  =  {};

cwfm.roomlist = {};

cwfm.roomlist.ctrl  =  function( $scope, $http, $user ) {

	$scope.rooms  =  [];
	$scope.user   =  {};

	$user.change(function(user) {
		$scope.user = user;
	});

	var init  =  function( ) {
		$scope.load_rooms();
	};

	var set_rooms = function( rsp ) {
		$scope.rooms = rsp && rsp.rooms ? rsp.rooms : [];
	};

	$scope.load_rooms  =  function( ) {
		$http.get('/room/list').success(set_rooms);
	};

	$scope.make_room  =  function( ) {
		$http.post( '/room/create', $scope.new_room, set_rooms );
	}

	init( );
};
