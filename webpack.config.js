const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');

module.exports = {
  mode: 'production',
  // CRITICAL FIX: This prevents Webpack from using "eval()", which Chrome blocks.
  devtool: 'cheap-module-source-map',
  
  entry: {
    background: './src/entry/background.js',
    content: './src/entry/content.js',
    // popup: './src/popup/popup.js', // REMOVED: No longer used
    dashboard: './src/dashboard/dashboard.js'
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js',
    clean: true,
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env']
          }
        }
      }
    ]
  },
  plugins: [
    new CopyPlugin({
      patterns: [
        { from: "src/manifest.json", to: "manifest.json" },
        { from: "src/assets", to: "assets" },
        { from: "src/dashboard/dashboard.html", to: "dashboard.html" },
        { from: "src/dashboard/dashboard.css", to: "dashboard.css" }
      ],
    }),
  ],
};