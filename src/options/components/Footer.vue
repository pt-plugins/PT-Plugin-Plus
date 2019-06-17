<template>
  <v-footer app fixed>
    <span class="pl-2 grey--text text--darken-1">
      &copy; {{ $t("app.author") }} 2019, {{ $t("common.version") }} {{version}}
      <span
        v-if="isDevelopmentMode"
        class="deep-orange--text"
      >{{ words.developmentMode }}</span>
      <v-chip
        label
        outline
        color="orange"
        disabled
        small
        v-if="isDebugMode"
      >{{ $t("common.debugMode") }}</v-chip>
      <v-btn
        outline
        color="success"
        small
        v-if="newReleases"
        href="https://github.com/ronggang/PT-Plugin-Plus/releases"
        target="_blank"
        rel="noopener noreferrer nofollow"
      >{{ $t("common.haveNewReleases") }}, {{ releasesVersion }}</v-btn>
    </span>
    <v-spacer></v-spacer>
    <v-menu top offset-y>
      <template v-slot:activator="{ on }">
        <v-btn flat small v-on="on">
          <v-icon small class="mr-1">language</v-icon>
          {{ $t("common.changeLanguage" )}}
        </v-btn>
      </template>

      <v-list>
        <v-list-tile v-for="(item, index) in languages" :key="index" @click="changeLanguage(item)">
          <v-list-tile-title>{{ item.name }}</v-list-tile-title>
        </v-list-tile>
      </v-list>
    </v-menu>
    <v-btn flat small to="/system-logs">
      <v-icon small class="mr-1">bug_report</v-icon>
      {{ $t("common.systemLog") }}
    </v-btn>
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
        developmentMode: "zip"
      },
      version: "",
      isDebugMode: APP.debugMode,
      isDevelopmentMode: false,
      newReleases: false,
      releasesVersion: "",
      languages: [] as Array<any>
    };
  },
  created() {
    this.languages = window.i18nService.config;
    if (APP.isExtensionMode && chrome.runtime && chrome.runtime.getManifest) {
      let manifest = chrome.runtime.getManifest();
      this.version = "v" + (manifest.version_name || manifest.version);
    } else {
      this.version = "localVersion";
    }
    if (this.version != "localVersion") {
      this.checkUpdate();
    }

    APP.getInstallType()
      .then(result => {
        console.log(result, EInstallType.development);
        this.isDevelopmentMode = result == EInstallType.development;
      })
      .catch(() => {});
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
    },

    /**
     * 更改语言
     */
    changeLanguage(item: any) {
      window.i18nService.reset(item.code);
    }
  }
});
</script>
