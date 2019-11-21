import { Site, SiteSchema, Options, SearchEntry } from "@/interface/common";
import extend from "extend";

export class SiteService {
  public isLogin: boolean = false;

  private _schema: SiteSchema = {};

  constructor(public options: Site, public systemOptions: Options) {
    this.mergeOptions();
  }

  public get schema(): SiteSchema {
    if (this._schema.name) {
      return this._schema;
    }
    let schema: SiteSchema = {};
    if (typeof this.options.schema === "string") {
      schema =
        this.systemOptions.system &&
        this.systemOptions.system.schemas &&
        this.systemOptions.system.schemas.find((item: SiteSchema) => {
          return item.name == this.options.schema;
        });
    }

    this._schema = schema;

    return schema;
  }

  private mergeOptions() {
    let site: Site =
      this.systemOptions.system &&
      this.systemOptions.system.sites &&
      this.systemOptions.system.sites.find((item: Site) => {
        return item.host == this.options.host;
      });

    if (site) {
      let customSearchEntry: SearchEntry[] = [];
      // 单独处理自定义的搜索入口，避免参数合并后错乱
      if (this.options.searchEntry) {
        for (
          let index = this.options.searchEntry.length - 1;
          index >= 0;
          index--
        ) {
          const item = this.options.searchEntry[index];
          if (item.isCustom) {
            customSearchEntry.push(item);
            this.options.searchEntry.splice(index, 1);
          }
        }
      }

      this.options = extend(true, {}, site, this.options);
      if (this.options.searchEntry && customSearchEntry.length > 0) {
        this.options.searchEntry.push(...customSearchEntry);
      }
    }
    console.log(this.options);
  }

  // public checkLogin(): Promise<any> {
  //   return new Promise<any>((resolve?: any, reject?: any) => {
  //     let site = this.options;
  //     let schema = this.schema;
  //     let checker: any;
  //     if (site.checker && site.checker.isLogin) {
  //       checker = site.checker.isLogin;
  //     } else if (schema.checker && schema.checker.isLogin) {
  //       checker = schema.checker.isLogin;
  //     }

  //     if (checker) {
  //       $.get(`${site.url}/${checker.page}`)
  //         .done((result: string) => {
  //           resolve(new RegExp(result, "").test(checker.contains));
  //         })
  //         .fail(() => {
  //           reject();
  //         });
  //     } else {
  //       resolve(null);
  //     }
  //   });
  // }
}
