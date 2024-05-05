const path = require("path");

// 用于替换 @ 符号的路径
function resolve(dir) {
  return path.join(__dirname, "..", dir);
}

module.exports = {
  optimization: {
    // 将第三方库和主程序分离
    // 参考配置：https://yi-jy.com/2018/06/09/webpack-split-chunks/
    splitChunks: {
      chunks: "all",
      minSize: 30000,
      minChunks: 1,
      maxAsyncRequests: 5,
      maxInitialRequests: 3,
      name: 'main',
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
    // 打包为 Chrome 商店版时不对代码进行压缩混淆
    minimize: !process.env.CHROME_WEB_STORE,
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: "esbuild-loader",
        exclude: /node_modules/
      },
      {
        test: /\.scss$/,
        use: [
          "style-loader",
          "css-loader",
          {
            loader: "sass-loader",
            options: {
              implementation: require("sass")
            }
          },
          "postcss-loader"
        ]
      },
      {
        test: /\.css$/,
        use: ["style-loader", "css-loader", "postcss-loader"]
      }
    ]
  },
  resolve: {
    extensions: [".ts", ".tsx", ".js"],
    alias: {
      "@": resolve("src")
    },
    fallback: {
      "path": require.resolve("path-browserify"),
      "http": require.resolve("stream-http"),
      "https": require.resolve("https-browserify")
    }
  },
  // 防止一些模块中使用了fs时无法编译的错误
  node: {
    // fs: "empty"
  }
};
