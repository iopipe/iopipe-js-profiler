const path = require("path")

module.exports = {
  target: "node",
  entry: "./src/index.js",
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: "./index.js",
    libraryTarget: 'commonjs2',
    library: "iopipe-plugin-profiler"
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        use: ['shebang-loader', 'babel-loader']
      },
      {
        test: /\.node$/,
        use: 'node-loader'
      },
      {
        test: /\.(h|.cc|.c|.o)$/,
        use: 'ignore-loader'
      }
    ]
  }
}
