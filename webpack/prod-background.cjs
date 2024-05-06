const { merge } = require("webpack-merge");
const common = require("./common.cjs");
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
    filename: "[name].js",
    clean: true
  },
  mode: "production",
  plugins: [
    new CopyWebpackPlugin({
      patterns: [
        {
          from: resolve("/resource/"),
          to: path.join(resolve("/dist/"), "resource"),
          globOptions: {
            ignoreFiles: [".DS_Store", "README.md", "testSearchData.json"]
          }
        }
      ],
    }),
    new CopyWebpackPlugin({
      patterns: [
        {
          from: path.join(resolve('public'), 'manifest.json'),
          to: path.join(resolve('dist'), "manifest.json"),
          transform(content, path) {
            const manifest = JSON.parse(content.toString());

            // rewrite version to add Build number (simple from git count)
            const build_number = git.count() % 65535;
            manifest.version = `${manifest.version}.${build_number}`;

            return JSON.stringify(manifest);
          }
        }
      ]
    })
  ]
});
