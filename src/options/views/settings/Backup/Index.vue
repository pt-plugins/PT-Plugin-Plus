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
          <td>{{ props.item.type }}</td>
          <td>{{ props.item.lastBackupTime | formatDate }}</td>
          <td>
            <v-btn
              flat
              icon
              small
              @click="backupToServer(props.item)"
              :loading="props.item.backingup"
              color="success"
              class="mx-0"
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
            >
              <v-icon small>restore</v-icon>
            </v-btn>
            <v-btn flat icon small @click="editBackupServer(props.item)" color="grey" class="mx-0">
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
            >
              <v-icon small>delete</v-icon>
            </v-btn>
          </td>
        </template>
        <template slot="expand" slot-scope="props">
          <div class="px-5">
            <OWSSList
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

    <!-- 新增 -->
    <AddOWSS v-model="showAddOWSS" @save="addBackupServer" />
    <!-- 新增 -->
    <EditOWSS v-model="showEditOWSS" :initData="selectedItem" @save="updateBackupServer" />
  </div>
</template>
<script lang="ts">
import FileSaver from "file-saver";
import Vue from "vue";
import Extension from "@/service/extension";
import JSZip from "jszip";
import md5 from "blueimp-md5";
import {
  EAction,
  EModule,
  Options,
  IBackupServer,
  EBackupServerType
} from "@/interface/common";
import { PPF } from "@/service/public";
import { FileDownloader } from "@/service/downloader";
import AddOWSS from "./OWSS/Add.vue";
import EditOWSS from "./OWSS/Edit.vue";
import OWSSList from "./OWSS/List.vue";
import { OWSS } from "@/background/plugins/OWSS";

interface IBackupServerPro extends IBackupServer {
  loading?: boolean;
  dataList?: any[];
  backingup?: boolean;
  restoring?: boolean;
  deleting?: boolean;
}

const extension = new Extension();

interface IHashData {
  hash: string;
  keyMap: number[];
  length: number;
}

interface IManifest {
  checkInfo: IHashData;
  version: string;
  time: number;
  hash?: string;
}

export default Vue.extend({
  components: {
    AddOWSS,
    EditOWSS,
    OWSSList
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
      isDevelopmentMode: false,
      pagination: {
        rowsPerPage: -1
      },
      selected: [] as any,
      showAddOWSS: false,
      showEditOWSS: false,
      servers: [] as any,
      selectedItem: {} as IBackupServer,
      backupServerTypes: [
        {
          type: "OWSS"
        }
      ]
    };
  },
  mounted() {
    this.fileInput = this.$refs.fileRestore;
    this.fileInput.addEventListener("change", this.restoreFile);
  },
  beforeDestroy() {
    this.fileInput.removeEventListener("change", this.restoreFile);
  },
  created() {
    if (chrome && chrome.management) {
      chrome.management.getSelf(result => {
        // 安装于开发者模式
        if (result.installType == "development") {
          this.isDevelopmentMode = true;
        }
      });
    }

    this.initBackupServers();
  },
  methods: {
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
      extension.sendRequest(EAction.createBackupFile).catch(error => {
        console.log(error);
        this.errorMsg = this.$t("settings.backup.backupError").toString();
      });
    },
    /**
     * 从 zip 文件中恢复配置信息
     */
    restoreFromZipFile(file: any) {
      JSZip.loadAsync(file)
        .then(zip => {
          let requests: any[] = [];
          requests.push(zip.file("manifest.json").async("text"));
          requests.push(zip.file("options.json").async("text"));
          requests.push(zip.file("userdatas.json").async("text"));

          if (zip.file("collection.json")) {
            requests.push(zip.file("collection.json").async("text"));
          }

          return Promise.all(requests);
        })
        .then(results => {
          extension
            .sendRequest(EAction.checkBackupData, null, results)
            .then(result => {
              console.log(result);
              this.restoreConfirm(result);
            })
            .catch(error => {
              console.log(error);
              this.errorMsg = this.$t(
                "settings.backup.restoreError"
              ).toString();
            });
        })
        .catch(error => {
          console.log(error);
          this.errorMsg = this.$t("settings.backup.restoreError").toString();
        });
    },
    /**
     * 恢复配置确认
     */
    restoreConfirm(infos: any) {
      if (confirm(this.$t("settings.backup.restoreConfirm").toString())) {
        try {
          this.$store.dispatch("resetRunTimeOptions", infos.options);
          if (infos.datas) {
            extension.sendRequest(EAction.resetUserDatas, null, infos.datas);
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
      this.showEditOWSS = true;
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
        this.$store.dispatch("removeBackupServer", server);
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
    restoreFromServer(server: IBackupServerPro, options: any) {
      server.restoring = true;
      extension
        .sendRequest(EAction.restoreFromServer, null, {
          server,
          path: options.name
        })
        .then((result: any) => {
          this.restoreConfirm(result);
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
      switch (type) {
        case EBackupServerType.OWSS:
          this.showAddOWSS = true;
          break;
      }
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
          value: "name"
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
        },
        {
          text: this.$t("settings.backup.index.headers.action"),
          value: "name",
          sortable: false
        }
      ];
    }
  }
});
</script>
