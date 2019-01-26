<template>
  <div>
    <v-alert :value="true" type="info">{{ words.title }}</v-alert>
    <v-card color>
      <v-card-text>
        <v-form v-model="valid">
          <v-container fluid grid-list-xs>
            <v-layout row wrap>
              <v-flex xs12>
                <v-autocomplete
                  v-model="options.defaultClientId"
                  :items="this.$store.state.options.clients"
                  :label="words.defaultClient"
                  :menu-props="{maxHeight:'auto'}"
                  :hint="getClientAddress"
                  persistent-hint
                  item-text="name"
                  item-value="id"
                  required
                  :rules="rules.require"
                >
                  <template slot="selection" slot-scope="{ item }">
                    <span v-text="item.name"></span>
                  </template>
                  <template slot="item" slot-scope="data" style>
                    <v-list-tile-content>
                      <v-list-tile-title v-html="data.item.name"></v-list-tile-title>
                      <v-list-tile-sub-title v-html="data.item.address"></v-list-tile-sub-title>
                    </v-list-tile-content>
                    <v-list-tile-action>
                      <v-list-tile-action-text>{{ data.item.type }}</v-list-tile-action-text>
                    </v-list-tile-action>
                  </template>
                  <template slot="no-data">
                    <span class="ma-2">{{ words.noClient }}</span>
                  </template>
                </v-autocomplete>
              </v-flex>

              <v-flex xs4>
                <v-text-field
                  v-model="options.search.rows"
                  type="number"
                  :label="words.searchResultRows"
                  :placeholder="words.searchResultRows"
                ></v-text-field>
              </v-flex>
              <v-flex xs1>
                <v-slider v-model="options.search.rows" :max="200" :min="1"></v-slider>
              </v-flex>
              <v-flex xs7></v-flex>

              <v-flex xs4>
                <v-text-field
                  v-model="options.connectClientTimeout"
                  :label="words.connectClientTimeout"
                  :placeholder="words.connectClientTimeout"
                  type="number"
                ></v-text-field>
              </v-flex>
              <v-flex xs1>
                <v-slider
                  v-model="options.connectClientTimeout"
                  :max="60000"
                  :min="500"
                  :step="500"
                ></v-slider>
              </v-flex>

              <v-flex xs12>
                <v-switch
                  color="success"
                  v-model="options.autoUpdate"
                  :label="words.autoUpdate+lastUpdate"
                ></v-switch>

                <v-switch
                  color="success"
                  v-model="options.allowSelectionTextSearch"
                  :label="words.allowSelectionTextSearch"
                ></v-switch>

                <v-switch
                  color="success"
                  v-model="options.allowDropToSend"
                  :label="words.allowDropToSend"
                ></v-switch>

                <v-switch
                  color="success"
                  v-model="options.saveDownloadHistory"
                  :label="words.saveDownloadHistory"
                ></v-switch>

                <v-switch
                  color="success"
                  v-model="options.needConfirmWhenExceedSize"
                  :label="words.needConfirmWhenExceedSize"
                ></v-switch>
              </v-flex>

              <v-flex xs12>
                <div style="margin: -40px 0 0 40px;">
                  <v-text-field
                    v-model="options.exceedSize"
                    :placeholder="words.exceedSize"
                    class="ml-2 d-inline-flex"
                    style="max-width: 100px;max-height: 30px;"
                    :disabled="!options.needConfirmWhenExceedSize"
                  ></v-text-field>
                  <v-select
                    v-model="options.exceedSizeUnit"
                    :items="units"
                    class="mx-2 d-inline-flex"
                    style="max-width: 50px;max-height: 30px;"
                    :disabled="!options.needConfirmWhenExceedSize"
                  ></v-select>
                </div>
              </v-flex>
            </v-layout>
          </v-container>
        </v-form>
      </v-card-text>

      <v-divider></v-divider>

      <v-card-actions class="pa-3">
        <v-btn color="success" @click="save" :disabled="!valid">
          <v-icon>check_circle_outline</v-icon>
          <span class="ml-1">{{ words.save }}</span>
        </v-btn>
        <v-spacer></v-spacer>
        <v-btn color="warning" @click="clearCache">
          <v-icon>settings_backup_restore</v-icon>
          <span class="ml-1">{{ words.clearCache }}</span>
        </v-btn>
      </v-card-actions>
    </v-card>
    <v-snackbar v-model="haveError" absolute top :timeout="3000" color="error">{{ errorMsg }}</v-snackbar>
    <v-snackbar
      v-model="haveSuccess"
      absolute
      bottom
      :timeout="3000"
      color="success"
    >{{ successMsg }}</v-snackbar>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import { APP } from "@/service/api";
