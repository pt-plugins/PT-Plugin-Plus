<template>
  <div class="set-download-clients">
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
        <v-spacer></v-spacer>

        <v-text-field class="search" append-icon="search" label="Search" single-line hide-details></v-text-field>
      </v-card-title>

      <v-data-table
        v-model="selected"
        :headers="headers"
        :items="items"
        :pagination.sync="pagination"
        item-key="data.title"
        select-all
        class="elevation-1"
      >
        <template slot="items" slot-scope="props">
          <td style="width:20px;">
            <v-checkbox v-model="props.selected" primary hide-details></v-checkbox>
          </td>
          <td>{{ props.item.data.title }}</td>
          <td>{{ props.item.time | formatDate }}</td>
          <td>
            <v-icon small color="error" @click="removeConfirm(props.item)">delete</v-icon>
          </td>
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
  </div>
</template>
<script lang="ts">
import Vue from "vue";
import { EAction } from "@/interface/common";
import Extension from "@/service/extension";

const extension = new Extension();
export default Vue.extend({
  data() {
    return {
      words: {
        title: "下载历史",
        remove: "删除",
        clear: "清除",
        removeConfirm: "确认要删除这条记录吗？",
        removeConfirmTitle: "删除确认",
        clearConfirm: "确认要删除所有下载记录吗？",
        ok: "确认",
        cancel: "取消"
      },
      selected: [],
      selectedItem: {} as any,
      pagination: {
        rowsPerPage: 10
      },
      headers: [
        { text: "标题", align: "left", value: "data.title" },
        { text: "下载时间", align: "left", value: "time" },
        { text: "操作", value: "name", sortable: false }
      ],
      items: [],
      dialogRemoveConfirm: false
    };
  },

  methods: {
    clear() {
      if (confirm(this.words.clearConfirm)) {
        extension
          .sendRequest(EAction.clearDownloadHistory)
          .then((result: any) => {
            console.log("clearDownloadHistory", result);
            this.items = result;
          });
      }
    },
    remove() {
      extension
        .sendRequest(EAction.removeDownloadHistory, null, [this.selectedItem])
        .then((result: any) => {
          console.log("removeDownloadHistory", result);
          this.items = result;
        });
      this.dialogRemoveConfirm = false;
    },

    removeConfirm(item: any) {
      this.selectedItem = item;
      this.dialogRemoveConfirm = true;
    },
    getDownloadHistory() {
      extension.sendRequest(EAction.getDownloadHistory).then((result: any) => {
        console.log("downloadHistory", result);
        this.items = result;
      });
    }
  },

  created() {
    this.getDownloadHistory();
  }
});
</script>
