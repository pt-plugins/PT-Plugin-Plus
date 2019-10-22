const merge = require("webpack-merge");
const common = require("./common.js");
// 避免编译后 Chrome 无法加载 content.js 的问题
// Chrome 会报以下错误：无法为内容脚本加载“js/content.js”文件。该文件采用的不是 UTF-8 编码。
// @see https://stackoverflow.com/questions/55601774/chrome-extension-has-a-content-js-error-about-utf-8
const TerserPlugin = require("terser-webpack-plugin");

module.exports = merge(common, {
  mode: "production",
  optimization: {
    minimizer: [
      new TerserPlugin({
        terserOptions: {
          output: { ascii_only: true }
        }
      })
    ]
  }
});
