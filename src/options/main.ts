import Vue from "vue";
import vuetifyService from "./plugins/vuetify";
import App from "./App.vue";
import router from "./router";
import store from "./store";
import { filters } from "@/service/filters";
import dayjs from "dayjs";
import { i18nService } from "./i18n";
import { Options, i18nResource } from "@/interface/common";

(function main() {
  let options: Options;
  Vue.config.productionTip = false;

  // 初始化全局过滤器
  for (const key in filters) {
    if (filters.hasOwnProperty(key)) {
      Vue.filter(key, (...result: any) => {
        return filters[key].call(filters, result);
      });
    }
  }

  // 初始化时间格式化过滤器
  Vue.filter("formatDate", (val: any, format: string = "YYYY-MM-DD HH:mm") => {
    if (!val) {
      return "";
    }
    if (dayjs(val).isValid()) {
      // 标准时间戳需要 * 1000
      if (/^(\d){10}$/.test(val)) {
        val = parseInt(val) * 1000;
      }
      return dayjs(val).format(format);
    }
    return val;
  });

  /**
   * 将时间格式化为 xxx 前
   * 修改自 NexusPHP
   */
  Vue.filter("timeAgo", (source: any, weekOnly: boolean = false) => {
    if (!source) {
      return "";
    }
    let unit = {
      year: "年",
      month: "月",
      day: "日",
      hour: "时",
      mins: "分",
      week: "周"
    };

    let now = new Date().getTime();

    let mins = Math.floor(Math.abs(now - source) / 1000 / 60);
    let hours = Math.floor(mins / 60);
    mins -= hours * 60;
    let days = Math.floor(hours / 24);
    hours -= days * 24;

    if (weekOnly) {
      let week = Math.floor(days / 7);
      if (week < 1) {
        return "不满一周";
      }
      return `${week}${unit.week}`;
    }

    let months = Math.floor(days / 30);
    let days2 = days - months * 30;
    let years = Math.floor(days / 365);
    months -= years * 12;
    while (months > 12) {
      years++;
      months -= 12;
    }
    let result = "";

    switch (true) {
      case years > 0:
        result = years + unit["year"] + months + unit["month"];
        break;

      case months > 0:
        result = months + unit["month"] + days2 + unit["day"];
        break;

      case days > 0:
        result = days + unit["day"] + hours + unit["hour"];
        break;

      case hours > 0:
        result = hours + unit["hour"] + mins + unit["mins"];
        break;

      case mins > 0:
        result = mins + unit["mins"];
        break;

      default:
        result = "< 1" + unit["mins"];
    }

    return result + "前";
  });

  let vm: any;

  // 读取配置信息
  store
    .dispatch("readConfig")
    .then((result: Options) => {
      let i18n = new i18nService();

      i18n.onChanged = (locale: string) => {
        options.locale = locale;
        store.dispatch("saveConfig", {
          locale
        });
        if (!vm) {
          return;
        }

        // 非简体中文时，暂时切换到英文
        // TODO 考虑添加其他语言动态支持
        if (locale != "zh-CN") {
          vm.$vuetify.lang.current = "en";
        } else {
          vm.$vuetify.lang.current = "zh-Hans";
        }
      };

      i18n.onAdded = (resource: i18nResource) => {
        store.dispatch("addLanguage", resource);
      };

      i18n.onReplaced = (resource: i18nResource) => {
        store.dispatch("replaceLanguage", resource);
      };

      options = result;

      if (options.locale != "zh-CN") {
        vuetifyService.init("en");
      } else {
        vuetifyService.init("zh-Hans");
      }

      // 设置语言信息
      i18n.init(options.locale || "zh-CN").then((i18n: any) => {
        vm = new Vue({
          router,
          store,
          i18n,
          render: h => h(App)
        });
        vm.$mount("#app");
      });

      // 全局挂载 i18nService 对象
      window.i18nService = i18n;
    })
    .catch(error => {
      alert("加载配置失败？？" + error);
    });
  store.dispatch("readUIOptions");
})();

/**
 * 定义 window 中需要挂载的对象
 */
declare global {
  interface Window {
    i18nService: i18nService;
  }
}
