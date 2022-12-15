<template>
  <v-app id="inspire" :dark="this.darkMode">
    <template v-if="initializing">
      <v-progress-linear :indeterminate="true" color="info" height="5" class="pa-0 ma-0"></v-progress-linear>
      <v-alert :value="true" type="info">
        <div>
          <div>{{ $t("app.initializing", "zh-CN") }}</div>
          <div>{{ $t("app.initializing", "en") }}</div>
        </div>
      </v-alert>
    </template>

    <template v-else>
      <v-alert :value="!$store.state.initialized" type="error">{{ $t("app.initError") }}</v-alert>
      <template v-if="$store.state.initialized && havePermissions">
        <!-- 导航栏 -->
        <Navigation v-model="drawer"></Navigation>
        <!-- 顶部工具条 -->
        <Topbar v-model="drawer"></Topbar>
        <!-- 内容显示区域 -->
        <Content />
        <!-- 页脚 -->
        <Footer />
      </template>
      <Permissions v-else @update="reload" />
    </template>
  </v-app>
</template>

<script>
import { EAction, Options } from "../interface/common";
import Navigation from "./components/Navigation.vue";
import Topbar from "./components/Topbar.vue";
import Footer from "./components/Footer.vue";
import Content from "./components/Content.vue";
import Permissions from "./components/Permissions";
export default {
  name: "App",
  components: {
    Navigation,
    Topbar,
    Footer,
    Content,
    Permissions
  },
  data() {
    return {
      baseColor: "amber",
      drawer: this.$store.state.options.navBarIsOpen,
      havePermissions: false,
      initializing: true,
      darkMode: false
    };
  },
  created() {
    // this.init();
    if (localStorage.getItem('DarkMode'))
      this.darkMode = localStorage.getItem('DarkMode') == 'true';
  },
  mounted() {
    this.$root.$on("ToggleDarkMode",() => {
      this.darkMode = !this.darkMode;
      localStorage.setItem('DarkMode', this.darkMode);
    });
  },
  watch: {
    drawer() {
      if (this.$store.state.options.navBarIsOpen != this.drawer) {
        this.$store.dispatch("saveConfig", {
          navBarIsOpen: this.drawer
        });
      }
    }
  },
  methods: {
    init() {
      console.log("APP init.");
      if (chrome && chrome.permissions) {
        // 查询当前权限
        chrome.permissions.contains(
          {
            origins: ["http://*/*", "https://*/*"]
          },
          result => {
            this.havePermissions = result;
            this.initializing = false;
          }
        );
      } else {
        this.havePermissions = true;
        this.initializing = false;
      }
    },
    reload(havePermissions) {
      this.havePermissions = havePermissions;
    }
  }
};
</script>

<style lang="scss" src="./assets/contextMenu.scss"></style>