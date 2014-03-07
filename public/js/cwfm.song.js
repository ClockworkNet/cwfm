if ( typeof cwfm == 'undefined' ) var cwfm  =  {};

cwfm.song = {};

cwfm.song.factory = function() {
	var player = Object.create(WaveSurfer);
	var defaults = {};
	var onVolume = 1.0;

	var playFile   = '';
	var loadStart  = 0;
	var playSkip   = 0;
	return {
		init: function(containerId, options) {
			options = options ? options : {};
			options.container = containerId;
			options.__proto = defaults;

			player.init(options);
			player.setVolume(0.0);

			player.on('ready', function() {
				var loadTime = Date.now() - loadStart;
				var offset   = playSkip + loadTime;
				if (offset != 0) {
					console.info("Skip requested:", playSkip, " Load time:", loadTime, " Skipping ahead:", offset);
					player.skip(offset / 1000.0);
				}
				console.info("Playing song", playFile);
				player.play();
			});
		}
		, play: function(file, skip) {
			playSkip   = skip;
			loadStart  = Date.now();
			playFile   = file;
			player.load(file);
		}
		, unmute: function() {
			player.setVolume(onVolume);
		}
		, mute: function() {
			player.setVolume(0.0);
		}
		, clear: function() {
			player.empty();
		}
		, on: function(event, callback) {
			player.on(event, callback);
		}
	};
};
