if ( typeof cwfm == 'undefined' ) var cwfm  =  {};

cwfm.user = {};

cwfm.user.ctrl  =  function( $scope, $http, $user ) {

	$scope.me         = $user.get();
	$scope.avatarUrls = [];

	$scope.adminMessage = '';

	$user.change(function(user) {
		$scope.me = user;
	});

	var init  =  function( ) {
		$scope.loadMe();
	};

	var setUser = function(rsp) {
		$user.set(rsp);
	};

	var handleSuccess = function(o) {
		$scope.message = o;
	};

	var handleError = function(e) {
		console.error("Error occurred", e);
		$scope.message = e;
	};

	$scope.loadMe  =  function() {
		$http.get('/user/me')
		.success(setUser)
		.error(handleError);
	};

	$scope.createUser  =  function( ) {
		$http.post('/user/create', $scope.newUser)
		.success(setUser)
		.error(handleError);
	}

	$scope.login  =  function( ) {
		$http.post('/user/login', $scope.me)
		.success(function(user) {
			setUser(user);
			$user.trigger('login');
		})
		.error(handleError);
	};

	$scope.logout  =  function( ) {
		$http.post('/user/logout', {})
		.success(function(user) {
			setUser(user);
			$user.trigger('logout');
		})
		.error(handleError);
	}

	$scope.loadAvatars = function() {
		if ($scope.avatarUrls.length > 0) return;

		$http.get('/avatar/list')
		.success(function(urls) {
			$scope.avatarUrls = urls;
		});
	};

	$scope.selectAvatar = function(url) {
		$scope.me.avatar = url;
	};

	$scope.save = function() {
		$http.post('/user/update', $scope.me)
		.success(setUser)
		.error(handleError);
	};

	// Admin functions
	$scope.adminify = function() {
		$http.post('/user/adminify', {
			username: $scope.user.username,
			demoted: false 
		})
		.success(handleSuccess)
		.error(handleError);
	};

	$scope.demote = function() {
		$http.post('/user/adminify', {
			username: $scope.user.username,
			demoted: true
		})
		.success(handleSuccess)
		.error(handleError);
	};

	$scope.boot = function() {
		$http.post('/user/boot', {username: $scope.user.username})
		.success(handleSuccess)
		.error(handleError);
	};

	init( );
};
