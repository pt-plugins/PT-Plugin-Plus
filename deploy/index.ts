import Package from "./package";
import ChromeWebStore from "./chrome";
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
      .option("-c, --chrome", "发布至 Chrome Web Store")
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
  private publish(file?: string) {
    if (this.options.chrome) {
      const chromeWebStore = new ChromeWebStore(file);
      chromeWebStore.upload().then(() => {
        chromeWebStore.publish();
      });
    }
  }
}

new Deployer();
