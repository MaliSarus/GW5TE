import Twig from 'twig'
import express from 'express'
import path from 'path'
import fs from 'fs'

export const app = express();

const pathToChunk = './src/assets/css/chunks.min.css'
const pathToVendors = './src/assets/js/vendors.min.js'

const paths = {
  src: './src',
  build: './dist',
  data: './src/data/',
  sass: './src/assets/scss',
  css: './src/assets/css',
  js: './src/assets/js',
  images: './src/assets/images',
  img: './src/assets/images',
};
import dataForTwig from './src/data/data.js'

let vendorFiles;
fs.readdir(paths.js + '/vendors', function (err, files) {
  //handling error
  if (err) {
    return console.log('Unable to scan directory: ' + err);
  }

  vendorFiles = files
});

Twig.cache(false);
app.set('view engine', 'twig');
app.set('twig options', {
  base: paths.src + '/templates',
  strict_variables: false,
  namespaces: { 'root': 'src/templates/' }
});
app.set('views', paths.src + '/templates');

app.use(express.static(path.join('src')));

/*, '/!**!/!*.html'*/
app.get(['/:fileName'], (req, res) => {
  let chunk = false;
  try {
    if (fs.existsSync(pathToChunk)) {
      chunk = true
    }
  }
  catch (err) {
    console.log('Chunks not exist')
  }

  let vendors = false;
  try {
    if (fs.existsSync(pathToVendors)) {
      vendors = true
    }
  }
  catch (err) {
    console.log('Vendors not exist')
  }

  const fileName = req.params.fileName
  res.render(
    fileName + '.twig',
    {
      ...dataForTwig[fileName],
      url: '/' + fileName,
      chunk,
      vendors,
      vendorFiles
    }
  );
});
app.get('/', function (req, res) {
  let chunk = false;
  try {
    if (fs.existsSync(pathToChunk)) {
      chunk = true
    }
  }
  catch (err) {
    console.log('Chunks not exist')
  }

  let vendors = false;
  try {
    if (fs.existsSync(pathToVendors)) {
      vendors = true
    }
  }
  catch (err) {
    console.log('Vendors not exist')
  }

  res.render(
    'index.twig',
    {
      ...dataForTwig.index,
      url: '/',
      chunk,
      vendors,
      vendorFiles
    }
  );
});


const listener = app.listen();
const port = listener.address().port;

export default port;