<template>
  <div class="collection">
    <v-alert :value="true" type="info">{{ $t("collection.title") }}</v-alert>
    <v-card>
      <div style="height: 120px; overflow-x: auto;display: -webkit-box;" class="ma-2 pt-2">
        <GroupCard
          :color="group.color"
          v-for="(group, index) in groups"
          :key="index"
          :name="group.name"
          :description="group.description"
          :count="group.count"
          :group="group"
          @changeColor="changeGroupColor"
          @remove="removeGroup"
          @rename="changeGroupName"
        ></GroupCard>
      </div>

      <!-- 分隔线 -->
      <v-divider></v-divider>

      <v-card-title>
        <v-btn color="error" :disabled="selected.length==0" @click="removeSelected">
          <v-icon class="mr-2">remove</v-icon>
          {{ $t("common.remove") }}
        </v-btn>

        <v-btn color="error" @click="clear" :disabled="items.length==0">
          <v-icon class="mr-2">clear</v-icon>
          {{ $t("common.clear") }}
        </v-btn>

        <v-divider class="mx-3 mt-0" vertical></v-divider>

        <v-btn color="success" @click="addGroup">
          <v-icon class="mr-2">add</v-icon>
          {{ $t("collection.addGroup") }}
        </v-btn>

        <v-spacer></v-spacer>

        <!-- <v-text-field class="search" append-icon="search" label="Search" single-line hide-details></v-text-field> -->
      </v-card-title>

      <v-data-table
        v-model="selected"
        :headers="headers"
        :items="items"
        :pagination.sync="pagination"
        item-key="link"
        select-all
        class="dataList"
      >
        <template slot="items" slot-scope="props">
          <td style="width:50px;">
            <v-checkbox v-model="props.selected" primary hide-details></v-checkbox>
          </td>
          <td>{{ props.index + 1 }}</td>
          <td>
            <v-img
              :src="(props.item.movieInfo && props.item.movieInfo.image)?props.item.movieInfo.image:'./assets/movie.png'"
              class="mx-0 my-2"
              contain
              max-height="80"
              position="left center"
            >
              <v-layout style="margin-left: 80px;" row wrap>
                <template v-if="(props.item.movieInfo && props.item.movieInfo.title)">
                  <v-flex xs12>
                    <a
                      :href="props.item.movieInfo.link"
                      target="_blank"
                      rel="noopener noreferrer nofollow"
                    >
                      <img src="https://img3.doubanio.com/favicon.ico" class="mr-2 mt-0" width="16" />
                    </a>
                    <span class="title">{{ props.item.movieInfo.title }}</span>

                    <span class="caption ml-2">({{ props.item.movieInfo.year }})</span>
                  </v-flex>

                  <v-flex xs12 class="mb-1">
                    <span class="sub-title">{{ props.item.movieInfo.alt_title }}</span>
                  </v-flex>
                </template>
                <template>
                  <v-flex xs12>
                    <a
                      :href="props.item.link"
                      target="_blank"
                      :title="props.item.title"
                      rel="noopener noreferrer nofollow"
                    >
                      <span>{{ props.item.title }}</span>
                    </a>
                  </v-flex>

                  <v-flex xs12>
                    <span class="sub-title">{{ props.item.subTitle }}</span>
                  </v-flex>
                </template>
              </v-layout>
            </v-img>

            <!-- 分组列表 -->
            <template>
              <div style="margin-left: 80px;">
                <v-chip
                  label
                  :color="group.color||'grey'"
                  :dark="group.color && group.color.indexOf('lighten')>0?false: true"
                  v-for="(group, index) in getGroupList(props.item)"
                  :key="index"
                  small
                >{{group.name}}</v-chip>

                <AddToGroup icon small flat @add="addToGroup" :item="props.item" :groups="groups"></AddToGroup>
              </div>
            </template>
          </td>
          <td>
            <v-layout row wrap v-if="!!props.item.site">
              <a
                :href="props.item.site.activeURL"
                target="_blank"
                rel="noopener noreferrer nofollow"
                class="nodecoration"
              >
                <v-avatar :size="15">
                  <img :src="props.item.site.icon" />
                </v-avatar>
                <span class="caption ml-1 site-name">{{ props.item.site.name }}</span>
              </a>
            </v-layout>
          </td>
          <td class="text-xs-right">{{ props.item.size | formatSize }}</td>
          <td class="text-xs-right">{{ props.item.time | formatDate }}</td>
          <td class="text-xs-center">
            <DownloadTo
              :downloadOptions="props.item"
              flat
              icon
              small
              class="mx-0"
              @error="onError"
              @success="onSuccss"
            />
            <v-btn flat icon small @click="removeConfirm(props.item)" color="error" class="mx-0">
              <v-icon small>delete</v-icon>
            </v-btn>
          </td>
        </template>
      </v-data-table>
    </v-card>

    <v-snackbar v-model="haveError" top :timeout="3000" color="error" multi-line>
      <span v-html="errorMsg"></span>
    </v-snackbar>
    <v-snackbar v-model="haveSuccess" bottom :timeout="3000" color="success" multi-line>
      <span v-html="successMsg"></span>
    </v-snackbar>
  </div>
</template>
<script lang="ts">
import Vue from "vue";
import {
  EAction,
  DownloadOptions,
  Site,
  Dictionary,
  ICollection,
  ICollectionGroup,
  BASE_COLORS
} from "@/interface/common";
import Extension from "@/service/extension";
import DownloadTo from "@/options/components/DownloadTo.vue";
import GroupCard from "./GroupCard.vue";
import AddToGroup from "./AddToGroup.vue";

const extension = new Extension();

