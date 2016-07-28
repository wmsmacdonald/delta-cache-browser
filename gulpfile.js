var gulp = require('gulp');
var babel = require('gulp-babel');
var watch = require('gulp-watch');
var webpack = require('gulp-webpack');
var uglify = require('gulp-uglify');
var rename = require('gulp-rename');

gulp.task('client-compile-watcher', function() {
  compileClientJavascripts();
  watch('./src/*', compileClientJavascripts)
});

gulp.task('client-compile', compileClientJavascripts);

function compileClientJavascripts() {
  gulp.src('./src/index.js')
    .pipe(webpack({
      output: {
        filename: 'websocket_relay.js'
      }
    }))
    .pipe(babel({ presets: ['es2015'] }))
    .pipe(gulp.dest('dist/'))
    .pipe(gulp.dest('tests/public/'))
    .pipe(uglify())
    .pipe(rename('delta_cache.min.js'))
    .pipe(gulp.dest('dist/'))
    .pipe(gulp.dest('tests/public/'))
}
