<template>
  <div class="set-download-clients">
    <v-alert :value="true" type="info">{{ words.title }}</v-alert>
    <v-card>
      <v-card-title>
        <v-autocomplete
          v-model="selectedClient"
          :items="items"
          :label="words.selectedClient"
          :menu-props="{maxHeight:'auto'}"
          style="max-width: 500px;"
          :hint="selectedClient.address"
          return-object
          persistent-hint
          item-text="name"
          item-value="id"
        >
          <template slot="selection" slot-scope="{ item }">
            <span>{{ item.name }}</span>
          </template>
          <template slot="item" slot-scope="data">
            <v-list-tile-content>
              <v-list-tile-title v-html="data.item.name"></v-list-tile-title>
              <v-list-tile-sub-title v-html="data.item.address"></v-list-tile-sub-title>
            </v-list-tile-content>
            <v-list-tile-action>
              <v-list-tile-action-text>{{ data.item.allowCustomPath?data.item.type:words.notSupport }}</v-list-tile-action-text>
            </v-list-tile-action>
          </template>
        </v-autocomplete>

        <v-spacer></v-spacer>

        <v-btn
          color="success"
          @click="add"
          :disabled="!selectedClient.id||!selectedClient.allowCustomPath"
        >
          <v-icon class="mr-2">add</v-icon>
          {{ words.add }}
        </v-btn>
        <v-btn color="error" :disabled="selected.length==0">
          <v-icon class="mr-2">remove</v-icon>
          {{ words.remove }}
        </v-btn>
      </v-card-title>

      <v-data-table
        v-model="selected"
        :headers="headers"
        :items="getClientPaths"
        :pagination.sync="pagination"
        item-key="name"
        select-all
        class="elevation-1"
      >
        <template slot="items" slot-scope="props">
          <td style="width:20px;">
            <v-checkbox v-model="props.selected" primary hide-details></v-checkbox>
          </td>
          <td>
            <a @click="edit(props.item)">{{ props.item.name }}</a>
          </td>
          <td>
            <div v-for="(path, index) in props.item.paths" :key="index">{{path}}</div>
          </td>
          <td>
            <v-icon small class="mr-2" @click="edit(props.item)">edit</v-icon>
            <v-icon small color="error" @click="removeConfirm(props.item)">delete</v-icon>
          </td>
        </template>
      </v-data-table>
    </v-card>

    <!-- 新增 -->
    <AddItem v-model="showAddDialog" @save="addItem" :client="selectedClient"/>
    <!-- 编辑 -->
    <EditItem
      v-model="showEditDialog"
      :option="selectedItem"
      @save="updateItem"
      :client="selectedClient"
    />

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

    <v-snackbar v-model="itemDuplicate" top :timeout="3000" color="error">{{ words.itemDuplicate }}</v-snackbar>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import AddItem from "./Add.vue";
import EditItem from "./Edit.vue";
export default Vue.extend({
  components: {
    AddItem,
    EditItem
  },
  data() {
    return {
      words: {
        title: "下载目录设置",
        selectedClient: "需要设置的服务器",
        add: "新增",
        remove: "删除",
        clear: "清除",
        itemDuplicate: "该名称已存在",
        removeConfirm: "确认要删除这个下载服务器吗？",
        removeConfirmTitle: "删除确认",
        clearConfirm: "确认要删除所有下载服务器吗？",
        ok: "确认",
        cancel: "取消",
        notSupport: "暂不支持该服务器类型"
      },
      showAddDialog: false,
      showEditDialog: false,
      itemDuplicate: false,
      selected: [],
      selectedItem: {} as any,
      pagination: {
        rowsPerPage: -1
      },
      headers: [
        { text: "站点", align: "left", value: "name" },
        { text: "保存目录", align: "left", value: "type" },
        { text: "操作", value: "name", sortable: false }
      ],
      items: [],
      dialogRemoveConfirm: false,
      selectedClient: {} as any
    };
  },
  created() {
    this.items = this.$store.state.options.clients;
  },
  methods: {
    getPaths(paths: any) {
      return paths.join("<br>");
    },
    add() {
      this.showAddDialog = true;
    },
    addItem(item: any) {
      this.$store.commit("updatePathsOfClient", {
        clientId: this.selectedClient.id,
        site: item.site,
        paths: item.paths
      });
      this.reload();
    },

    edit(item: any) {
      this.selectedItem = item;
      this.showEditDialog = true;
    },
    updateItem(item: any) {
      console.log(item);
      this.$store.commit("updatePathsOfClient", {
        clientId: this.selectedClient.id,
        site: item.site,
        paths: item.paths
      });
      this.reload();
    },

    remove() {
      this.dialogRemoveConfirm = false;
      this.$store.commit("removePathsOfClient", {
        clientId: this.selectedClient.id,
        site: this.selectedItem.site
      });
      this.reload();
    },
    removeConfirm(item: any) {
      this.selectedItem = item;
      this.dialogRemoveConfirm = true;
    },
    reload() {
      let item = Object.assign({}, this.selectedClient);
      this.selectedClient = null;
      this.selectedClient = item;
    }
  },
  computed: {
    getClientPaths(): any {
      let result = [];
      for (const host in this.selectedClient.paths) {
        let site = this.$store.state.options.sites.find((item: any) => {
          return item.host == host;
        });
        if (site) {
          result.push({
            name: site.name,
            site: site,
            paths: this.selectedClient.paths[host]
          });
        }
      }
      return result;
    }
  }
});
</script>

<style lang="scss" scoped>
.set-download-clients {
  .search {
    max-width: 400px;
  }
}
</style>