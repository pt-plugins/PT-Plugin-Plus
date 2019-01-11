<template>
  <div class="system-logs">
    <v-alert :value="true" type="info">{{ words.title }}</v-alert>
    <v-card>
      <v-card-title>
        <v-btn color="error" :disabled="selected.length==0">
          <v-icon class="mr-2">remove</v-icon>
          {{ words.remove }}
        </v-btn>

        <v-btn color="error" @click="clear" :disabled="items.length==0">
          <v-icon class="mr-2">clear</v-icon>
          {{ words.clear }}
        </v-btn>

        <v-btn color="success" @click="save">
          <v-icon>save</v-icon>
          <span class="ml-1">{{ words.save }}</span>
        </v-btn>
        <v-spacer></v-spacer>

        <v-text-field class="search" append-icon="search" label="Search" single-line hide-details></v-text-field>
      </v-card-title>

      <v-data-table
        v-model="selected"
        :headers="headers"
        :items="items"
        :pagination.sync="pagination"
        item-key="time"
        select-all
        class="elevation-1"
        :rows-per-page-items="options.rowsPerPageItems"
        @update:pagination="updatePagination"
      >
        <template slot="items" slot-scope="props">
          <tr @click="props.expanded = !props.expanded">
            <td style="width:20px;">
              <v-checkbox v-model="props.selected" primary hide-details></v-checkbox>
            </td>
            <td>{{ props.item.module }}</td>
            <td>{{ props.item.event }}</td>
            <td>{{ props.item.time | formatDate("YYYY-MM-DD HH:mm:ss") }}</td>
            <td>{{ props.item.msg }}</td>
            <td>
              <v-icon small color="error" @click="removeConfirm(props.item)">delete</v-icon>
            </td>
          </tr>
        </template>
        <template slot="expand" slot-scope="props">
          <v-card flat>
            <v-card-text>{{getErrorDetail(props.item.data)}}</v-card-text>
          </v-card>
        </template>
      </v-data-table>
    </v-card>

    <!-- 删除确认 -->
    <v-dialog v-model="dialogRemoveConfirm" width="300">
      <v-card>
        <v-card-title class="headline red lighten-2">{{ words.removeConfirmTitle }}</v-card-title>

        <v-card-text>{{ words.removeConfirm }}</v-card-text>

        <v-divider></v-divider>

        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn flat color="info" @click="dialogRemoveConfirm=false">
            <v-icon>cancel</v-icon>
            <span class="ml-1">{{ words.cancel }}</span>
          </v-btn>
          <v-btn color="error" flat @click="remove">
            <v-icon>check_circle_outline</v-icon>
            <span class="ml-1">{{ words.ok }}</span>
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-snackbar v-model="haveError" top :timeout="3000" color="error">{{ errorMsg }}</v-snackbar>
    <v-snackbar v-model="haveSuccess" bottom :timeout="3000" color="success">{{ successMsg }}</v-snackbar>
  </div>
</template>
<script lang="ts">
import Vue from "vue";
import { EAction, DownloadOptions, EPaginationKey } from "@/interface/common";
import Extension from "@/service/extension";
import FileSaver from "file-saver";

const extension = new Extension();
export default Vue.extend({
  data() {
    return {
      words: {
        title: "系统日志",
        remove: "删除",
        clear: "清除",
        removeConfirm: "确认要删除这条记录吗？",
        removeConfirmTitle: "删除确认",
        clearConfirm: "确认要删除所有记录吗？",
        ok: "确认",
        cancel: "取消",
        save: "保存日志"
      },
      selected: [],
      selectedItem: {} as any,
      pagination: {
        rowsPerPage: 10,
        sortBy: "time",
        descending: true
      },
      headers: [
        { text: "模块", align: "left", value: "module" },
        { text: "事件", align: "left", value: "event" },
        { text: "时间", align: "left", value: "time" },
        { text: "描述", align: "left", value: "msg" },
        { text: "操作", value: "name", sortable: false }
      ],
      items: [],
      dialogRemoveConfirm: false,
      options: this.$store.state.options,
      errorMsg: "",
      haveError: false,
      haveSuccess: false,
      successMsg: ""
    };
  },

  methods: {
    clear() {
      if (confirm(this.words.clearConfirm)) {
        extension.sendRequest(EAction.clearSystemLogs).then((result: any) => {
          this.items = result;
        });
      }
    },
    remove() {
      extension
        .sendRequest(EAction.removeSystemLogs, null, [this.selectedItem])
        .then((result: any) => {
          console.log("removeSystemLogs", result);
          this.items = result;
        });
      this.dialogRemoveConfirm = false;
    },

    removeConfirm(item: any) {
      this.selectedItem = item;
      this.dialogRemoveConfirm = true;
    },
    getSystemLogs() {
      extension.sendRequest(EAction.getSystemLogs).then((result: any) => {
        this.items = result;
      });
    },
    save() {
      const Blob = window.Blob;
      const data = new Blob([JSON.stringify(this.items)], {
        type: "text/plain"
      });
      FileSaver.saveAs(data, "PT-Plugin-Plus-System-Logs.json");
    },
    updatePagination(value: any) {
      console.log(value);
      this.$store.dispatch("updatePagination", {
        key: EPaginationKey.systemLogs,
        options: value
      });
    },
    getErrorDetail(data: any): string {
      let result = "";
      if (data) {
        try {
          result = JSON.stringify(data);
        } catch (error) {
          result = "";
        }
      }
      return result;
    }
  },

  created() {
    this.getSystemLogs();
    this.pagination = this.$store.getters.pagination(
      EPaginationKey.systemLogs,
      {
        rowsPerPage: 10,
        sortBy: "time",
        descending: true
      }
    );
  }
});
</script>
<style lang="scss" scoped>
.system-logs {
  .sub-title {
    color: #aaaaaa;
    font-size: 12px;
  }
}
</style>