import { ESizeUnit, EAction } from "@/interface/common";
import Extension from "@/service/extension";

const extension = new Extension();

export default Vue.extend({
  data() {
    return {
      words: {
        title: "基本设置",
        defaultClient: "默认下载服务器",
        autoUpdate: "自动更新官方数据",
        save: "保存",
        allowSelectionTextSearch: "启用页面内容选择搜索",
        allowDropToSend: "启用拖放链接到插件图标时，直接发送链接到下载服务器",
        clearCache: "清除缓存",
        clearCacheConfirm:
          "确认要清除缓存吗？清除完成后，下次将会从官网中重新下载系统配置信息。",
        needConfirmWhenExceedSize:
          "当要下载的种子总体积超过以下大小时需要确认。",
        exceedSize: "大小",
        searchResultRows: "搜索时每站点返回结果数量",
        saveDownloadHistory: "记录每次一键发送的种子信息，以供导出备份",
        connectClientTimeout:
          "连接下载服务器超时时间（毫秒，1000毫秒=1秒），超出后将中断连接",
        noClient: "尚未配置下载服务器，请配置下载服务后再选择",
        cacheIsCleared: "缓存已清除，如需立即生效，请重新打开页面",
        saved: "参数已保存"
      },
      valid: false,
      rules: {
        require: [(v: any) => !!v || "!"]
      },
      options: {
        defaultClientId: "",
        search: {}
      },
      units: [] as any,
      downloadHistory: [] as any,
      haveError: false,
      haveSuccess: false,
      successMsg: "",
      errorMsg: "",
      lastUpdate: ""
    };
  },
  methods: {
    save() {
      console.log(this.options);
      this.$store.dispatch("saveConfig", this.options);
      this.successMsg = this.words.saved;
    },
    clearCache() {
      if (confirm(this.words.clearCacheConfirm)) {
        APP.cache.clear();

        setTimeout(() => {
          extension
            .sendRequest(EAction.reloadConfig)
            .then(() => {
              this.successMsg = this.words.cacheIsCleared;
            })
            .catch();
        }, 200);
      }
    }
  },
  created() {
    this.options = Object.assign({}, this.$store.state.options);
    this.units.push(ESizeUnit.MiB);
    this.units.push(ESizeUnit.GiB);
    this.units.push(ESizeUnit.TiB);
    this.units.push(ESizeUnit.PiB);
    extension.sendRequest(EAction.getDownloadHistory).then((result: any) => {
      console.log("downloadHistory", result);
      this.downloadHistory = result;
    });
    APP.cache
      .getLastUpdateTime()
      .then((time: number) => {
        if (time > 0) {
          this.lastUpdate = `（最后更新于 ${new Date(time).toLocaleString()}）`;
        } else {
          this.lastUpdate = " （更新时间未知）";
        }
      })
      .catch(() => {
        this.lastUpdate = " （更新时间获取失败）";
      });
  },
  watch: {
    successMsg() {
      this.haveSuccess = this.successMsg != "";
    },
    errorMsg() {
      this.haveError = this.errorMsg != "";
    }
  },
  computed: {
    getClientAddress(): any {
      if (!this.options.defaultClientId) {
        return "";
      }
      let client = this.$store.state.options.clients.find((data: any) => {
        return this.options.defaultClientId === data.id;
      });

      if (client) {
        return client.address;
      }
      return "";
    }
  }
});
</script>
<style lang="scss" scoped>
.v-input--selection-controls {
  margin: 0;
  padding: 0;
}
</style>
