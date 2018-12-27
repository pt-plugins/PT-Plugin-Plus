import Vue from "vue";
import "./plugins/vuetify";
import App from "./App.vue";
import router from "./router";
import store from "./store";
import { filters } from "@/service/filters";

Vue.config.productionTip = false;

for (const key in filters) {
  if (filters.hasOwnProperty(key)) {
    Vue.filter(key, (...result: any) => {
      return filters[key].call(filters, result);
    });
  }
}

new Vue({
  router,
  store,
  render: h => h(App)
}).$mount("#app");
