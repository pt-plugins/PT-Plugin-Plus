<template>
  <div class="set-download-clients">
    <v-alert :value="true" type="info">{{ words.title }}</v-alert>
    <v-card>
      <v-card-title>
        <v-btn color="success" @click="add">
          <v-icon class="mr-2">add</v-icon>
          {{ words.add }}
        </v-btn>
        <v-btn color="error" :disabled="selected.length==0" @click="removeSelected">
          <v-icon class="mr-2">remove</v-icon>
          {{ words.remove }}
        </v-btn>
        <!-- <v-btn color="error" @click="clear" :disabled="this.$store.state.options.clients.length==0">
          <v-icon class="mr-2">clear</v-icon>
          {{ words.clear }}
        </v-btn>-->
        <v-spacer></v-spacer>
        <v-text-field class="search" append-icon="search" label="Search" single-line hide-details></v-text-field>
      </v-card-title>

      <v-data-table
        v-model="selected"
        :headers="headers"
        :items="this.$store.state.options.clients"
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
            <a @click="edit(props.item)">{{ props.item.name }}</a>
          </td>
          <td>{{ props.item.type }}</td>
          <td>{{ props.item.address }}</td>
          <td>
            <v-icon small class="mr-2" @click="edit(props.item)">edit</v-icon>
            <v-icon small color="error" @click="removeConfirm(props.item)">delete</v-icon>
          </td>
        </template>
      </v-data-table>
    </v-card>

    <!-- 新增 -->
    <AddItem v-model="showAddDialog" @save="addItem"/>
    <!-- 编辑 -->
    <EditItem v-model="showEditDialog" :option="selectedItem" @save="updateItem"/>

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
        title: "下载服务器配置",
        add: "新增",
        remove: "删除",
        clear: "清除",
        itemDuplicate: "该名称已存在",
        removeConfirm: "确认要删除这个下载服务器吗？",
        removeConfirmTitle: "删除确认",
        clearConfirm: "确认要删除所有下载服务器吗？",
        removeSelectedConfirm: "确认要删除已选中的下载服务器吗？",
        ok: "确认",
        cancel: "取消"
      },
      showAddDialog: false,
      showEditDialog: false,
      itemDuplicate: false,
      selected: [],
      selectedItem: {},
      pagination: {
        rowsPerPage: -1
      },
      headers: [
        { text: "名称", align: "left", value: "name" },
        { text: "类型", align: "left", value: "type" },
        { text: "服务器地址", align: "left", value: "address" },
        { text: "操作", value: "name", sortable: false }
      ],
      items: [],
      dialogRemoveConfirm: false
    };
  },
  created() {
    this.items = this.$store.state.options.system.clients;
  },
  methods: {
    add() {
      this.showAddDialog = true;
    },
    addItem(item: any) {
      let index = this.$store.state.options.clients.findIndex((data: any) => {
        return data.name === item.name;
      });
      if (index === -1) {
        this.$store.commit("addClient", item);
      } else {
        this.itemDuplicate = true;
      }
    },

    edit(item: any) {
      let index = this.$store.state.options.clients.findIndex((data: any) => {
        return item.id === data.id;
      });

      if (index !== -1) {
        this.selectedItem = this.$store.state.options.clients[index];
        this.showEditDialog = true;
      }
    },
    updateItem(item: any) {
      this.$store.commit("updateClient", item);
    },

    remove() {
      this.dialogRemoveConfirm = false;
      this.$store.commit("removeClient", this.selectedItem);
      this.selectedItem = {};
    },
    removeConfirm(item: any) {
      this.selectedItem = item;
      this.dialogRemoveConfirm = true;
    },
    clear() {
      if (confirm(this.words.clearConfirm)) {
        this.$store.commit("clearClients");
      }
    },
    removeSelected() {
      if (confirm(this.words.removeSelectedConfirm)) {
        console.log(this.selected);
        this.selected.forEach((item: any) => {
          this.$store.commit("removeClient", item);
        });
        this.selected = [];
      }
    }
  },
  computed: {}
});
</script>

<style lang="scss" scoped>
.set-download-clients {
  .search {
    max-width: 400px;
  }
}
</style>