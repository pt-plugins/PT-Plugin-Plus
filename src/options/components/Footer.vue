<template>
  <v-footer app fixed>
    <span class="pl-2 grey--text text--darken-1">
      &copy; {{ $t("app.author") }} {{ year }}, {{ $t("common.version") }}
      {{ version }}
      <span
        v-if="isDevelopmentMode && $vuetify.breakpoint.mdAndUp"
        class="deep-orange--text"
        >{{ words.developmentMode }}</span
      >
      <v-chip
        label
        outline
        color="orange"
        disabled
        small
        v-if="isDebugMode && $vuetify.breakpoint.mdAndUp"
        >{{ $t("common.debugMode") }}</v-chip
      >
      <v-btn
        outline
        color="success"
        small
        v-if="newReleases"
        href="https://github.com/pt-plugins/PT-Plugin-Plus/releases"
        target="_blank"
        rel="noopener noreferrer nofollow"
        >{{ $t("common.haveNewReleases") }}, {{ releasesVersion }}</v-btn
      >
    </span>
    <v-spacer></v-spacer>
    <v-btn
      flat
      small
      href="https://t.me/joinchat/NZ9NCxPKXyby8f35rn_QTw"
      target="_blank"
      rel="noopener noreferrer nofollow"
      title="Telegram"
      :icon="$vuetify.breakpoint.smAndDown"
    >
      <v-img
        src="./assets/telegram.svg"
        width="16"
        :style="$vuetify.breakpoint.smAndDown ? 'max-width:16px' : null"
      />
      <span class="ml-1" v-if="$vuetify.breakpoint.mdAndUp">Telegram</span>
    </v-btn>
    <input type="file" ref="fileLanguage" style="display: none" />
    <v-menu top offset-y>
      <template v-slot:activator="{ on }">
        <v-btn flat small v-on="on" :icon="$vuetify.breakpoint.smAndDown">
          <v-icon small>language</v-icon>
          <span class="ml-1" v-if="$vuetify.breakpoint.mdAndUp">
            {{ $t("common.changeLanguage") }}
          </span>
        </v-btn>
      </template>

      <v-list dense>
        <v-list-tile @click="selectFile">
          <v-list-tile-title>{{ $t("common.addLanguage") }}</v-list-tile-title>
        </v-list-tile>
      </v-list>

      <v-divider></v-divider>

      <v-list dense>
        <v-list-tile
          v-for="(item, index) in languages"
          :key="index"
          @click="changeLanguage(item)"
        >
          <v-list-tile-title
            :class="currentLanguage == item.code ? 'primary--text' : ''"
          >
            <span>
              <v-icon
                small
                class="mr-1 primary--text"
                v-if="currentLanguage == item.code"
                >check</v-icon
              >
              <span v-else class="mr-4"></span>
            </span>
            {{ item.name }}
          </v-list-tile-title>
        </v-list-tile>
      </v-list>
    </v-menu>
    <v-btn flat small to="/system-logs" :icon="$vuetify.breakpoint.smAndDown">
      <v-icon small>assignment</v-icon>
      <span class="ml-1" v-if="$vuetify.breakpoint.mdAndUp">
        {{ $t("common.systemLog") }}
      </span>
    </v-btn>
    <v-btn @click="toggle_dark_mode" flat small :icon="$vuetify.breakpoint.smAndDown">
      <v-icon small>invert_colors</v-icon>
      <span class="ml-1" v-if="$vuetify.breakpoint.mdAndUp">
        {{ $t("common.darkMode") }}
      </span>
    </v-btn>
    <v-btn
      v-if="$vuetify.breakpoint.mdAndUp"
      flat
      small
      href="/debugger.html"
      target="_blank"
      rel="noopener noreferrer nofollow"
      :title="$t('navigation.support.debugger')"
    >
      <v-icon small>bug_report</v-icon>
      <span class="ml-1">{{ $t("navigation.support.debugger") }}</span>
    </v-btn>

    <v-snackbar v-model="invalidFile" top :timeout="3000" color="error">
      {{ $t("footer.invalidFile") }}
    </v-snackbar>
  </v-footer>
</template>
<script lang="ts">
import { APP, API } from "@/service/api";
import Vue from "vue";
import { EInstallType } from "@/interface/enum";
import { i18nResource } from "@/interface/common";
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
      currentLanguage: "",
      invalidFile: false,
      year: new Date().getFullYear()
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
        this.isDevelopmentMode = [
          EInstallType.development,
          EInstallType.crx
        ].includes(result);
        if (result === EInstallType.crx) {
          this.words.developmentMode = EInstallType.crx;
        }
      })
      .catch(() => {
        console.log("获取安装方式失败");
      });
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
        .fail((result: any) => { });
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
            if (result.code && result.words) {
              this.loadLanguage(result);
              this.invalidFile = false;
            } else {
              this.invalidFile = true;
            }
            console.log(result);
          } catch (error) {
            console.warn(error);
            this.invalidFile = true;
          }
        };
        r.onerror = () => { };
        r.readAsText(fileInput.files[0]);
        fileInput.value = "";
      }
    },
    toggle_dark_mode() {
      this.$root.$emit('ToggleDarkMode');
    },

    /**
     * 加载语言信息
     */
    loadLanguage(resource: i18nResource) {
      // 检测指定的语言是否已存在
      if (window.i18nService.exists(resource.code)) {
        // 是否替换
        if (window.confirm(this.$t("footer.replaceLanguageConfirm") + "")) {
          window.i18nService
            .replace(resource)
            .then(() => {
              this.currentLanguage = resource.code;
            })
            .catch(() => { });
        }
      } else {
        window.i18nService
          .add(resource)
          .then(() => {
            this.currentLanguage = resource.code;
            this.languages.push({
              name: resource.name,
              code: resource.code
            });
          })
          .catch(() => { });
      }
    },

    selectFile() {
      this.fileInput.click();
    }
  }
});
</script>
