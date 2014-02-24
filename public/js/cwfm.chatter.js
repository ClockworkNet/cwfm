if ( typeof cwfm == 'undefined' ) var cwfm  =  {};

cwfm.chatter  =  { };

cwfm.chatter.ctrl  =  function( $scope, $http, $roomservice ) {

    $scope.polling  =  1000;
    $scope.last_id  =  0;

    var refresh  =  function( ) {
        var apiurl   =  '/api/chatter/' + $roomservice.get_name( ) + '/' + $scope.last_id;
        var request  =  $http.get( apiurl );

        request.success( function( rsp ) {
            for (var i=0; i<rsp.length; i++) {
                $scope.add_message(rsp[i]);
            }
            setTimeout( refresh, $scope.polling );
        });

        request.error( function( rsp ) {
            console.error(rsp);
        });
    };

    $scope.sorted  =  function() {
        if ( ! $scope.messages ) return [];
        return $scope.messages.sort(function(a, b) {
            return b.time - a.time;
        });
    };

    $scope.add_message  =  function( o ) {
        if (! o || ! o.message) return;
        if (!$scope.messages) $scope.messages = [];
        $scope.messages[o.id]  =  o;
        if (o.id > $scope.last_id) {
            $scope.last_id  =  o.id;
        }
    };

    $scope.send  =  function( ) {
        var apiurl  = '/api/say/' + $roomservice.get_name( );
        $http({
            method : 'POST'
            , url  : apiurl
            , data : $.param( { 'message' : $scope.message } )
            , headers : {'Content-Type': 'application/x-www-form-urlencoded'}
        }).success( function( rsp ) {
            $scope.message  =  '';
        });
    };

    refresh( );
};
