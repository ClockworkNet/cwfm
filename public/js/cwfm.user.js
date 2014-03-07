if ( typeof cwfm == 'undefined' ) var cwfm  =  {};

cwfm.user = {};

cwfm.user.ctrl  =  function( $scope, $http, $user ) {

	$scope.avatarUrls = [];

	$user.change(function(user) {
		$scope.user = user;
	});

	var init  =  function( ) {
		$scope.user  = $user.get();
		$scope.error = null;
		$scope.load_me();
	};

	var set_user = function(rsp) {
		$user.set(rsp);
	};

	var oops  =  function(e) {
		console.info(e);
		$scope.error = e.error;
	};

	$scope.load_me  =  function() {
		$http.get('/user/me')
			.success(set_user)
			.error(oops);
	};

	$scope.create_user  =  function( ) {
		$http.post('/user/create', $scope.new_user)
			.success(set_user)
			.error(oops);
	}

	$scope.login  =  function( ) {
		$http.post('/user/login', $scope.user)
		.success(function(user) {
			set_user(user);
			$user.trigger('login');
		})
		.error(oops);
	};

	$scope.logout  =  function( ) {
		$http.post('/user/logout', {})
		.success(function(user) {
			set_user(user);
			$user.trigger('logout');
		})
		.error(oops);
	}

	$scope.loadAvatars = function() {
		if ($scope.avatarUrls.length > 0) return;

		$http.get('/avatar/list')
		.success(function(urls) {
			$scope.avatarUrls = urls;
		});
	};

	$scope.selectAvatar = function(url) {

	};

	init( );
};
