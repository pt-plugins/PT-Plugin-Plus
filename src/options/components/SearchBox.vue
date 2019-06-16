<template>
  <v-menu v-model="showMenu" offset-y nudge-right="32">
    <template v-slot:activator="{ on }">
      <v-text-field
        flat
        solo-inverted
        prepend-icon="search"
        :label="$t('searchBox.searchTip')"
        class="mt-2 mb-0"
        v-model="searchKey"
        clearable
        @click.stop="showSelectBox"
        @click:clear="clearSearchKey"
        :loading="loadStatus"
        v-on:keyup.13="searchTorrent()"
      >
        <v-menu slot="append" offset-y class="search-solution">
          <v-btn slot="activator" flat small color="grey lighten-2">{{selectedSearchSolutionName}}</v-btn>
          <v-list dense>
            <v-list-tile @click="changeSearchSolution(null)" :title="$t('searchBox.defaultTip')">
              <v-list-tile-title>{{ $t('searchBox.default') }}</v-list-tile-title>
            </v-list-tile>
            <v-divider></v-divider>
            <template
              v-if="$store.state.options.searchSolutions && $store.state.options.searchSolutions.length>0"
            >
              <v-list-tile
                @click="changeSearchSolution(item)"
                v-for="(item, index) in $store.state.options.searchSolutions"
                :key="index"
              >
                <v-list-tile-title>{{ item.name }}</v-list-tile-title>
              </v-list-tile>
            </template>
            <v-btn flat small v-else to="/set-search-solution">{{$t('searchBox.noSearchSolution')}}</v-btn>

            <v-divider></v-divider>
            <v-list-tile @click="changeSearchSolution(allSite)">
              <v-list-tile-title>{{ $t('searchBox.all') }}</v-list-tile-title>
            </v-list-tile>
          </v-list>
        </v-menu>
      </v-text-field>
    </template>
    <div>
      <v-list class="pb-0">
        <v-list-tile @click.stop="itemClick(null)">
          <v-list-tile-content>
            <v-list-tile-title>
              <v-icon>search</v-icon>
              <span class="title ml-1">{{ $t('searchBox.searchThisKey', { key: this.searchKey }) }}</span>
            </v-list-tile-title>
          </v-list-tile-content>
        </v-list-tile>
        <v-divider v-if="!isLoading"></v-divider>
        <v-progress-linear :indeterminate="true" v-else color="secondary" height="2"></v-progress-linear>
      </v-list>

      <v-list three-line class="py-0">
        <template v-for="(item, index) in items">
          <v-list-tile
            :key="index"
            @click.stop="itemClick(item)"
            :title="$t('searchBox.searchThisKey', { key: item.title })"
          >
            <v-list-tile-avatar class="album" :size="75">
              <img :src="item.images.small">
            </v-list-tile-avatar>
            <v-list-tile-content>
              <v-list-tile-title class="mb-1">
                <span class="title">{{ item.title }}</span>
                <span class="ml-1 caption">({{ item.year }})</span>
              </v-list-tile-title>
              <v-list-tile-sub-title>
                <div>{{ item.original_title }}</div>
                <div class="caption">{{ item.genres.join(" | ")}}</div>
              </v-list-tile-sub-title>
            </v-list-tile-content>

            <v-list-tile-action style="align-items:center">
              <a
                class="grey--text text--darken-1 mt-3 title"
                style="text-decoration: none;"
                :href="item.alt"
                rel="noopener noreferrer nofollow"
                target="_blank"
                :title="$t('searchBox.toDouban')"
                @click.stop
              >
                <img src="https://img3.doubanio.com/favicon.ico" width="16">
                {{ parseFloat(item.rating.average).toFixed(1) }}
              </a>
              <v-rating
                :value="parseInt(item.rating.stars)/10"
                background-color="grey lighten-2"
                color="yellow accent-4"
                dense
                readonly
                half-increments
                size="13"
                class="mb-3"
              ></v-rating>
            </v-list-tile-action>
          </v-list-tile>
          <v-divider :key="'l'+index"></v-divider>
        </template>
      </v-list>
      <v-list class="py-0">
        <v-list-tile>
          <v-list-tile-content>
            <v-list-tile-title
              class="grey--text text--darken-1 caption"
            >{{ $t("searchBox.doubanTip") }}</v-list-tile-title>
          </v-list-tile-content>
        </v-list-tile>
      </v-list>
    </div>
  </v-menu>
</template>
<script lang="ts">
import Vue from "vue";
import {
  SearchSolution,
  Options,
  Site,
  EBeforeSearchingItemSearchMode,
  EAction
} from "@/interface/common";

import Extension from "@/service/extension";

const extension = new Extension();

