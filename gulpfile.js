const gulp = require('gulp')
const $ = require('gulp-load-plugins')();
const autoprefixer = require('autoprefixer')
const mainBowerFiles = require('main-bower-files')
const browserSync = require('browser-sync').create()
const minimist = require('minimist')
const gulpDequence = require('gulp-sequence')

let envOptions = {
  string: 'env',
  default: {env:'develop'}
}

let options = minimist(process.argv.slice(2), envOptions)
let production = 'dist'

gulp.task('clean', function(){
  return gulp.src(['./.tmp', './public'], {read: false})
  .pipe($.clean())
})


gulp.task('copyHTML', function(){
  return gulp.src('./src/**/*.html')
    .pipe(gulp.dest('./dist/'))
})


gulp.task('jade', function() {
  // var YOUR_LOCALS = {};
  gulp.src('./src/**/*.jade')
    .pipe($.plumber())
    .pipe($.jade({
      // locals: YOUR_LOCALS
      // 看說要轉出的格式是漂亮的還是壓縮的
    }))
    .pipe(gulp.dest('./dist/'))
    .pipe(browserSync.stream())
});

gulp.task('sass', function () {
  return gulp.src('./src/scss/**/*.scss')
    .pipe($.plumber())
    .pipe($.sourcemaps.init())
    .pipe($.sass().on('error', $.sass.logError))
    // 編譯完成css
    .pipe($.postcss([autoprefixer()]))
    //壓縮
    .pipe($.if(options.env === production, $.minifyCss()))
    //輸出
    .pipe($.sourcemaps.write('.'))
    .pipe(gulp.dest('./dist/css'))
    .pipe(browserSync.stream())
})

gulp.task('babel', () =>
  gulp.src('./src/js/**/*.js')
    .pipe($.sourcemaps.init())
    .pipe($.babel({
      presets: ['@babel/env']
    }))
    .pipe($.concat('all.js'))
    .pipe($.if(options.env === production, $.uglify({
      compress: {
        drop_console: true
      }
    })))
    .pipe($.sourcemaps.write('.'))
    .pipe(gulp.dest('./dist/js'))
    .pipe(browserSync.stream())
);

gulp.task('bower', function() {
  return gulp.src(mainBowerFiles({
    "overrides": {
      "bootstrap": {                       // 套件名稱
        "main": "dist/js/bootstrap.js"      // 取用的資料夾路徑
      }
    }
  }))
    .pipe(gulp.dest('./.tmp/vendors'))
});

gulp.task('vendorJs', ['bower'], function(){
  return gulp.src('./.tmp/vendors/**/**.js')
    .pipe($.order(
      ['jquery.js','bootstrap.js']
    ))
    .pipe($.concat('vendors.js'))
    .pipe($.if(options.env === production,$.uglify()))
    .pipe(gulp.dest('./dist/js'))
})

gulp.task('browser-sync', function(){
  browserSync.init({
    server: {
      baseDir: './dist'
    }, 
    reloadDebounce: 5000
  })
})

gulp.task('image-min', () => {
  gulp.src('./src/images/*')
  .pipe($.if(options.env === production,$.imagemin()))
  .pipe(gulp.dest('./dist/images'))
})

gulp.task('watch', function () {
  gulp.watch('./src/**/*.jade', ['jade']);
  gulp.watch('./src/scss/**/*.scss', ['sass']);
  gulp.watch('./src/js/**/*.js', ['babel']);
})

gulp.task('build', gulpDequence('clean','jade', 'sass', 'babel', 'vendorJs'))

gulp.task('default', ['jade', 'sass', 'babel', 'vendorJs', 'browser-sync', 'image-min'])