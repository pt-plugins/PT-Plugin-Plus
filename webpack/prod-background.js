const merge = require("webpack-merge");
const common = require("./common.js");
const path = require("path");
const CopyWebpackPlugin = require("copy-webpack-plugin");
const git = require('git-rev-sync');

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
  mode: "production",
  plugins: [
    new CopyWebpackPlugin([
      {
        from: resolve("/resource/"),
        to: path.join(resolve("/dist/"), "resource"),
        ignore: [".DS_Store", "README.md", "testSearchData.json"]
      }
    ]),
    new CopyWebpackPlugin([
      {
        from: path.join(resolve('public'), 'manifest.json'),
        to: path.join(resolve('dist'), "manifest.json"),
        transform (content, path) {
          var manifest = JSON.parse(content.toString());

          // rewrite version to add Build number (simple from git count)
          const build_number = git.count() % 65535;
          manifest.version = `${manifest.version}.${build_number}`;

          return JSON.stringify(manifest);
        }
      }
    ])
  ]
});
