const path = require("path");
const CopyWebpackPlugin = require("copy-webpack-plugin");
// 因第三方库中可能会包含一些特殊字符，导致编译后 Chrome 无法加载的问题，故引入 terser-webpack-plugin 插件
// Chrome 会报以下错误：无法为内容脚本加载“xxx.js”文件。该文件采用的不是 UTF-8 编码。
// @see https://stackoverflow.com/questions/55601774/chrome-extension-has-a-content-js-error-about-utf-8
const TerserPlugin = require("terser-webpack-plugin");

// 用于替换 @ 符号的路径
function resolve(dir) {
  return path.join(__dirname, "..", dir);
}

module.exports = {
  entry: {
    popup: path.join(__dirname, "../src/popup/index.ts"),
    background: path.join(__dirname, "../src/background/index.ts"),
    content: path.join(__dirname, "../src/content/index.ts")
  },
  output: {
    path: path.join(__dirname, "../dist/js/service"),
    filename: "[name].js"
  },
  optimization: {
    // 将第三方库和主程序分离
    // 参考配置：https://yi-jy.com/2018/06/09/webpack-split-chunks/
    splitChunks: {
      chunks: "all",
      minSize: 30000,
      maxSize: 0,
      minChunks: 1,
      maxAsyncRequests: 5,
      maxInitialRequests: 3,
      name: true,
      cacheGroups: {
        // 第三方库
        vendors: {
          test: /[\\/]node_modules[\\/]/,
          priority: -10,
          name: "libs"
        },
        // 公用模块
        default: {
          minSize: 0,
          minChunks: 2,
          priority: -20,
          reuseExistingChunk: true,
          name: "utils"
        }
      }
    },
    minimizer: [
      new TerserPlugin({
        // 防止因编码问题导致Chrome无法加载插件
        terserOptions: {
          output: { ascii_only: true }
        }
      })
    ]
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: "ts-loader",
        exclude: /node_modules/
      }
    ]
  },
  resolve: {
    extensions: [".ts", ".tsx", ".js"],
    alias: {
      "@": resolve("src")
    }
  },
  plugins: [
    new CopyWebpackPlugin([
      {
        from: resolve("/resource/"),
        to: path.join(resolve("/dist/"), "resource"),
        ignore: [".DS_Store", "README.md", "testSearchData.json"]
      }
    ])
  ],
  // 防止一些模块中使用了fs时无法编译的错误
  node: {
    fs: "empty"
  }
};
