import { Dictionary, ERequestResultType } from "@/interface/common";
import dayjs from "dayjs";
import { PPF } from "@/service/public";
import customParseFormat from "dayjs/plugin/customParseFormat";
import advancedFormat from "dayjs/plugin/advancedFormat";
dayjs.extend(customParseFormat);
dayjs.extend(advancedFormat);

export class InfoParser {
  constructor(public service?: any) { }
  /**
   * 根据指定规则和原始获取需要的数据
   * @param content 原始内容
   * @param rule 规则配置
   * @return Dictionary<any>
   */
  getResult(content: any, rule: any): Dictionary<any> {
    let results: Dictionary<any> = {};

    if (content) {
      for (const key in rule.fields) {
        if (rule.fields.hasOwnProperty(key)) {
          let config = rule.fields[key];

          let result = this.getFieldData(content, config, rule);
          if (result != null) {
            results[key] = result;
          }
        }
      }
    }

    return results;
  }

  private debug(...msg: any[]) {
    if (this.service) {
      this.service.debug(...msg);
    } else {
      PPF.debug(...msg);
    }
  }

  /**
   * 获取字段信息
   * @param content 原始内容
   * @param config 当前字段定义信息
   * @param rule 选择器规则
   */
  getFieldData(content: any, config: any, rule: any) {
    let query: any;
    // selectorIndex 表示当前匹配了哪条选择器
    let selectorIndex: number = 0;
    let selectors = [];
    // 直接表达式
    if (typeof config.selector == "string") {
      selectors.push(config.selector);
    } else if (config.selector && config.selector.length) {
      selectors = config.selector;
    } else {
      return config.value === undefined ? null : config.value;
    }

    // 遍历选择器
    selectors.some((selector: string) => {
      try {
        switch (rule.dataType) {
          case ERequestResultType.JSON:
            if (selector == "") {
              query = content;
            } else if (selector.substr(0, 1) == "[") {
              query = eval("content" + selector);
            } else {
              query = eval("content." + selector);
            }
            if (query != null) {
              return true;
            }
            break;

          case ERequestResultType.TEXT:
          case ERequestResultType.HTML:
          default:
            if (selector == "") {
              query = content;
            } else {
              query = content.find(selector);
              if (query.length == 0)query = content.filter(selector)
            }

            if (query.length > 0) {
              return true;
            }
            break;
        }

        selectorIndex++;
      } catch (error) {
        this.debug(
          "InfoParser.getFieldData.Error",
          selector,
          error.message,
          error.stack
        );
        return true;
      }
    });

    let result = null;
    // 该变量 dateTime 用于 eval 内部执行，不可删除或改名
    let dateTime = dayjs;
    let _self = this;
    if (query != null) {
      if (config.attribute || config.filters || config.switchFilters) {
        if (config.attribute && rule.dataType != ERequestResultType.JSON) {
          query = query.attr(config.attribute);
        }

        let filters: any;

        // 按 selectorIndex 来选择
        if (config.switchFilters) {
          filters = config.switchFilters[selectorIndex] || null;
        } else {
          filters = config.filters;
        }

        if (filters) {
          filters.every((filter: string) => {
            try {
              query = eval(filter);
            } catch (error) {
              this.debug(
                "InfoParser.filter.Error",
                filter,
                error.message,
                error.stack
              );
              query = null;
              return false;
            }
            return true;
          });
        }
        result = query;
      } else {
        switch (rule.dataType) {
          case ERequestResultType.JSON:
            result = query;
            break;

          default:
            result = query.text().trim();
            break;
        }
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

    datas.forEach((item: string) => {
      let match = item.match(/^(\d*\.?\d+)(.*[^ZEPTGMK])?([ZEPTGMK](B|iB)?)$/i);
      if (!match) {
        return;
      }
      let size = parseFloat(match[1]);
      let unit = match[3].toLowerCase();
      switch (true) {
        case /ki?b/.test(unit):
          total += size * Math.pow(2, 10);
          break;

        case /mi?b/.test(unit):
          total += size * Math.pow(2, 20);
          break;

        case /gi?b/.test(unit):
          total += size * Math.pow(2, 30);
          break;

        case /ti?b?/.test(unit):
          total += size * Math.pow(2, 40);
          break;

        case /pi?b?/.test(unit):
          total += size * Math.pow(2, 50);
          break;

        case /ei?b?/.test(unit):
          total += size * Math.pow(2, 60);
          break;

        case /zi?b?/.test(unit):
          total += size * Math.pow(2, 70);
          break;
      }
    });

    return total;
  }

  /**
   * 获取指定数组的合计尺寸
   * @param imdbId 表示大小的数组
   */
  formatIMDbId(imdbId: string) {
    if (Number(imdbId))
    {
      if (imdbId.length < 7)
        imdbId = imdbId.padStart(7, '0');
      
      imdbId = "tt" + imdbId;
    }
    return imdbId;
  }
}
