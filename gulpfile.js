var gulp = require('gulp');
var watch = require('gulp-watch');
var uglify = require('uglify-js-harmony');
var minifier = require('gulp-uglify/minifier');
var rename = require('gulp-rename');
var pump = require('pump');

gulp.task('client-compile-watcher', function() {
  compileClientJavascripts();
  watch('./src/*', compileClientJavascripts)
});

gulp.task('client-compile', compileClientJavascripts);

function compileClientJavascripts(cb) {
  pump([
    gulp.src('./src/delta_cache_ws.js'),
    gulp.dest('dist/'),
    gulp.dest('test/public/'),
    minifier({}, uglify),
    rename('delta_cache_ws.min.js'),
    gulp.dest('dist/'),
    gulp.dest('test/public/')
  ], cb);
}
