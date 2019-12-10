import * as fs from "fs";
import * as dotenv from "dotenv";
import * as webstore from "chrome-webstore-upload";

export default class ChromeWebStore {
  private webStore;
  private configFile = "./.env.local";
  private isInitialized = false;
  constructor(
    public zipFile = `./releases/${process.env.npm_package_archiverName}-v${process.env.npm_package_version}.zip`
  ) {}

  public init() {
    if (this.isInitialized) {
      return this;
    }

    let env: any = null;
    if (fs.existsSync(this.configFile)) {
      env = dotenv.parse(fs.readFileSync(this.configFile));
    } else {
      env = process.env;
    }

    if (
      env &&
      env.CHROME_EXTENSION_ID &&
      env.CHROME_CLIENT_ID &&
      env.CHROME_CLIENT_SECRET &&
      env.CHROME_REFRESH_TOKEN
    ) {
      this.webStore = webstore({
        extensionId: env.CHROME_EXTENSION_ID,
        clientId: env.CHROME_CLIENT_ID,
        clientSecret: env.CHROME_CLIENT_SECRET,
        refreshToken: env.CHROME_REFRESH_TOKEN
      });
      this.isInitialized = true;
    } else {
      console.log("关键参数未指定");
    }

    return this;
  }

  /**
   * 上传压缩包
   * @see https://developer.chrome.com/webstore/webstore_api/items#resource
   */
  public upload(): Promise<any> {
    return new Promise<any>((resolve?: any, reject?: any) => {
      this.init();
      if (!this.webStore) {
        reject(
          "Chrome Web Store 配置文件不存在，不能完成自动上传和发布，请手工上传。"
        );
        return;
      }

      if (!fs.existsSync(this.zipFile)) {
        reject(`指定的 ${this.zipFile} 文件不存在!`);
        return;
      }

      console.log("正在将压缩包上传至 Chrome Web Store，请稍候……");
      const file = fs.createReadStream(this.zipFile);

      this.webStore
        .uploadExisting(file)
        .then(res => {
          console.log("上传完成");
          console.log(res);
          resolve(res);
        })
        .catch(error => {
          console.log("上传失败", error);
          reject(error);
        });
    });
  }

  /**
   * 发布
   * @see https://developer.chrome.com/webstore/webstore_api/items/publish
   */
  public publish(): Promise<any> {
    return new Promise<any>((resolve?: any, reject?: any) => {
      this.init();
      console.log("正在执行发布操作，请稍候……");
      this.webStore
        .publish()
        .then(res => {
          console.log("发布完成");
          console.log(res);
          resolve(res);
        })
        .catch(error => {
          console.log("发布失败", error);
          reject(error);
        });
    });
  }

  public fetchToken(): Promise<any> {
    this.init();
    return this.webStore.fetchToken();
  }
}
