import * as FS from "fs";
import * as PATH from "path";

type resource = {
  name: string;
  type: string;
};

/**
 * 构建过程辅助工具
 */
export class BuildPlugin {
  public resourcePath: string = "";
  private resourceMap = ["sites", "schemas", "clients"];

  constructor() {
    this.resourcePath = PATH.resolve(__dirname, "../../resource");
    console.log(this.resourcePath);
  }

  /**
   * 创建资源文件列表
   */
  public buildResource() {
    this.resourceMap.forEach((name: string) => {
      this.makeResourceMap(name);
    });
  }

  /**
   * 创建指定的资源列表
   * @param name
   */
  private makeResourceMap(name: string): void {
    let parentFolder = PATH.join(this.resourcePath, name);
    let fileName = PATH.join(this.resourcePath, `${name}.json`);

    let list = FS.readdirSync(parentFolder);

    let results: resource[] = [];
    list.forEach((path: string) => {
      let file = PATH.join(parentFolder, path);
      var stat = FS.statSync(file);
      // 仅获取目录
      if (stat && stat.isDirectory()) {
        results.push({
          name: path,
          type: "dir"
        });
      }
    });

    FS.writeFileSync(fileName, JSON.stringify(results));
  }
}
