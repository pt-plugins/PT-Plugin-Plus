<template>
  <div class="userDataTimeline">
    <div class="card" ref="userDataCard">
      <v-card color="blue-grey darken-2" class="white--text">
        <v-card-actions>
          <v-chip
            color="blue-grey darken-2"
            text-color="white"
            label
            outline
            @click.stop="changeDisplayUserName"
          >
            <v-avatar>
              <v-icon>account_circle</v-icon>
            </v-avatar>
            <div class="title">{{ displayUserName || infos.nameInfo.name }}</div>
          </v-chip>
          <v-spacer></v-spacer>
          <v-btn
            flat
            icon
            class="white--text"
            @click="share"
            v-if="!shareing"
            :title="$t('timeline.share')"
          >
            <v-icon>share</v-icon>
          </v-btn>
          <v-btn
            flat
            icon
            class="white--text"
            to="/home"
            v-if="!shareing"
            :title="$t('timeline.close')"
          >
            <v-icon>close</v-icon>
          </v-btn>
          <v-progress-circular indeterminate :width="3" size="30" color="green" v-if="shareing" class="by_pass_canvas"></v-progress-circular>
        </v-card-actions>
        <v-layout row wrap>
          <v-card-title primary-title>
            <div class="headline font-weight-bold">
              <div>{{ $t('timeline.total.sites') }}{{ datas.length }}</div>
              <div v-if="showUserUploads && infos.total.uploads && infos.total.uploads > 0">{{ $t('timeline.total.uploads') }}{{ infos.total.uploads }}</div>
              <div>{{ $t('timeline.total.uploaded') }}{{ infos.total.uploaded | formatSizetoPrecision }}</div>
              <div>{{ $t('timeline.total.downloaded') }}{{ infos.total.downloaded | formatSizetoPrecision }}</div>
              <div>{{ $t('timeline.total.seedingSize') }}{{ infos.total.seedingSize | formatSizetoPrecision }}</div>
              <div>{{ $t('timeline.total.seeding') }}{{ infos.total.seeding }}</div>
              <div>{{ $t('timeline.total.ratio') }}{{ infos.total.ratio | formatRatio }}</div>
              <div>{{ $t('timeline.total.years', {year: infos.joinTimeInfo.years}) }}</div>
            </div>
          </v-card-title>
          <v-divider vertical></v-divider>
          <v-card-title primary-title>
            <div class="headline font-weight-bold">
              <div><v-icon color="#C9B037">emoji_events</v-icon></div>
              <div v-if="showUserUploads && infos.total.uploads && infos.total.uploads > 0"><div>
                <v-avatar size="20">
                  <img v-if="infos.maxUploadsInfo.site.icon" :src="infos.maxUploadsInfo.site.icon" :class="{'icon-blur': blurSiteIcon}"/>
                </v-avatar>
              <span>{{ infos.maxUploadsInfo.maxValue }}</span></div></div>
              <div>
                <v-avatar size="20">
                  <img v-if="infos.maxUploadedInfo.site.icon" :src="infos.maxUploadedInfo.site.icon" :class="{'icon-blur': blurSiteIcon}"/>
                </v-avatar>
              <span>{{ infos.maxUploadedInfo.maxValue | formatSizetoPrecision }}</span></div>
              <div>
                <v-avatar size="20">
                  <img v-if="infos.maxDownloadedInfo.site.icon" :src="infos.maxDownloadedInfo.site.icon" :class="{'icon-blur': blurSiteIcon}"/>
                </v-avatar>
              <span>{{ infos.maxDownloadedInfo.maxValue | formatSizetoPrecision }}</span></div>
              <div>
                <v-avatar size="20">
                  <img v-if="infos.maxSeedingSizeInfo.site.icon" :src="infos.maxSeedingSizeInfo.site.icon" :class="{'icon-blur': blurSiteIcon}"/>
                </v-avatar>
              <span>{{ infos.maxSeedingSizeInfo.maxValue | formatSizetoPrecision }}</span></div>
              <div>
                <v-avatar size="20">
                  <img v-if="infos.maxSeedingInfo.site.icon" :src="infos.maxSeedingInfo.site.icon" :class="{'icon-blur': blurSiteIcon}"/>
                </v-avatar>
              <span>{{ infos.maxSeedingInfo.maxValue }}</span></div>
              <div><v-icon></v-icon></div>
              <div><v-icon></v-icon></div>
            </div>
          </v-card-title>
          <v-card-title v-if="infos.maxUploadsInfo.subSite" primary-title>
            <div class="headline font-weight-bold">
              <div><v-icon color="#B4B4B4">emoji_events</v-icon></div>
              <div v-if="showUserUploads && infos.total.uploads && infos.total.uploads > 0"><div>
                <v-avatar size="20">
                  <img v-if="infos.maxUploadsInfo.subSite.icon" :src="infos.maxUploadsInfo.subSite.icon" :class="{'icon-blur': blurSiteIcon}"/>
                </v-avatar>
              <span v-if="infos.maxUploadsInfo.submaxValue && infos.maxUploadsInfo.submaxValue > 0">{{ infos.maxUploadsInfo.submaxValue }}</span></div></div>
              <div>
                <v-avatar size="20">
                  <img v-if="infos.maxUploadedInfo.subSite.icon" :src="infos.maxUploadedInfo.subSite.icon" :class="{'icon-blur': blurSiteIcon}"/>
                </v-avatar>
              <span>{{ infos.maxUploadedInfo.submaxValue | formatSizetoPrecision }}</span></div>
              <div>
                <v-avatar size="20">
                  <img v-if="infos.maxDownloadedInfo.subSite.icon" :src="infos.maxDownloadedInfo.subSite.icon" :class="{'icon-blur': blurSiteIcon}"/>
                </v-avatar>
              <span>{{ infos.maxDownloadedInfo.submaxValue | formatSizetoPrecision }}</span></div>
              <div>
                <v-avatar size="20">
                  <img v-if="infos.maxSeedingSizeInfo.subSite.icon" :src="infos.maxSeedingSizeInfo.subSite.icon" :class="{'icon-blur': blurSiteIcon}"/>
                </v-avatar>
              <span>{{ infos.maxSeedingSizeInfo.submaxValue | formatSizetoPrecision }}</span></div>
              <div>
                <v-avatar size="20">
                  <img v-if="infos.maxSeedingInfo.subSite.icon" :src="infos.maxSeedingInfo.subSite.icon" :class="{'icon-blur': blurSiteIcon}"/>
                </v-avatar>
              <span>{{ infos.maxSeedingInfo.submaxValue }}</span></div>
              <div><v-icon></v-icon></div>
              <div><v-icon></v-icon></div>
            </div>
          </v-card-title>
        </v-layout>
        <v-card-text>
          <v-divider></v-divider>
          <div style="text-align:center;">
            <div
              class="headline font-weight-bold mt-2"
              @click.stop="changeShareMessage"
            >... {{ shareMessage }} ...</div>
            <div
              style="color:#b5b5b5;"
            >({{ $t('timeline.updateat') }}{{ options.autoRefreshUserDataLastTime | formatDate('YYYY-MM-DD HH:mm:ss') }})</div>
          </div>

          <v-timeline class="my-2">
            <v-timeline-item v-for="(site, i) in datas" :key="i" color="transparent" large>
              <template v-slot:icon>
                <v-avatar size="38">
                  <img v-if="site.icon" :src="site.icon" :class="{'icon-blur': blurSiteIcon}"/>
                </v-avatar>
              </template>
              <template v-slot:opposite>
                <div class="headline font-weight-bold">{{ site.user.joinTime | timeAgo }}</div>
                <div class="caption">
                  <span v-if="showUserName" class="mr-2">{{ site.user.name }}</span>
                  <span v-if="showUserLevel">&lt;{{ site.user.levelName }}&gt;</span>
                  <span v-if="site.user.id && site.user.id.length > 0 && showUid">&lt;{{ site.user.id }}&gt;</span>
                </div>
              </template>
              <div>
                <v-divider v-if="i>0" class="mb-2"></v-divider>
                <div class="headline font-weight-light mb-2" v-if="showSiteName">{{ site.name }}</div>
                <div v-if="showUserUploads && site.user.uploads && site.user.uploads > 0">{{ $t('timeline.user.uploads') }}{{$t('timeline.user.colonSeparator')}}{{ site.user.uploads }}</div>
                <div>{{ $t('timeline.user.uploaded') }}{{$t('timeline.user.colonSeparator')}}{{ site.user.uploaded | formatSize}}</div>
                <div>{{ $t('timeline.user.downloaded') }}{{$t('timeline.user.colonSeparator')}}{{ site.user.downloaded | formatSize }}</div>
                <div>{{ $t('timeline.user.ratio') }}{{$t('timeline.user.colonSeparator')}}{{ site.user.ratio | formatRatio }}</div>
                <div>{{ $t('timeline.user.seedingSize') }}{{$t('timeline.user.colonSeparator')}}{{ site.user.seedingSize | formatSize }} ({{ site.user.seeding }})</div>
                <div v-if="site.user.averageSeedtime && site.user.averageSeedtime > 0">{{ $t('timeline.user.averageSeedtime') }}{{$t('timeline.user.colonSeparator')}}{{ site.user.averageSeedtime | formatInteger }}</div>
                <div>{{ $t('timeline.user.bonus') }}{{$t('timeline.user.colonSeparator')}}{{ site.user.bonus | formatNumber }}</div>
                <div v-if="site.user.bonusPerHour && site.user.bonusPerHour != 'N/A'">{{ $t('timeline.user.bonusPerHour') }}{{$t('timeline.user.colonSeparator')}}{{ site.user.bonusPerHour | formatNumber }}</div>
              </div>
            </v-timeline-item>
          </v-timeline>
        </v-card-text>
        <v-divider></v-divider>
        <v-card-actions>
          <v-spacer></v-spacer>
          <span>{{ shareTime | formatDate('YYYY-MM-DD HH:mm:ss') }}</span>
          <span class="ml-1">Created By {{ $t('app.name') }} {{ version }}</span>
        </v-card-actions>
      </v-card>
    </div>

    <div class="toolbar">
      <v-switch
        color="success"
        v-model="showSiteName"
        :label="$t('timeline.siteName')"
        class="my-0"
      ></v-switch>
      <v-switch
          color="success"
          v-model="blurSiteIcon"
          :label="$t('timeline.blurSiteIcon')"
          class="my-0"
      ></v-switch>
      <v-switch
        color="success"
        v-model="showUserName"
        :label="$t('timeline.userName')"
        class="my-0"
      ></v-switch>
      <v-switch
        color="success"
        v-model="showUserLevel"
        :label="$t('timeline.userLevel')"
        class="my-0"
      ></v-switch>
      <v-switch
        color="success"
        v-model="showUserUploads"
        :label="$t('timeline.userUploads')"
        class="my-0"
      ></v-switch>
      <v-switch
        color="success"
        v-model="showUid"
        :label="$t('timeline.userId')"
        class="my-0"
      ></v-switch>
      <v-divider />
      <h1 style="padding: 5px;">{{ $t('timeline.showSites') }}</h1>
      <v-layout justify-start row wrap>
        <v-flex v-for="(site, i) in sites" :key="i" xs3>
          <v-switch
                  color="success"
                  v-model="showSites"
                  :label="site.name"
                  :value="site.name"
                  class="my-0"
                  :disabled="!site.allowGetUserInfo"
                  @change="formatData"
          ></v-switch>
        </v-flex>
      </v-layout>
      <v-divider />
      <!-- 排序 -->
      <h1 style="padding: 5px;">{{ $t('timeline.sortSites.name') }}</h1>
