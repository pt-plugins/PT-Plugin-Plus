import * as FS from "fs";
import * as PATH from "path";

export type Dictionary<T> = { [key: string]: T };

/**
 * 构建过程辅助工具
 */
export class BuildPlugin {
  public resourcePath: string = "";
  private resourceMap = ["sites", "schemas", "clients", "publicSites"];

  constructor(rootPaht: string = "../../dist/resource") {
    this.resourcePath = PATH.resolve(__dirname, rootPaht);
    console.log(this.resourcePath);
  }

  /**
   * 创建资源文件列表
   */
  public buildResource() {
    let fileName = PATH.join(this.resourcePath, `systemConfig.json`);
    FS.writeFileSync(fileName, JSON.stringify(this.getSystemConfig()));
    fileName = PATH.join(this.resourcePath, `i18n.json`);
    FS.writeFileSync(fileName, JSON.stringify(this.geti18n()));
  }

  /**
   * 获取系统配置信息
   */
  public getSystemConfig() {
    let result = {};
    this.resourceMap.forEach((name: string) => {
      result[name] = this.getResourceConfig(name);
    });

    return result;
  }

  /**
   * 获取指定的资源配置信息
   * @param name
   */
  private getResourceConfig(name: string): any {
    let parentFolder = PATH.join(this.resourcePath, name);
    let list = FS.readdirSync(parentFolder);

    let results: any[] = [];
    list.forEach((path: string) => {
      let _path = PATH.join(parentFolder, path);
      var stat = FS.statSync(_path);
      // 仅获取目录
      if (stat && stat.isDirectory()) {
        let file = PATH.join(_path, `config.json`);
        if (FS.existsSync(file)) {
          let content = JSON.parse(FS.readFileSync(file, "utf-8"));

          // 获取解析器
          let parser = this.getParser(PATH.join(_path, "parser"));
          if (parser) {
            content["parser"] = parser;
          }
          results.push(content);
        }
      }
    });

    return results;
  }

  /**
   * 创建架构和站点的解析器
   */
  private makeParser(name: string) {
    let parentFolder = PATH.join(this.resourcePath, name);
    let list = FS.readdirSync(parentFolder);

    list.forEach((path: string) => {
      let _path = PATH.join(parentFolder, path);
      var stat = FS.statSync(_path);
      // 仅获取目录
      if (stat && stat.isDirectory()) {
        let parser = this.getParser(PATH.join(_path, "parser"));
        if (parser) {
          let fileName = PATH.join(_path, `config.json`);
          let content = JSON.parse(FS.readFileSync(fileName, "utf-8"));
          content["parser"] = parser;

          FS.writeFileSync(fileName, JSON.stringify(content));
        }
      }
    });
  }

  /**
   * 获取解析器
   * @param parentFolder
   */
  private getParser(parentFolder): any {
    if (!FS.existsSync(parentFolder)) {
      return null;
    }
    let list = FS.readdirSync(parentFolder);

    let results: any = {};
    list.forEach((path: string) => {
      let _path = PATH.join(parentFolder, path);
      var stat = FS.statSync(_path);
      // 仅获取目录
      if (stat && stat.isFile() && PATH.extname(_path) == ".js") {
        results[PATH.basename(_path, ".js")] = FS.readFileSync(_path, "utf-8");
      }
    });

    return results;
  }

