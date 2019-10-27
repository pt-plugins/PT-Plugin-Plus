const merge = require("webpack-merge");
const common = require("./common.js");
const path = require("path");
const CopyWebpackPlugin = require("copy-webpack-plugin");

// 用于替换 @ 符号的路径
function resolve(dir) {
  return path.join(__dirname, "..", dir);
}

module.exports = merge(common, {
  entry: {
    background: path.join(__dirname, "../src/background/index.ts")
  },
  output: {
    path: path.join(__dirname, "../dist/js/background"),
    filename: "[name].js"
  },
  devtool: "inline-source-map",
  mode: "development",
  plugins: [
    new CopyWebpackPlugin([
      {
        from: resolve("/resource/"),
        to: path.join(resolve("/dist/"), "resource"),
        ignore: [".DS_Store", "README.md", "testSearchData.json"]
      }
    ])
  ]
});
