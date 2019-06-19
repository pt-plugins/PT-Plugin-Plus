<template>
  <div class="set-download-clients">
    <v-alert :value="true" type="info">{{ $t('settings.downloadClients.index.title') }}</v-alert>
    <v-card>
      <v-card-title>
        <v-btn color="success" @click="add">
          <v-icon class="mr-2">add</v-icon>
          {{ $t('settings.downloadClients.index.add') }}
        </v-btn>
        <v-btn color="error" :disabled="selected.length==0" @click="removeSelected">
          <v-icon class="mr-2">remove</v-icon>
          {{ $t('settings.downloadClients.index.remove') }}
        </v-btn>
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
          <td>
            <a
              :href="props.item.address"
              target="_blank"
              rel="noopener noreferrer nofollow"
            >{{ props.item.address }}</a>
          </td>
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
        <v-card-title
          class="headline red lighten-2"
        >{{ $t('settings.downloadClients.index.removeConfirmTitle') }}</v-card-title>

        <v-card-text>{{ $t('settings.downloadClients.index.removeConfirm') }}</v-card-text>

        <v-divider></v-divider>

        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn flat color="info" @click="dialogRemoveConfirm=false">
            <v-icon>cancel</v-icon>
            <span class="ml-1">{{ $t('settings.downloadClients.index.cancel') }}</span>
          </v-btn>
          <v-btn color="error" flat @click="remove">
            <v-icon>check_circle_outline</v-icon>
            <span class="ml-1">{{ $t('settings.downloadClients.index.ok') }}</span>
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-alert :value="true" color="grey">
      <div v-html="$t('settings.downloadClients.index.subTitle')"></div>
    </v-alert>

    <v-snackbar
      v-model="itemDuplicate"
      top
      :timeout="3000"
      color="error"
    >{{ $t('settings.downloadClients.index.itemDuplicate') }}</v-snackbar>
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
      showAddDialog: false,
      showEditDialog: false,
      itemDuplicate: false,
      selected: [],
      selectedItem: {},
      pagination: {
        rowsPerPage: -1
      },
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
      if (
        confirm(
          this.$t("settings.downloadClients.index.clearConfirm").toString()
        )
      ) {
        this.$store.commit("clearClients");
      }
    },
    removeSelected() {
      if (
        confirm(
          this.$t(
            "settings.downloadClients.index.removeSelectedConfirm"
          ).toString()
        )
      ) {
        console.log(this.selected);
        this.selected.forEach((item: any) => {
          this.$store.commit("removeClient", item);
        });
        this.selected = [];
      }
    }
  },
  computed: {
    headers(): Array<any> {
      return [
        {
          text: this.$t("settings.downloadClients.index.headers.name"),
          align: "left",
          value: "name"
        },
        {
          text: this.$t("settings.downloadClients.index.headers.type"),
          align: "left",
          value: "type"
        },
        {
          text: this.$t("settings.downloadClients.index.headers.address"),
          align: "left",
          value: "address"
        },
        {
          text: this.$t("settings.downloadClients.index.headers.action"),
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