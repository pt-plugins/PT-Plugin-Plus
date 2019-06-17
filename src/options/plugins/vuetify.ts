import Vue from "vue";
import Vuetify from "vuetify";
// Translation provided by Vuetify (typescript)
import zhHans from "vuetify/src/locale/zh-Hans";
import en from "vuetify/src/locale/en";
import "vuetify/src/stylus/app.styl";

class VuetifyService {
  public init(lang: string = "zh-Hans") {
    Vue.use(Vuetify, {
      iconfont: "md",
      lang: {
        locales: { "zh-Hans": zhHans, en },
        current: lang
      }
    });
  }
}

export default new VuetifyService();
