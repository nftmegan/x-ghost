const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');

module.exports = {
  mode: 'production', // Defaults to pro mode
  entry: {
    background: './src/entry/background.js', // Updated path
    content: './src/entry/content.js',       // Updated path
    popup: './src/popup/popup.js',
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
        use: { loader: 'babel-loader', options: { presets: ['@babel/preset-env'] } }
      }
    ]
  },
  plugins: [
    new CopyPlugin({
      patterns: [
        { from: "src/manifest.json", to: "manifest.json" },
        { from: "src/assets", to: "assets" },
        { from: "src/popup/popup.html", to: "popup.html" },
        { from: "src/popup/popup.css", to: "popup.css" },
        { from: "src/dashboard/dashboard.html", to: "dashboard.html" },
        { from: "src/dashboard/dashboard.css", to: "dashboard.css" }
      ],
    }),
  ],
};