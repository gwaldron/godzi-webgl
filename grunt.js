module.exports = function(grunt) {

  var project = JSON.parse(grunt.file.read("project.json"));


  // Project configuration.
  grunt.initConfig({
    pkg: '<json:package.json>',
    meta: {
      banner: '/*! <%= pkg.name %> - v<%= pkg.version %> - ' + '<%= grunt.template.today("yyyy-mm-dd") %>\n' + '<%= pkg.homepage ? "* " + pkg.homepage + "\n" : "" %>' + '* Copyright (c) <%= grunt.template.today("yyyy") %> <%= pkg.author.name %>;' + ' Licensed <%= _.pluck(pkg.licenses, "type").join(", ") %> */'
    },
    watch: {
      files: '<config:linter.files>',
      tasks: 'linter'
    },
    lint: {
      beforeconcat: project.scripts,
      afterconcat: 'build/<%= pkg.name %>-<%=pkg.version %>-debug.js'
    },
    jshint: {
      options: {
        // http://www.jshint.com/docs/
        // Enforcing Options:
        curly: false,
        eqeqeq: false,
        immed: false,
        latedef: true,
        noarg: true,
        sub: true,
        undef: false,
        eqnull: true,
        browser: true,
        unused: false,
        forin: true,
        camelcase: false,
        newcap: false,
        // Relaxing Options:
        loopfunc: true,
        evil: true
      },
      globals: {
        gl: true,

        osg: true,
        osgDB: true,
        osgGA: true,
        osgUtil: true,
        osgViewer: true,
        osgAnimation: true,

        WebGLDebugUtils: true,
        WebGLUtils: true,

        Stats: true,
        performance: true,

        WebGLRenderingContext: true,
        WebGLBuffer: true,
        WebGLRenderbuffer: true,
        WebGLFramebuffer: true,
        WebGLProgram: true,
        WebGLTexture: true,
        WebGLShader: true
      }
    },
    jsvalidate: {
      files: project.scripts
    },
    qunit: {
      all: ['test/index.html']
    },
    concat: {
      build: {
        src:  ['<banner:meta.banner>', project.scripts],
        dest: 'build/<%= pkg.name %>-debug.js'
      }
    },
    strip: {
      main: {
        src: 'build/<%= pkg.name %>-debug.js',
        dest: 'build/<%= pkg.name %>.js'
      }
    },
    min: {
      build: {
        src: ['build/<%= pkg.name %>.js'],
        dest: 'build/<%= pkg.name %>.min.js'
      }
    },
    uglify: {
      mangle: {
        toplevel: false,
        except: []
      },
      squeeze: {
        make_seqs: true,
        dead_code: false
      },
      codegen: {
        beautify: false,
        quote_keys: false
      }
    },
    compress: {
      zip: {
        files: {
          'build/<%= pkg.name %>.min.js.gz': 'build/<%= pkg.name %>.min.js'
        }
      }
    },
    copy: {
      dist: {
        files: {
          'build/<%= pkg.name %>-debug-<%= pkg.version %>.js': 'build/<%= pkg.name %>-debug.js',
          'build/<%= pkg.name %>-<%= pkg.version %>.js': 'build/<%= pkg.name %>.min.js'
        }
      }
    }
  });

  // min is uglify (included with grunt)
  // lint is jslint
  grunt.loadNpmTasks('grunt-contrib');

  grunt.loadNpmTasks('grunt-contrib-compress'); // gz
  grunt.loadNpmTasks('grunt-contrib-uglify'); // minify
  grunt.loadNpmTasks('grunt-linter'); // linter
  grunt.loadNpmTasks('grunt-jsvalidate'); // syntax error
  grunt.loadNpmTasks('grunt-strip'); // remove console.log, etc
  grunt.loadNpmTasks('grunt-contrib-usemin');
  grunt.registerTask('release', 'concat copy strip min compress');
  grunt.registerTask('default', 'jsvalidate release');

};
