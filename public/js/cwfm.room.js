if ( typeof cwfm == 'undefined' ) var cwfm  =  {};

cwfm.room  =  { ping: 1000 };

// Connects to the server via a socket and monitors all of the changes to the room
cwfm.room.service = function($socket) {

	var room = {};
	var listeners = {};

	return {
		on: function ( key, func, ctx ) {
			if ( ! listeners[ key ] ) listeners[ key ]  =  [];
			var listener  =  ( ctx ) ? function( ) { func.call( ctx, arguments ); } : func;
			listeners[ key ].push( listener ); 
		}
		, trigger: function ( key, args ) {
			console.info('room event triggered', key, args);
			if ( ! listeners[ key ] ) return;
			angular.forEach( listeners[ key ], function( func ) {
				func.apply( args );
			} );
		}
		, get: function( ) {
			return room;
		}
		, set: function(data) {
			room = typeof(data) == 'object' ? data : {};
			this.trigger('change', [room]);
		}
		, get_name: function( ) {
			return location.search.substr( 0 );
		}
	}
};
