gulp = require('gulp')
fs = require('fs')
browserify = require('browserify')
uglify = require('gulp-uglify')
eslint = require('gulp-eslint')
less = require('gulp-less')
cssmin = require('gulp-cssmin')
rimraf = require('rimraf')
source = require('vinyl-source-stream')
buffer = require('vinyl-buffer')
stringify = require('stringify')
path = require('path')

config =
   entryFile: './admin/_attachments/script/index.js'
   inputDir: './admin'
   outputDir: './dist/admin'
   outputFile: 'index.js'

getBundler = (config) ->
   browserify(config.entryFile, { debug: true })
   .transform(stringify, {
      appliesTo: { includeExtensions: ['.html', '.css'] },
      minify: true
   })

bundle = (config) ->
   getBundler(config).bundle().on('error', (err) ->
      console.log 'Error: ' + err.message
      process.exit 0
   ).pipe source(config.outputFile)
   .pipe buffer()
   .pipe uglify()
   .pipe gulp.dest(config.outputDir + '/_attachments/script')

gulp.task 'clean', (cb) ->
   rimraf './dist/', cb

gulp.task 'css-admin', ['clean'], ->
   gulp.src(config.inputDir + '/_attachments/less/style.less')
      .pipe(less({
         paths: [path.join(config.inputDir, '_attachments', 'node_modules')]
      }))
      .pipe cssmin()
      .pipe gulp.dest(config.outputDir + '/_attachments/css')

gulp.task 'css-public', ['clean'], ->
   gulp.src(config.inputDir + '/_attachments/less/public/style.less')
      .pipe(less({
         paths: [path.join(config.inputDir, '_attachments', 'node_modules')]
      }))
      .pipe cssmin()
      .pipe gulp.dest(config.outputDir + '/_attachments/css/public')

gulp.task 'copy-admin', ['clean', 'build'], ->
   gulp.src(config.inputDir + '/_id')
      .pipe gulp.dest(config.outputDir)

   gulp.src(config.inputDir + '/rewrites.json')
      .pipe gulp.dest(config.outputDir)

   gulp.src(config.inputDir + '/language')
      .pipe gulp.dest(config.outputDir)

   gulp.src(config.inputDir + '/_attachments/index.html')
      .pipe gulp.dest(config.outputDir + '/_attachments')

gulp.task 'build-admin', ['clean'], ->
   bundle(config)

gulp.task 'css', ['css-admin', 'css-public'], ->

gulp.task 'build', ['build-admin'], ->

gulp.task 'copy', ['copy-admin'], ->

gulp.task 'lint', ->
   # ESLint ignores files with "node_modules" paths.
   # So, it's best to have gulp ignore the directory as well.
   # Also, Be sure to return the stream from the task;
   # Otherwise, the task may end before the stream has finished.
   gulp.src(['**/*.js','!**/node_modules/**', '!**/views/**'])
      # eslint() attaches the lint output to the "eslint" property
      # of the file object so it can be used by other modules.
      .pipe(eslint())
      # eslint.format() outputs the lint results to the console.
      # Alternatively use eslint.formatEach() (see Docs).
      .pipe(eslint.format())
      # To have the process exit with an error code (1) on
      # lint error, return the stream and pipe to failAfterError last.
      .pipe(eslint.failAfterError());

# The default task (called when you run `gulp` from cli)
gulp.task 'default', ['lint', 'css', 'build', 'copy'], ->
   process.exit 0
