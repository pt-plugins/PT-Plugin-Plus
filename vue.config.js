module.exports = {
  pages: {
    index: {
      // page 的入口
      entry: "src/options/main.ts"
    },
    // 调试页面
    debugger: "src/debugger/index.ts"
  },
  productionSourceMap: false
};
