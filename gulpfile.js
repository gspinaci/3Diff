const gulp = require('gulp')
const minify = require('gulp-minify')

const jsFiles = ['3diff.js']
const jsDest = './docs/assets/'

gulp.task('watch', () => {
  gulp.watch(jsFiles, gulp.series('build'))
})

gulp.task('build', () => {
  return gulp.src(jsFiles)
    .pipe(minify())
    .pipe(gulp.dest(jsDest))
})
