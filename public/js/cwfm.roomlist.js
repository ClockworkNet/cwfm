if ( typeof cwfm == 'undefined' ) var cwfm  =  {};

cwfm.roomlist  =  { poll : 1000 };

cwfm.roomlist.ctrl  =  function( $scope, $http, $roomservice ) {

	var init  =  function( ) {
		setInterval( refresh, cwfm.roomlist.poll );
		$scope.rooms  =  [];
	};

	var refresh  =  function( ) {
		$http.get( '/room/list' ).success( function( rsp ) {
			console.info(rsp);
			$scope.rooms = rsp.rooms;
		} );
	};

	$scope.make_room  =  function( ) {
		$http.post( '/room/create', $scope.new_room );
	}

	$scope.create_user  =  function( ) {
		$http.post( '/user/create', $scope.new_user, function( rsp ) {
			rsp.password = null;
			rsp.salt = null;
			$scope.user = rsp;
		} );
	}

	$scope.login  =  function( ) {
		$http.post( '/user/login', $scope.user );
	};

	init( );
};

angular.module( 'cwfmMainApp', [ 'cwfmFilters' ] )
    .controller( 'cwfmRoomlistCtrl', [ '$scope', '$http', cwfm.roomlist.ctrl ] )
;
