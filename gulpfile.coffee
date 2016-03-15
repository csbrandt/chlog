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

configAdmin =
   entryFile: './admin/_attachments/script/index.js'
   inputDir: './admin'
   outputDir: './dist/admin'
   outputFile: 'index.js'

configPublic =
   entryFile: './public/_attachments/script/index.js'
   inputDir: './public'
   outputDir: './dist/public'
   outputFile: 'index.js'

getBundler = (config) ->
   browserify(config.entryFile, { debug: true })
   .transform(stringify, {
      appliesTo: { includeExtensions: ['.html'] },
      minify: true,
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

gulp.task 'css-admin', ->
   gulp.src(configAdmin.inputDir + '/_attachments/less/style.less')
      .pipe(less({
         paths: [path.join(configAdmin.inputDir, '_attachments', 'node_modules')]
      }))
      .pipe cssmin()
      .pipe gulp.dest(configAdmin.outputDir + '/_attachments/css')

gulp.task 'css-public', ->
   gulp.src(configPublic.inputDir + '/_attachments/less/style.less')
      .pipe(less({
         paths: [path.join(configPublic.inputDir, '_attachments', 'node_modules')]
      }))
      .pipe cssmin()
      .pipe gulp.dest(configPublic.outputDir + '/_attachments/css')

gulp.task 'copy-admin', ['clean', 'build'], ->
   gulp.src(configAdmin.inputDir + '/_id')
      .pipe gulp.dest(configAdmin.outputDir)

   gulp.src(configAdmin.inputDir + '/rewrites.json')
      .pipe gulp.dest(configAdmin.outputDir)

   gulp.src(configAdmin.inputDir + '/language')
      .pipe gulp.dest(configAdmin.outputDir)

   gulp.src(configAdmin.inputDir + '/_attachments/index.html')
      .pipe gulp.dest(configAdmin.outputDir + '/_attachments')

   gulp.src(configAdmin.inputDir + '/_attachments/node_modules/sapo_ink/dist/css/ink.min.css')
      .pipe gulp.dest(configAdmin.outputDir + '/_attachments/css')

gulp.task 'copy-public', ['clean', 'build'], ->
   gulp.src(configPublic.inputDir + '/_id')
      .pipe gulp.dest(configPublic.outputDir)

   gulp.src(configPublic.inputDir + '/rewrites.json')
      .pipe gulp.dest(configPublic.outputDir)

   gulp.src(configPublic.inputDir + '/language')
      .pipe gulp.dest(configPublic.outputDir)

   gulp.src(configPublic.inputDir + '/_attachments/index.html')
      .pipe gulp.dest(configPublic.outputDir + '/_attachments')

   gulp.src(configPublic.inputDir + '/_attachments/node_modules/sapo_ink/dist/css/ink.min.css')
      .pipe gulp.dest(configPublic.outputDir + '/_attachments/css')

gulp.task 'build-admin', ['clean'], ->
   bundle(configAdmin)

gulp.task 'build-public', ['clean'], ->
   bundle(configPublic)

gulp.task 'css', ['css-admin', 'css-public'], ->

gulp.task 'build', ['build-admin', 'build-public'], ->

gulp.task 'copy', ['copy-admin', 'copy-public'], ->

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
