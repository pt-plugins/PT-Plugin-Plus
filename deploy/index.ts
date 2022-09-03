import Package from "./package";
import * as program from "commander";

class Deployer {
  private options: any = {};
  constructor() {
    this.initCommander();
  }

  private initCommander() {
    program
      .version("0.0.1")
      .option("-p, --package", "打包文件")
      .option("-z, --zip", "打包文件")
      .action(options => {
        this.options = options;
        this.init();
      });

    program.parse(process.argv);
  }

  private init() {
    // 打包
    if (this.options.package) {
      new Package(process.env.CRX_PRIVATE_KEY).start().then(file => {
        this.publish(file);
      });
    } else if (this.options.zip) {
      new Package().zip();
    } else {
      this.publish();
    }
  }

  /**
   * 发布至应用市场
   * @param file
   */
}

new Deployer();
