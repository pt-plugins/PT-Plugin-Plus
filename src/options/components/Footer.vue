<template>
  <v-footer app fixed>
    <span class="pl-2 grey--text text--darken-1">
      &copy; 栽培者 2019, 版本 {{version}}
      <v-chip label outline color="orange" disabled small v-if="isDebugMode">{{ words.isDebugMode }}</v-chip>
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
export default Vue.extend({
  data() {
    return {
      words: {
        isDebugMode: APP.debugMode ? "当前处于调试模式" : "",
        newReleases: "有更新可用"
      },
      version: "",
      isDebugMode: APP.debugMode,
      newReleases: false,
      releasesVersion: ""
    };
  },
  created() {
    if (APP.isExtensionMode) {
      this.version = "v" + chrome.runtime.getManifest().version;
    } else {
      this.version = "localVersion";
    }
    this.checkUpdate();
  },
  methods: {
    checkUpdate() {
      $.getJSON(API.latestReleases)
        .done((result: any) => {
          if (result && result.tag_name) {
            // 版本号
            this.releasesVersion = result.tag_name;

            if (this.releasesVersion !== this.version) {
              this.newReleases = true;
            }
          }
        })
        .fail((result: any) => {});
    }
  }
});
</script>
