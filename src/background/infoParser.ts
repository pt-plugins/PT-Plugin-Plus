import { Dictionary } from "@/interface/common";
import moment from "moment";
import PTPlugin from "./service";
type Service = PTPlugin;
export class InfoParser {
  constructor(public service: Service) {}
  getResult(content: any, rule: any) {
    let results: Dictionary<any> = {};

    if (content) {
      for (const key in rule.fields) {
        if (rule.fields.hasOwnProperty(key)) {
          let config = rule.fields[key];

          let result = this.getFieldData(content, config);
          if (result != null) {
            results[key] = result;
          }
        }
      }
    }

    return results;
  }

  getFieldData(content: any, config: any) {
    let query: any;
    // selectorIndex 表示当前匹配了哪条选择器
    let selectorIndex: number = 0;
    // 直接表达式
    if (typeof config.selector == "string") {
      query = content.find(config.selector);
    } else if (config.selector && config.selector.length) {
      // 数组时
      config.selector.some((selector: string) => {
        query = content.find(selector);
        if (query.length > 0) {
          return true;
        }
        selectorIndex++;
      });
    } else {
      return null;
    }

    let result = null;
    // 该变量 dateTime 用于 eval 内部执行，不可删除或改名
    let dateTime = moment;
    let _self = this;
    if (query) {
      if (config.attribute || config.filters) {
        if (config.attribute) {
          query = query.attr(config.attribute);
        }

        let filters: any;

        // 按 selectorIndex 来选择
        if (config.switchFilters) {
          filters = config.switchFilters[selectorIndex] || null;
        } else {
          filters = config.filters;
        }

        console.log(filters);

        if (filters) {
          filters.forEach((filter: string) => {
            try {
              query = eval(filter);
            } catch (error) {
              this.service.debug("InfoParser.Error", filter, error);
              return;
            }
          });
        }
        result = query;
      } else {
        result = query.text().trim();
      }
    }
    return result;
  }

  /**
   * 获取指定数组的合计尺寸
   * @param datas 表示大小的数组
   */
  getTotalSize(datas: string[]) {
    let total: number = 0.0;

    console.log(datas);

    datas.forEach((item: string) => {
      let size = parseFloat(item.replace(/[A-Za-z]/g, ""));
      let unit = item.replace(/[^A-Za-z]/g, "").toLowerCase();
      switch (true) {
        case /ki?b/.test(unit):
          total += size * 1024;
          break;

        case /mi?b/.test(unit):
          total += size * 1048576;
          break;

        case /gi?b/.test(unit):
          total += size * 1073741824;
          break;

        case /ti?b?/.test(unit):
          total += size * 1099511627776;
          break;
      }
    });

    return total;
  }
}
