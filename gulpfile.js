const gulp = require('gulp');

// Copy all icons from node folders and credentials folder into dist
gulp.task('build:icons', function () {
  return gulp.src(['nodes/**/icon.*', 'credentials/**/icon.*']).pipe(gulp.dest('dist'));
});