  /**
   * 获取已支持站点列表
   */
  public getSupportedSites() {
    let schemaFolder = PATH.join(this.resourcePath, "schemas");
    let schemaList = FS.readdirSync(schemaFolder);

    let schemas: any = {};
    schemaList.forEach((path: string) => {
      let file = PATH.join(schemaFolder, path);
      var stat = FS.statSync(file);
      // 仅获取目录
      if (stat && stat.isDirectory()) {
        schemas[path] = [];
      }
    });

    schemas["其他架构"] = [];

    let parentFolder = PATH.join(this.resourcePath, "sites");

    let list = FS.readdirSync(parentFolder);

    let itemTemplate =
      "| $schema$ | $name$ | $search$ | $imdbSearch$ | $userData$ | $sendTorrent$ | $torrentProgress$ | $collaborator$ |";

    list.forEach((path: string) => {
      let file = PATH.join(parentFolder, path);
      var stat = FS.statSync(file);
      // 仅获取目录
      if (stat && stat.isDirectory()) {
        let fileName = PATH.join(file, `config.json`);
        let content = JSON.parse(FS.readFileSync(fileName, "utf-8"));
        let schema = content.schema;
        if (!schemas[schema]) {
          schema = "其他架构";
        }

        let supportedFeatures = {
          search: true,
          imdbSearch: true,
          userData: true,
          sendTorrent: true
        };

        if (content.supportedFeatures) {
          supportedFeatures = Object.assign(
            supportedFeatures,
            content.supportedFeatures
          );
        }

        // 判断是否有跳过 IMDb 选项，有则定为不支持 IMDb
        if (content.searchEntryConfig) {
          if (content.searchEntryConfig.skipIMDbId === true) {
            supportedFeatures.imdbSearch = false;
          }
        }

        let count = schemas[schema].length;
        let item = this.replaceKeys(itemTemplate, {
          schema: count == 0 ? schema : "",
          name: content.name,
          search: supportedFeatures.search === true ? "√" : "",
          imdbSearch: supportedFeatures.imdbSearch === true ? "√" : "",
          userData:
            supportedFeatures.userData === true
              ? "√"
              : supportedFeatures.userData === false
              ? ""
              : supportedFeatures.userData,
          sendTorrent: supportedFeatures.sendTorrent === true ? "√" : "",
          torrentProgress:
            content.searchEntryConfig &&
            content.searchEntryConfig.fieldSelector &&
            content.searchEntryConfig.fieldSelector.progress
              ? "√"
              : "",
          collaborator: this.getCollaborator(content.collaborator)
        });
        schemas[schema].push(item);
      }
    });

    console.log("\n");
    for (const key in schemas) {
      if (schemas.hasOwnProperty(key)) {
        const items: Array<any> = schemas[key];
        // console.log(`\n## ${key}`);

        items.forEach((item: string) => {
          console.log(item);
        });
      }
    }
    console.log("\n");

    // console.log(results);
  }

  public getCollaborator(source: string | Array<string>): string {
    if (!source) {
      return "";
    }
    if (typeof source == "string") {
      return source;
    } else if (source.length > 0) {
      let result: Array<string> = [];
      source.forEach((item: string) => {
        result.push(item);
      });

      return result.join(", ");
    }
    return "";
  }

  /**
   * 获取语言配置信息
   */
  public geti18n() {
    let parentFolder = PATH.join(this.resourcePath, "i18n");

    let list = FS.readdirSync(parentFolder);
    let results: Array<any> = [];

    list.forEach((path: string) => {
      let file = PATH.join(parentFolder, path);
      var stat = FS.statSync(file);
      // 获取语言配置文件
      if (stat && stat.isFile() && PATH.extname(file) == ".json") {
        let content = JSON.parse(FS.readFileSync(file, "utf-8"));
        if (content && content.code && content.name) {
          console.log(path, content.name);
          results.push({
            name: content.name,
            code: content.code
          });
        }
      }
    });
    return results;
  }

  /**
   * 替换指定的字符串列表
   * @param source
   * @param keys
   */
  replaceKeys(
    source: string,
    keys: Dictionary<any>,
    prefix: string = ""
  ): string {
    let result: string = source;

    for (const key in keys) {
      if (keys.hasOwnProperty(key)) {
        const value = keys[key];
        let search = "$" + key + "$";
        if (prefix) {
          search = `$${prefix}.${key}$`;
        }
        result = result.replace(search, value);
      }
    }
    return result;
  }
}
