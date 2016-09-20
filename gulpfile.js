var gulp = require('gulp');
var watch = require('gulp-watch');
var uglify = require('uglify-js-harmony');
var minifier = require('gulp-uglify/minifier');
var rename = require('gulp-rename');
var pump = require('pump');
var webpack = require('gulp-webpack');

gulp.task('client-compile-watcher', function(cb) {
  compileClientJavascripts(cb);
  watch('./src/delta_cache_sw.js', compileClientJavascripts)
});

gulp.task('client-compile', compileClientJavascripts);

function compileClientJavascripts(cb) {
  pump([
    gulp.src('./lib/delta_cache_sw.js'),
    webpack({
      output: {
        filename: 'delta_cache_sw.js'
      }
    }),
    gulp.dest('dist/'),
    gulp.dest('test/public/')
    /*minifier({}, uglify),
    rename('delta_cache_sw.min.js'),
    gulp.dest('dist/'),
    gulp.dest('test/public/')*/
  ], cb);
}
