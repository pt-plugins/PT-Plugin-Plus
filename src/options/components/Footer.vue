<template>
  <v-footer app fixed>
    <span class="pl-2 grey--text text--darken-1">
      &copy; 栽培者 2019, 版本 {{version}}
      <span
        v-if="isDevelopmentMode"
        class="deep-orange--text"
      >{{ words.developmentMode }}</span>
      <v-chip label outline color="orange" disabled small v-if="isDebugMode">{{ words.debugMode }}</v-chip>
      <v-btn
        outline
        color="success"
        small
        v-if="newReleases"
        href="https://github.com/ronggang/PT-Plugin-Plus/releases"
        target="_blank"
        rel="noopener noreferrer nofollow"
      >{{ words.newReleases }}, {{ releasesVersion }}</v-btn>
    </span>
    <v-spacer></v-spacer>
    <v-btn flat small to="/system-logs">系统日志</v-btn>
  </v-footer>
</template>
<script lang="ts">
import { APP, API } from "@/service/api";
import Vue from "vue";
import { EInstallType } from "@/interface/enum";
export default Vue.extend({
  data() {
    return {
      words: {
        debugMode: "当前处于调试模式",
        newReleases: "有更新可用",
        developmentMode: "zip"
      },
      version: "",
      isDebugMode: APP.debugMode,
      isDevelopmentMode: false,
      newReleases: false,
      releasesVersion: ""
    };
  },
  created() {
    if (APP.isExtensionMode) {
      let manifest = chrome.runtime.getManifest();
      this.version = "v" + (manifest.version_name || manifest.version);
    } else {
      this.version = "localVersion";
    }
    this.checkUpdate();
    APP.getInstallType().then(result => {
      console.log(result, EInstallType.development);
      this.isDevelopmentMode = result == EInstallType.development;
    });
  },
  methods: {
    checkUpdate() {
      $.getJSON(API.latestReleases)
        .done((result: any) => {
          if (result && result.tag_name) {
            // 版本号
            this.releasesVersion = result.tag_name;

            if (this.releasesVersion > this.version) {
              this.newReleases = true;
            }
          }
        })
        .fail((result: any) => {});
    }
  }
});
</script>
