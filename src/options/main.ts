import Vue from "vue";
import "./plugins/vuetify";
import App from "./App.vue";
import router from "./router";
import store from "./store";
import { filters } from "@/service/filters";
import moment from "moment";

Vue.config.productionTip = false;

for (const key in filters) {
  if (filters.hasOwnProperty(key)) {
    Vue.filter(key, (...result: any) => {
      return filters[key].call(filters, result);
    });
  }
}

// 时间格式化
Vue.filter("formatDate", (val: any, format: string = "YYYY-MM-DD HH:mm") => {
  return moment(val).format(format);
});

new Vue({
  router,
  store,
  render: h => h(App)
}).$mount("#app");
