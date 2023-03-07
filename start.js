const { webpack } = require("./lib/webpack");
const webpackOptions = require("./webpack.config.js");
const compiler = webpack(webpackOptions);

//开始编译
compiler.run((err, stats) => {
  if (err) {
    return console.error('err', err);
  }
  console.log(
    stats.toJson({
      assets: true,   //打印编译产出的资源
      chunks: true,   //打印编译产出的代码块
      modules: true,  //打印编译产出的模块
    })
  );
});
