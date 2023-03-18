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

        <v-card-title primary-title>
          <div class="headline font-weight-bold">
            <div>{{ $t('timeline.total.uploaded') }}{{ infos.total.uploaded | formatSize }}</div>
            <div>{{ $t('timeline.total.downloaded') }}{{ infos.total.downloaded | formatSize }}</div>
            <div>{{ $t('timeline.total.seedingSize') }}{{ infos.total.seedingSize | formatSize }} ({{ infos.total.seeding }})</div>
            <div>{{ $t('timeline.total.ratio') }}{{ infos.total.ratio | formatRatio }}</div>
            <div>{{ $t('timeline.total.years', {year: infos.joinTimeInfo.years}) }}</div>
          </div>
        </v-card-title>
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
                <div>{{ $t('timeline.user.uploaded') }}{{ site.user.uploaded | formatSize}}</div>
                <div>{{ $t('timeline.user.downloaded') }}{{ site.user.downloaded | formatSize }}</div>
                <div>{{ $t('timeline.user.ratio') }}{{ site.user.ratio | formatRatio }}</div>
                <div>{{ $t('timeline.user.seedingSize') }}{{ site.user.seedingSize | formatSize }} ({{ site.user.seeding }})</div>
                <div>{{ $t('timeline.user.bonus') }}{{ site.user.bonus | formatNumber }}</div>
                <div v-if="site.user.bonusPerHour && site.user.bonusPerHour != 'N/A'">{{ $t('timeline.user.bonusPerHour') }}{{ site.user.bonusPerHour | formatNumber }}</div>
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
    </div>
  </div>
</template>
<script lang="ts">
import Vue from "vue";
import { Site, Dictionary, EAction, Options } from "@/interface/common";
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
        maxUploadedInfo: {
          site: {} as Site,
          maxValue: 0
        },
        maxSeedingInfo: {
          site: {} as Site,
          maxValue: 0
        },
        total: {
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
      showUid: true,
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
    this.replaceImageToBase64();
  },
  methods: {
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
          this.showSites = this.sites
                  .filter((site: Site) => {return site.allowGetUserInfo})
                  .map((site: Site) => {return site.name});  //  只提取站点名称
          this.formatData();
        })
        .catch();
    },
    formatData() {
      let userNames: Dictionary<any> = {};
      let result = this.infos;
      result.total = {
        uploaded: 0,
        downloaded: 0,
        seedingSize: 0,
        ratio: -1,
        seeding: 0
      };

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

          if (user.uploaded && user.uploaded > 0) {
            result.total.uploaded += user.uploaded;
            // 获取上传最多的站点
            if (user.uploaded > result.maxUploadedInfo.maxValue) {
              result.maxUploadedInfo.maxValue = user.uploaded;
              result.maxUploadedInfo.site = site;
            }
          }

          if (user.downloaded && user.downloaded > 0) {
            result.total.downloaded += user.downloaded;
          }

          if (user.seeding && user.seeding > 0) {
            result.total.seeding += Math.round(user.seeding);
          }

          if (user.seedingSize && user.seedingSize > 0) {
            result.total.seedingSize += user.seedingSize;
            // 获取上传最多的站点
            if (user.seedingSize > result.maxSeedingInfo.maxValue) {
              result.maxSeedingInfo.maxValue = user.seedingSize;
              result.maxSeedingInfo.site = site;
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

      // 按加入时间排序
      this.datas = sites.sort((a, b) => {
        
        if (!a.user || !b.user) {
          return 0;
        }
        const sortA = a.user.joinTime || 0;
        const sortB = b.user.joinTime || 0;

        if (sortA < sortB) return -1;
        if (sortA > sortB) return 1;
        return 0;
      });

      this.infos.total.ratio = this.getRatio(this.infos.total);
      setTimeout(() => {
        this.replaceImageToBase64();
      }, 200);
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
