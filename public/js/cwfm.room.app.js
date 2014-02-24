var cwfmApp = angular.module( 'cwfmApp', [ 'cwfmFilters' ] );

cwfmApp
    .service( '$roomservice', cwfm.room.service )
    .controller( 'cwfmUserCtrl', [ '$scope', '$http', cwfm.user.ctrl ] )
    .controller( 'cwfmRoomListCtrl', [ '$scope', '$http', '$roomservice', cwfm.roomlist.ctrl ] )
    .controller( 'cwfmRoomCtrl', [ '$scope', '$http', '$roomservice', cwfm.room.ctrl ] )
    .controller( 'cwfmPlaylistCtrl', [ '$scope', '$http', '$roomservice', cwfm.playlist.ctrl ] )
    .controller( 'cwfmChatterCtrl', [ '$scope', '$http', '$roomservice', cwfm.chatter.ctrl ] )
;
