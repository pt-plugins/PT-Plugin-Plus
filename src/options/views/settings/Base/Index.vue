<template>
  <div>
    <!-- <v-alert :value="true" type="info">{{ $t('settings.base.title') }}</v-alert> -->
    <v-card>
      <v-card-text>
        <v-form v-model="valid" ref="form">
          <!--  -->
          <v-tabs centered dark icons-and-text v-model="activeTab">
            <v-tabs-slider color="yellow"></v-tabs-slider>

            <v-tab key="base">
              {{ $t('settings.base.tabs.base') }}
              <v-icon>settings</v-icon>
            </v-tab>

            <v-tab key="search">
              {{ $t('settings.base.tabs.search') }}
              <v-icon>search</v-icon>
            </v-tab>

            <v-tab key="download">
              {{ $t('settings.base.tabs.download') }}
              <v-icon>cloud_download</v-icon>
            </v-tab>

            <!-- 常规选项 -->
            <v-tab-item key="base">
              <v-container fluid grid-list-xs>
                <v-layout row wrap>
                  <!-- 默认下载服务器 -->
                  <v-flex xs10>
                    <v-autocomplete
                      v-model="options.defaultClientId"
                      :items="this.$store.state.options.clients"
                      :label="$t('settings.base.defaultClient')"
                      :menu-props="{maxHeight:'auto'}"
                      :hint="getClientAddress"
                      persistent-hint
                      item-text="name"
                      item-value="id"
                      required
                      :rules="rules.require"
                      autofocus
                      ref="defaultClient"
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
                        <span class="ma-2">{{ $t('settings.base.noClient') }}</span>
                      </template>
                    </v-autocomplete>
                  </v-flex>
                  <v-flex xs2></v-flex>

                  <!-- 连接超时设置 -->
                  <v-flex xs10>
                    <v-text-field
                      v-model="options.connectClientTimeout"
                      :label="$t('settings.base.connectClientTimeout')"
                      :placeholder="$t('settings.base.connectClientTimeout')"
                      type="number"
                    ></v-text-field>
                  </v-flex>
                  <v-flex xs2>
                    <v-slider
                      style="display:none;"
                      v-model="options.connectClientTimeout"
                      :max="60000"
                      :min="500"
                      :step="500"
                    ></v-slider>
                  </v-flex>

                  <v-flex xs12>
                    <!-- 自动刷新用户数据 -->
                    <v-switch
                      color="success"
                      v-model="options.autoRefreshUserData"
                      :label="$t('settings.base.autoRefreshUserData')+autoRefreshUserDataLastUpdate"
                    ></v-switch>

                    <!-- 自动刷新用户数据时间 -->
                    <v-flex xs12 v-if="options.autoRefreshUserData">
                      <div style="margin: -40px 0 10px 45px;">
                        <span>{{ $t('settings.base.autoRefreshUserDataTip1') }}</span>
                        <v-select
                          v-model="options.autoRefreshUserDataHours"
                          :items="hours"
                          class="mx-2 d-inline-flex"
                          style="max-width: 50px;max-height: 30px;"
                        ></v-select>
                        <span>:</span>
                        <v-select
                          v-model="options.autoRefreshUserDataMinutes"
                          :items="minutes"
                          class="mx-2 d-inline-flex"
                          style="max-width: 50px;max-height: 30px;"
                        ></v-select>
                        <span>{{ $t('settings.base.autoRefreshUserDataTip2') }}</span>
                      </div>
                    </v-flex>

                    <!-- 失败重试 -->
                    <v-flex xs12 v-if="options.autoRefreshUserData">
                      <div style="margin: -20px 0 10px 45px;">
                        <span>{{ $t('settings.base.autoRefreshUserDataTip3') }}</span>
                        <v-select
                          v-model="options.autoRefreshUserDataFailedRetryCount"
                          :items="[1,2,3,4,5]"
                          class="mx-2 d-inline-flex"
                          style="max-width: 50px;max-height: 30px;"
                        ></v-select>
                        <span>{{ $t('settings.base.autoRefreshUserDataTip4') }}</span>
                        <v-select
                          v-model="options.autoRefreshUserDataFailedRetryInterval"
                          :items="[1,2,3,4,5]"
                          class="mx-2 d-inline-flex"
                          style="max-width: 50px;max-height: 30px;"
                        ></v-select>
                        <span>{{ $t('settings.base.autoRefreshUserDataTip5') }}</span>
                      </div>
                    </v-flex>

                    <!-- 显示插件图标 -->
                    <v-switch
                      color="success"
                      v-model="options.showToolbarOnContentPage"
                      :label="$t('settings.base.showToolbarOnContentPage')"
                    ></v-switch>

                    <!-- 拖放下载 -->
                    <v-switch
                      color="success"
                      v-if="options.showToolbarOnContentPage"
                      v-model="options.allowDropToSend"
                      :label="$t('settings.base.allowDropToSend')"
                      class="ml-5"
                    ></v-switch>

                    <v-switch
                      color="success"
                      v-model="options.searchResultOrderBySitePriority"
                      :label="$t('settings.base.searchResultOrderBySitePriority')"
                    ></v-switch>
                  </v-flex>
                </v-layout>
              </v-container>
            </v-tab-item>

            <!-- 搜索选项 -->
            <v-tab-item key="search">
              <v-container fluid grid-list-xs>
                <v-layout row wrap>
                  <!-- 搜索返回的结果 -->
                  <v-flex xs6>
                    <v-text-field
                      v-model="options.search.rows"
                      type="number"
                      :label="$t('settings.base.searchResultRows')"
                      :placeholder="$t('settings.base.searchResultRows')"
                    ></v-text-field>
                  </v-flex>
                  <v-flex xs6>
                    <v-slider
                      style="display:none;"
                      v-model="options.search.rows"
                      :max="200"
                      :min="1"
                    ></v-slider>
                  </v-flex>

                  <v-flex xs12>
                    <!-- 启用内容选择搜索 -->
                    <v-switch
                      color="success"
                      v-model="options.allowSelectionTextSearch"
                      :label="$t('settings.base.allowSelectionTextSearch')"
                    ></v-switch>

                    <v-switch
                      color="success"
                      v-model="options.search.saveKey"
                      :label="$t('settings.base.saveSearchKey')"
                    ></v-switch>

                    <v-switch
                      color="success"
                      v-model="options.showMoiveInfoCardOnSearch"
                      :label="$t('settings.base.showMoiveInfoCardOnSearch')"
                    ></v-switch>

                    <!-- 在搜索之前一些选项配置 -->
                    <v-switch
                      color="success"
                      v-model="options.beforeSearchingOptions.getMovieInformation"
                      :label="$t('settings.base.getMovieInformationBeforeSearching')"
                    ></v-switch>
                    <v-flex xs12 v-if="options.beforeSearchingOptions.getMovieInformation">
                      <div style="margin: -40px 0 10px 45px;">
                        <span>{{ $t('settings.base.maxMovieInformationCount') }}</span>
                        <v-text-field
                          v-model="options.beforeSearchingOptions.maxMovieInformationCount"
                          class="ml-2 d-inline-flex"
                          style="max-width: 100px;max-height: 30px;"
                          type="number"
                        ></v-text-field>
                        <v-slider
                          style="display:none;"
                          v-model="options.beforeSearchingOptions.maxMovieInformationCount"
                          :max="20"
                          :min="1"
                        ></v-slider>
                      </div>
                    </v-flex>

                    <!-- 当点击预选条目时，搜索模式 -->
                    <v-flex xs12 v-if="options.beforeSearchingOptions.getMovieInformation">
                      <div style="margin: -20px 0 10px 45px;">
                        <span>{{ $t('settings.base.searchModeForItem') }}</span>
                        <v-select
                          v-model="options.beforeSearchingOptions.searchModeForItem"
                          :items="searchModes"
                          class="mx-2 d-inline-flex"
                          style="max-height: 30px;"
                        ></v-select>
                      </div>
                    </v-flex>
                  </v-flex>
                </v-layout>
              </v-container>
            </v-tab-item>

            <!-- 下载选项 -->
            <v-tab-item key="download">
              <v-container fluid grid-list-xs>
                <v-layout row wrap>
                  <v-flex xs12>
                    <!-- 保存下载历史 -->
                    <v-switch
                      color="success"
                      v-model="options.saveDownloadHistory"
                      :label="$t('settings.base.saveDownloadHistory')"
                    ></v-switch>

                    <!-- 下载失败重试 -->
                    <v-switch
                      color="success"
                      v-model="options.downloadFailedRetry"
                      :label="$t('settings.base.downloadFailedRetry')"
                    ></v-switch>

                    <!-- 下载失败重试选项 -->
                    <v-flex xs12 v-if="options.downloadFailedRetry">
                      <div style="margin: -35px 0 10px 45px;">
                        <span>{{ $t('settings.base.downloadFailedRetryTip1') }}</span>
                        <v-select
                          v-model="options.downloadFailedFailedRetryCount"
                          :items="[1,2,3,4,5]"
                          class="mx-2 d-inline-flex"
                          style="max-width: 50px;max-height: 20px;"
                        ></v-select>
                        <span>{{ $t('settings.base.downloadFailedRetryTip2') }}</span>
                        <v-text-field
                          v-model="options.downloadFailedFailedRetryInterval"
                          class="ml-2 d-inline-flex"
                          style="max-width: 50px;max-height: 20px;"
                          type="number"
                        ></v-text-field>
                        <span>{{ $t('settings.base.downloadFailedRetryTip3') }}</span>
                      </div>
                    </v-flex>

                    <!-- 批量下载确认 -->
                    <v-switch
                      color="success"
                      v-model="options.needConfirmWhenExceedSize"
                      :label="$t('settings.base.needConfirmWhenExceedSize')"
                    ></v-switch>

                    <v-flex xs12 v-if="options.needConfirmWhenExceedSize">
                      <div style="margin: -40px 0 10px 40px;">
                        <v-text-field
                          v-model="options.exceedSize"
                          :placeholder="$t('settings.base.exceedSize')"
                          class="ml-2 d-inline-flex"
                          style="max-width: 100px;max-height: 30px;"
                        ></v-text-field>
                        <v-select
                          v-model="options.exceedSizeUnit"
                          :items="units"
                          class="mx-2 d-inline-flex"
                          style="max-width: 50px;max-height: 30px;"
                        ></v-select>
                      </div>
                    </v-flex>
                  </v-flex>
                </v-layout>
              </v-container>
            </v-tab-item>
          </v-tabs>
          <v-container fluid grid-list-xs>
            <v-layout row wrap></v-layout>
          </v-container>
        </v-form>
      </v-card-text>

      <v-divider></v-divider>

      <v-card-actions class="pa-3">
        <v-btn color="success" @click="save">
          <v-icon>check_circle_outline</v-icon>
          <span class="ml-1">{{ $t('settings.base.save') }}</span>
        </v-btn>
        <v-spacer></v-spacer>
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
import {
  ESizeUnit,
  EAction,
  Options,
  EBeforeSearchingItemSearchMode
} from "@/interface/common";
import Extension from "@/service/extension";

