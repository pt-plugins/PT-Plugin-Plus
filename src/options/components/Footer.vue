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
    <input type="file" ref="fileLanguage" style="display:none;">
    <v-menu top offset-y>
      <template v-slot:activator="{ on }">
        <v-btn flat small v-on="on">
          <v-icon small class="mr-1">language</v-icon>
          {{ $t("common.changeLanguage" )}}
        </v-btn>
      </template>

      <v-list dense>
        <v-list-tile @click="selectFile">
          <v-list-tile-title>{{ $t("common.addLanguage") }}</v-list-tile-title>
        </v-list-tile>
      </v-list>

      <v-divider></v-divider>

      <v-list dense>
        <v-list-tile v-for="(item, index) in languages" :key="index" @click="changeLanguage(item)">
          <v-list-tile-title :class="currentLanguage==item.code?'primary--text':''">
            <span>
              <v-icon small class="mr-1 primary--text" v-if="currentLanguage==item.code">check</v-icon>
              <span v-else class="mr-4"></span>
            </span>
            {{ item.name }}
          </v-list-tile-title>
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
      languages: [] as Array<any>,
      fileInput: null as any,
      currentLanguage: ""
    };
  },
  created() {
    this.languages = window.i18nService.config;
    this.currentLanguage = window.i18nService.currentLanguage;
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
  mounted() {
    this.fileInput = this.$refs.fileLanguage;
    this.fileInput.addEventListener("change", this.addLanguage);
  },
  beforeDestroy() {
    this.fileInput.removeEventListener("change", this.addLanguage);
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
      this.currentLanguage = item.code;
      window.i18nService.reset(item.code);
    },

    /**
     * 手工添加一个新语言文件
     */
    addLanguage(event: Event) {
      let fileInput: any = event.srcElement;
      if (fileInput.files.length > 0 && fileInput.files[0].name.length > 0) {
        let r = new FileReader();
        r.onload = (e: any) => {
          try {
            let result = JSON.parse(e.target.result);
            if (result.code) {
              this.loadLanguage(result);
            }
            console.log(result);
          } catch (error) {
            console.error(error);
          }
        };
        r.onerror = () => {};
        r.readAsText(fileInput.files[0]);
        fileInput.value = "";
      }
    },

    loadLanguage(resource: any) {
      window.i18nService
        .add(resource)
        .then(() => {
          this.currentLanguage = resource.code;
          this.languages.push({
            name: resource.name,
            code: resource.code
          });
        })
        .catch(() => {});
    },

    selectFile() {
      this.fileInput.click();
    }
  }
});
</script>
