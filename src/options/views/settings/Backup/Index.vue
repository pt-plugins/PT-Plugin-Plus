<template>
  <div>
    <v-alert :value="true" type="info">{{ $t('settings.backup.title') }}</v-alert>
    <v-card>
      <v-card-actions class="pa-3">
        <input type="file" ref="fileRestore" style="display:none;" />
        <v-btn color="success" @click="createBackupFile">
          <v-icon>save</v-icon>
          <span class="ml-1">{{ $t('settings.backup.backup') }}</span>
        </v-btn>
        <v-btn color="info" @click="restore">
          <v-icon>restore</v-icon>
          <span class="ml-1">{{ $t('settings.backup.restore') }}</span>
        </v-btn>

        <v-divider class="mx-3 mt-0" vertical></v-divider>

        <v-menu offset-y>
          <template v-slot:activator="{ on }">
            <v-btn color="blue-grey" dark v-on="on">
              <v-icon>add</v-icon>
              <span class="ml-1">{{ $t('settings.backup.server.add.title') }}</span>
            </v-btn>
          </template>
          <v-list>
            <v-list-tile
              v-for="(item, index) in backupServerTypes"
              :key="index"
              @click="showAddServer(item.type)"
            >
              <v-list-tile-title>{{ item.type }}</v-list-tile-title>
            </v-list-tile>
          </v-list>
        </v-menu>

        <v-spacer></v-spacer>
        <div v-if="!isDevelopmentMode">
          <v-btn
            color="success"
            @click="backupToGoogle"
            :loading="status.backupToGoogle"
            :disabled="status.backupToGoogle"
            :title="$t('settings.backup.backupToGoogle')"
          >
            <v-icon>backup</v-icon>
            <span class="ml-1">{{ $t('settings.backup.backupToGoogle') }}</span>
          </v-btn>
          <v-btn
            color="info"
            @click="restoreFromGoogle"
            :loading="status.restoreFromGoogle"
            :disabled="status.restoreFromGoogle"
            :title="$t('settings.backup.restoreFromGoogle')"
          >
            <v-icon>cloud_download</v-icon>
            <span class="ml-1">{{ $t('settings.backup.restoreFromGoogle') }}</span>
          </v-btn>

          <v-btn
            color="error"
            @click="clearFromGoogle"
            :loading="status.clearFromGoogle"
            :disabled="status.clearFromGoogle"
            :title="$t('settings.backup.clearFromGoogleTip')"
          >
            <v-icon>delete_sweep</v-icon>
            <span class="ml-1">{{ $t('settings.backup.clearFromGoogle') }}</span>
          </v-btn>
        </div>
      </v-card-actions>

      <WorkingStatus ref="workingStatus" />

      <v-data-table
        v-model="selected"
        :headers="headers"
        :items="servers"
        :pagination.sync="pagination"
        item-key="id"
        select-all
        class="elevation-1"
      >
        <template slot="items" slot-scope="props">
          <td style="width:20px;">
            <v-checkbox v-model="props.selected" primary hide-details></v-checkbox>
          </td>
          <td>
            <a @click="editBackupServer(props.item)">{{ props.item.name }}</a>
          </td>
          <td>
            <v-btn
              flat
              icon
              small
              @click="backupToServer(props.item)"
              :loading="props.item.backingup"
              color="success"
              class="mx-0"
              :title="$t('settings.backup.server.list.backupToServer')"
            >
              <v-icon small>backup</v-icon>
            </v-btn>
            <v-btn
              flat
              icon
              small
              @click="getBackupServerFileList(props)"
              :loading="props.item.loading"
              color="info"
              class="mx-0"
              :title="$t('settings.backup.server.list.loadBackupList')"
            >
              <v-icon small>restore</v-icon>
            </v-btn>
            <v-btn
              flat
              icon
              small
              @click="editBackupServer(props.item)"
              color="grey"
              class="mx-0"
              :title="$t('common.edit')"
            >
              <v-icon small>edit</v-icon>
            </v-btn>
            <v-btn
              flat
              icon
              small
              @click="removeBackupServer(props.item)"
              :loading="props.item.deleting"
              color="error"
              class="mx-0"
              :title="$t('common.remove')"
            >
              <v-icon small>delete</v-icon>
            </v-btn>
          </td>
          <td>{{ props.item.type }}</td>
          <td>{{ props.item.lastBackupTime | formatDate }}</td>
        </template>
        <template slot="expand" slot-scope="props">
          <div class="px-5" style="padding-left: 80px !important;">
            <ServerList
              :items="props.item.dataList"
              :server="props.item"
              :loading="props.item.loading"
              :downloading="props.item.restoring"
              @download="restoreFromServer"
              @delete="deleteFileFromBackupServer"
            />
          </div>
        </template>
      </v-data-table>
    </v-card>
    <v-alert :value="true" color="grey">{{ $t('settings.backup.subTitle') }}</v-alert>
    <v-snackbar v-model="haveError" top :timeout="3000" color="error">{{ errorMsg }}</v-snackbar>
    <v-snackbar v-model="haveSuccess" bottom :timeout="3000" color="success">{{ successMsg }}</v-snackbar>

    <!-- 新增备份服务器 -->
    <ServerAdd v-model="showServerAdd" :type="currentServerType" @save="addBackupServer" />
    <!-- 编辑备份服务器 -->
    <ServerEdit
      v-model="showServerEdit"
      :type="currentServerType"
      :initData="selectedItem"
      @save="updateBackupServer"
    />
  </div>
