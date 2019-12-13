module.exports = {
  pages: {
    index: {
      // page 的入口
      entry: "src/options/main.ts",
      title: "PT-Plugin-Plus"
    },
    // 调试页面
    debugger: {
      entry: "src/debugger/index.ts",
      title: "PT-Plugin-Plus Debugger"
    },
    changelog: {
      entry: "src/changelog/index.ts",
      title: "PT-Plugin-Plus ChangeLog"
    }
  },
  productionSourceMap: false,
  configureWebpack: {
    optimization: {
      // 打包为 Chrome 商店版时不对代码进行压缩混淆
      minimize: !process.env.CHROME_WEB_STORE
    }
  }
};
