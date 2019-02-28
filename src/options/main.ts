import Vue from "vue";
import "./plugins/vuetify";
import App from "./App.vue";
import router from "./router";
import store from "./store";
import { filters } from "@/service/filters";
import moment from "moment";

(function main() {
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
    if (moment(val).isValid()) {
      return moment(val).format(format);
    }
    return val;
  });

  Vue.filter("timeAgo", (source: any) => {
    let unit = {
      year: "年",
      month: "月",
      day: "日",
      hour: "小时",
      min: "分钟"
    };

    let now = new Date().getTime();

    let mins = Math.floor(Math.abs(now - source) / 1000 / 60);
    let hours = Math.floor(mins / 60);
    mins -= hours * 60;
    let days = Math.floor(hours / 24);
    hours -= days * 24;
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

      case mins > 0:
        result = mins + unit["min"];
        break;

      default:
        result = "&lt; 1" + unit["min"];
    }

    return result + "之前";
  });

  // 读取配置信息
  store.dispatch("readConfig");
  store.dispatch("readUIOptions");

  // 延时加载界面
  setTimeout(() => {
    new Vue({
      router,
      store,
      render: h => h(App)
    }).$mount("#app");
  }, 100);
})();