</template>
<script lang="ts">
import FileSaver from "file-saver";
import Vue from "vue";
import Extension from "@/service/extension";
import {
  EAction,
  EModule,
  Options,
  IBackupServer,
  EBackupServerType,
  ERestoreContent,
  EBrowserType,
  IWorkingStatusItem,
  EWorkingStatus,
  Site,
  EInstallType
} from "@/interface/common";
import { PPF } from "@/service/public";
import { FileDownloader } from "@/service/downloader";

import ServerAdd from "./Server/Add.vue";
import ServerEdit from "./Server/Edit.vue";
import ServerList from "./Server/List.vue";

import { BackupFileParser } from "@/service/backupFileParser";
import WorkingStatus from "@/options/components/WorkingStatus.vue";
import { APP } from "@/service/api";

interface IBackupServerPro extends IBackupServer {
  loading?: boolean;
  dataList?: any[];
  backingup?: boolean;
  restoring?: boolean;
  deleting?: boolean;
}

const extension = new Extension();
const backupFileParser = new BackupFileParser();

export default Vue.extend({
  components: {
    WorkingStatus,
    ServerAdd,
    ServerEdit,
    ServerList
  },
  data() {
    return {
      fileName: "PT-plugin-plus-config.json",
      fileInput: null as any,
      zipFileName: "PT-Plugin-Plus-Config.zip",
      errorMsg: "",
      haveError: false,
      haveSuccess: false,
      successMsg: "",
      status: {
        backupToGoogle: false,
        restoreFromGoogle: false,
        clearFromGoogle: false
      },
      isDevelopmentMode: true,
      pagination: {
        rowsPerPage: -1
      },
      selected: [] as any,
      showServerAdd: false,
      showServerEdit: false,
      currentServerType: EBackupServerType.OWSS,
      servers: [] as any,
      selectedItem: {} as IBackupServer,
      backupServerTypes: [
        {
          type: EBackupServerType.OWSS
        },
        {
          type: EBackupServerType.WebDAV
        }
      ],
      workingStatus: null as any
    };
  },
  mounted() {
    this.fileInput = this.$refs.fileRestore;
    this.fileInput.addEventListener("change", this.restoreFile);
    this.workingStatus = this.$refs.workingStatus;
  },
  beforeDestroy() {
    this.fileInput.removeEventListener("change", this.restoreFile);
  },
  created() {
    APP.getInstallType()
      .then(result => {
        this.isDevelopmentMode = [
          EInstallType.development,
          EInstallType.crx
        ].includes(result);
      })
      .catch(() => {
        console.log("获取安装方式失败");
      });

    this.initBackupServers();
  },
  methods: {
    t(key: string): string {
      return this.$t(key).toString();
    },
    /**
     * 初始化备份服务器列表
     */
    initBackupServers() {
      if (
        this.$store.state.options.backupServers &&
        this.$store.state.options.backupServers.length > 0
      ) {
        this.servers = [];
        this.$store.state.options.backupServers.forEach(
          (item: IBackupServer) => {
            this.servers.push(
              Object.assign(
                {
                  loading: false,
                  backingup: false,
                  deleting: false,
                  restoring: false,
                  dataList: []
                },
                JSON.parse(JSON.stringify(item))
              )
            );
          }
        );
      }
    },
    backup() {
      this.clearMessage();
      extension
        .sendRequest(EAction.getClearedOptions)
        .then((options: any) => {
          const Blob = window.Blob;
          delete options.system;
          const data = new Blob([JSON.stringify(options)], {
            type: "text/plain"
          });
          FileSaver.saveAs(data, this.fileName);
          this.successMsg = this.$t("settings.backup.backupDone").toString();
        })
        .catch(() => {
          this.errorMsg = this.$t("settings.backup.backupError").toString();
        });
    },
    restore() {
      this.fileInput.click();
    },
    restoreFile(event: Event) {
      this.clearMessage();
      let restoreFile: any = event.srcElement;
      if (
        restoreFile.files.length > 0 &&
        restoreFile.files[0].name.length > 0
      ) {
        let file = restoreFile.files[0];
        if (file.name.substr(-4) === ".zip") {
          this.restoreFromZipFile(file);
          restoreFile.value = "";
          return;
        }
        var r = new FileReader();
        r.onload = (e: any) => {
          let result = JSON.parse(e.target.result);
          this.restoreConfirm({
            options: result
          });
        };
        r.onerror = () => {
          this.errorMsg = this.$t("settings.backup.loadError").toString();
        };
        r.readAsText(file);
        restoreFile.value = "";
      }
    },
    backupToGoogle() {
      this.clearMessage();
      this.status.backupToGoogle = true;
      extension
        .sendRequest(EAction.backupToGoogle)
        .then(() => {
          this.successMsg = this.$t("settings.backup.backupDone").toString();
        })
        .catch((error: any) => {
          console.log(error.msg);
          if (error.msg && error.msg.message) {
            switch (true) {
              case error.msg.message.indexOf("QUOTA_BYTES_PER_ITEM") != -1:
                this.errorMsg = this.$t(
                  "settings.backup.errorMessage.QUOTA_BYTES_PER_ITEM"
                ).toString();
                break;

              default:
                this.errorMsg = this.$t(
                  "settings.backup.backupError"
                ).toString();
                break;
            }
          } else {
            this.errorMsg = this.$t("settings.backup.backupError").toString();
          }
          extension.sendRequest(EAction.writeLog, null, {
            module: EModule.options,
            event: "backupToGoogle",
            msg: this.$t("settings.backup.backupError").toString(),
            data: error
          });
        })
        .finally(() => {
          this.status.backupToGoogle = false;
        });
    },
    restoreFromGoogle() {
      if (!confirm(this.$t("settings.backup.restoreConfirm").toString())) {
        return;
      }
      this.clearMessage();
      this.status.restoreFromGoogle = true;
      extension
        .sendRequest(EAction.restoreFromGoogle)
        .then((options: Options) => {
          this.successMsg = this.$t(
            "settings.backup.restoreSuccess"
          ).toString();
          this.$store.commit("updateOptions", options);
        })
        .catch((error: any) => {
          this.errorMsg = this.$t("settings.backup.restoreError").toString();
          extension.sendRequest(EAction.writeLog, null, {
            module: EModule.options,
            event: "restoreFromGoogle",
            msg: this.$t("settings.backup.restoreError").toString(),
            data: error
          });
        })
        .finally(() => {
          this.status.restoreFromGoogle = false;
        });
    },
    clearMessage() {
      this.successMsg = "";
      this.errorMsg = "";
    },
    clearFromGoogle() {
      if (
        !confirm(this.$t("settings.backup.clearFromGoogleConfirm").toString())
      ) {
        return;
      }
      this.clearMessage();
      this.status.clearFromGoogle = true;
      extension
        .sendRequest(EAction.clearFromGoogle)
        .then((options: Options) => {
          this.successMsg = this.$t(
            "settings.backup.clearFromGoogleSuccess"
          ).toString();
        })
        .catch((error: any) => {
          this.errorMsg = this.$t(
            "settings.backup.clearFromGoogleError"
          ).toString();
          extension.sendRequest(EAction.writeLog, null, {
            module: EModule.options,
            event: "clearFromGoogle",
            msg: this.$t("settings.backup.clearFromGoogleError").toString(),
            data: error
          });
        })
        .finally(() => {
          this.status.clearFromGoogle = false;
        });
    },
    /**
     * 创建备份文件
     */
    createBackupFile() {
      switch (PPF.browserName) {
        case EBrowserType.Chrome:
          extension
            .sendRequest(EAction.createBackupFile)
            .then(result => {
              console.log(result);
            })
            .catch(error => {
              console.log(error);
              this.errorMsg = this.$t("settings.backup.backupError").toString();
            });
          break;

        default:
          extension
            .sendRequest(EAction.getBackupRawData)
            .then(result => {
              backupFileParser
                .createBackupFileBlob(result)
                .then((blob: any) => {
                  FileSaver.saveAs(blob, PPF.getNewBackupFileName());
                });
              console.log(result);
            })
            .catch(error => {
              console.log(error);
              this.errorMsg = this.$t("settings.backup.backupError").toString();
            });
          break;
      }
    },
    /**
     * 从 zip 文件中恢复配置信息
     */
    restoreFromZipFile(file: any) {
      backupFileParser
        .loadZipData(
          file,
          this.$t("settings.backup.enterSecretKey").toString(),
          this.$store.state.options.encryptSecretKey
        )
        .then(result => {
          console.log(result);
          this.restoreConfirm(result);
        })
        .catch(error => {
          console.log(error);
          if (typeof error === "string") {
            if (this.$te(`settings.backup.restoreErrorType.${error}`)) {
              this.errorMsg = this.$t(
                `settings.backup.restoreErrorType.${error}`
              ).toString();
              return;
            }
          }
          this.errorMsg = this.$t("settings.backup.restoreError").toString();
        });
    },
    /**
     * 恢复配置确认
     */
    restoreConfirm(
      infos: any,
      restoreContent: ERestoreContent = ERestoreContent.all
    ) {
      // 如果指定了恢复内容，检测要恢复的内容是否存在
      switch (restoreContent) {
        case ERestoreContent.collection:
          if (!infos.collection) {
            this.errorMsg = this.$t(
              "settings.backup.contentNotExist.collection"
            ).toString();
            return;
          }
          break;

        case ERestoreContent.cookies:
          if (!infos.cookies) {
            this.errorMsg = this.$t(
              "settings.backup.contentNotExist.cookies"
            ).toString();
            return;
          }
          break;

        case ERestoreContent.keepUploadTask:
          if (!infos.keepUploadTask) {
            this.errorMsg = this.$t(
              "settings.backup.contentNotExist.keepUploadTask"
            ).toString();
            return;
          }
          break;

        case ERestoreContent.searchResultSnapshot:
          if (!infos.searchResultSnapshot) {
            this.errorMsg = this.$t(
              "settings.backup.contentNotExist.searchResultSnapshot"
            ).toString();
            return;
          }
          break;

        case ERestoreContent.downloadHistory:
          if (!infos.downloadHistory) {
            this.errorMsg = this.$t(
              "settings.backup.contentNotExist.downloadHistory"
            ).toString();
            return;
          }
          break;
      }

      if (confirm(this.$t("settings.backup.restoreConfirm").toString())) {
        try {
          this.workingStatus.clear();
          // 恢复运行时配置
          if (
            infos.options &&
            (restoreContent == ERestoreContent.all ||
              restoreContent == ERestoreContent.options)
          ) {
            this.workingStatus.add({
              key: "options",
              title: this.t("settings.backup.backupItem.base")
            });

            let sites: Site[] = [];

            // 去除没有 host 字段的站点
            // 可能因自定义的站点之前出错导致 host 缺失
            infos.options.sites.forEach((site: Site) => {
              if (site.host) {
                sites.push(site);
              }
            });

            infos.options.sites = sites;
            // 不覆盖当前的密钥值
            infos.options.encryptSecretKey = this.$store.state.options.encryptSecretKey;

            this.$store.dispatch("resetRunTimeOptions", infos.options);
            this.workingStatus.update("options", EWorkingStatus.success);
          }

          // 恢复用户数据
          if (
            infos.datas &&
            (restoreContent == ERestoreContent.all ||
              restoreContent == ERestoreContent.userDatas)
          ) {
            this.workingStatus.add({
              key: "userDatas",
              title: this.t("settings.backup.backupItem.userDatas")
            });
            extension
              .sendRequest(EAction.resetUserDatas, null, infos.datas)
              .then(() => {
                this.workingStatus.update("userDatas", EWorkingStatus.success);
              })
              .catch(() => {
                this.workingStatus.update("userDatas", EWorkingStatus.error);
              });
          }

          // 恢复收藏
          if (
            infos.collection &&
            (restoreContent == ERestoreContent.all ||
              restoreContent == ERestoreContent.collection)
          ) {
            this.workingStatus.add({
              key: "collection",
              title: this.t("settings.backup.backupItem.collection")
            });
            extension
              .sendRequest(
                EAction.resetTorrentCollections,
                null,
                infos.collection
              )
              .then(() => {
                // 取消默认收藏分组信息
                this.$store.dispatch("saveConfig", {
                  defaultCollectionGroupId: ""
                });
                this.workingStatus.update("collection", EWorkingStatus.success);
              })
              .catch(() => {
                this.workingStatus.update("collection", EWorkingStatus.error);
              });
          }

          // 恢复搜索快照
          if (
            infos.searchResultSnapshot &&
            (restoreContent == ERestoreContent.all ||
              restoreContent == ERestoreContent.searchResultSnapshot)
          ) {
            this.workingStatus.add({
              key: "searchResultSnapshot",
              title: this.t("settings.backup.backupItem.searchResultSnapshot")
            });
            extension
              .sendRequest(
                EAction.resetSearchResultSnapshot,
                null,
                infos.searchResultSnapshot
              )
              .then(() => {
                this.workingStatus.update(
                  "searchResultSnapshot",
                  EWorkingStatus.success
                );
              })
              .catch(() => {
                this.workingStatus.update(
                  "searchResultSnapshot",
                  EWorkingStatus.error
                );
              });
          }

          // 恢复辅种任务
          if (
            infos.keepUploadTask &&
            (restoreContent == ERestoreContent.all ||
              restoreContent == ERestoreContent.keepUploadTask)
          ) {
            this.workingStatus.add({
              key: "keepUploadTask",
              title: this.t("settings.backup.backupItem.keepUploadTask")
            });
            extension
              .sendRequest(
                EAction.resetKeepUploadTask,
                null,
                infos.keepUploadTask
              )
              .then(() => {
                this.workingStatus.update(
                  "keepUploadTask",
                  EWorkingStatus.success
                );
              })
              .catch(() => {
                this.workingStatus.update(
                  "keepUploadTask",
                  EWorkingStatus.error
                );
              });
          }

          // 恢复下载历史
          if (
            infos.downloadHistory &&
            (restoreContent == ERestoreContent.all ||
              restoreContent == ERestoreContent.downloadHistory)
          ) {
            this.workingStatus.add({
              key: "downloadHistory",
              title: this.t("settings.backup.backupItem.downloadHistory")
            });
            extension
              .sendRequest(
                EAction.resetDownloadHistory,
                null,
                infos.downloadHistory
              )
              .then(() => {
                this.workingStatus.update(
                  "downloadHistory",
                  EWorkingStatus.success
                );
              })
              .catch(() => {
                this.workingStatus.update(
                  "downloadHistory",
                  EWorkingStatus.error
                );
              });
          }

          // 恢复Cookies，需要放到最后一项
          if (
            infos.cookies &&
            (restoreContent == ERestoreContent.all ||
              restoreContent == ERestoreContent.cookies) &&
            PPF.checkOptionalPermission("cookies")
          ) {
            // 当恢复所有内容，并且包含cookies时，需要确认是否恢复
            if (
              restoreContent == ERestoreContent.all &&
              !confirm(
                this.$t("settings.backup.restoreCookiesConfirm").toString()
              )
            ) {
              this.successMsg = this.$t(
                "settings.backup.restoreSuccess"
              ).toString();
              return;
            }
            this.workingStatus.add({
              key: "cookies",
              title: this.t("settings.backup.backupItem.cookies")
            });
            PPF.usePermissions(
              ["cookies"],
              true,
              this.$t("permissions.request.cookies").toString()
            )
              .then(() => {
                return extension.sendRequest(
                  EAction.restoreCookies,
                  null,
                  infos.cookies
                );
              })
              .then(() => {
                this.successMsg = this.$t(
                  "settings.backup.restoreSuccess"
                ).toString();
                this.workingStatus.update("cookies", EWorkingStatus.success);
              })
              .catch(() => {
                this.errorMsg = this.$t(
                  "settings.backup.restoreError"
                ).toString();
                this.workingStatus.update("cookies", EWorkingStatus.error);
              });
            return;
          }

          this.successMsg = this.$t(
            "settings.backup.restoreSuccess"
          ).toString();
        } catch (error) {
          this.errorMsg = this.$t("settings.backup.restoreError").toString();
        }
      }
    },
    /**
     * 添加备份服务器
     */
    addBackupServer(server: IBackupServer) {
      this.$store.dispatch("addBackupServer", server).then(() => {
        this.initBackupServers();
      });
    },
    /**
     * 修改备份服务器
     */
    editBackupServer(server: IBackupServer) {
      this.selectedItem = server;
      this.currentServerType = server.type;
      this.showServerEdit = true;
    },
    /**
     * 更新备份服务器
     */
    updateBackupServer(server: IBackupServer) {
      this.$store.dispatch("updateBackupServer", server).then(() => {
        this.initBackupServers();
      });
    },
    /**
     * 删除备份服务器
     */
    removeBackupServer(server: IBackupServer) {
      if (confirm(this.$t("common.removeConfirm").toString())) {
        let index = this.servers.findIndex((item: IBackupServer) => {
          return item.id === server.id;
        });
        this.$store.dispatch("removeBackupServer", server);
        this.servers.splice(index, 1);
      }
    },
    /**
     * 备份到服务器
     */
    backupToServer(server: IBackupServerPro) {
      server.backingup = true;
      extension
        .sendRequest(EAction.backupToServer, null, server)
        .then((result: any) => {
          server.lastBackupTime = result.time;
          console.log(result);
        })
        .catch(() => {
          this.errorMsg = this.$t("settings.backup.backupError").toString();
        })
        .finally(() => {
          server.backingup = false;
        });
    },
    /**
     * 从服务器恢复指定的内容
     */
    restoreFromServer(
      server: IBackupServerPro,
      options: any,
      restoreContent: ERestoreContent = ERestoreContent.all
    ) {
      server.restoring = true;
      extension
        .sendRequest(EAction.restoreFromServer, null, {
          server,
          path: options.name
        })
        .then((result: any) => {
          this.restoreConfirm(result, restoreContent);
          // console.log(result);
        })
        .catch(error => {
          console.log(error);
          this.errorMsg = this.$t("settings.backup.restoreError").toString();
        })
        .finally(() => {
          server.restoring = false;
        });
    },
    /**
     * 获取已备份的文件列表
     */
    getBackupServerFileList(prop: any) {
      let server: IBackupServerPro = prop.item;
      prop.expanded = true;
      server.loading = true;
      extension
        .sendRequest(EAction.getBackupListFromServer, null, {
          server,
          pageSize: 5,
          search: "PT-Plugin-Plus"
        })
        .then((result: any) => {
          prop.item.dataList = result;
          console.log(result);
        })
        .catch(() => {
          this.errorMsg = this.$t(
            "settings.backup.server.getFileListError"
          ).toString();
        })
        .finally(() => {
          server.loading = false;
        });
    },
    showAddServer(type: EBackupServerType) {
      this.currentServerType = type;
      this.showServerAdd = true;
    },
    deleteFileFromBackupServer(
      server: IBackupServerPro,
      options: any,
      index: number
    ) {
      if (!confirm(this.$t("common.removeConfirm").toString())) {
        return;
      }
      extension
        .sendRequest(EAction.deleteFileFromBackupServer, null, {
          server,
          path: options.name
        })
        .then((result: any) => {
          if (server.dataList && server.dataList[index]) {
            server.dataList.splice(index, 1);
          }
          console.log(result);
        })
        .catch(error => {
          console.log(error);
          // this.errorMsg = this.$t("settings.backup.restoreError").toString();
        })
        .finally(() => {
          server.loading = false;
        });
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
    headers(): Array<any> {
      return [
        {
          text: this.$t("settings.backup.index.headers.name"),
          align: "left",
          width: 280,
          value: "name"
        },
        {
          text: this.$t("settings.backup.index.headers.action"),
          value: "name",
          sortable: false
        },
        {
          text: this.$t("settings.backup.index.headers.type"),
          align: "left",
          value: "type"
        },
        {
          text: this.$t("settings.backup.index.headers.lastBackupTime"),
          align: "left",
          value: "lastBackupTime"
        }
      ];
    }
  }
});
</script>
