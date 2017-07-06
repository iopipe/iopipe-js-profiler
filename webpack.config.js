const path = require("path")

module.exports = {
  target: "node",
  entry: "./index.js",
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: "./index.js",
    libraryTarget: 'commonjs2',
    library: "lambda-profiler"
  }
}
