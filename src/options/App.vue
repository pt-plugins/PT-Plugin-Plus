<template>
  <v-app id="inspire">
    <v-alert :value="initializing" type="info">{{ $t("app.initializing") }}</v-alert>
    <template v-if="!initializing">
      <v-alert :value="!$store.state.initialized" type="error">{{ $t("app.initError") }}</v-alert>
      <template v-if="$store.state.initialized && havePermissions">
        <!-- 导航栏 -->
        <Navigation v-model="drawer"></Navigation>
        <!-- 顶部工具条 -->
        <Topbar v-model="drawer"></Topbar>
        <!-- 内容显示区域 -->
        <Content/>
        <!-- 页脚 -->
        <Footer/>
      </template>
      <Permissions v-else @update="reload"/>
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
      initializing: true
    };
  },
  created() {
    if (chrome && chrome.permissions) {
      // 查询当前权限
      chrome.permissions.contains(
        {
          permissions: ["tabs"],
          origins: ["*://*/*"]
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
    reload(havePermissions) {
      this.havePermissions = havePermissions;
    }
  }
};
</script>
