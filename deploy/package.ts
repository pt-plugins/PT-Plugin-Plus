import * as fs from "fs";
import * as archiver from "archiver";

export default class Package {
  private zipFile = `./releases/${process.env.npm_package_archiverName}-v${process.env.npm_package_version}.zip`;

  constructor() {}

  /**
   * 打包
   */
  public run(): Promise<any> {
    return new Promise<any>((resolve?: any, reject?: any) => {
      console.log("正要准备打包……");
      const output = fs.createWriteStream(this.zipFile);
      const zip = archiver("zip", {
        zlib: { level: 9 }
      });

      output.on("close", () => {
        console.log("打包完成 %s", this.zipFile);
        resolve(this.zipFile);
      });

      zip.pipe(output);

      // 打包 dist 目录
      zip.directory("dist/", false);

      zip.finalize().catch(error => {
        reject(error);
      });
    });
  }
}
