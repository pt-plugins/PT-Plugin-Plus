<template>
  <div class="home">
    <v-alert :value="true" type="info">{{ $t("home.title") }}</v-alert>
    <v-card>
      <v-card-title v-if="sites && sites.length > 0">
        <v-btn color="success" @click="getInfos" :loading="loading" :title="$t('home.getInfos')">
          <v-icon class="mr-2">cached</v-icon>
          {{ $t("home.getInfos") }}
        </v-btn>
        <v-btn to="/user-data-timeline" color="success" :title="$t('home.timeline')">
          <v-icon>timeline</v-icon>
        </v-btn>

        <v-btn to="/statistic" color="success" :title="$t('home.statistic')">
          <v-icon>equalizer</v-icon>
        </v-btn>

        <v-menu :close-on-content-click="false" offset-y>
          <template v-slot:activator="{ on }">
            <v-btn color="blue" dark v-on="on" :title="$t('home.settings')">
              <v-icon>settings</v-icon>
            </v-btn>
          </template>

          <v-card>
            <v-container grid-list-xs>
              <v-switch color="success" v-model="showSiteName" :label="$t('home.siteName')"
                @change="updateViewOptions"></v-switch>
              <v-switch color="success" v-model="showUserName" :label="$t('home.userName')"
                @change="updateViewOptions"></v-switch>
              <v-switch color="success" v-model="showUserLevel" :label="$t('home.userLevel')"
                @change="updateViewOptions"></v-switch>
              <v-switch color="success" v-model="showLevelRequirements" :label="$t('home.levelRequirements')"
                @change="updateViewOptions"></v-switch>
              <v-switch color="success" v-model="showWeek" :label="$t('home.week')"
                @change="updateViewOptions"></v-switch>
              <v-switch color="success" v-model="showSeedingPoints" :label="$t('home.seedingPoints')"
                @change="updateViewOptions"></v-switch>
            </v-container>
          </v-card>
        </v-menu>
        <v-select v-model="selectedHeaders" class="select" :items="headers" :label="$t('home.selectColumns')"
          @change="updateViewOptions" multiple outlined return-object>
          <template v-slot:selection="{ item, index }">
            <v-chip v-if="index === 0">
              <span>{{ item.text }}</span>
            </v-chip>
            <span v-if="index === 1" class="grey--text caption">(+{{ selectedHeaders.length - 1 }} others)</span>
          </template>
        </v-select>

        <!-- <AutoSignWarning /> -->
        <v-spacer></v-spacer>

        <v-text-field class="search" v-model="filterKey" append-icon="search" label="Search" single-line hide-details
          enterkeyhint="search"></v-text-field>
      </v-card-title>

      <v-data-table :search="filterKey" :headers="showHeaders" :items="sites" :pagination.sync="pagination"
        item-key="host" class="elevation-1" ref="userDataTable" :no-data-text="$t('home.nodata')">
        <template slot="items" slot-scope="props">
          <!-- 站点 -->
          <td v-if="showColumn('name')" class="center">
            <v-badge color="red messageCount" overlap>
              <template v-slot:badge v-if="
                !props.item.disableMessageCount &&
                props.item.user.messageCount > 0
              " :title="$t('home.newMessage')">
                {{
                    props.item.user.messageCount > 10
                      ? ""
                      : props.item.user.messageCount
                }}
              </template>
              <v-btn flat icon class="siteIcon" :title="$t('home.getInfos')" :disabled="props.item.offline"
                @click.stop="getSiteUserInfo(props.item)">
                <v-avatar :size="showSiteName ? 18 : 24">
                  <img :src="props.item.icon" />
                </v-avatar>
              </v-btn>
            </v-badge>

            <br />
            <a :href="props.item.activeURL" target="_blank" rel="noopener noreferrer nofollow" class="nodecoration"
              v-if="showSiteName">
              <span class="caption">{{ props.item.name }}</span>
            </a>
          </td>
          <td v-if="showColumn('user.name')" :title="props.item.user.id">
            <template v-if="showUserName">
              {{ props.item.user.name }}
            </template>
            <template v-else> **** </template>
          </td>
          <td v-if="showColumn('user.levelName')">
            {{ showUserLevel ? props.item.user.levelName : "****" }}
            <template v-if="showLevelRequirements">
              <template v-if="props.item.levelRequirements">
                <template v-if="
                  props.item.user.nextLevel && props.item.user.nextLevel.name
                ">
                  <div>
                    <v-icon small color="black darken-4">keyboard_tab</v-icon>
                    <template v-if="props.item.user.nextLevel.requiredDate">
                      {{ props.item.user.nextLevel.requiredDate }}&nbsp;
                    </template>
                    <template v-if="props.item.user.nextLevel.uploaded">
                      <v-icon small color="red darken-4">arrow_upward</v-icon>{{
                          props.item.user.nextLevel.uploaded | formatSize
                      }}&nbsp;
                    </template>
                    <template v-if="props.item.user.nextLevel.downloaded">
                      <v-icon small color="green darken-4">arrow_downward</v-icon>{{
                          props.item.user.nextLevel.downloaded | formatSize
                      }}&nbsp;
                    </template>
                    <template v-if="props.item.user.nextLevel.trueDownloaded">
                      {{ $t("home.levelRequirement.trueDownloaded") }}
                      {{
                          props.item.user.nextLevel.trueDownloaded | formatSize
                      }}&nbsp;
                    </template>
                    <template v-if="props.item.user.nextLevel.bonus">
                      <v-icon small color="green darken-4">attach_money</v-icon>{{
                          props.item.user.nextLevel.bonus | formatNumber
                      }}&nbsp;
                    </template>
                    <template v-if="props.item.user.nextLevel.seedingPoints">
                      <v-icon small color="green darken-4">energy_savings_leaf</v-icon>{{
                          props.item.user.nextLevel.seedingPoints | formatNumber
                      }}&nbsp;
                    </template>
                    <template v-if="props.item.user.nextLevel.uploads">
                      <v-icon small color="green darken-4">file_upload</v-icon>{{ props.item.user.nextLevel.uploads
                      }}&nbsp;
                    </template>
                    <template v-if="props.item.user.nextLevel.classPoints">
                      <v-icon small color="yellow darken-4">energy_savings_leaf</v-icon>{{
                          props.item.user.nextLevel.classPoints | formatNumber
                      }}&nbsp;
                    </template>
                  </div>
                </template>
                <template v-else>
                  <v-icon small color="green darken-4">done</v-icon>
                </template>
                <v-card class="levelRequirement">
                  <template v-for="levelRequirement in props.item.levelRequirements">
                    <template v-if="
                      !props.item.user.nextLevel.name ||
                      Number(props.item.user.nextLevel.level) >
                      Number(levelRequirement.level)
                    ">
                      <v-icon small color="green darken-4">done</v-icon>
                    </template>
                    <template v-else>
                      <v-icon small color="red darken-4">block</v-icon>
                    </template>
                    <template v-if="levelRequirement.requiredDate">
                      {{ levelRequirement.requiredDate }} </template>({{ levelRequirement.name }}):
                    <template v-if="levelRequirement.uploaded">
                      <v-icon small color="green darken-4">arrow_upward</v-icon>{{ levelRequirement.uploaded }};
                    </template>
                    <template v-if="levelRequirement.uploads">
                      <v-icon small color="green darken-4">file_upload</v-icon>{{ levelRequirement.uploads }};
                    </template>
                    <template v-if="levelRequirement.downloaded">
                      <v-icon small color="red darken-4">arrow_downward</v-icon>{{ levelRequirement.downloaded }};
                    </template>
                    <template v-if="levelRequirement.trueDownloaded">
                      {{ $t("home.levelRequirement.trueDownloaded") }}
                      {{ levelRequirement.trueDownloaded }};
                    </template>
                    <template v-if="levelRequirement.ratio">
                      <v-icon small color="orange darken-4">balance</v-icon>{{ levelRequirement.ratio }};
                    </template>
                    <template v-if="levelRequirement.bonus">
                      <v-icon small color="green darken-4">attach_money</v-icon>{{ levelRequirement.bonus |
                          formatInteger
                      }};
                    </template>
                    <template v-if="levelRequirement.seedingPoints">
                      <v-icon small color="green darken-4">energy_savings_leaf</v-icon>{{ levelRequirement.seedingPoints
                          | formatInteger
                      }};
                    </template>
                    <template v-if="levelRequirement.classPoints">
                      <v-icon small color="yellow darken-4">energy_savings_leaf</v-icon>{{ levelRequirement.classPoints
                          | formatInteger
                      }};
                    </template>
                    {{ levelRequirement.privilege }}
                    <br />
                  </template>
                </v-card>
              </template>
            </template>
          </td>
          <td v-if="showColumn('user.uploaded')" class="number">
            <div>
              {{ props.item.user.uploaded | formatSize }}
              <v-icon small color="green darken-4">expand_less</v-icon>
            </div>
            <div>
              {{ props.item.user.downloaded | formatSize }}
              <v-icon small color="red darken-4">expand_more</v-icon>
            </div>
          </td>
          <td v-if="showColumn('user.ratio')" class="number">
            {{ props.item.user.ratio | formatRatio }}
          </td>
          <td v-if="showColumn('user.seeding')" class="number">
            {{ props.item.user.seeding }}
          </td>
          <td v-if="showColumn('user.seedingSize')" class="number">
            {{ props.item.user.seedingSize | formatSize }}
          </td>
          <td v-if="showColumn('user.bonus')" class="number">
            <template v-if="showSeedingPoints && props.item.user.seedingPoints">
              <div>
                <v-icon small color="green darken-4">attach_money</v-icon>{{ props.item.user.bonus | formatNumber }}
              </div>
              <div>
                <v-icon small color="green darken-4">energy_savings_leaf</v-icon>{{ props.item.user.seedingPoints |
                    formatNumber
                }}
              </div>
            </template>
            <template v-else-if="showSeedingPoints && props.item.user.classPoints">
              <div>
                <v-icon small color="green darken-4">attach_money</v-icon>{{ props.item.user.bonus | formatNumber }}
              </div>
              <div>
                <v-icon small color="yellow darken-4">energy_savings_leaf</v-icon>{{ props.item.user.classPoints |
                    formatNumber
                }}
              </div>
            </template>
            <template v-else>
              {{ props.item.user.bonus | formatNumber }}
            </template>
          </td>
          <td v-if="showColumn('user.bonusPerHour')" class="number">
            <template v-if="props.item.user.bonusPerHour">
              {{ props.item.user.bonusPerHour | formatNumber }}
            </template>
          </td>
          <td v-if="showColumn('user.joinTime')" class="number" :title="props.item.user.joinDateTime">
            {{ props.item.user.joinTime | timeAgo(showWeek) }}
          </td>
          <td v-if="showColumn('user.lastUpdateTime')" class="number">
            <v-btn depressed small :to="`statistic/${props.item.host}`" :title="$t('home.statistic')">{{
                props.item.user.lastUpdateTime |
                formatDate("YYYY-MM-DD HH:mm:ss")
            }}</v-btn>
          </td>
          <td v-if="showColumn('user.lastUpdateStatus')" class="center">
            <v-progress-circular indeterminate :width="3" size="30" color="green" v-if="props.item.user.isLoading">
              <v-icon v-if="props.item.user.isLoading" @click="abortRequest(props.item)" color="red" small
                :title="$t('home.cancelRequest')">cancel</v-icon>
            </v-progress-circular>
            <span v-else>
              <a :href="props.item.activeURL" v-if="!props.item.user.isLogged" target="_blank"
                rel="noopener noreferrer nofollow" class="nodecoration">{{ formatError(props.item.user) }}</a>
              <span v-else>{{ formatError(props.item.user) }}</span>
            </span>
          </td>
        </template>
      </v-data-table>
    </v-card>

    <v-alert :value="true" color="grey">
      <div v-html="$t('home.tip')"></div>
    </v-alert>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import Extension from "@/service/extension";
