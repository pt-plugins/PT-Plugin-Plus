import Vue from 'vue'
import Vuetify from 'vuetify'
// Translation provided by Vuetify (typescript)
import zhHans from 'vuetify/src/locale/zh-Hans'
import 'vuetify/src/stylus/app.styl'

Vue.use(Vuetify, {
  iconfont: 'md',
  lang: {
    locales: { 'zh-Hans': zhHans },
    current: 'zh-Hans'
  }
})
