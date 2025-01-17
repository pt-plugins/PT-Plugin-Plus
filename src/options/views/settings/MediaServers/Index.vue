<template>
  <div class="cus-page">
    <v-alert :value="true" type="info">{{ $t('settings.mediaServers.index.title') }}</v-alert>
    <v-card>
      <v-card-title>
        <v-menu offset-y>
          <template v-slot:activator="{ on }">
            <v-btn color="blue-grey" dark v-on="on">
              <v-icon>add</v-icon>
              <span class="ml-1">{{ $t('common.add') }}</span>
            </v-btn>
          </template>
          <v-list>
            <v-list-tile v-for="(item, index) in mediaServerTypes" :key="index" @click="add(item)">
              <v-list-tile-title>{{ item }}</v-list-tile-title>
            </v-list-tile>
          </v-list>
        </v-menu>

        <v-btn color="error" :disabled="selected.length == 0" @click="removeSelected">
          <v-icon class="mr-2">remove</v-icon>
          {{ $t('common.remove') }}
        </v-btn>
        <v-spacer></v-spacer>
        <v-text-field class="search" append-icon="search" label="Search" single-line hide-details></v-text-field>
      </v-card-title>

      <v-data-table v-model="selected" :headers="headers" :items="this.$store.state.options.mediaServers"
        :pagination.sync="pagination" item-key="id" select-all class="elevation-1">
        <template slot="items" slot-scope="props">
          <td style="width:20px;">
            <v-checkbox v-model="props.selected" primary hide-details></v-checkbox>
          </td>
          <td>
            <a @click="edit(props.item)">{{ props.item.name }}</a>
          </td>
          <td>
            <v-switch
              true-value="true"
              false-value="false"
              :input-value="props.item.enabled?'true':'false'"
              hide-details
              @click.stop="updateEnabled(props.item)"
            ></v-switch>  
          </td>
          <td>{{ props.item.type }}</td>
          <td>
            <a :href="props.item.address" target="_blank" rel="noopener noreferrer nofollow">{{ props.item.address
              }}</a>
          </td>
          <td>
            <v-icon small class="mr-2" @click="edit(props.item)">edit</v-icon>
            <v-icon small color="error" @click="removeConfirm(props.item)">delete</v-icon>
          </td>
        </template>
      </v-data-table>
    </v-card>

    <component v-model="showEditDialog" :is="currentServerType" :option="selectedItem" @save="updateItem"></component>

    <!-- 删除确认 -->
    <v-dialog v-model="dialogRemoveConfirm" width="300">
      <v-card>
        <v-card-title class="headline red lighten-2">{{ $t('settings.mediaServers.index.removeConfirmTitle')
          }}</v-card-title>

        <v-card-text>{{ $t('settings.mediaServers.index.removeConfirm') }}</v-card-text>

        <v-divider></v-divider>

        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn flat color="info" @click="dialogRemoveConfirm = false">
            <v-icon>cancel</v-icon>
            <span class="ml-1">{{ $t('common.cancel') }}</span>
          </v-btn>
          <v-btn color="error" flat @click="remove">
            <v-icon>check_circle_outline</v-icon>
            <span class="ml-1">{{ $t('common.ok') }}</span>
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-alert :value="true" color="grey">
      <div v-html="$t('settings.mediaServers.index.subTitle')"></div>
    </v-alert>

    <v-snackbar v-model="itemDuplicate" top :timeout="3000" color="error">{{
      $t('settings.mediaServers.index.itemDuplicate') }}</v-snackbar>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import Emby from "./Emby/Edit.vue";
import { EMediaServerType } from "@/interface/enum";
export default Vue.extend({
  components: {
    Emby
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
      currentServerType: EMediaServerType.Emby,
      mediaServerTypes: [
        EMediaServerType.Emby
      ],
      dialogRemoveConfirm: false
    };
  },
  created() {
    this.items = this.$store.state.options.system.mediaServers;
    // 更新旧数据
    this.$store.state.options.mediaServers.forEach((c: { enabled: boolean | undefined; }) => {
      if (c.enabled === undefined) {
        c.enabled = true
        this.updateItem(c)
      }
    });
  },
  methods: {
    add(type: EMediaServerType) {
      this.currentServerType = type;
      this.selectedItem = {
        type: this.currentServerType
      };
      this.showEditDialog = true;
    },
    addItem(item: any) {
      let index = this.$store.state.options.mediaServers.findIndex((data: any) => {
        return data.name === item.name;
      });
      if (index === -1) {
        this.$store.commit("addMediaServer", item);
      } else {
        this.itemDuplicate = true;
      }
    },

    edit(item: any) {
      let index = this.$store.state.options.mediaServers.findIndex((data: any) => {
        return item.id === data.id;
      });

      if (index !== -1) {
        this.selectedItem = this.$store.state.options.mediaServers[index];
        this.showEditDialog = true;
      }
    },
    updateItem(item: any) {
      console.debug('updateMediaServer', item)
      this.$store.commit("updateMediaServer", item);
      this.pagination.rowsPerPage = 0;
      this.pagination.rowsPerPage = -1;
    },

    remove() {
      this.dialogRemoveConfirm = false;
      this.$store.commit("removeMediaServer", this.selectedItem);
      this.selectedItem = {};
    },
    removeConfirm(item: any) {
      this.selectedItem = item;
      this.dialogRemoveConfirm = true;
    },
    clear() {
      if (
        confirm(
          this.$t("settings.mediaServers.index.clearConfirm").toString()
        )
      ) {
        this.$store.commit("clearMediaServer");
      }
    },
    removeSelected() {
      if (
        confirm(
          this.$t(
            "settings.mediaServers.index.removeSelectedConfirm"
          ).toString()
        )
      ) {
        console.log(this.selected);
        this.selected.forEach((item: any) => {
          this.$store.commit("removeMediaServer", item);
        });
        this.selected = [];
      }
    },
    updateEnabled(item: any) {
      item.enabled = !(<boolean>item.enabled);
      this.updateItem(item);
    },
  },
  computed: {
    headers(): Array<any> {
      return [
        {
          text: this.$t("settings.mediaServers.index.headers.name"),
          align: "left",
          value: "name"
        },
        {
          text: this.$t("settings.mediaServers.index.headers.enabled"),
          align: "left",
          value: "enabled"
        },
        {
          text: this.$t("settings.mediaServers.index.headers.type"),
          align: "left",
          value: "type"
        },
        {
          text: this.$t("settings.mediaServers.index.headers.address"),
          align: "left",
          value: "address"
        },
        {
          text: this.$t("settings.mediaServers.index.headers.action"),
          value: "name",
          sortable: false
        }
      ];
    }
  }
});
</script>

<style lang="scss" scoped>
.cus-page {
  .search {
    max-width: 400px;
  }
}
</style>