<!--      SortBy-->
      <h2 style="padding: 7px;">{{ $t('timeline.sortSites.key.label') }}</h2>
      <v-radio-group v-model="siteSortBy" row class="ml-5">

        <v-radio v-for="(key, i) in siteSortKeys" :key="i"
            :label="$t('timeline.user.'+key)" color="success" :value="key"
        ></v-radio>
      </v-radio-group>
<!--      sort order-->
      <h2 style="padding: 7px;">{{ $t('timeline.sortSites.order.label') }}</h2>
      <v-radio-group v-model="siteSortOrder" row class="ml-5">
        <v-radio
            :label="$t('timeline.sortSites.order.asc')" color="success" value="asc"
        ></v-radio>
        <v-radio
            :label="$t('timeline.sortSites.order.dsc')" color="success" value="dsc"
        ></v-radio>
      </v-radio-group>
    </div>
  </div>
</template>
<script lang="ts">
import Vue from "vue";
import {
  Site,
  Dictionary,
  EAction,
  Options,
  EViewKey,
  ETagType,
  EUserDataRequestStatus,
  UserInfo
} from "@/interface/common";
import FileSaver from "file-saver";
import domtoimage from 'dom-to-image';
import Extension from "@/service/extension";
import dayjs from "dayjs";
import { PPF } from "@/service/public";

