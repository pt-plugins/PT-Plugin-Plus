// 导入基础库
import * as Express from "express";
import * as cors from "cors";
import * as BodyParser from "body-parser";
import * as PATH from "path";
import * as FS from "fs";
import { BuildPlugin } from "./BuildPlugin";
import { SearchData } from "./SearchData";

/**
 * 默认APP
 */
class App {
  public express = Express();
  public options;
  public systemConfig;
  public i18n;

  constructor(options) {
    this.options = options || {
      port: 80,
      from: "../resource",
      to: "/"
    };

    let buildPlugin = new BuildPlugin("../../resource");
    this.systemConfig = JSON.stringify(buildPlugin.getSystemConfig());
    this.i18n = JSON.stringify(buildPlugin.geti18n());

    this.useModules();
    this.mountRoutes();
  }

  /**
   * 使用一些模块
   */
  private useModules() {
    const from = PATH.join(__dirname, this.options.from);

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
    this.express.get("/systemConfig.json", (req, res) => {
      res.send(this.systemConfig);
    });

    this.express.get("/i18n.json", (req, res) => {
      res.send(this.i18n);
    });

    const config = JSON.parse(this.systemConfig);
    this.express.get("/test/searchData.json", (req, res) => {
      res.send(new SearchData(config).generate());
    });

    this.express.get("/test/*.*", (req, res) => {
      console.log(req.url);
      let fileName = (req.url as any).match(/test\/(.[^\?]+)/)[1];
      console.log(fileName);
      let path = PATH.resolve(__dirname, "../data/");
      let file = PATH.join(path, fileName);
      if (FS.existsSync(file)) {
        let content = FS.readFileSync(PATH.join(path, fileName), "utf-8");
        if (fileName.substr(-5) === ".json") {
          res.send(JSON.parse(content));
        } else {
          console.log(PATH.join(path, fileName));
          res.sendFile(PATH.join(path, fileName));
          // res.send(content);
        }
      } else {
        res.send("no file.");
      }
    });
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
