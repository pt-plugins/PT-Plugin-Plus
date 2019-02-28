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
      });
    } else {
      return null;
    }

    let result = null;
    let dateTime = moment;
    if (query) {
      if (config.attribute || config.filters) {
        if (config.attribute) {
          query = query.attr(config.attribute);
        }

        if (config.filters) {
          config.filters.forEach((filter: string) => {
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
        result = query.text();
      }
    }
    return result;
  }
}
