<template>
  <div class="collection">
    <v-alert :value="true" type="info">{{ $t("collection.title") }}</v-alert>
    <v-card>
      <div
        style="height: 120px; overflow-x: auto; display: -webkit-box"
        class="ma-2 pt-2"
        v-if="groups.length > 1"
      >
        <GroupCard
          :color="group.color"
          v-for="(group, index) in groups"
          :key="index"
          :name="group.name"
          :description="group.description"
          :count="group.count"
          :group="group"
          :active="group.id === activeGroupId"
          :readOnly="group.readOnly"
          :width="group.width"
          :isDefault="group.id === defaultGroupId"
          :items="getItemsFromGroup(group.id)"
          @changeColor="changeGroupColor"
          @remove="removeGroup"
          @rename="changeGroupName"
          @click="setGroupActive"
          @setDefault="setDefaultGroup"
          @cancelDefault="cancelDefaultGroup"
          @downloadSuccess="onSuccess"
          @downloadError="onError"
        ></GroupCard>
      </div>

      <!-- 分隔线 -->
      <v-divider></v-divider>

      <v-card-title>
        <v-btn
          color="error"
          :disabled="selected.length == 0"
          @click="removeSelected"
        >
          <v-icon class="mr-2">remove</v-icon>
          {{ $t("common.remove") }}
        </v-btn>

        <v-btn color="error" @click="clear" :disabled="items.length == 0">
          <v-icon class="mr-2">clear</v-icon>
          {{ $t("common.clear") }}
        </v-btn>

        <v-divider class="mx-3 mt-0" vertical></v-divider>

        <v-btn color="success" @click="addGroup">
          <v-icon class="mr-2">add</v-icon>
          {{ $t("collection.addGroup") }}
        </v-btn>

        <v-btn
          color="info"
          href="https://github.com/pt-plugins/PT-Plugin-Plus/wiki/my-collection"
          target="_blank"
          rel="noopener noreferrer nofollow"
        >
          <v-icon class="mr-2">help</v-icon>
          {{ $t("settings.searchSolution.index.help") }}
        </v-btn>

        <v-spacer></v-spacer>

        <v-text-field
          v-model="filterKey"
          class="search"
          append-icon="search"
          label="Search"
          single-line
          hide-details
          clearable
        ></v-text-field>
      </v-card-title>

      <v-data-table
        v-model="selected"
        :search="filterKey"
        :custom-filter="searchResultFilter"
        :headers="headers"
        :items="items"
        :pagination.sync="pagination"
        item-key="link"
        select-all
        class="dataList"
      >
        <template slot="items" slot-scope="props">
          <td style="width: 50px">
            <v-checkbox
              v-model="props.selected"
              primary
              hide-details
            ></v-checkbox>
          </td>
          <td>{{ props.index + 1 }}</td>
          <td>
            <v-img
              :src="
                props.item.movieInfo && props.item.movieInfo.image
                  ? props.item.movieInfo.image
                  : './assets/movie.png'
              "
              class="mx-0 my-2"
              contain
              :max-height="
                props.item.movieInfo && props.item.movieInfo.image ? 100 : 80
              "
              position="left center"
            >
              <v-layout style="margin-left: 90px" row wrap>
                <template
                  v-if="props.item.movieInfo && props.item.movieInfo.title"
                >
                  <v-flex xs12>
                    <a
                      :href="props.item.movieInfo.link"
                      target="_blank"
                      rel="noopener noreferrer nofollow"
                    >
                      <img
                        src="https://img3.doubanio.com/favicon.ico"
                        class="mr-2 mt-0"
                        width="16"
                      />
                    </a>
                    <span class="title">{{ props.item.movieInfo.title }}</span>

                    <span class="caption ml-2"
                      >({{ props.item.movieInfo.year }})</span
                    >
                  </v-flex>

                  <v-flex xs12 class="mb-1">
                    <span class="sub-title">{{
                      props.item.movieInfo.alt_title
                    }}</span>
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
              <div style="margin-left: 90px">
                <v-hover
                  v-for="(group, index) in getGroupList(props.item)"
                  :key="index"
                >
                  <v-chip
                    slot-scope="{ hover }"
                    :close="hover && group.id != null"
                    label
                    :color="group.color || 'grey'"
                    :dark="
                      group.color && group.color.indexOf('lighten') > 0
                        ? false
                        : true
                    "
                    small
                    @input="removeFromGroup(props.item, group)"
                    >{{ group.name }}</v-chip
                  >
                </v-hover>

                <AddToGroup
                  v-if="groups && groups.length > 1"
                  icon
                  small
                  flat
                  @add="addToGroup"
                  :item="props.item"
                  :groups="groups"
                ></AddToGroup>
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
                <span class="caption ml-1 site-name">{{
                  props.item.site.name
                }}</span>
              </a>
            </v-layout>
          </td>
          <td class="text-xs-right">{{ props.item.size | formatSize }}</td>
          <td class="text-xs-right">{{ props.item.time | formatDate }}</td>
          <td class="text-xs-center">
            <template v-if="props.item.movieInfo">
              <!-- IMDb Id -->
              <v-btn
                v-if="!!props.item.movieInfo.imdbId"
                flat
                icon
                small
                class="mx-0"
                :title="$t('common.search')"
                :to="`/search-torrent/${props.item.movieInfo.imdbId}`"
              >
                <v-icon small>search</v-icon>
              </v-btn>
              <!-- 豆瓣ID -->
              <v-btn
                v-else-if="!!props.item.movieInfo.doubanId"
                flat
                icon
                small
                class="mx-0"
                :title="$t('common.search')"
                :to="`/search-torrent/douban${props.item.movieInfo.doubanId}|${props.item.movieInfo.title}|${props.item.movieInfo.alt_title}`"
              >
                <v-icon small>search</v-icon>
              </v-btn>

              <v-btn
                v-else
                flat
                icon
                small
                class="mx-0"
                :title="$t('collection.setMovieId')"
                @click="setMovieId(props.item)"
              >
                <v-icon small>edit</v-icon>
              </v-btn>
            </template>

            <!-- 下载到 -->
            <DownloadTo
              :downloadOptions="props.item"
              flat
              icon
              small
              class="mx-0"
              @error="onError"
              @success="onSuccess"
            />

            <!-- 下载种子文件 -->
            <v-btn
              v-if="props.item.site.downloadMethod == 'POST'"
              flat
              icon
              small
              class="mx-0"
              @click.stop="saveTorrentFile(props.item)"
            >
              <v-icon small :title="$t('searchTorrent.saveTip')">save</v-icon>
            </v-btn>

            <v-btn
              v-else
              flat
              icon
              small
              class="mx-0"
              :href="props.item.url"
              target="_blank"
              rel="noopener noreferrer nofollow"
              :title="$t('searchTorrent.saveTip')"
            >
              <v-icon small>save</v-icon>
            </v-btn>

            <!-- 删除 -->
            <v-btn
              flat
              icon
              small
              @click="removeConfirm(props.item)"
              color="error"
              class="mx-0"
              :title="$t('common.remove')"
            >
              <v-icon small>delete</v-icon>
            </v-btn>
          </td>
        </template>
      </v-data-table>
    </v-card>

    <v-snackbar
      v-model="haveError"
      top
      :timeout="3000"
      color="error"
      multi-line
    >
      <span v-html="errorMsg"></span>
    </v-snackbar>
    <v-snackbar
      v-model="haveSuccess"
      bottom
      :timeout="3000"
      color="success"
      multi-line
    >
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
  BASE_COLORS,
  ECommonKey,
  Options,
  ERequestMethod
} from "@/interface/common";
import Extension from "@/service/extension";
import DownloadTo from "@/options/components/DownloadTo.vue";
import GroupCard from "./GroupCard.vue";
import AddToGroup from "./AddToGroup.vue";
import { PPF } from "@/service/public";
import { FileDownloader } from "@/service/downloader";

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
      allItems: [] as ICollection[],
      groups: [] as ICollectionGroup[],
      options: this.$store.state.options as Options,
      errorMsg: "",
      haveError: false,
      haveSuccess: false,
      successMsg: "",
      siteCache: {} as Dictionary<any>,
      activeGroupId: ECommonKey.all as any,
      defaultGroupId: "" as any,
      filterKey: "",
      loading: false
    };
  },
  /**
   * 当前组件激活时触发
   * 因为启用了搜索结果缓存，所以需要在这里处理关键字
   */
  activated() {
    this.getTorrentCollections();
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
            this.allItems = [];
            this.items = [];
            this.groups = [];
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
      if (this.loading) {
        return;
      }
      const requests: any[] = [];

      requests.push(extension.sendRequest(EAction.getTorrentCollectionGroups));
      requests.push(extension.sendRequest(EAction.getTorrentCollections));
      this.loading = true;
      return Promise.all(requests).then(results => {
        console.log("getTorrentCollections", results);
        this.items = [];
        this.groups = [];
        let noGroup = {
          id: ECommonKey.noGroup,
          name: this.$t("collection.noGroup").toString(),
          count: 0,
          readOnly: true,
          width: 120
        };

        results[1].forEach((item: any) => {
          let site = this.siteCache[item.host];
          if (!site) {
            site = PPF.getSiteFromHost(item.host, this.options);
            this.siteCache[item.host] = site;
          }

          item.site = site;
          if (!item.groups || item.groups.length == 0) {
            noGroup.count++;
          }

          this.items.push(item);
        });

        this.allItems = PPF.clone(this.items);

        let allGroup = {
          name: this.$t("common.all").toString(),
          id: ECommonKey.all,
          count: this.allItems.length,
          color: "grey darken-2",
          readOnly: true,
          width: 120
        };

        this.groups.push(allGroup);
        if (noGroup.count !== allGroup.count && noGroup.count > 0) {
          this.groups.push(noGroup);
        }

        this.groups.push(...results[0]);

        if (this.activeGroupId !== ECommonKey.all) {
          this.filterCollections();
        }
        this.loading = false;
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

    onSuccess(msg: string) {
      this.successMsg = msg;
    },

    addGroup() {
      let name = window.prompt(this.$t("collection.inputGroupName").toString());
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
      if (group.count && group.count > 0) {
        if (
          !confirm(
            this.$t("collection.removeGroupConfirm", {
              count: group.count
            }).toString()
          )
        ) {
          return;
        }
      }
      extension
        .sendRequest(EAction.removeTorrentCollectionGroup, null, group)
        .then(() => {
          this.getTorrentCollections();
        });

      this.cancelDefaultGroup(group);
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
    },

    removeFromGroup(item: ICollection, group: ICollectionGroup) {
      extension
        .sendRequest(EAction.removeTorrentCollectionFromGroup, null, {
          item,
          groupId: group.id
        })
        .then(() => {
          this.getTorrentCollections();
        });
    },

    setGroupActive(group: ICollectionGroup) {
      this.activeGroupId = group.id;
      if (this.activeGroupId === ECommonKey.all) {
        this.getTorrentCollections();
        return;
      }
      this.filterCollections();
    },

    filterCollections() {
      let groupId = this.activeGroupId;

      this.items = this.getItemsFromGroup(groupId);
    },

    getItemsFromGroup(groupId: string) {
      if (groupId === ECommonKey.all) {
        return this.allItems;
      }

      let result = [];
      for (let index = 0; index < this.allItems.length; index++) {
        const item = this.allItems[index];
        if (item.groups && item.groups.includes(groupId)) {
          result.push(item);
        } else if (
          groupId === ECommonKey.noGroup &&
          (!item.groups || item.groups.length === 0)
        ) {
          result.push(item);
        }
      }

      return result;
    },

    setDefaultGroup(group: ICollectionGroup) {
      this.defaultGroupId = group.id;
      this.$store.dispatch("saveConfig", {
        defaultCollectionGroupId: group.id
      });
    },

    cancelDefaultGroup(group: ICollectionGroup) {
      if (this.defaultGroupId === group.id) {
        this.defaultGroupId = "";
        this.$store.dispatch("saveConfig", {
          defaultCollectionGroupId: ""
        });
      }
    },

    setMovieId(item: ICollection) {
      let id = prompt(this.$t("collection.setMovieId").toString());

      if (!id) {
        return;
      }

      let doubanId = "";
      let imdbId = "";

      if (/^(tt\d+)$/.test(id)) {
        imdbId = id;
      } else if (/^(\d+)$/.test(id)) {
        doubanId = id;
      }

      if (imdbId || doubanId) {
        let data = PPF.clone(item);
        delete data.site;
        data.movieInfo = {
          imdbId,
          doubanId
        };
        extension
          .sendRequest(EAction.updateTorrentCollention, null, data)
          .then(() => {
            this.getTorrentCollections();
          });
      }
    },

    /**
     * 搜索结果过滤器，用于用户二次过滤
     * @param items
     * @param search
     */
    searchResultFilter(items: any[], search: string) {
      search = search.toString().toLowerCase();
      if (search.trim() === "") return items;

      // 以空格分隔要过滤的关键字
      let searchs = search.split(" ");

      return items.filter((item: ICollection) => {
        let texts: string[] = [];
        texts.push(item.title);

        item.subTitle && texts.push(item.title);
        if (item.movieInfo) {
          item.movieInfo.title && texts.push(item.movieInfo.title);
          item.movieInfo.alt_title && texts.push(item.movieInfo.alt_title);
        }

        let source = texts.join("").toLowerCase();
        let result = true;
        searchs.forEach(key => {
          if (key.trim() != "") {
            result = result && source.indexOf(key) > -1;
          }
        });
        return result;
      });
    },

    /**
     * 保存种子文件
     * @param item
     */
    saveTorrentFile(item: any) {
      let requestMethod = ERequestMethod.GET;
      if (item.site) {
        requestMethod = item.site.downloadMethod || ERequestMethod.GET;
      }
      let url = item.url + "";
      let file = new FileDownloader({
        url,
        timeout: this.options.connectClientTimeout,
        fileName: `[${item.site.name}][${item.title}].torrent`
      });

      file.requestMethod = requestMethod;
      file.onError = (error: any) => { };
      file.start();
    }
  },

  created() {
    this.getTorrentCollections();
    this.defaultGroupId = this.options.defaultCollectionGroupId;
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
          width: 100
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

    table.v-table.theme--dark tbody tr:nth-child(even) {
      background-color: #1f1f1f;
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
