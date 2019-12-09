import Vue from "vue";
import App from "./Index.vue";
import vuetifyService from "@/options/plugins/vuetify";
vuetifyService.init("en");

new Vue({
  el: "#app",
  render: h => h(App)
});