const extension = new Extension();

export default Vue.extend({
  data() {
    return {
      shareMessage: this.$t("timeline.shareMessage").toString(),
      displayUserName: "",
      sites: [] as Site[],
      showSites: [] as string[],
      infos: {
        nameInfo: { name: "test", maxCount: 0 },
        joinTimeInfo: {
          site: {} as Site,
          time: new Date().getTime(),
          years: 0 as number | string
        },
        maxUploadsInfo: {
          site: {} as Site,
          maxValue: 0,
          subSite: {} as Site,
          submaxValue: 0
        },
        maxUploadedInfo: {
          site: {} as Site,
          maxValue: 0,
          subSite: {} as Site,
          submaxValue: 0
        },
        maxDownloadedInfo: {
          site: {} as Site,
          maxValue: 0,
          subSite: {} as Site,
          submaxValue: 0
        },
        maxSeedingInfo: {
          site: {} as Site,
          maxValue: 0,
          subSite: {} as Site,
          submaxValue: 0
        },
        maxSeedingSizeInfo: {
          site: {} as Site,
          maxValue: 0,
          subSite: {} as Site,
          submaxValue: 0
        },
        total: {
          uploads: 0,
          uploaded: 0,
          downloaded: 0,
          seedingSize: 0,
          ratio: -1,
          seeding: 0
        }
      },
      options: this.$store.state.options as Options,
      version: "",
      datas: [] as Site[],
      shareTime: new Date(),
      shareing: false,
      showUserName: true,
      showSiteName: false,
      showUserLevel: true,
      showUserUploads: true,
      showUid: true,
      siteSortKeys: ["joinTime", "uploaded", "seedingSize", "ratio"],
      siteSortBy: "joinTime",
      siteSortOrder: "asc",
      blurSiteIcon: true,
      iconCache: {} as Dictionary<any>
    };
  },
  created() {
    if (chrome && chrome.runtime) {
      let manifest = chrome.runtime.getManifest();
      this.version = "v" + (manifest.version_name || manifest.version);
    }
    this.init();
  },
  mounted() {
  },
  computed: {
    selectedTagValues() {
      let {selectedTags} =   this.$store.getters.viewsOptions(EViewKey.home, {})
      if (selectedTags && Array.isArray(selectedTags) && selectedTags.length > 0) {
        return selectedTags.map(_ => _.value)
      } else {
        return []
      }
    }
  },
  watch: {
    siteSortBy(newVal) {
      this.datas = this.sortSitesByUserInfo(this.datas, newVal, this.siteSortOrder == "asc")
    },
    siteSortOrder(newVal) {
      this.datas = this.sortSitesByUserInfo(this.datas, this.siteSortBy, newVal == "asc")
    }
  },
  methods: {
    filteredSitesByTags(sites: Site[]) {
      if (this.selectedTagValues.length === 0) return sites
      if (this.selectedTagValues.includes(ETagType.all)) return sites
      let tags = this.clone(this.selectedTagValues)
      let res: any[] = []
      if (tags.includes(ETagType.unTagged)) {
        let allUnTaggedSites = sites.filter(s => !s.tags || s.tags.length === 0)
        res = res.concat(allUnTaggedSites)
      }
      if (tags.includes(ETagType.unReadMsg)) {
        let allUnReadMsgSites = sites.filter((site: Site) => (site.user?.messageCount || 0) > 0)
        res = res.concat(allUnReadMsgSites)
      }
      if (tags.includes(ETagType.statusError)) {
        let allStatusErrSites = sites.filter((site: Site) => site.user?.lastErrorMsg || (site.user?.lastUpdateStatus !== EUserDataRequestStatus.success))
        res = res.concat(allStatusErrSites)
      }
      let allTaggedSites = sites.filter(s => Array.isArray(s.tags) && s.tags.length > 0)
      for (let site of allTaggedSites) {
        if (site.tags?.some((s: any) => tags.includes(s))) {
          res.push(site)
        }
      }
      // 这里可能会有重复
      return res
    },
    init() {
      extension
        .sendRequest(EAction.readConfig)
        .then((options: Options) => {
          this.options = this.clone(options);
          this.sites = this.options.sites;
          if (this.options.shareMessage) {
            this.shareMessage = this.options.shareMessage;
          }
          if (this.options.displayUserName) {
            this.displayUserName = this.options.displayUserName;
          }
          let showSites = this.sites.filter((site: Site) => {return site.allowGetUserInfo})
          showSites = this.filteredSitesByTags(showSites)
          //  只提取站点名称
          this.showSites = [...new Set(showSites.map((site: Site) => site.name))];
          this.formatData();
          // console.log(`init`, this.showSites, this.selectedTagValues)
        })
        .catch();
    },
    formatData() {
      let userNames: Dictionary<any> = {};
      let result = this.infos;
      result = {
        nameInfo: { name: "test", maxCount: 0 },
        joinTimeInfo: {
          site: {} as Site,
          time: new Date().getTime(),
          years: 0 as number | string
        },
        maxUploadsInfo: {
          site: {} as Site,
          maxValue: 0,
          subSite: {} as Site,
          submaxValue: 0
        },
        maxUploadedInfo: {
          site: {} as Site,
          maxValue: 0,
          subSite: {} as Site,
          submaxValue: 0
        },
        maxDownloadedInfo: {
          site: {} as Site,
          maxValue: 0,
          subSite: {} as Site,
          submaxValue: 0
        },
        maxSeedingInfo: {
          site: {} as Site,
          maxValue: 0,
          subSite: {} as Site,
          submaxValue: 0
        },
        maxSeedingSizeInfo: {
          site: {} as Site,
          maxValue: 0,
          subSite: {} as Site,
          submaxValue: 0
        },
        total: {
          uploads: 0,
          uploaded: 0,
          downloaded: 0,
          seedingSize: 0,
          ratio: -1,
          seeding: 0
        }
      }

      let sites: Site[] = [];
      this.sites.forEach((site: Site) => {
        // 站点设置不获取用户信息
        if (!site.allowGetUserInfo) {
          return;
        }

        // 展示时不显示该站点信息
        if (!this.showSites.includes(site.name)) {
          return;
        }

        let user = site.user;
        if (user && user.name && user.joinTime) {
          user.joinTime = PPF.transformTime(user.joinTime, site.timezoneOffset);  //add by pxwang for gpw jointime error

          sites.push(site);
          if (!userNames[user.name]) {
            userNames[user.name] = 0;
          }
          userNames[user.name]++;

          // 获取使用最多的用户名
          if (userNames[user.name] > result.nameInfo.maxCount) {
            result.nameInfo.name = user.name;
            result.nameInfo.maxCount = userNames[user.name];
          }

          // 获取加入时间最久的站点
          if (user.joinTime && user.joinTime < result.joinTimeInfo.time) {
            result.joinTimeInfo.time = Math.round(user.joinTime);
            result.joinTimeInfo.site = site;
          }

          if (user.uploads && user.uploads > 0) {
            // https://github.com/pt-plugins/PT-Plugin-Plus/pull/1517
            if (typeof user.uploads !== 'number') {
              console.log(`${site.url}: 当前站点 uploads 类型为 ${typeof user.uploads}，强制转换为 number 类型`)
              user.uploads = parseInt(user.uploads) || 0;
            }
            result.total.uploads += user.uploads;
            if (user.uploads > result.maxUploadsInfo.maxValue) {
              result.maxUploadsInfo.submaxValue = result.maxUploadsInfo.maxValue
              result.maxUploadsInfo.subSite = result.maxUploadsInfo.site
              result.maxUploadsInfo.maxValue = user.uploads;
              result.maxUploadsInfo.site = site;
            } else if (user.uploads > result.maxUploadsInfo.submaxValue) {
              result.maxUploadsInfo.submaxValue = user.uploads;
              result.maxUploadsInfo.subSite = site;
            }
            // https://github.com/pt-plugins/PT-Plugin-Plus/pull/1517
            // console.log(`${site.url}\t\t: uploads: ${user?.uploads} -> ${typeof user?.uploads}, total: ${result.total.uploads}`)
          }

          if (user.uploaded && user.uploaded > 0) {
            result.total.uploaded += user.uploaded;
            // 获取上传最多的站点
            if (user.uploaded > result.maxUploadedInfo.maxValue) {
              result.maxUploadedInfo.submaxValue = result.maxUploadedInfo.maxValue
              result.maxUploadedInfo.subSite = result.maxUploadedInfo.site
              result.maxUploadedInfo.maxValue = user.uploaded;
              result.maxUploadedInfo.site = site;
            } else if (user.uploaded > result.maxUploadedInfo.submaxValue) {
              result.maxUploadedInfo.submaxValue = user.uploaded;
              result.maxUploadedInfo.subSite = site;
            }
          }

          if (user.downloaded && user.downloaded > 0) {
            result.total.downloaded += user.downloaded;
            if (user.downloaded > result.maxDownloadedInfo.maxValue) {
              result.maxDownloadedInfo.submaxValue = result.maxDownloadedInfo.maxValue
              result.maxDownloadedInfo.subSite = result.maxDownloadedInfo.site
              result.maxDownloadedInfo.maxValue = user.downloaded;
              result.maxDownloadedInfo.site = site;
            } else if (user.downloaded > result.maxDownloadedInfo.submaxValue) {
              result.maxDownloadedInfo.submaxValue = user.downloaded;
              result.maxDownloadedInfo.subSite = site;
            }
          }

          if (user.seeding && user.seeding > 0) {
            result.total.seeding += Math.round(user.seeding);
            if (user.seeding > result.maxSeedingInfo.maxValue) {
              result.maxSeedingInfo.submaxValue = result.maxSeedingInfo.maxValue
              result.maxSeedingInfo.subSite = result.maxSeedingInfo.site
              result.maxSeedingInfo.maxValue = Math.round(user.seeding);
              result.maxSeedingInfo.site = site;
            } else if (user.seeding > result.maxSeedingInfo.submaxValue) {
              result.maxSeedingInfo.submaxValue = Math.round(user.seeding);
              result.maxSeedingInfo.subSite = site;
            }
          }

          if (user.seedingSize && user.seedingSize > 0) {
            result.total.seedingSize += user.seedingSize;
            // 获取上传最多的站点
            if (user.seedingSize > result.maxSeedingSizeInfo.maxValue) {
              result.maxSeedingSizeInfo.submaxValue = result.maxSeedingSizeInfo.maxValue
              result.maxSeedingSizeInfo.subSite = result.maxSeedingSizeInfo.site
              result.maxSeedingSizeInfo.maxValue = user.seedingSize;
              result.maxSeedingSizeInfo.site = site;
            } else if (user.seedingSize > result.maxSeedingSizeInfo.submaxValue) {
              result.maxSeedingSizeInfo.submaxValue = user.seedingSize;
              result.maxSeedingSizeInfo.subSite = site;
            }
          }
          user.ratio = this.getRatio(user);
        }
      });

      if (result.joinTimeInfo.time > 0) {
        // 计算P龄，带小数
        result.joinTimeInfo.years = dayjs(new Date())
          .diff(result.joinTimeInfo.time, "year", true)
          .toFixed(2);
      }
      this.infos = result;

      this.datas = this.sortSitesByUserInfo(sites, this.siteSortBy, this.siteSortOrder == "asc")

      console.log(this.datas)

      this.infos.total.ratio = this.getRatio(this.infos.total);

    },
    sortSitesByUserInfo(sites: Site[], key: keyof UserInfo, ascending: boolean): Site[]{
      return sites.sort((a, b) => {
        if ((!a.user || !b.user) || (typeof a.user[key] != "number") ){
          return 0;
        }
        let sortA = a.user[key] ? a.user[key] as number : 0
        let sortB = b.user[key] ? b.user[key] as number : 0

        // handle the condition of ratio is infinitely
        if ((key == "ratio") && (this.ratioIsInfinitely(sortA) || this.ratioIsInfinitely(sortB))) {
          if (this.ratioIsInfinitely(sortA) && this.ratioIsInfinitely(sortB)) {
            return 0
          }
          if (this.ratioIsInfinitely(sortA)) {
            return ascending ? 1: -1
          }
          if (this.ratioIsInfinitely(sortB)) {
            return ascending ? -1: 1
          }
        }
        return ascending ? sortA - sortB : sortB - sortA;
      });
    },
    ratioIsInfinitely(v: number): boolean {
      return v > 10000 || v == -1
    },
    getRatio(info: any): number {
      let downloaded = info.downloaded as number;
      let uploaded = info.uploaded as number;
      // 没有下载量时设置分享率为无限
      if (downloaded == 0 && uploaded > 0) {
        return -1;
      }
      // 没有分享率时，重新以 上传量 / 下载量计算
      else if (downloaded > 0) {
        return uploaded / downloaded;
      }
      return -1;
    },
    /**
     * 用JSON对象模拟对象克隆
     * @param source
     */ clone(source: any) {
      return JSON.parse(JSON.stringify(source));
    },
    share() {
      this.shareing = true;
      this.shareTime = new Date();
      this.formatData();
      setTimeout(() => {
        let div = this.$refs.userDataCard as HTMLDivElement;
        domtoimage.toBlob(div, {
          imagePlaceholder: "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
          filter: (node) => {
            if (node.nodeType === 1) {
              return !(node as Element).classList.contains('by_pass_canvas')
            }

            return true
          }
        }).then((blob: any) => {
          if (blob) {
            FileSaver.saveAs(blob, "PT-Plugin-Plus-UserData.png");
          }
          this.shareing = false;
        }).catch(error => {
          console.log('error:', error);
          this.shareing = false;
        });
      }, 500);
    },

    /**
     * 替换网络图片，用于生成图片
     * 因为网络图片会存在跨域问题，无法正常生成图片
     */
    replaceImageToBase64() {
      let div = this.$refs.userDataCard as HTMLDivElement;
      let imgs = $("img", div);
      imgs.each((index, el) => {
        let src = $(el).attr("src") + "";
        if (src.indexOf("http") > -1) {
          if (this.iconCache[src]) {
            $(el).attr("src", this.iconCache[src]);
            return;
          }
          extension
            .sendRequest(EAction.getBase64FromImageUrl, null, src)
            .then(result => {
              this.iconCache[src] = result;
              $(el).attr("src", result);
            })
            .catch(e => {
              console.log(e);
            });
        }
      });
    },

    /**
     * 修改需要显示的用户名
     */
    changeDisplayUserName() {
      let result = prompt(
        this.$t("timeline.inputDisplayName").toString(),
        this.displayUserName
      );
      if (result != null) {
        this.displayUserName = result;
        this.$store.dispatch("saveConfig", {
          displayUserName: result
        });
      }
    },

    /**
     * 修复需要分享的寄语
     */
    changeShareMessage() {
      let result = prompt(
        this.$t("timeline.inputShareMessage").toString(),
        this.shareMessage
      );
      if (result != null) {
        this.shareMessage = result;
        this.$store.dispatch("saveConfig", {
          shareMessage: result
        });
      }
    }
  },
  filters: {
    formatRatio(v: any) {
      if (v > 10000 || v == -1) {
        return "∞";
      }
      let number = parseFloat(v);
      if (isNaN(number)) {
        return "-";
      }
      return number.toFixed(2);
    }
  }
});
</script>
<style lang="scss" scoped>
.userDataTimeline {
  position: relative;
  .card {
    width: 650px;
  }

  .toolbar {
    position: absolute;
    left: 660px;
    top: 0;
  }

  .icon-blur {
    filter: blur(4px);
  }
}
</style>
