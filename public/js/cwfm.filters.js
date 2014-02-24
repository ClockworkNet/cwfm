angular.module( 'cwfmFilters', [] )
.filter( 'time', function( ) {
    return function( input ) {
        var pad      =  function( n ) { return n < 10 ? '0' + n : n; }
        var time     =  parseInt( input );
        var hours    =  Math.floor( time / 3600 );
        var minutes  =  Math.floor( time / 60 ) - ( hours * 3600 );
        var seconds  =  time - ( hours * 3600 ) - ( minutes * 60 );
        var d        =  new Date( 0, 0, 0, hours, minutes, seconds );
        if ( hours ) return pad( hours ) + ':' + pad( minutes ) + ':' + pad( seconds );
        return  pad( minutes ) + ':' + pad( seconds );
    };
}).
filter( 'checkmark', function( ) {
    return function( input ) {
        return input ? '\u2713' : '\u2718';
    };
});