import {
  EAction,
  Site,
  LogItem,
  EModule,
  EUserDataRequestStatus,
  Options,
  UserInfo,
  EViewKey,
} from "@/interface/common";
import dayjs from "dayjs";

import AutoSignWarning from "./AutoSignWarning.vue";
import { PPF } from "@/service/public";

interface UserInfoEx extends UserInfo {
  joinDateTime?: string;
}

const extension = new Extension();
export default Vue.extend({
  components: {
    AutoSignWarning,
  },
  data() {
    return {
      loading: false,
      items: [] as any[],
      selectedHeaders: [] as any[],
      headers: [
        {
          text: this.$t("home.headers.site"),
          align: "center",
          value: "name",
          width: "110px",
        },
        {
          text: this.$t("home.headers.userName"),
          align: "left",
          value: "user.name",
        },
        {
          text: this.$t("home.headers.levelName"),
          align: "left",
          value: "user.levelName",
        },
        {
          text: this.$t("home.headers.activitiyData"),
          align: "right",
          value: "user.uploaded",
          width: "120px",
        },
        {
          text: this.$t("home.headers.ratio"),
          align: "right",
          value: "user.ratio",
        },
        {
          text: this.$t("home.headers.seeding"),
          align: "right",
          value: "user.seeding",
        },
        {
          text: this.$t("home.headers.seedingSize"),
          align: "right",
          value: "user.seedingSize",
        },
        {
          text: this.$t("home.headers.bonus"),
          align: "right",
          value: "user.bonus",
        },
        {
          text: this.$t("home.headers.bonusPerHour"),
          align: "right",
          value: "user.bonusPerHour",
        },
        {
          text: this.$t("home.headers.joinTime"),
          align: "right",
          value: "user.joinTime",
        },
        {
          text: this.$t("home.headers.lastUpdateTime"),
          align: "right",
          value: "user.lastUpdateTime",
        },
        {
          text: this.$t("home.headers.status"),
          align: "center",
          value: "user.lastUpdateStatus",
        },
      ],
      pagination: {
        rowsPerPage: -1,
      },
      options: this.$store.state.options,
      beginTime: null as any,
      reloadCount: 0,
      requestQueue: [] as any[],
      requestTimer: 0,
      requestMsg: "",
      sites: [] as Site[],
      filterKey: "",
      isSecret: false,
      showUserName: true,
      showSiteName: true,
      showUserLevel: true,
      showLevelRequirements: true,
      showSeedingPoints: true,
      showWeek: false,
    };
  },
  created() {
    this.init();
  },
  computed: {
    //Done to get the ordered headers
    showHeaders(): any[] {
      return this.headers.filter((s) =>
        this.selectedHeaders.map((sh) => sh.value).includes(s.value)
      );
    },
  },

  /**
   * 当前组件激活时触发
   * 因为启用了缓存，所以需要重新加载数据
   */
  activated() {
    if (!this.loading) {
      this.init();
    }
  },

  methods: {
    showColumn(val: string) {
      for (var header of this.headers.filter((s) =>
        this.selectedHeaders.includes(s)
      )) {
        if (header.value === val) return true;
      }
      return false;
    },
    resetSites() {
      this.sites = [];
      this.options.sites.forEach((site: Site) => {
        let _site: Site = this.clone(site);
        if (_site.allowGetUserInfo) {
          if (!_site.user) {
            _site.user = {
              id: "",
              name: "",
              isLogged: false,
              isLoading: false,
            };
          } else {
            if (_site.user.isLoading === undefined) {
              _site.user.isLoading = false;
            }

            if (_site.user.isLogged === undefined) {
              _site.user.isLogged = false;
            }
            this.formatUserInfo(_site.user, _site);
          }
          this.sites.push(_site);
        }
      });
    },

    init() {
      extension
        .sendRequest(EAction.readConfig)
        .then((options: Options) => {
          this.options = this.clone(options);
          this.resetSites();
        })
        .catch();

      let viewOptions = this.$store.getters.viewsOptions(EViewKey.home, {
        showUserName: true,
        showSiteName: true,
        showUserLevel: true,
        showLevelRequirements: true,
        showSeedingPoints: true,
        showWeek: false,
        selectedHeaders: this.selectedHeaders,
      });
      Object.assign(this, viewOptions);
      this.selectedHeaders = this.headers.filter((s) =>
        this.selectedHeaders.map((sh) => sh.value).includes(s.value)
      );
      if (this.selectedHeaders.length == 0) {
        this.selectedHeaders = Object.assign([], this.headers);
      }
    },
    getInfos() {
      this.loading = true;
      this.beginTime = dayjs();
      this.writeLog({
        event: `Home.getUserInfo.Start`,
        msg: this.$t("home.startGetting").toString(),
      });

      this.sites.forEach((site: Site, index: number) => {
        this.writeLog({
          event: `Home.getUserInfo.Processing`,
          msg: this.$t("home.gettingForSite", {
            siteName: site.name,
          }).toString(),
          data: {
            host: site.host,
            name: site.name,
          },
        });

        this.getSiteUserInfo(site);
      });
    },
    /**
     * 记录日志
     * @param options
     */
    writeLog(options: LogItem) {
      extension.sendRequest(EAction.writeLog, null, {
        module: EModule.options,
        event: options.event,
        msg: options.msg,
        data: options.data,
      });
    },

    /**
     * 移除搜索队列
     */
    removeQueue(site: Site) {
      let index = this.requestQueue.findIndex((item: any) => {
        return item.host === site.host;
      });

      (site.user as any).isLoading = false;
      if (index !== -1) {
        this.requestQueue.splice(index, 1);
        if (this.requestQueue.length == 0) {
          this.requestMsg = this.$t("home.requestCompleted", {
            second: dayjs().diff(this.beginTime, "second", true),
          }).toString();
          this.loading = false;
          this.writeLog({
            event: `Home.getUserInfo.Finished`,
            msg: this.requestMsg,
          });
          // 重置站点信息，因为有时候加载完成后，某些行还显示正在加载，暂时未明是哪里问题
          this.sites = this.clone(this.sites);
        }
      }
    },
    /**
     * 格式化一些用户信息
     */
    formatUserInfo(user: UserInfoEx, site: Site) {
      let downloaded = user.downloaded as number;
      let uploaded = user.uploaded as number;
      // 没有下载量时设置分享率为无限
      if (downloaded == 0 && uploaded > 0) {
        user.ratio = -1;
      }
      // 重新以 上传量 / 下载量计算分享率
      else if (downloaded > 0) {
        user.ratio = uploaded / downloaded;
      }

      // 如果设置了时区，则进行转换
      user.joinTime = PPF.transformTime(user.joinTime, site.timezoneOffset);

      user.joinDateTime = dayjs(user.joinTime).format("YYYY-MM-DD HH:mm:ss");

      // 设置升级条件
      try {
        if (site.levelRequirements) {
          user.nextLevel = {};
          user.nextLevel.level = -1;
          for (var levelRequirement of site.levelRequirements) {
            if (levelRequirement.requiredDate) break;

            if (levelRequirement.interval && user.joinDateTime) {
              levelRequirement.requiredDate = dayjs(user.joinDateTime)
                .add(levelRequirement.interval as number, "week")
                .format("YYYY-MM-DD");
            } else break;
          }

          for (var levelRequirement of site.levelRequirements) {
            if (levelRequirement.interval && user.joinDateTime) {
              let weeks = levelRequirement.interval as number;
              let requiredDate = dayjs(user.joinDateTime).add(weeks, "week");
              if (dayjs(new Date()).isBefore(requiredDate)) {
                user.nextLevel.requiredDate = requiredDate.format("YYYY-MM-DD");
                user.nextLevel.level = levelRequirement.level;
              }
            }

            if (
              levelRequirement.uploaded ||
              (downloaded && levelRequirement.ratio)
            ) {
              let levelRequirementUploaded = levelRequirement.uploaded
                ? this.fileSizetoLength(levelRequirement.uploaded as string)
                : 0;
              let requiredDownloaded = levelRequirement.downloaded
                ? this.fileSizetoLength(levelRequirement.downloaded as string)
                : 0;
              let requiredUploadedbyRatio = levelRequirement.ratio
                ? Math.max(downloaded, requiredDownloaded) *
                levelRequirement.ratio
                : 0;
              let requiredUploaded = Math.max(
                levelRequirementUploaded,
                requiredUploadedbyRatio
              );
              if (uploaded < requiredUploaded) {
                user.nextLevel.uploaded = requiredUploaded - uploaded;
                user.nextLevel.level = levelRequirement.level;
              }
            }

            if (levelRequirement.downloaded) {
              let requiredDownloaded = this.fileSizetoLength(
                levelRequirement.downloaded as string
              );
              if (downloaded < requiredDownloaded) {
                user.nextLevel.downloaded = requiredDownloaded - downloaded;
                user.nextLevel.level = levelRequirement.level;
              }
            }

            if (levelRequirement.ratio) {
              let userRatio = user.ratio as number;
              let requiredRatio = levelRequirement.ratio as number;
              if (userRatio != -1 && userRatio < requiredRatio) {
                user.nextLevel.ratio = levelRequirement.ratio;
                user.nextLevel.level = levelRequirement.level;
              }
            }

            if (levelRequirement.bonus) {
              let userBonus = user.bonus as number;
              let requiredBonus = levelRequirement.bonus as number;

              if (userBonus < requiredBonus) {
                user.nextLevel.bonus = requiredBonus - userBonus;
                user.nextLevel.level = levelRequirement.level;
              }
            }

            if (levelRequirement.seedingPoints) {
              let userSeedingPoints = user.seedingPoints as number;
              let requiredSeedingPoints =
                levelRequirement.seedingPoints as number;
              if (userSeedingPoints < requiredSeedingPoints) {
                user.nextLevel.seedingPoints =
                  requiredSeedingPoints - userSeedingPoints;
                user.nextLevel.level = levelRequirement.level;
              }
            }

            if (levelRequirement.uploads) {
              let userUploads = user.uploads as number;
              let requiredUploads = levelRequirement.uploads as number;
              if (userUploads < requiredUploads) {
                user.nextLevel.uploads = requiredUploads - userUploads;
                user.nextLevel.level = levelRequirement.level;
              }
            }

            if (levelRequirement.trueDownloaded) {
              let userTrueDownloaded = user.trueDownloaded
                ? (user.trueDownloaded as number)
                : 0;
              let requiredTrueDownloaded = this.fileSizetoLength(
                levelRequirement.trueDownloaded as string
              );
              if (userTrueDownloaded < requiredTrueDownloaded) {
                user.nextLevel.trueDownloaded =
                  requiredTrueDownloaded - userTrueDownloaded;
                user.nextLevel.level = levelRequirement.level;
              }
            }

            if (levelRequirement.classPoints) {
              let userClassPoints = user.classPoints as number;
              let requiredClassPoints = levelRequirement.classPoints as number;
              if (userClassPoints < requiredClassPoints) {
                user.nextLevel.classPoints =
                  requiredClassPoints - userClassPoints;
                user.nextLevel.level = levelRequirement.level;
              }
            }

            if ((user.nextLevel.level as number) > 0) {
              user.nextLevel.name = levelRequirement.name;
              break;
            }
          }
        }
      } catch { }
    },
    /**
     * @return {number}
     */
    fileSizetoLength(size: string | number): number {
      if (typeof size == "number") {
        return size;
      }
      let _size_raw_match = size
        .replace(/,/g, "")
        .trim()
        .match(/^(\d*\.?\d+)(.*[^ZEPTGMK])?([ZEPTGMK](B|iB))$/i);
      if (_size_raw_match) {
        let _size_num = parseFloat(_size_raw_match[1]);
        let _size_type = _size_raw_match[3];
        switch (true) {
          case /Zi?B/i.test(_size_type):
            return _size_num * Math.pow(2, 70);
          case /Ei?B/i.test(_size_type):
            return _size_num * Math.pow(2, 60);
          case /Pi?B/i.test(_size_type):
            return _size_num * Math.pow(2, 50);
          case /Ti?B/i.test(_size_type):
            return _size_num * Math.pow(2, 40);
          case /Gi?B/i.test(_size_type):
            return _size_num * Math.pow(2, 30);
          case /Mi?B/i.test(_size_type):
            return _size_num * Math.pow(2, 20);
          case /Ki?B/i.test(_size_type):
            return _size_num * Math.pow(2, 10);
          default:
            return _size_num;
        }
      }
      return 0;
    },
    /**
     * 获取站点用户信息
     */
    getSiteUserInfo(site: Site) {
      // fix issue #1065, 注意此处直接return在无站点更新时会导致刷新按钮一直处于loading状态，暂不修
      if (!site.user || site.offline) {
        return;
      }

      let user = site.user;
      user.isLoading = true;
      user.isLogged = false;
      user.lastErrorMsg = "";

      this.requestQueue.push(Object.assign({}, site));
      extension
        .sendRequest(EAction.getUserInfo, null, site)
        .then((result: any) => {
          console.log(result);
          if (result && result.name) {
            user = Object.assign(user, result);
            this.formatUserInfo(user, site);
          }
        })
        .catch((result) => {
          console.log("error", result);
          if (result.msg && result.msg.status) {
            user.lastErrorMsg = result.msg.msg;
          } else {
            user.lastErrorMsg = this.$t("home.getUserInfoError").toString();
          }
        })
        .finally(() => {
          this.removeQueue(site);
          // 重新加载配置信息
          this.$store.commit("readConfig");
        });
    },

    abortRequest(site: Site) {
      extension
        .sendRequest(EAction.abortGetUserInfo, null, site)
        .then(() => {
          this.writeLog({
            event: `Home.getUserInfo.Abort`,
            msg: this.$t("home.getUserInfoAbort", {
              siteName: site.name,
            }).toString(),
          });
        })
        .catch(() => {
          this.writeLog({
            event: `Home.getUserInfo.Abort.Error`,
            msg: this.$t("home.getUserInfoAbortError", {
              siteName: site.name,
            }).toString(),
          });
          this.removeQueue(site);
        });
    },

    /**
     * 用JSON对象模拟对象克隆
     * @param source
     */
    clone(source: any) {
      return JSON.parse(JSON.stringify(source));
    },

    updateViewOptions() {
      this.$store.dispatch("updateViewOptions", {
        key: EViewKey.home,
        options: {
          showUserName: this.showUserName,
          showSiteName: this.showSiteName,
          showUserLevel: this.showUserLevel,
          showLevelRequirements: this.showLevelRequirements,
          showSeedingPoints: this.showSeedingPoints,
          showWeek: this.showWeek,
          selectedHeaders: this.selectedHeaders,
        },
      });
    },

    formatError(user: any) {
      if (user.lastErrorMsg) {
        return user.lastErrorMsg;
      }
      if (
        user.lastUpdateStatus &&
        user.lastUpdateStatus !== EUserDataRequestStatus.success
      ) {
        return this.$t(`service.user.${user.lastUpdateStatus}`);
      }
      return "";
    },
  },

  filters: {
    formatRatio(v: any) {
      if (v > 10000 || v == -1) {
        return "∞";
      }
      let number = parseFloat(v);
      if (isNaN(number)) {
        return "";
      }
      return number.toFixed(2);
    },
  },
});
</script>

<style lang="scss">
.home {

  table.v-table thead tr:not(.v-datatable__progress) th,
  table.v-table tbody tr td {
    padding: 5px !important;
    font-size: 12px;
  }

  .center {
    text-align: center;
  }

  .number {
    text-align: right;
  }

  .nodecoration {
    text-decoration: none;
  }

  .messageCount {
    font-size: 9px;
    height: 16px;
    width: 16px;
    top: -2px;
    right: -8px;
  }

  .siteIcon {
    margin: 0;
    height: 30px;
    width: 30px;
  }

  td:hover div.levelRequirement {
    display: block;
  }

  .levelRequirement {
    position: absolute;
    display: none;
    z-index: 999;
    border: 1px solid;
  }

  .select {
    max-width: 180px;
  }
}
</style>
