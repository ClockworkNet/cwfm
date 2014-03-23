var fs = require('fs');
var path = require('path');

var patterns = {
	'all'     : new RegExp('.+')
	, 'music' : new RegExp('\.mp3|\.m4a|\.ogg|\.flac|\.wma|\.wmv$')
};

var Scanner = function(dir, opts) {

	opts = opts || {};
	this.dir = dir;
	this.filePattern = opts.filePattern || patterns.all;
	this.dirPattern  = opts.dirPattern  || patterns.all;

	this.listeners = {
		'start'       : []
		, 'error'     : []
		, 'file'      : []
		, 'skipFile'  : []
		, 'dir'       : []
		, 'skipDir'   : []
		, 'end'       : []
	};
};

Scanner.patterns = patterns;

Scanner.prototype = {
	fire: function(event) {
		var args = Array.prototype.slice.call(arguments, 1);
		var self = this;
		this.listeners[event].forEach(function(callback) {
			callback.apply(self, args);
		});
	}

	, on: function(event, callback) {
		if (!this.listeners[event]) {
			throw new Error("Invalid event");
		}
		this.listeners[event].push(callback);
	}

	, start: function(dir) {
		dir = dir || this.dir;
		this.fire('start');
		console.info('starting scan in', dir);
		this.scan(dir);
	}

	, isValidFile: function(url) {
		console.info(this.filePattern);
		return url.match(this.filePattern);
	}

	, isValidDir: function(url) {
		return url.match(this.dirPattern);
	}

	, scan: function(url) {
		var self = this;
		fs.stat(url, function(e, stats) {
			if (e) return self.fire('error', e);

			if (stats.isFile()) {
				if (!self.isValidFile(url)) {
					return self.fire('skipFile', url, stats);
				}
				else {
					return self.fire('file', url, stats);
				}
			}

			if (stats.isDirectory()) {
				if (!self.isValidDir(url)) {
					return self.fire('skipDir', url, stats);
				}

				fs.readdir(url, function(e, urls) {
					if (e) return self.fire('error', e);
					if (!urls) return;

					self.fire('dir', url, stats, urls);

					urls.forEach(function(childurl) {
						var fullurl = path.join(url, childurl);
						self.scan(fullurl);
					});
				});
			}
		});
	}
};

module.exports = Scanner;
