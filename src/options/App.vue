<template>
  <v-app id="inspire">
    <!-- 导航栏 -->
    <Navigation v-model="drawer"></Navigation>
    <!-- 顶部工具条 -->
    <Topbar v-model="drawer"></Topbar>
    <!-- 内容显示区域 -->
    <Content/>
    <!-- 页脚 -->
    <Footer/>
  </v-app>
</template>

<script>
import { EAction, Options } from "../interface/common";
import Navigation from "./components/Navigation.vue";
import Topbar from "./components/Topbar.vue";
import Footer from "./components/Footer.vue";
import Content from "./components/Content.vue";
export default {
  name: "App",
  components: {
    Navigation,
    Topbar,
    Footer,
    Content
  },
  data() {
    return {
      baseColor: "amber",
      drawer: true
    };
  },
  created() {
    // chrome.extension.sendMessage(EAction.readConfig, result => {
    //   console.log("回调", result);
    //   this.$store.commit("initConfig", result);
    // });
    this.$store.commit("readConfig");
  }
};
</script>
