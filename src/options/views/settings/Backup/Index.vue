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
    </v-card>
    <v-alert :value="true" color="grey">{{ $t('settings.backup.subTitle') }}</v-alert>
    <v-snackbar v-model="haveError" top :timeout="3000" color="error">{{ errorMsg }}</v-snackbar>
    <v-snackbar v-model="haveSuccess" bottom :timeout="3000" color="success">{{ successMsg }}</v-snackbar>
  </div>
</template>
<script lang="ts">
import FileSaver from "file-saver";
import Vue from "vue";
import Extension from "@/service/extension";
import JSZip from "jszip";
import md5 from "blueimp-md5";
import { EAction, EModule, Options } from "@/interface/common";
import { PPF } from "@/service/public";
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
      isDevelopmentMode: false
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
  },
  methods: {
    /**
     * 获取当前配置信息，以文本形式返回
     */
    getOptionData(): Promise<any> {
      return new Promise<any>((resolve?: any, reject?: any) => {
        extension
          .sendRequest(EAction.getClearedOptions)
          .then((options: any) => {
            delete options.system;
            resolve(options);
          })
          .catch(() => {
            reject();
          });
      });
    },
    getUserData(): Promise<any> {
      return new Promise<any>((resolve?: any, reject?: any) => {
        extension
          .sendRequest(EAction.getUserHistoryData, null, "")
          .then((data: any) => {
            console.log(data);
            resolve(data);
          })
          .catch(() => {
            reject();
          });
      });
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
      const zip = new JSZip();
      let requests: any[] = [];
      requests.push(this.getOptionData());
      requests.push(this.getUserData());

      Promise.all(requests).then(results => {
        const options = JSON.stringify(results[0]);
        const datas = JSON.stringify(results[1]);
        // 配置
        zip.file("options.json", options);
        // 用户数据
        zip.file("userdatas.json", datas);

        // 创建检证用的文件
        const manifest = {
          checkInfo: this.createHash(options + datas),
          version: PPF.getVersion(),
          time: new Date().getTime()
        };
        zip.file("manifest.json", JSON.stringify(manifest));

        zip.generateAsync({ type: "blob" }).then(blob => {
          saveAs(blob, this.zipFileName);
        });
      });
    },
    /**
     * 创建用于验证数据对象
     */
    createHash(data: string): IHashData {
      const length = data.length;

      const keys: any[] = [];

      let result: IHashData = {
        hash: "",
        keyMap: [],
        length
      };

      for (let n = 0; n < 32; n++) {
        let index = Math.round(length * Math.random());
        keys.push(data.substr(index, 1));
        result.keyMap.push(index);
      }

      result.hash = md5(keys.join(""));

      return result;
    },
    /**
     * 简单验证数据，仅防止格式错误的数据
     */
    checkData(manifest: IManifest, data: string): boolean {
      if (!manifest) {
        return false;
      }

      if (!manifest.checkInfo) {
        return false;
      }

      const checkInfo = manifest.checkInfo;
      const length = data.length;

      if (length !== checkInfo.length) {
        return false;
      }

      const keys: any[] = [];

      try {
        if (checkInfo.keyMap.length !== 32) {
          return false;
        }
        for (let n = 0; n < 32; n++) {
          let index = checkInfo.keyMap[n];
          keys.push(data.substr(index, 1));
        }

        if (md5(keys.join("")) === checkInfo.hash) {
          return true;
        }
      } catch (error) {}

      return false;
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
          return Promise.all(requests);
        })
        .then(results => {
          try {
            const manifest = JSON.parse(results[0]);
            const options = JSON.parse(results[1]);
            const datas = JSON.parse(results[2]);

            if (this.checkData(manifest, results[1] + results[2])) {
              this.restoreConfirm({
                options,
                datas
              });
            } else {
              this.errorMsg = this.$t(
                "settings.backup.restoreError"
              ).toString();
            }
          } catch (error) {
            this.errorMsg = this.$t("settings.backup.restoreError").toString();
          }
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
    }
  },
  watch: {
    successMsg() {
      this.haveSuccess = this.successMsg != "";
    },
    errorMsg() {
      this.haveError = this.errorMsg != "";
    }
  }
});
</script>
