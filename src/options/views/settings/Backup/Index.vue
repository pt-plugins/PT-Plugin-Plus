<template>
  <div>
    <v-alert :value="true" type="info">{{ words.title }}</v-alert>
    <v-card>
      <v-card-actions class="pa-3">
        <input type="file" ref="fileRestore" style="display:none;">
        <v-btn color="success" @click="backup">
          <v-icon>save</v-icon>
          <span class="ml-1">{{ words.backup }}</span>
        </v-btn>
        <v-btn color="info" @click="restore">
          <v-icon>restore</v-icon>
          <span class="ml-1">{{ words.restore }}</span>
        </v-btn>
        <v-spacer></v-spacer>
        <v-btn
          color="success"
          @click="backupToGoogle"
          :loading="status.backupToGoogle"
          :disabled="status.backupToGoogle"
          :title="words.backupToGoogle"
        >
          <v-icon>backup</v-icon>
          <span class="ml-1">{{ words.backupToGoogle }}</span>
        </v-btn>
        <v-btn
          color="info"
          @click="restoreFromGoogle"
          :loading="status.restoreFromGoogle"
          :disabled="status.restoreFromGoogle"
          :title="words.restoreFromGoogle"
        >
          <v-icon>cloud_download</v-icon>
          <span class="ml-1">{{ words.restoreFromGoogle }}</span>
        </v-btn>

        <v-btn
          color="error"
          @click="clearFromGoogle"
          :loading="status.clearFromGoogle"
          :disabled="status.clearFromGoogle"
          :title="words.clearFromGoogleTip"
        >
          <v-icon>delete_sweep</v-icon>
          <span class="ml-1">{{ words.clearFromGoogle }}</span>
        </v-btn>
      </v-card-actions>
    </v-card>
    <v-alert :value="true" color="grey">{{words.subTitle}}</v-alert>
    <v-snackbar v-model="haveError" top :timeout="3000" color="error">{{ errorMsg }}</v-snackbar>
    <v-snackbar v-model="haveSuccess" bottom :timeout="3000" color="success">{{ successMsg }}</v-snackbar>
  </div>
</template>
<script lang="ts">
import FileSaver from "file-saver";
import Vue from "vue";
import Extension from "@/service/extension";
import { EAction, EModule, Options } from "@/interface/common";
const extension = new Extension();
export default Vue.extend({
  data() {
    return {
      words: {
        title: "参数备份与恢复",
        subTitle: "注：备份文件为明文，其中可能包含个人信息，请注意保管。",
        backup: "备份",
        restore: "恢复",
        backupToGoogle: "备份到Google",
        restoreFromGoogle: "从Google恢复",
        restoreConfirm:
          "确认要从备份数据中恢复配置吗？这将覆盖当前所有设置信息。",
        restoreSuccess: "参数已恢复",
        restoreError: "参数恢复失败！",
        loadError: "配置信息加载失败",
        backupDone: "备份完成",
        backupError: "备份参数失败！",
        errorMessage: {
          QUOTA_BYTES_PER_ITEM: "要保存的内容大小超出了Google限制（8K）"
        },
        clearFromGoogle: "清除",
        clearFromGoogleTip: "从Google中清除已备份的参数",
        clearFromGoogleConfirm: "是否要从Google中清除已备份的参数？",
        clearFromGoogleError: "清除失败！",
        clearFromGoogleSuccess: "内容已清除"
      },
      fileName: "PT-plugin-plus-config.json",
      fileInput: null as any,
      errorMsg: "",
      haveError: false,
      haveSuccess: false,
      successMsg: "",
      status: {
        backupToGoogle: false,
        restoreFromGoogle: false,
        clearFromGoogle: false
      }
    };
  },
  mounted() {
    this.fileInput = this.$refs.fileRestore;
    this.fileInput.addEventListener("change", this.restoreFile);
  },
  beforeDestroy() {
    this.fileInput.removeEventListener("change", this.restoreFile);
  },
  methods: {
    backup() {
      this.clearMessage();
      const Blob = window.Blob;
      const options = Object.assign({}, this.$store.state.options);
      delete options.system;
      const data = new Blob([JSON.stringify(options)], {
        type: "text/plain"
      });
      FileSaver.saveAs(data, this.fileName);
      this.successMsg = this.words.backupDone;
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
        var r = new FileReader();
        r.onload = (e: any) => {
          if (confirm(this.words.restoreConfirm)) {
            try {
              let result = JSON.parse(e.target.result);
              this.$store.commit("resetConfig", result);
              // let system = this.$store.state.options.system;
              console.log(result);
              this.successMsg = this.words.restoreSuccess;
            } catch (error) {
              this.errorMsg = this.words.restoreError;
            }
          }
        };
        r.onerror = () => {
          this.errorMsg = this.words.loadError;
        };
        r.readAsText(restoreFile.files[0]);
        restoreFile.value = "";
      }
    },
    backupToGoogle() {
      this.clearMessage();
      this.status.backupToGoogle = true;
      extension
        .sendRequest(EAction.backupToGoogle)
        .then(() => {
          this.successMsg = this.words.backupDone;
        })
        .catch((error: any) => {
          console.log(error.msg);
          if (error.msg && error.msg.message) {
            switch (true) {
              case error.msg.message.indexOf("QUOTA_BYTES_PER_ITEM") != -1:
                this.errorMsg = this.words.errorMessage.QUOTA_BYTES_PER_ITEM;
                break;

              default:
                this.errorMsg = this.words.backupError;
                break;
            }
          } else {
            this.errorMsg = this.words.backupError;
          }
          extension.sendRequest(EAction.writeLog, null, {
            module: EModule.options,
            event: "backupToGoogle",
            msg: this.words.backupError,
            data: error
          });
        })
        .finally(() => {
          this.status.backupToGoogle = false;
        });
    },
    restoreFromGoogle() {
      if (!confirm(this.words.restoreConfirm)) {
        return;
      }
      this.clearMessage();
      this.status.restoreFromGoogle = true;
      extension
        .sendRequest(EAction.restoreFromGoogle)
        .then((options: Options) => {
          this.successMsg = this.words.restoreSuccess;
          this.$store.commit("updateOptions", options);
        })
        .catch((error: any) => {
          this.errorMsg = this.words.restoreError;
          extension.sendRequest(EAction.writeLog, null, {
            module: EModule.options,
            event: "restoreFromGoogle",
            msg: this.words.restoreError,
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
      if (!confirm(this.words.clearFromGoogleConfirm)) {
        return;
      }
      this.clearMessage();
      this.status.clearFromGoogle = true;
      extension
        .sendRequest(EAction.clearFromGoogle)
        .then((options: Options) => {
          this.successMsg = this.words.clearFromGoogleSuccess;
        })
        .catch((error: any) => {
          this.errorMsg = this.words.clearFromGoogleError;
          extension.sendRequest(EAction.writeLog, null, {
            module: EModule.options,
            event: "clearFromGoogle",
            msg: this.words.clearFromGoogleError,
            data: error
          });
        })
        .finally(() => {
          this.status.clearFromGoogle = false;
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
  }
});
</script>