const extension = new Extension();

export default Vue.extend({
  data() {
    return {
      valid: false,
      rules: {
        require: [(v: any) => !!v || "!"]
      },
      options: {
        defaultClientId: "",
        search: {
          saveKey: true
        },
        needConfirmWhenExceedSize: false,
        autoRefreshUserData: false,
        autoRefreshUserDataHours: "00",
        autoRefreshUserDataMinutes: "00",
        autoRefreshUserDataFailedRetryCount: 3,
        autoRefreshUserDataFailedRetryInterval: 5,
        connectClientTimeout: 10000,
        beforeSearchingOptions: {
          getMovieInformation: true,
          maxMovieInformationCount: 5,
          searchModeForItem: EBeforeSearchingItemSearchMode.id
        },
        showToolbarOnContentPage: true,
        downloadFailedRetry: false,
        downloadFailedFailedRetryCount: 3,
        downloadFailedFailedRetryInterval: 5
      } as Options,
      units: [] as any,
      hours: [] as any,
      minutes: [] as any,
      downloadHistory: [] as any,
      haveError: false,
      haveSuccess: false,
      successMsg: "",
      errorMsg: "",
      lastUpdate: "",
      autoRefreshUserDataLastUpdate: "",
      activeTab: "base"
    };
  },
  methods: {
    save() {
      console.log(this.options);
      if (!(this.$refs.form as any).validate()) {
        this.activeTab = "base";
        (this.$refs.defaultClient as any).focus();
        return;
      }
      this.$store.dispatch("saveConfig", this.options);
      this.successMsg = this.$t("settings.base.saved").toString();
    },
    clearCache() {
      if (confirm(this.$t("settings.base.clearCacheConfirm").toString())) {
        APP.cache.clear();

        setTimeout(() => {
          extension
            .sendRequest(EAction.reloadConfig)
            .then(() => {
              this.successMsg = this.$t(
                "settings.base.cacheIsCleared"
              ).toString();
            })
            .catch();
        }, 200);
      }
    }
  },
  created() {
    this.options = Object.assign(this.options, this.$store.state.options);
    this.units.push(ESizeUnit.MiB);
    this.units.push(ESizeUnit.GiB);
    this.units.push(ESizeUnit.TiB);
    this.units.push(ESizeUnit.PiB);

    for (let index = 0; index < 24; index++) {
      this.hours.push(`0${index}`.substr(-2));
    }

    for (let index = 0; index < 60; index += 5) {
      this.minutes.push(`0${index}`.substr(-2));
    }

    extension.sendRequest(EAction.getDownloadHistory).then((result: any) => {
      console.log("downloadHistory", result);
      this.downloadHistory = result;
    });
    APP.cache
      .getLastUpdateTime()
      .then((time: number) => {
        if (time > 0) {
          this.lastUpdate = this.$t("settings.base.lastUpdate", {
            time: new Date(time).toLocaleString()
          }).toString();
        } else {
          this.lastUpdate = this.$t(
            "settings.base.lastUpdateUnknown"
          ).toString();
        }
      })
      .catch(() => {
        this.lastUpdate = this.$t("settings.base.lastUpdateFailed").toString();
      });

    if (this.options.autoRefreshUserDataLastTime) {
      this.autoRefreshUserDataLastUpdate = this.$t(
        "settings.base.autoRefreshUserDataLastUpdate",
        {
          time: new Date(
            this.options.autoRefreshUserDataLastTime
          ).toLocaleString()
        }
      ).toString();
    }
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
    },
    searchModes(): Array<any> {
      return [
        {
          value: EBeforeSearchingItemSearchMode.id,
          text: this.$t(
            "settings.base.beforeSearchingItemSearchMode.id"
          ).toString()
        },
        {
          value: EBeforeSearchingItemSearchMode.name,
          text: this.$t(
            "settings.base.beforeSearchingItemSearchMode.name"
          ).toString()
        }
      ];
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
