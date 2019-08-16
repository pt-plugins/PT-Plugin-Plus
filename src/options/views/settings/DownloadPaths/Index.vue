<template>
  <div class="set-download-clients">
    <v-alert :value="true" type="info">{{ $t('settings.downloadPaths.index.title') }}</v-alert>
    <v-card>
      <v-card-title>
        <v-autocomplete
          v-model="selectedClient"
          :items="items"
          :label="$t('settings.downloadPaths.index.selectedClient')"
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
              <v-list-tile-action-text>{{ data.item.allowCustomPath?data.item.type:$t('settings.downloadPaths.index.notSupport') }}</v-list-tile-action-text>
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
          {{ $t('settings.downloadPaths.index.add') }}
        </v-btn>
        <v-btn color="error" :disabled="selected.length==0" @click.stop="removeSelected">
          <v-icon class="mr-2">remove</v-icon>
          {{ $t('settings.downloadPaths.index.remove') }}
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
    <AddItem v-model="showAddDialog" @save="addItem" :client="selectedClient" />
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
        <v-card-title
          class="headline red lighten-2"
        >{{ $t('settings.downloadPaths.index.removeConfirmTitle') }}</v-card-title>

        <v-card-text>{{ $t('settings.downloadPaths.index.removeConfirm') }}</v-card-text>

        <v-divider></v-divider>

        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn flat color="info" @click="dialogRemoveConfirm=false">
            <v-icon>cancel</v-icon>
            <span class="ml-1">{{ $t('settings.downloadPaths.index.cancel') }}</span>
          </v-btn>
          <v-btn color="error" flat @click="remove">
            <v-icon>check_circle_outline</v-icon>
            <span class="ml-1">{{ $t('settings.downloadPaths.index.ok') }}</span>
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-snackbar
      v-model="itemDuplicate"
      top
      :timeout="3000"
      color="error"
    >{{ $t('settings.downloadPaths.index.itemDuplicate') }}</v-snackbar>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import AddItem from "./Add.vue";
import EditItem from "./Edit.vue";
import { ECommonKey, EViewKey } from "@/interface/enum";
export default Vue.extend({
  components: {
    AddItem,
    EditItem
  },
  data() {
    return {
      showAddDialog: false,
      showEditDialog: false,
      itemDuplicate: false,
      selected: [],
      selectedItem: {} as any,
      pagination: {
        rowsPerPage: -1
      },
      items: [],
      dialogRemoveConfirm: false,
      selectedClient: {
        address: ""
      } as any,
      lastClientId: ""
    };
  },
  created() {
    if (
      this.$store.state.options.clients &&
      this.$store.state.options.clients.length > 0
    ) {
      this.items = this.$store.state.options.clients;
      this.initView();
    }
  },
  watch: {
    selectedClient() {
      if (this.selectedClient && this.selectedClient.id) {
        this.lastClientId = this.selectedClient.id;
        this.updateViewOptions();
      }
    }
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
    },
    removeSelected() {
      if (
        confirm(
          this.$t(
            "settings.downloadPaths.index.removeSelectedConfirm"
          ).toString()
        )
      ) {
        console.log(this.selected);
        this.selected.forEach((item: any) => {
          this.$store.commit("removePathsOfClient", {
            clientId: this.selectedClient.id,
            site: item.site
          });
        });
        this.selected = [];
        this.reload();
      }
    },
    /**
     * 初始当前界面
     */
    initView() {
      let options = this.$store.getters.viewsOptions(EViewKey.downloadPaths, {
        lastClientId: ""
      });

      this.lastClientId = options.lastClientId;

      if (this.lastClientId && this.items.length > 0) {
        let selectedClient = this.items.find((item: any) => {
          return item.id == this.lastClientId;
        });

        if (selectedClient) {
          this.selectedClient = selectedClient;
        }
      }
    },
    /**
     * 更新当前界面配置
     */
    updateViewOptions() {
      this.$store.dispatch("updateViewOptions", {
        key: EViewKey.downloadPaths,
        options: {
          lastClientId: this.lastClientId
        }
      });
    }
  },
  computed: {
    getClientPaths(): any {
      if (!this.selectedClient) {
        return [];
      }
      if (!this.selectedClient.paths) {
        return [];
      }
      let result = [];

      let allSite = this.selectedClient.paths[ECommonKey.allSite];
      if (allSite) {
        result.push({
          name: this.$t("settings.downloadPaths.index.allSite").toString(),
          site: null,
          paths: allSite
        });
      }

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
    },
    headers(): Array<any> {
      return [
        {
          text: this.$t("settings.downloadPaths.index.headers.name"),
          align: "left",
          value: "name"
        },
        {
          text: this.$t("settings.downloadPaths.index.headers.path"),
          align: "left",
          sortable: false
        },
        {
          text: this.$t("settings.downloadPaths.index.headers.action"),
          value: "name",
          sortable: false
        }
      ];
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