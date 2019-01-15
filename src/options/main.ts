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
    return moment(val).format(format);
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
