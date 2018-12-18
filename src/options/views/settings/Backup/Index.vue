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
        <v-btn color="success" @click="backupToGoogle">
          <v-icon>backup</v-icon>
          <span class="ml-1">{{ words.backupToGoogle }}</span>
        </v-btn>
        <v-btn color="info" @click="restoreFromGoogle">
          <v-icon>cloud_download</v-icon>
          <span class="ml-1">{{ words.restoreFromGoogle }}</span>
        </v-btn>
      </v-card-actions>
    </v-card>
    <v-alert :value="true" color="grey">{{words.subTitle}}</v-alert>
  </div>
</template>
<script lang="ts">
import FileSaver from "file-saver";
import Vue from "vue";
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
          "确认要从这个文件中恢复配置吗？这将覆盖当前所有设置信息。"
      },
      fileName: "PT-plugin-plus-config.json",
      fileInput: null as any
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
      const Blob = window.Blob;
      const options = Object.assign({}, this.$store.state.options);
      delete options.system;
      const data = new Blob([JSON.stringify(options)], {
        type: "text/plain"
      });
      FileSaver.saveAs(data, this.fileName);
    },
    restore() {
      this.fileInput.click();
    },
    restoreFile(event: Event) {
      let restoreFile: any = event.srcElement;
      if (
        restoreFile.files.length > 0 &&
        restoreFile.files[0].name.length > 0
      ) {
        var r = new FileReader();
        r.onload = (e: any) => {
          if (confirm(this.words.restoreConfirm)) {
            let result = JSON.parse(e.target.result);
            this.$store.commit("resetConfig", result);
            // let system = this.$store.state.options.system;
            console.log(result);
          }
        };
        r.onerror = function() {
          console.log("配置信息加载失败");
        };
        r.readAsText(restoreFile.files[0]);
        restoreFile.value = "";
      }
    },
    backupToGoogle() {},
    restoreFromGoogle() {}
  }
});
</script>
