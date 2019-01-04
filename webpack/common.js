const path = require('path');

// 用于替换 @ 符号的路径
function resolve(dir) {
  return path.join(__dirname, '..', dir);
}

module.exports = {
  entry: {
    popup: path.join(__dirname, '../src/popup/index.ts'),
    background: path.join(__dirname, '../src/background/index.ts'),
    content: path.join(__dirname, '../src/content/index.ts')
  },
  output: {
    path: path.join(__dirname, '../dist/js'),
    filename: '[name].js'
  },
  // optimization: {
  //   splitChunks: {
  //     name: 'vendor',
  //     chunks: "initial"
  //   }
  // },
  module: {
    rules: [{
      test: /\.tsx?$/,
      use: 'ts-loader',
      exclude: /node_modules/
    }]
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js'],
    alias: {
      '@': resolve('src')
    }
  }
};