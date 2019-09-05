<template>
  <div class="site-plugins">
    <v-alert
      :value="true"
      type="info"
    >{{ $t('settings.sitePlugins.index.title') }} [{{ site.name }}]</v-alert>
    <v-card>
      <v-card-title>
        <v-btn color="success" @click="add">
          <v-icon class="mr-2">add</v-icon>
          {{$t('common.add')}}
        </v-btn>
        <v-btn color="error" :disabled="selected.length==0" @click="removeSelected">
          <v-icon class="mr-2">remove</v-icon>
          {{$t('common.remove')}}
        </v-btn>
        <v-btn
          color="info"
          href="https://github.com/ronggang/PT-Plugin-Plus/wiki/config-custom-plugin"
          target="_blank"
          rel="noopener noreferrer nofollow"
        >
          <v-icon class="mr-2">help</v-icon>
          {{ $t('settings.siteSearchEntry.index.help') }}
        </v-btn>
        <v-spacer></v-spacer>
        <v-text-field class="search" append-icon="search" label="Search" single-line hide-details></v-text-field>
      </v-card-title>
      <v-data-table
        v-model="selected"
        :headers="headers"
        :items="plugins"
        :pagination.sync="pagination"
        item-key="name"
        select-all
        class="elevation-1"
      >
        <template slot="items" slot-scope="props">
          <td style="width:20px;">
            <v-checkbox v-model="props.selected" primary hide-details v-if="props.item.isCustom"></v-checkbox>
          </td>
          <td>
            <a @click="edit(props.item)">
              <span class="ml-2">{{ props.item.name }}</span>
            </a>
          </td>
          <td>
            <v-chip
              label
              color="light-blue"
              text-color="white"
              v-for="(page, index) in props.item.pages"
              :key="index"
              small
            >
              <!-- <v-icon left small>label</v-icon> -->
              {{ page }}
            </v-chip>
          </td>
          <td>{{ props.item.url }}</td>
          <td>
            <v-icon small class="mr-2" @click="edit(props.item)" :title="$t('common.edit')">edit</v-icon>
            <v-icon
              small
              color="error"
              @click="removeConfirm(props.item)"
              :title="$t('common.remove')"
              v-if="props.item.isCustom"
            >delete</v-icon>

            <v-icon
              small
              color="info"
              class="ml-2"
              @click="share(props.item)"
              :title="$t('common.share')"
              v-if="props.item.isCustom"
            >share</v-icon>
          </td>
        </template>
      </v-data-table>
    </v-card>

    <!-- 新增插件 -->
    <AddItem v-model="showAddDialog" @save="addItem" />
    <!-- 编辑插件 -->
    <EditItem v-model="showEditDialog" :initData="selectedItem" @save="updateItem" />

    <v-dialog v-model="dialogRemoveConfirm" width="300">
      <v-card>
        <v-card-title
          class="headline red lighten-2"
        >{{ $t('settings.sitePlugins.index.removeTitle') }}</v-card-title>

        <v-card-text>{{ $t('settings.sitePlugins.index.removeConfirm') }}</v-card-text>

        <v-divider></v-divider>

        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn flat color="info" @click="dialogRemoveConfirm=false">
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
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import { Site, Plugin } from "@/interface/common";
import AddItem from "./Add.vue";
import EditItem from "./Edit.vue";

import { filters } from "@/service/filters";
import { PPF } from "../../../../service/public";
export default Vue.extend({
  components: {
    AddItem,
    EditItem
  },
  data() {
    return {
      selected: [],
      pagination: {
        rowsPerPage: -1
      },
      showAddDialog: false,
      showEditDialog: false,
      site: {} as Site,
      selectedItem: {
        name: "",
        id: null,
        pages: [],
        scripts: [],
        styles: [],
        script: "",
        style: "",
        readonly: false
      } as any,
      dialogRemoveConfirm: false,
      plugins: [] as any
    };
  },
  methods: {
    add() {
      this.showAddDialog = true;
    },
    edit(source: any) {
      this.selectedItem = PPF.clone(source);
      if (!source.id) {
        this.selectedItem.readonly = true;
      }

      this.showEditDialog = true;
    },
    removeConfirm(item: any) {
      this.selectedItem = item;
      this.dialogRemoveConfirm = true;
    },
    remove() {
      this.dialogRemoveConfirm = false;
      this.$store.commit("removePlugin", {
        host: this.site.host,
        plugin: this.selectedItem
      });
      this.selectedItem = {};
      this.reloadPlugins(this.site.host);
    },
    removeSelected() {
      if (
        confirm(
          this.$t("settings.sitePlugins.index.removeSelectedConfirm").toString()
        )
      ) {
        this.selected.forEach((item: Plugin) => {
          if (item.isCustom) {
            this.$store.commit("removePlugin", {
              host: this.site.host,
              plugin: item
            });
          }
        });
        this.selected = [];
        this.reloadPlugins(this.site.host);
      }
    },
    updateItem(item: any) {
      console.log(item);
      this.selectedItem = item;
      this.$store.commit("updatePlugin", {
        host: this.site.host,
        plugin: item
      });
      this.reloadPlugins(this.site.host);
    },
    addItem(item: any) {
      console.log(item);
      this.$store.commit("addPlugin", {
        host: this.site.host,
        plugin: item
      });
      this.reloadPlugins(this.site.host);
    },
    reloadPlugins(host: any) {
      this.site = this.$store.state.options.sites.find((item: Site) => {
        return item.host == host;
      });

      if (this.site) {
        let plugins: any[] = [];

        let schema = this.site.schema;
        if (typeof schema === "string") {
          let _schema = this.$store.state.options.system.schemas.find(
            (item: Site) => {
              return item.name == schema;
            }
          );
          if (_schema) {
            plugins.push(..._schema.plugins);
          }
        } else if (schema && schema.plugins) {
          let site = this.$store.state.options.system.sites.find(
            (item: Site) => {
              return item.host == host;
            }
          );
          if (site && site.schema && site.schema.plugins) {
            plugins.push(...site.schema.plugins);
          }
        }

        if (this.site.plugins) {
          plugins.push(...this.site.plugins);
        }

        this.plugins = plugins;
      }
    },
    share(item: Plugin) {
      console.log(item);
    }
  },
  created() {
    let host = this.$route.params["host"];
    console.log("create", this.$route.params);
    if (host) {
      this.reloadPlugins(host);
    }
  },
  computed: {
    headers(): Array<any> {
      return [
        {
          text: this.$t("settings.sitePlugins.index.headers.name"),
          align: "left",
          value: "name"
        },
        {
          text: this.$t("settings.sitePlugins.index.headers.pages"),
          align: "left",
          value: "pages"
        },
        {
          text: this.$t("settings.sitePlugins.index.headers.enable"),
          align: "left",
          value: "enable"
        },
        {
          text: this.$t("settings.sitePlugins.index.headers.action"),
          value: "name",
          sortable: false
        }
      ];
    }
  }
});
</script>

<style lang="scss" scoped>
.site-plugins {
  .search {
    max-width: 400px;
  }
}
</style>