export default Vue.extend({
  components: {
    DownloadTo,
    GroupCard,
    AddToGroup
  },
  data() {
    return {
      selected: [],
      selectedItem: {} as any,
      pagination: {
        rowsPerPage: 10,
        sortBy: "time",
        descending: true
      },
      items: [] as ICollection[],
      groups: [] as ICollectionGroup[],
      options: this.$store.state.options,
      errorMsg: "",
      haveError: false,
      haveSuccess: false,
      successMsg: "",
      siteCache: {} as Dictionary<any>
    };
  },

  methods: {
    clearMessage() {
      this.successMsg = "";
      this.errorMsg = "";
    },

    clear() {
      if (confirm(this.$t("common.clearConfirm").toString())) {
        extension
          .sendRequest(EAction.clearTorrentCollention)
          .then((result: any) => {
            this.items = [];
          });
      }
    },
    remove(item: ICollection | ICollection[]) {
      extension
        .sendRequest(EAction.deleteTorrentFromCollention, null, item)
        .then((result: any) => {
          this.getTorrentCollections();
        });
    },

    removeConfirm(item: ICollection) {
      if (confirm(this.$t("common.removeConfirm").toString())) {
        this.remove(item);
      }
    },

    getTorrentCollections() {
      const requests: any[] = [];

      requests.push(extension.sendRequest(EAction.getTorrentCollectionGroups));
      requests.push(extension.sendRequest(EAction.getTorrentCollections));

      return Promise.all(requests).then(results => {
        console.log("getTorrentCollections", results);
        this.items = [];
        this.groups = [];
        let noGroup = {
          name: this.$t("collection.noGroup").toString(),
          count: 0
        };
        results[1].forEach((item: any) => {
          let site = this.siteCache[item.host];
          if (!site) {
            site = this.options.sites.find((site: Site) => {
              return site.host === item.host;
            });
            this.siteCache[item.host] = site;
          }

          item.site = site;
          if (!item.groups) {
            noGroup.count++;
          }

          this.items.push(item);
        });

        this.groups.push(noGroup);

        this.groups.push(...results[0]);
      });
    },

    removeSelected() {
      if (this.selected && this.selected.length > 0) {
        if (confirm(this.$t("common.actionConfirm").toString())) {
          this.remove(this.selected);
        }
      }
    },

    onError(msg: string) {
      this.errorMsg = msg;
    },

    onSuccss(msg: string) {
      this.successMsg = msg;
    },

    addGroup() {
      let name = window.prompt("请输入分组名称：");
      if (name) {
        extension
          .sendRequest(EAction.addTorrentCollectionGroup, null, {
            name,
            color: BASE_COLORS[Math.floor(Math.random() * BASE_COLORS.length)]
          })
          .then(() => {
            this.getTorrentCollections();
          });
      }
    },

    getGroupList(item: ICollection) {
      let result: ICollectionGroup[] = [];
      if (item.groups) {
        item.groups.forEach(id => {
          this.groups.forEach(group => {
            if (group.id === id) {
              result.push(group);
            }
          });
        });
      }

      if (result.length == 0) {
        result.push({
          name: this.$t("collection.noGroup").toString()
        });
      }

      return result;
    },

    removeGroup(group: ICollectionGroup) {
      console.log(group);
    },

    changeGroupColor(color: string, group: ICollectionGroup) {
      group.color = color;
      console.log(color, group);
      extension
        .sendRequest(EAction.updateTorrentCollectionGroup, null, group)
        .then(() => {
          this.getTorrentCollections();
        });
    },

    addToGroup(item: ICollection, group: ICollectionGroup) {
      console.log(item, group);
      extension
        .sendRequest(EAction.addTorrentCollectionToGroup, null, {
          item,
          groupId: group.id
        })
        .then(() => {
          this.getTorrentCollections();
        });
    },

    changeGroupName(name: string, group: ICollectionGroup) {
      group.name = name;
      extension
        .sendRequest(EAction.updateTorrentCollectionGroup, null, group)
        .then(() => {
          this.getTorrentCollections();
        });
    }
  },

  created() {
    this.getTorrentCollections();
  },

  watch: {
    successMsg() {
      this.haveSuccess = this.successMsg != "";
    },
    errorMsg() {
      this.haveError = this.errorMsg != "";
    }
  },

  computed: {
    headers(): Array<any> {
      return [
        {
          text: "№",
          align: "left",
          sortable: false,
          value: "title",
          width: 30
        },
        {
          text: this.$t("collection.headers.title"),
          align: "left",
          value: "title"
        },
        {
          text: this.$t("collection.headers.site"),
          align: "left",
          value: "site.host",
          width: 150
        },
        {
          text: this.$t("collection.headers.size"),
          align: "right",
          value: "size",
          width: 80
        },
        {
          text: this.$t("collection.headers.time"),
          align: "right",
          value: "time",
          width: 130
        },
        {
          text: this.$t("collection.headers.action"),
          value: "title",
          align: "center",
          sortable: false,
          width: 150
        }
      ];
    }
  }
});
</script>
<style lang="scss" >
.collection {
  .sub-title {
    color: #aaaaaa;
    font-size: 12px;
  }

  .dataList {
    table.v-table thead tr:not(.v-datatable__progress) th,
    table.v-table tbody tr td {
      padding: 8px !important;
      font-size: 12px;
    }

    table.v-table tbody tr:nth-child(even) {
      background-color: #f1f1f1;
    }

    table.v-table tbody tr:nth-child(odd) {
      background-color: #fff;
    }
  }

  .nodecoration {
    text-decoration: none;
  }

  .site-name {
    vertical-align: middle;
  }
}
</style>

<style lang="scss" src="../search/contextMenu.scss"></style>
