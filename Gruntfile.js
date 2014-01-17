module.exports = function(grunt) {
  'use strict';

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),

    // Check syntax
    jshint: {
      lib: ['lib/**/*.js'],
      grunt: ['Gruntfile.js'],
      test: ['test/unit/**/*.js', 'test/main.js'],
    },

    // Compile JS and handlebars templates
    browserify: {
      test: {
        src: ['test/main.js'],
        dest: 'test/bin/main.js',
        options: { debug: true }
      }
    },

    qunit: {
      test: ['test/index.html']
    },

    watch: {
      lib: {
        files: ['test/unit/**', 'lib/**'],
        tasks: ['jshint', 'browserify']
      },

      options: { livereload: 35729 }
    }
  });

  // plugins
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-qunit');
  grunt.loadNpmTasks('grunt-browserify');

  grunt.registerTask('test', [
    'jshint',
    'browserify',
    'qunit'
  ]);

  grunt.registerTask('default', ['test']);

};
