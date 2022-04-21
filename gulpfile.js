let fileswatch = 'html,htm,txt,json,md,woff2,php,twig' // List of files extensions for watching & hard reload
import gulp from 'gulp'
import browserSync from 'browser-sync'
import webpackStream from 'webpack-stream'
import gulpSass from 'gulp-sass'
import sassLib from 'sass'

const sass = gulpSass(sassLib)
import autoprefixer from 'gulp-autoprefixer'
import gcmq from 'gulp-group-css-media-queries'
import rename from 'gulp-rename'
import imagemin from 'gulp-imagemin'
import del from 'del'
import sassGlob from 'gulp-sass-glob'
import dataForTwig from './src/data/data.js'
import twig from 'gulp-twig'
import plumber from 'gulp-plumber'
import nodemon from 'gulp-nodemon'
import flatmap from 'gulp-flatmap'
import cleanCSS from 'gulp-clean-css'
import webpackConfig from './webpack.config.js'
import webpack from 'webpack'

const {src, dest, parallel, series, watch} = gulp
var paths = {
  src: './src',
  build: './dist',
  data: './src/data/',
  sass: './src/assets/scss',
  css: './src/assets/css',
  js: './src/assets/js',
  images: './src/assets/images',
  img: './src/assets/img',
};

var transferPaths = {
  assets: '../../../../assets'
};


function express(cb) {
  let start = false
  return nodemon({
    script: 'server.js',
    ext: 'twig',
    env: {'NODE_ENV': 'development'},
  })
    .on('start', function () {
      if (!start) {
        start = true;
        cb()
      }
    })
    .on('restart', function () {
      setTimeout(function () {
        browserSync.reload();
      }, 1000);
    });
}

async function browsersync(cb) {
  const module = await import('./server.js')
  const port = module.default;

  browserSync.init({
    proxy: 'localhost:' + port,
    startPath: '/',
    host: 'localhost',
    port: 5000,
    notify: false,
    online: true,
    logPrefix: 'Proxy to localhost:' + port
  })
  cb()
}

function twigBuild() {
  return src([paths.src + '/templates/*.twig'])
    .pipe(flatmap(function (stream, file) {
      const fileName = file.stem
      const twigData = {
        ...dataForTwig[fileName],
        url: fileName === 'index' ? '/' : `/${fileName}`
      }
      return stream
        .pipe(plumber({
          handleError: function (err) {
            console.log(err);
            this.emit('end');
          }
        }))
        .pipe(twig({
          extname: '.php',
          data: twigData,
          namespaces: {'root': 'src/templates/'}
        }))
        .on('error', function (err) {
          process.stderr.write(err.message + '\n');
          this.emit('end');
        });
    }))
    .pipe(dest(paths.build));
};


function scripts() {
  return scriptsNoBS()
    .pipe(browserSync.reload({stream: true}))
}

function cleanAll(){
  return del([
    paths.js + '/chunks/**',
    paths.js + '/vendors/**',
    paths.css + '/**/*',
    paths.img + '/**/*'
  ], {force: true})
}

function scriptsNoBS() {
  return src(paths.js + '/main.js', {allowEmpty: true})
    .pipe(webpackStream(webpackConfig, webpack)).on('error', function handleError() {
      this.emit('end')
    })
    .pipe(dest(paths.js))
}

function styles() {
  return stylesNoBS()
    .pipe(browserSync.reload({stream: true}))
}

function stylesNoBS() {
  return src(paths.sass + '/**/*.scss')
    .pipe(sassGlob())
    .pipe(sass({
      outputStyle: 'compressed'
    }))
    .pipe(autoprefixer({
      overrideBrowserslist: ['last 10 versions'],
      grid: true,
      cascade: false
    }))
    .pipe(gcmq())
    .pipe(cleanCSS())
    .pipe(dest(paths.css))
}

function minChunks() {
  return minChunksNoBS()
    .pipe(browserSync.reload({stream: true}))
}

function minChunksNoBS() {
  return src(paths.css + '/**/chunks.css')
    .pipe(gcmq())
    .pipe(cleanCSS())
    .pipe(rename('chunks.min.css'))
    .pipe(dest(paths.css))
}

function images() {
  return src(paths.images + '/**/*')
    .pipe(imagemin([
      imagemin.gifsicle({interlaced: true}),
      imagemin.mozjpeg({quality: 75, progressive: true}),
      imagemin.optipng({optimizationLevel: 3, interlaced: true}),
    ]))
    .pipe(dest(paths.img))
}


function clearDist() {
  return del(paths.build, {force: true})
}

function createBuild() {
  return src(paths.src + '/assets/**/*.*')
    .pipe(dest(paths.build + '/assets'))
}

function startwatch() {
  watch(paths.sass + '/**/*', {usePolling: true}, styles);
  watch(
    [
      paths.js + '/**/*.js',
      paths.js + '/**/*.mjs',
      '!' + paths.js + '**/main.min.js',
      '!' + paths.js + '**/vendors.min.js',
      '!' + paths.js + '/vendors/**',
      '!' + paths.js + '/chunks/**'
    ],
    {usePolling: true},
    scripts
  )
  watch(paths.images + '/**/*.{jpg,jpeg,png,webp,svg,gif}', {usePolling: true}, images)
  watch(paths.css + '/**/chunks.css', {usePolling: true}, minChunks);
}

function transferAssets(){
  return src(paths.src + '/assets/**/*.*')
    .pipe(dest(transferPaths.assets))
}


export let build = series(cleanAll,clearDist, styles, images, twigBuild, createBuild)
export let prod = series(cleanAll, styles, scripts, minChunks, images, parallel(express))
export default series(cleanAll, styles, scripts, minChunks, images, express, parallel(startwatch, browsersync))
