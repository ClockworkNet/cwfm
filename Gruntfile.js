/*!
 * @file
 * Grunt config file for CWFM.
 */

module.exports = function(grunt) {
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    shell: {
      // Start mongodb, this should generally be run before attempting to launch
      // the app.
      mongodb: {
        command: 'mongod --dbpath ./data/db',
        options: {
          async: true,
          stdout: false,
          stderr: true,
          failOnError: true,
          execOptions: {
            cwd: '.'
          }
        }
      }
    },
    nodemon: {
      // Launch the express application.
      dev: {
        script: 'app.js',
        watch: ['lib', 'models', 'routes']
      }
    }
  });

  grunt.loadNpmTasks('grunt-shell-spawn');
  grunt.loadNpmTasks('grunt-nodemon');

  // Helper to display information about how to connect to the app in your
  // browser.
  grunt.registerTask('announce', 'Print server info.', function() {
    grunt.log.writeln('Starting CWFM on http://localhost:1501');
  });

  // Get the app up and running so you can connect and start listening to some
  // sweet tunes.
  grunt.registerTask('server', ['shell', 'announce', 'nodemon']);
};
