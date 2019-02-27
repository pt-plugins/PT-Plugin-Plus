import { Dictionary } from "@/interface/common";
import moment from "moment";
export class InfoParser {
  constructor(public options?: any) {}
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
    let query: any = content.find(config.selector);
    let result = null;
    let dateTime = moment;
    if (query) {
      if (config.attribute || config.filters) {
        if (config.attribute) {
          query = query.attr(config.attribute);
        }

        if (config.filters) {
          config.filters.forEach((filter: string) => {
            query = eval(filter);
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
