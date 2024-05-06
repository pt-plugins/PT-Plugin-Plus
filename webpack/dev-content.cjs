const {merge} = require("webpack-merge");
const common = require("./common.cjs");
const path = require("path");

module.exports = merge(common, {
  entry: {
    content: path.join(__dirname, "../src/content/index.ts")
  },
  output: {
    path: path.join(__dirname, "../dist/js/content"),
    filename: "[name].js",
    clean: true
  },
  devtool: "inline-source-map",
  mode: "development"
});
