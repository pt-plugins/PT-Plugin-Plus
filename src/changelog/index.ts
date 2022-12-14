import Vue from "vue";
import App from "./Index.vue";
import vuetifyService from "@/options/plugins/vuetify";
import "github-markdown-css/github-markdown.css";

vuetifyService.init("en");

new Vue({
  el: "#app",
  render: h => h(App)
});
