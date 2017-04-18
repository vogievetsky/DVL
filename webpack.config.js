var path = require("path");
var webpack = require("webpack");
var ExtractTextPlugin = require("extract-text-webpack-plugin");

var extractSass = new ExtractTextPlugin({
    filename: "dvl.css"
});

module.exports = function(env) {
  var outputFile = '[name].js',
      libraryName = 'dvl'
  console.log("Env: ", env);
  // if(env=="production") outputFile = '[name].min.js'
  return {
    devtool: 'source-map',
    output: {
      path: __dirname,
      filename: outputFile,
      library: libraryName,
      libraryTarget: 'umd',
      umdNamedDefine: true
    },
    resolve: {
        extensions: ['.js', '.json', '.coffee', 'html', '.scss']
    },
    entry: {
      dvl: "./src/index.coffee",
      style: './src/style/dvl.scss'
    },
    plugins: [
        new webpack.DefinePlugin({
          "define": () => true,
          "process.env": {
              BROWSER: JSON.stringify(true)
          },
          'require.specified':'require.resolve'
      })
    ],
    module:{
      noParse: /d3/,
      rules: [
          {
            test: /\.json$/,
            loader: "json-loader"
          },
          {
            test: /\.coffee$/,
            loader: "coffee-loader"
          },
          {
            test: /\.js$/,
            loader: 'babel-loader',
            exclude: [
              /node_modules/,
              /\.spec\.js$/
            ],
            query: {
              presets: ['es2015']
            }
          },
          {
              test: /\.scss$/,
              use: extractSass.extract({
                  use: [{
                      loader: "css-loader"
                  }, {
                      loader: "sass-loader"
                  }],
                  // use style-loader in development
                  fallback: "style-loader"
              })
          }
      ]
    },
    plugins: [
      extractSass
    ]
  }
};
