// 导入基础库
import * as Express from "express";
import * as cors from "cors";
import * as BodyParser from "body-parser";
import * as Path from "path";

/**
 * 默认APP
 */
class App {
  public express;
  public options;

  constructor(options) {
    this.options = options || {
      port: 80,
      from: "../resource",
      to: "/"
    };

    this.express = Express();
    this.useModules();
    this.mountRoutes();
  }

  /**
   * 使用一些模块
   */
  private useModules() {
    const from = Path.join(__dirname, this.options.from);

    this.express.use(cors());
    // 启用静态文件目录
    this.express.use(this.options.to, Express.static(from));
    this.express.use(BodyParser.json()); // for parsing application/json
    this.express.use(BodyParser.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded
  }

  /**
   * 挂载路由
   */
  private mountRoutes(): void {
    // //设置跨域访问
    // this.express.all("*", (req, res, next) => {
    //   console.log("all-----test");
    //   res.header("Access-Control-Allow-Credentials", "true");
    //   res.header("Access-Control-Allow-Origin", req.headers.origin);
    //   res.header(
    //     "Access-Control-Allow-Headers",
    //     "Content-Type, Content-Length, Authorization, Accept, X-Requested-With"
    //   );
    //   res.header(
    //     "Access-Control-Allow-Methods",
    //     "PUT, POST, GET, DELETE, OPTIONS"
    //   );
    //   res.header("X-Powered-By", "z");
    //   res.header("Content-Type", "application/json;charset=utf-8");
    //   console.log(req);
    //   // res.send("OK");
    //   if (req.method === "OPTIONS") {
    //     res.sendStatus(200);
    //   } else {
    //     next();
    //   }
    //   // next();
    // });
  }

  /**
   * 启动服务
   */
  public start() {
    this.express.listen(this.options.port, err => {
      if (err) {
        return console.log(err);
      }

      return console.log(`Base Web Service Run at ${this.options.port}`);
    });
  }
}

export default App;