export default Vue.extend({
  data() {
    return {
      words: {
        searchTip: "输入种子关键字、IMDb编号，按回车进行搜索",
        default: "<默认>",
        defaultTip: "仅搜索已允许的站点",
        all: "<所有站点>",
        noSearchSolution: "暂无方案，请添加",
        noAllowSearchSites: "暂未配置允许搜索的站点，请先配置",
        searchThisKey: "搜索 “$key$”",
        doubanTip:
          "以上数据来自©豆瓣电影 API v2 查询接口；如不想显示这些结果进行预选，可在“常规设置”中进行关闭",
        toDouban: "在豆瓣进行查看"
      },
      isLoading: false,
      items: [] as any[],
      selected: {} as any,
      timer: null as any,
      showMenu: false,
      searchKey: "",
      options: this.$store.state.options as Options,
      selectedSearchSolutionName: "",
      allSite: {
        id: "all",
        name: "<所有站点>"
      },
      initialized: false
    };
  },

  methods: {
    itemClick(item: any) {
      console.log(item);
      let key = this.searchKey;
      let searchMode = this.options.beforeSearchingOptions
        ? this.options.beforeSearchingOptions.searchModeForItem
        : EBeforeSearchingItemSearchMode.id;
      switch (searchMode) {
        case EBeforeSearchingItemSearchMode.id:
          if (item && item.id) {
            key = `douban${item.id}|${item.title}|${item.original_title}`;
          }
          break;

        case EBeforeSearchingItemSearchMode.name:
          if (item && item.title) {
            key = item.title;
          }
          break;
      }

      this.searchTorrent(key);
    },
    showSelectBox() {
      if (
        this.$store &&
        !this.$store.state.options.beforeSearchingOptions.getMovieInformation
      )
        return;
      if (this.items.length > 0) {
        this.showMenu = true;
      } else if (this.searchKey) {
        this.getDoubanInfos(this.searchKey);
      }
    },
    /**
     * 从豆瓣获取相关信息
     */
    getDoubanInfos(key: string) {
      if (
        this.$store &&
        !this.$store.state.options.beforeSearchingOptions.getMovieInformation
      )
        return;
      if (this.isLoading || !key) return;

      this.isLoading = true;
      this.items = [];

      // 本地调试时
      if (window.location.hostname == "localhost") {
        $.ajax("http://localhost:8001/test/beforeSearching.json")
          .done(result => {
            console.log(result);
            if (result && result.subjects) {
              this.items = result.subjects;
              this.isLoading = false;
              this.showMenu = true;
            }
          })
          .fail(err => {
            console.log(err);
          })
          .always(() => (this.isLoading = false));
        return;
      }

      extension
        .sendRequest(EAction.queryMovieInfoFromDouban, null, {
          key,
          count: this.$store.state.options.beforeSearchingOptions
            .maxMovieInformationCount
        })
        .then(result => {
          if (result && result.subjects) {
            this.items = result.subjects;
            this.isLoading = false;
            this.showMenu = true;
          }
        })
        .catch(error => {
          console.log(error);
        })
        .finally(() => {
          this.isLoading = false;
        });
    },

    searchTorrent(key?: string) {
      key = key || this.searchKey;
      if (!key) {
        return;
      }

      this.showMenu = false;

      this.$store.dispatch("saveConfig", {
        lastSearchKey: this.searchKey
      });

      this.$router.push({
        name: "search-torrent",
        params: {
          key: key
        }
      });
    },
    changeSearchSolution(solution?: SearchSolution) {
      let defaultSearchSolutionId = "";
      if (solution) {
        this.selectedSearchSolutionName = solution.name;
        defaultSearchSolutionId = solution.id;
      } else {
        this.selectedSearchSolutionName = this.$t(
          "searchBox.default"
        ).toString();
      }

      this.$store.dispatch("saveConfig", {
        defaultSearchSolutionId: defaultSearchSolutionId
      });
    },
    clearSearchKey() {
      this.$store.dispatch("saveConfig", {
        lastSearchKey: ""
      });
    }
  },
  watch: {
    /**
     * 当搜索关键字变更时，尝试从豆瓣获取相关信息
     */
    searchKey() {
      if (
        this.$store &&
        !this.$store.state.options.beforeSearchingOptions.getMovieInformation
      )
        return;
      clearTimeout(this.timer);
      if (!this.initialized) return;
      if (!this.searchKey) {
        this.showMenu = false;
        return;
      }

      this.timer = setTimeout(() => {
        this.getDoubanInfos(this.searchKey);
      }, 750);
    }
  },
  created() {
    this.selectedSearchSolutionName = this.words.default;
    if (this.options.defaultSearchSolutionId == this.allSite.id) {
      this.selectedSearchSolutionName = this.allSite.name;
    } else if (
      this.options.defaultSearchSolutionId &&
      this.options.searchSolutions
    ) {
      let searchSolution:
        | SearchSolution
        | undefined = this.options.searchSolutions.find(
        (item: SearchSolution) => {
          return item.id === this.options.defaultSearchSolutionId;
        }
      );

      if (searchSolution) {
        this.selectedSearchSolutionName = searchSolution.name;
      }
    }
    if (this.options.sites) {
      let count = 0;
      this.options.sites.forEach((item: Site) => {
        if (item.allowSearch) {
          count++;
        }
      });
      if (count == 0) {
        this.words.searchTip = this.words.noAllowSearchSites;
      }
    }
    if (this.options.search && this.options.search.saveKey) {
      this.searchKey = this.options.lastSearchKey || "";
    }
    // 防止初始化时进行信息获取
    setTimeout(() => {
      this.initialized = true;
    }, 500);
  },
  computed: {
    loadStatus(): boolean {
      if (this.$store && this.$store.state) {
        return this.$store.state.searching || this.isLoading;
      } else {
        return this.isLoading;
      }
    }
  }
});
</script>

<style lang="scss" scoped>
.search-solution {
  margin-right: -10px;
}

.album {
  img {
    margin-top: 18px;
    border-radius: 0px;
    margin-right: 10px;
  }
}
</style>
