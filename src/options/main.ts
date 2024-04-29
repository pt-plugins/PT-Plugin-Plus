import Vue from "vue";
import vuetifyService from "./plugins/vuetify";
import App from "./App.vue";
import router from "./router";
import store from "./store";
import { filters } from "@/service/filters";
import dayjs from "dayjs";
import { i18nService } from "./i18n";
import { Options, i18nResource } from "@/interface/common";

class Main {
  private options: Options = {
    sites: [],
    clients: []
  };

  private vm: any;
  private i18n = new i18nService();

  private loadCount = 0;

  constructor() {
    this.initI18n();
    this.initVueConfig();
    this.initMainVM();
    this.init();
  }

  /**
   * 初始化Vue全局相关参数
   */
  private initVueConfig() {
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
    Vue.filter(
      "formatDate",
      (val: any, format: string = "YYYY-MM-DD HH:mm") => {
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
      }
    );

    /**
     * 将时间格式化为 xxx 前
     * 修改自 NexusPHP
     */
    Vue.filter("timeAgo", (source: any, weekOnly: boolean = false) => {
      if (!source) {
        return "";
      }
      let unit = {
        year: this.i18n.vuei18n.t("timeline.time.year", this.i18n.currentLanguage).toString(),
        month: this.i18n.vuei18n.t("timeline.time.month", this.i18n.currentLanguage).toString(),
        day: this.i18n.vuei18n.t("timeline.time.day", this.i18n.currentLanguage).toString(),
        hour: this.i18n.vuei18n.t("timeline.time.hour", this.i18n.currentLanguage).toString(),
        mins: this.i18n.vuei18n.t("timeline.time.mins", this.i18n.currentLanguage).toString(),
        week: this.i18n.vuei18n.t("timeline.time.week", this.i18n.currentLanguage).toString()
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
          return this.i18n.vuei18n.t("timeline.time.lessThanAWeek", this.i18n.currentLanguage).toString();
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

      return result + this.i18n.vuei18n.t("timeline.time.ago", this.i18n.currentLanguage).toString();
    });
  }

  /**
   * 初始化多语言环境
   */
  private initI18n() {
    this.i18n.onChanged = (locale: string) => {
      this.options.locale = locale;
      store.dispatch("saveConfig", {
        locale
      });
      if (!this.vm) {
        return;
      }

      // 非简体中文时，暂时切换到英文
      // TODO 考虑添加其他语言动态支持
      if (locale != "zh-CN") {
        this.vm.$vuetify.lang.current = "en";
      } else {
        this.vm.$vuetify.lang.current = "zh-Hans";
      }
    };

    this.i18n.onAdded = (resource: i18nResource) => {
      store.dispatch("addLanguage", resource);
    };

    this.i18n.onReplaced = (resource: i18nResource) => {
      store.dispatch("replaceLanguage", resource);
    };

    // 全局挂载 i18nService 对象
    window.i18nService = this.i18n;
    vuetifyService.init("en");
  }

  /**
   * 初始AppVM
   */
  private initMainVM() {
    this.vm = new Vue({
      router,
      store,
      i18n: this.i18n.vuei18n,
      render: h => h(App)
    });
    this.vm.$mount("#app");
  }

  public init() {
    const requests: any[] = [];

    // 读取配置信息
    requests.push(store.dispatch("readConfig"));
    requests.push(store.dispatch("readUIOptions"));

    Promise.all(requests)
      .then((results: any) => {
        this.options = results[0];

        // 设置语言信息
        this.i18n.init(this.options.locale || "zh-CN").then((i18n: any) => {
          if (this.options.locale != "zh-CN") {
            this.vm.$vuetify.lang.current = "en";
          } else {
            this.vm.$vuetify.lang.current = "zh-Hans";
          }

          this.vm.$children[0].init();
        });
      })
      .catch(error => {
        // alert("加载配置失败？？" + error);
        if (++this.loadCount < 5) {
          setTimeout(() => {
            this.init();
          }, 1000);
        } else {
          alert("加载配置失败？？" + error);
        }
        console.log(error);
      });
  }
}
(function main() {
  new Main();
})();

/**
 * 定义 window 中需要挂载的对象
 */
declare global {
  interface Window {
    i18nService: i18nService;
  }
}
