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
    this.resourcePath = PATH.resolve(__dirname, "../../dist/resource");
    console.log(this.resourcePath);
  }

  /**
   * 创建资源文件列表
   */
  public buildResource() {
    this.resourceMap.forEach((name: string) => {
      this.makeResourceMap(name);
    });

    this.makeParser("schemas");
    this.makeParser("sites");
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

        schemas[schema].push(content.name);
      }
    });

    for (const key in schemas) {
      if (schemas.hasOwnProperty(key)) {
        const items = schemas[key];
        console.log(`\n## ${key}`);

        items.sort().forEach((item: string) => {
          console.log(`- ${item}`);
        });
      }
    }

    // console.log(results);
  }
}
