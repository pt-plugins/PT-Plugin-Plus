import * as fs from "fs";
import * as dotenv from "dotenv";
import * as webstore from "chrome-webstore-upload";

export default class ChromeWebStore {
  private webStore;
  private configFile = "./.env.local";
  constructor(
    public zipFile = `./releases/${process.env.npm_package_archiverName}-v${process.env.npm_package_version}.zip`
  ) {}

  /**
   * 上传压缩包
   * @see https://developer.chrome.com/webstore/webstore_api/items#resource
   */
  public upload(): Promise<any> {
    return new Promise<any>((resolve?: any, reject?: any) => {
      if (!fs.existsSync(this.configFile)) {
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
      const envConfig = dotenv.parse(fs.readFileSync(this.configFile));
      this.webStore = new webstore({
        extensionId: envConfig.CHROME_EXTENSION_ID,
        clientId: envConfig.CHROME_CLIENT_ID,
        clientSecret: envConfig.CHROME_CLIENT_SECRET,
        refreshToken: envConfig.CHROME_REFRESH_TOKEN
      });

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
}
