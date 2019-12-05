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
    }
  },
  productionSourceMap: false
};
