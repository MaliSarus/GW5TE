import MiniCssExtractPlugin from 'mini-css-extract-plugin'
import path from 'path'
import webpack from 'webpack'
import TerserPlugin from 'terser-webpack-plugin'
import {VueLoaderPlugin} from "vue-loader";

const {Compiler} = webpack
const config = {
  entry: './src/assets/js/main.js',
  output: {
    filename: '[name].min.js',
    chunkFilename: './chunks/[name].js',
    publicPath: '/assets/js/'
  },
  mode: 'production',

  plugins: [
    new MiniCssExtractPlugin({
      filename: '../css/chunks.css'
    }),
    new VueLoaderPlugin(),
    new webpack.ProgressPlugin((percentage, message) => {
      if (percentage * 100 % 10 === 0) {
        console.log(`${(percentage * 100).toFixed()}% ${message}`);
      }
    })
  ],
  module: {
    rules: [
      {
        test: /\.(js)$/,
        exclude: /(node_modules)/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/env'],
            plugins: [
              '@babel/plugin-syntax-dynamic-import',
              '@babel/plugin-transform-runtime'
            ]
          }
        }
      },
      {
        test: /\.css$/i,
        use: [
          {
            loader: MiniCssExtractPlugin.loader,
            options: {
              publicPath: './src/assets/css',
            },
          },
          "css-loader"
        ],
      },
      {test: /\.vue$/, use: 'vue-loader'}
    ]
  },
  optimization: {
    usedExports: true,
    minimize: true,
    minimizer: [
      (compiler = new Compiler()) => {
        new TerserPlugin({
          terserOptions: {format: {comments: false}},
          extractComments: false
        }).apply(compiler)
      }
    ],
    splitChunks: {
      chunks: 'all',
      maxInitialRequests: Infinity,
      minSize: 0,
      cacheGroups: {
        commons: {
          test: /[\\/]node_modules[\\/]/,
          name(module) {
            const packageName = module.context.match(/[\\/]node_modules[\\/](.*?)([\\/]|$)/);
            if (packageName) return `./vendors/vendor-${packageName[1].replace('@', '')}`;
            else return false
          },
        },
      },
    },
  }
}

export default config