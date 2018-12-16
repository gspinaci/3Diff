const gulp = require('gulp')
const watch = require('gulp-watch')
const batch = require('gulp-batch')
const minify = require('gulp-minify')

const jsFiles = ['3diff.js']
const jsDest = './docs/assets/'

gulp.task('watch', () => {
  watch(jsFiles, batch((events, done) => {
    gulp.start('build', done)
  }))
})

gulp.task('build', () => {
  return gulp.src(jsFiles)
    .pipe(minify())
    .pipe(gulp.dest(jsDest))
})
