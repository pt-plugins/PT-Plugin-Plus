const merge = require("webpack-merge");
const common = require("./common.js");
const path = require("path");

module.exports = merge(common, {
  entry: {
    content: path.join(__dirname, "../src/content/index.ts")
  },
  output: {
    path: path.join(__dirname, "../dist/js/content"),
    filename: "[name].js"
  },
  devtool: "inline-source-map",
  mode: "development"
});
