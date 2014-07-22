if ( typeof cwfm == 'undefined' ) var cwfm  =  {};

cwfm.song = {};

cwfm.song.factory = function() {
	var players  = [Object.create(WaveSurfer), Object.create(WaveSurfer)];
	var active   = 0;
	var defaults = {};
	var onVolume = 1.0;

	var hiddenCss = {opacity: 0.5};
	var shownCss  = {opacity: 1.0};

	var playFile   = '';
	var loadStart  = 0;
	var playSkip   = 0;

	var flipPlayer = function() {
		var other = active ? 0 : 1; 

		angular.element(players[other].drawer.container).css(hiddenCss);
		players[other].empty();

		angular.element(players[active].drawer.container).css(shownCss);
		players[active].play();

		console.info('Playing', playFile, "on player", active);
	};

	return {
		init: function(containerId, options) {
			options = options ? options : {};
			options.container = containerId;
			options.__proto__ = defaults;
			players[0].init(options);

			// Create a second player, hidden beneath the first.
			var playerContainer = angular.element(containerId);
			var preloadContainer = playerContainer.clone();
			preloadContainer.css(hiddenCss);
			preloadContainer.attr('id', playerContainer.attr('id') + '_preloader');
			playerContainer.after(preloadContainer);

			var preloadOptions = angular.copy(options);
			preloadOptions.container = '#' + preloadContainer.attr('id');
			players[1].init(preloadOptions);

			players.forEach(function(p, i) {
        // Disable all user interactions with the player.
        p.disableInteraction();

				p.setVolume(onVolume);
				p.on('ready', function() {
					var loadTime = Date.now() - loadStart;
					var offset   = playSkip + loadTime;
					active  = i;
					if (offset >= 0) {
						// Play it now!
						console.info("Skipping to", offset);
						p.skip(offset / 1000.0);
						flipPlayer();
					}
					// Schedule the flip
					else {
						console.info("Scheduling out", -offset);
						setTimeout(flipPlayer, -offset);
					}
				});
			});
		}
		, play: function(file, skip) {
			playSkip   = skip;
			loadStart  = Date.now();
			playFile   = file;
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
		, unmute: function() {
			players.forEach(function(p) {p.setVolume(onVolume);});
		}
		, mute: function() {
			players.forEach(function(p) {p.setVolume(0.0);});
		}
		, clear: function() {
			players.forEach(function(p) {p.empty();});
		}
	};
};
