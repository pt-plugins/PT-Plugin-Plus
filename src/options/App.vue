<template>
  <v-app id="inspire">
    <v-alert :value="!$store.state.initialized" type="error">配置信息加载失败，没有获取到系统定义信息，请尝试刷新当前页面</v-alert>
    <template v-if="$store.state.initialized">
      <!-- 导航栏 -->
      <Navigation v-model="drawer"></Navigation>
      <!-- 顶部工具条 -->
      <Topbar v-model="drawer"></Topbar>
      <!-- 内容显示区域 -->
      <Content/>
      <!-- 页脚 -->
      <Footer/>
    </template>
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
  created() {}
};
</script>
