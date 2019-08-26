import { Site, Dictionary } from "@/interface/common";

/**
 * 保存路径处理程序
 */
export class PathHandler {
  constructor() {}

  /**
   * 替换路径系统关键字
   * @param {*} path
   */
  public replacePathKey(path: any, site: Site) {
    if (!path) {
      return path;
    }
    return this.replaceKeys(path, {
      "site.name": site.name,
      "site.host": site.host
    });
  }

  /**
   * 获取保存路径
   * @param {*} sourcePath
   */
  public getSavePath(sourcePath: any, site: Site): any {
    if (!sourcePath) {
      return undefined;
    }
    let path = sourcePath;
    let key = "<...>";

    if (path) {
      // 自定义路径
      if (path.indexOf(key) >= 0) {
        let tmp = window.prompt(
          `当前为自定义路径：${path} \n请输入路径中 ${key} 部分的内容: `
        );
        // 取消
        if (tmp === null) {
          return false;
        }
        path = path.replace(key, tmp);
      }
    }

    return this.replacePathKey(path, site);
  }

  public replaceKeys(source: string, keys: Dictionary<any>): string {
    let result: string = source;

    for (const key in keys) {
      if (keys.hasOwnProperty(key)) {
        const value = keys[key];
        result = result.replace("$" + key + "$", value);
      }
    }
    return result;
  }
}
