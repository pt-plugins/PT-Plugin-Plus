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

            <v-tab key="advanced">
              {{ $t('settings.base.tabs.advanced') }}
              <v-icon>memory</v-icon>
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
                      :step="1"
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

                    <!-- 插件显示位置 -->
                    <v-radio-group
                      v-model="options.position"
                      row
                      v-if="options.showToolbarOnContentPage"
                      class="ml-5"
                    >
                      <span class="mr-1">{{ $t('settings.base.position.label') }}</span>
                      <v-radio
                        :label="$t('settings.base.position.left')"
                        color="success"
                        value="left"
                      ></v-radio>
                      <v-radio
                        :label="$t('settings.base.position.right')"
                        color="success"
                        value="right"
                      ></v-radio>
                    </v-radio-group>

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

                    <!-- 允许备份Cookies -->
                    <v-switch
                      v-if="checkOptionalPermission('cookies')"
                      color="success"
                      v-model="options.allowBackupCookies"
                      :label="$t('settings.base.allowBackupCookies')"
                    ></v-switch>

                    <!-- 加密备份数据 -->
                    <v-switch
                      color="success"
                      v-model="options.encryptBackupData"
                      :label="$t('settings.base.encryptBackupData')"
                    ></v-switch>

                    <!-- 加密备份数据 -->
                    <v-flex xs12 v-if="options.encryptBackupData">
                      <div style="margin: -20px 0 10px 45px;">
                        <v-text-field
                          v-model="options.encryptSecretKey"
                          :label="$t('settings.base.encryptSecretKey')"
                          :placeholder="$t('settings.base.encryptTip')"
                          :type="showEncryptSecretKey ? 'text' : 'password'"
                          class="d-inline-flex"
                          style="min-width: 800px;"
                        >
                          <template v-slot:append>
                            <v-icon
                              @click="showEncryptSecretKey = !showEncryptSecretKey"
                            >{{showEncryptSecretKey ? 'visibility_off' : 'visibility'}}</v-icon>
                            <v-btn
                              flat
                              small
                              color="primary"
                              @click="createSecretKey"
                              style="min-width:unset;"
                            >{{ $t('settings.base.createSecretKey') }}</v-btn>

                            <v-btn
                              flat
                              small
                              color="success"
                              @click="copySecretKeyToClipboard"
                              style="min-width:unset;"
                            >{{ $t('common.copy') }}</v-btn>
                          </template>
                        </v-text-field>

                        <v-alert :value="true" type="info">{{ $t('settings.base.encryptTip') }}</v-alert>
                      </div>
                    </v-flex>
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
                      v-model="options.allowSaveSnapshot"
                      :label="$t('settings.base.allowSaveSnapshot')"
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
                    <!-- 批量下载时间间隔 -->
                    <v-flex xs12>
                      <v-text-field
                        v-model="options.batchDownloadInterval"
                        :label="$t('settings.base.batchDownloadInterval')"
                        :placeholder="$t('settings.base.batchDownloadInterval')"
                        type="number"
                      ></v-text-field>
                    </v-flex>

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

                    <!-- 启用后台下载任务 -->
                    <v-switch
                      color="success"
                      v-model="options.enableBackgroundDownload"
                      :label="$t('settings.base.enableBackgroundDownload')"
                    ></v-switch>

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

            <!-- 高级 -->
            <v-tab-item key="advanced">
              <v-container fluid grid-list-xs>
                <v-layout row wrap>
                  <v-flex xs12>
                    <!-- omdb api key -->
                    <v-textarea
                      v-model="apiKey.omdb"
                      :label="$t('settings.base.apiKey.omdb')"
                      auto-grow
                      box
                    ></v-textarea>

                    <!-- douban api key -->
                    <v-textarea
                      v-model="apiKey.douban"
                      :label="$t('settings.base.apiKey.douban')"
                      auto-grow
                      box
                    ></v-textarea>

                    <div class="mb-4 text-xs-right">
                      <v-btn
                        @click="verifyApiKey"
                        :loading="apiKeyVerifying"
                      >{{ $t('settings.base.verifyApiKey') }}</v-btn>
                    </div>

                    <v-alert :value="showVerifyingStatus" color="info" icon="info" outline>
                      <div>OMDb:</div>
                      <div v-html="apiKeyVerifyResults.omdb.join('<br>')"></div>
                      <v-divider></v-divider>
                      <div>Douban:</div>
                      <div v-html="apiKeyVerifyResults.douban.join('<br>')"></div>
                    </v-alert>

                    <v-alert :value="true" color="info" icon="info" outline>
                      <div v-html="$t('settings.base.apiKeyTip').toString().replace(/\n/g, '<br>')"></div>
                    </v-alert>
                  </v-flex>
                </v-layout>
              </v-container>
            </v-tab-item>
          </v-tabs>
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
  EBeforeSearchingItemSearchMode,
  EEncryptMode
} from "@/interface/common";
import Extension from "@/service/extension";
import { MovieInfoService } from "@/service/movieInfoService";
import { PPF } from "@/service/public";

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
        downloadFailedFailedRetryInterval: 5,
        apiKey: {},
        batchDownloadInterval: 0,
        enableBackgroundDownload: false,
        position: "right",
        allowBackupCookies: false,
        encryptBackupData: false,
        encryptMode: EEncryptMode.AES,
        encryptSecretKey: "",
        allowSaveSnapshot: true
      } as Options,
      units: [] as any,
      hours: [] as any,
      minutes: [] as any,
      haveError: false,
      haveSuccess: false,
      successMsg: "",
      errorMsg: "",
      lastUpdate: "",
      autoRefreshUserDataLastUpdate: "",
      activeTab: "base",
      apiKey: {
        omdb: "",
        douban: ""
      },
      apiKeyVerifyResults: {
        omdb: [] as any,
        douban: [] as any
      },
      apiKeyVerifying: false,
      showVerifyingStatus: false,
      showEncryptSecretKey: false
    };
  },
  methods: {
    save() {
      console.log(this.options);
      this.successMsg = "";
      if (!(this.$refs.form as any).validate()) {
        this.activeTab = "base";
        (this.$refs.defaultClient as any).focus();
      }

      if (!this.options.apiKey) {
        this.options.apiKey = {};
      }

      let omdbApiKeys: string[] = [];
      let doubanApiKeys: string[] = [];

      // 添加 omdb api key
      if (this.apiKey.omdb) {
        let items = this.apiKey.omdb.split("\n");
        items.forEach((item: string) => {
          if (/^[a-z0-9]{7,8}$/.test(item)) {
            omdbApiKeys.push(item);
          }
        });
      }

      // 添加 douban api key
      if (this.apiKey.douban) {
        let items = this.apiKey.douban.split("\n");
        items.forEach((item: string) => {
          if (/^[a-z0-9]{32}$/.test(item)) {
            doubanApiKeys.push(item);
          }
        });
      }

      this.options.apiKey.omdb = omdbApiKeys;
      this.options.apiKey.douban = doubanApiKeys;

      // 如果启用备份 Cookies，检测是否有权限
      if (this.options.allowBackupCookies) {
        PPF.usePermissions(
          ["cookies"],
          true,
          this.$t("permissions.request.cookies").toString()
        )
          .then(() => {
            this.$store.dispatch("saveConfig", this.options);
            this.successMsg = this.$t("settings.base.saved").toString();
          })
          .catch(() => {
            this.options.allowBackupCookies = false;
            this.$store.dispatch("saveConfig", this.options);
            this.successMsg = this.$t("settings.base.saved").toString();
          });
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
    },
    /**
     * 测试 Api Key
     */
    verifyApiKey() {
      let omdbKeys = this.apiKey.omdb.split("\n");
      let doubanKeys = this.apiKey.douban.split("\n");
      let count = omdbKeys.length + doubanKeys.length;
      if (count == 0) {
        return;
      }
      let movieSerice = new MovieInfoService();

      this.apiKeyVerifyResults = {
        omdb: [],
        douban: []
      };
      this.apiKeyVerifying = true;
      this.showVerifyingStatus = true;

      let doneCount = 0;
      omdbKeys.forEach((item: string) => {
        if (/^[a-z0-9]{7,8}$/.test(item)) {
          movieSerice
            .verifyOmdbApiKey(item)
            .then(() => {
              this.apiKeyVerifyResults.omdb.push(`「${item}」 ok.`);
            })
            .catch(error => {
              this.apiKeyVerifyResults.omdb.push(
                `<span style='color:red'>「${item}」 error. (${error})</span>`
              );
            })
            .finally(() => {
              doneCount++;
              if (doneCount === count) {
                this.apiKeyVerifying = false;
                window.setTimeout(() => {
                  this.showVerifyingStatus = false;
                }, 60000);
              }
            });
        } else {
          doneCount++;
        }
      });

      doubanKeys.forEach((item: string) => {
        if (/^[a-z0-9]{32}$/.test(item)) {
          movieSerice
            .verifyDoubanApiKey(item)
            .then(() => {
              this.apiKeyVerifyResults.douban.push(`「${item}」 ok.`);
            })
            .catch(error => {
              this.apiKeyVerifyResults.douban.push(
                `<span style='color:red'>「${item}」 error.</span>`
              );
            })
            .finally(() => {
              doneCount++;
              if (doneCount === count) {
                this.apiKeyVerifying = false;
                window.setTimeout(() => {
                  this.showVerifyingStatus = false;
                }, 60000);
              }
            });
        } else {
          doneCount++;
        }
      });

      if (doneCount === count) {
        this.apiKeyVerifying = false;
        this.showVerifyingStatus = false;
      }
    },

    /**
     * 随机生成一个密钥
     */
    createSecretKey() {
      this.options.encryptSecretKey = PPF.getRandomString();
    },

    /**
     * 复制密钥到剪切板
     */
    copySecretKeyToClipboard() {
      this.successMsg = "";
      extension
        .sendRequest(
          EAction.copyTextToClipboard,
          null,
          this.options.encryptSecretKey
        )
        .then(result => {
          this.successMsg = this.$t("common.copyed").toString();
        })
        .catch(() => {});
    },

    checkOptionalPermission(key: string): boolean {
      return PPF.checkOptionalPermission(key);
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

    if (this.options.apiKey) {
      if (this.options.apiKey.omdb && this.options.apiKey.omdb.length > 0) {
        this.apiKey.omdb = this.options.apiKey.omdb.join("\n");
      }

      if (this.options.apiKey.douban && this.options.apiKey.douban.length > 0) {
        this.apiKey.douban = this.options.apiKey.douban.join("\n");
      }
    }

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
    successMsg: {
      handler() {
        this.haveSuccess = this.successMsg != "";
      },
      deep: true,
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
