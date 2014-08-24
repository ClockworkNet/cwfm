/*!
 * cwfm.song.js
 *
 * Factory for creating song objects.
 */
if ( typeof cwfm == 'undefined' ) var cwfm  =  {};

cwfm.song = {};

cwfm.song.factory = function() {
  // We use two players, one of which is considered active and contains the
  // song that is currently being played. The second player is used for queueing
  // and pre-loading the next song in order to allow for a seamless transition
  // between songs.
	var players  = [Object.create(WaveSurfer), Object.create(WaveSurfer)];
	var active   = 0;
	var defaults = {};
	var onVolume = 1.0;

	var hiddenCss = {opacity: 0.5};
	var shownCss  = {opacity: 1.0};

	var playFile   = '';
	var loadStart  = 0;
	var playSkip   = 0;

  /**
   * Helper function to switch the active player.
   *
   * Whenever we're ready to switch to the next song we need to switch the
   * currently active player to inactive, and make the inactive player active.
   */
	var flipPlayer = function() {
		var other = active ? 0 : 1; 

		angular.element(players[other].drawer.container).css(hiddenCss);
		players[other].empty();

		angular.element(players[active].drawer.container).css(shownCss);
		players[active].play();

		console.info('Playing', playFile, "on player", active);
	};

  var Song = {};

  /**
   * Initialize a new song object.
   *
   * @param containerId
   *   ID of the HTML element that will serve as a container for the song.
   * @param options
   *   A an object containing any additional options to pass to the WaveSurfer
   *   player when it's initialized for this song.
   */
  Song.init = function(containerId, options) {
    options = options ? options : {};
    options.container = containerId;
    options.__proto__ = defaults;

    players[0].init(options);

    // Create a second player, hidden beneath the first that can be used to
    // pre-load the next song in the queue.
    var playerContainer = angular.element(containerId);
    var preloadContainer = playerContainer.clone();
    preloadContainer.css(hiddenCss);
    preloadContainer.attr('id', playerContainer.attr('id') + '_preloader');
    playerContainer.after(preloadContainer);

    var preloadOptions = angular.copy(options);
    preloadOptions.container = '#' + preloadContainer.attr('id');
    players[1].init(preloadOptions);

    players.forEach(function(p, i) {
      // Disable all user interactions with the player
      p.disableInteraction();
      p.setVolume(onVolume);
      p.on('ready', function() {
        var loadTime = Date.now() - loadStart;
        var offset = playSkip + loadTime;
        active = i;
        if (offset >= 0) {
          // Play it now!
          console.info("Skipping to", offset);
          p.skip(offset / 1000.0);
          flipPlayer();
        }
        // Schedule the flip.
        else {
          console.info("Scheduling out", -offset);
          setTimeout(flipPlayer, -offset);
        }
      });
    });
  }

  /**
   * Play the song, or queue it to be played when the currently playing song is
   * finished.
   *
   * @param string file
   *   Path to the file that represents the song to play.
   * @param int skip
   *
   */
  Song.play = function(file, skip) {
    playSkip = skip;
    loadStart= Date.now();
    playFile = file;
    if (skip < 0) {
      var next = active ? 0 : 1;
      players[next].load(file);
      console.info("loading file", file, "on next player", next);
    }
    else {
      // No point in preloading the file, we're already behind!
      players[active].load(file);
      console.info("loading file", file, "on current player", active);
    }
  }

  /**
   * Tell all players to un-mute.
   */
  Song.unmute = function() {
    players.forEach(function(p) {
      p.setVolume(onVolume);
    });
  }

  /**
   * Tell all players to mute.
   */
  Song.mute = function() {
    players.forEach(function(p) {
      p.setVolume(0.0);
    });
  }

  /**
   * Tell all players to clear their buffer.
   */
  Song.clear = function() {
    players.forEach(function(p) {
      p.empty();
    });
  }

  return Song;
};
