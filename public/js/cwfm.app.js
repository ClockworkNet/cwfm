angular.module( 'cwfmRoomApp', [ 'cwfmFilters' ] )
    .service( '$roomservice', cwfm.room.service )
    .controller( 'cwfmRoomCtrl', [ '$scope', '$http', '$roomservice', cwfm.room.ctrl ] )
    .controller( 'cwfmPlaylistCtrl', [ '$scope', '$http', '$roomservice', cwfm.playlist.ctrl ] )
    .controller( 'cwfmChatterCtrl', [ '$scope', '$http', '$roomservice', cwfm.chatter.ctrl ] )
;
