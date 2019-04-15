<template>
  <div id="container" class="container">
    <v-autocomplete
      v-model="selectedSite"
      :items="options.sites"
      :label="words.selectSite"
      persistent-hint
      single-line
      item-text="name"
      item-value="host"
      return-object
      @input="init(selectedSite.host)"
    >
      <template slot="selection" slot-scope="{ item }">
        <v-list-tile-avatar>
          <img :src="item.icon">
        </v-list-tile-avatar>
        <span v-text="item.name"></span>
      </template>
      <template slot="item" slot-scope="data" style>
        <v-list-tile-avatar>
          <img :src="data.item.icon">
        </v-list-tile-avatar>
        <v-list-tile-content>
          <v-list-tile-title v-html="data.item.name"></v-list-tile-title>
          <v-list-tile-sub-title v-html="data.item.url"></v-list-tile-sub-title>
        </v-list-tile-content>
        <v-list-tile-action>
          <v-list-tile-action-text>{{ joinTags(data.item.tags) }}</v-list-tile-action-text>
        </v-list-tile-action>
      </template>
    </v-autocomplete>

    <div ref="charts">
      <highcharts :options="chartBaseData"/>
      <highcharts :options="chartExtData" class="mt-4"/>

      <v-card-actions>
        <v-spacer></v-spacer>
        <span>{{ shareTime | formatDate('YYYY-MM-DD HH:mm:ss') }}</span>
        <span class="ml-1">Created By PT 助手 Plus {{ version }}</span>
      </v-card-actions>
    </div>

    <v-layout row wrap>
      <v-btn depressed small to="/home">{{ words.goback }}</v-btn>
      <v-spacer></v-spacer>
      <v-btn depressed small @click="share" :title="words.share" v-if="!shareing">
        <v-icon>share</v-icon>
      </v-btn>
      <v-progress-circular indeterminate :width="3" size="30" color="green" v-if="shareing"></v-progress-circular>
    </v-layout>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import { Chart } from "highcharts-vue";
import { Route } from "vue-router";
import Extension from "@/service/extension";
import { filters } from "@/service/filters";
import {
  EAction,
  EUserDataRange,
  Site,
  DownloadClient,
  EDataResultType
} from "@/interface/common";
import html2canvas from "html2canvas";
import FileSaver from "file-saver";

const extension = new Extension();

function formatBonus(v: any) {
  let result: number | string = 0;
  let unit = "";
  switch (true) {
    case v >= 1000000000:
      return "∞";
      break;

    case v >= 100000000:
      unit = "亿";
      result = v / 100000000;
      break;

    case v >= 10000000:
      unit = "千万";
      result = v / 10000000;
      break;

    case v >= 1000000:
      unit = "百万";
      result = v / 1000000;
      break;

    case v >= 10000:
      unit = "万";
      result = v / 10000;
      break;

    case v >= 1000:
      unit = "千";
      result = v / 1000;
      break;

    default:
      return v;
      break;
  }

  return parseFloat(result.toString()).toFixed(2) + " " + unit;
}

export default Vue.extend({
  components: {
    highcharts: Chart
  },
  data() {
    return {
      words: {
        selectSite: "选择需要统计的站点",
        goback: "返回",
        share: "生成分享图片"
      },
      chartBaseData: {},
      chartExtData: {},
      host: "",
      options: this.$store.state.options,
      selectedSite: {} as Site,
      shareing: false,
      shareTime: new Date(),
      version: ""
    };
  },

  mounted() {
    this.initEvents();
    this.init(this.$route.params["host"]);
  },

  created() {
    if (chrome && chrome.runtime) {
      let manifest = chrome.runtime.getManifest();
      this.version = "v" + (manifest.version_name || manifest.version);
    }
  },

  methods: {
    initEvents() {},
    init(host: string) {
      if (!host) {
        return;
      }

      this.host = host;

      this.selectedSite = this.options.sites.find((item: Site) => {
        return item.host == this.host;
      });

      extension
        .sendRequest(EAction.getUserHistoryData, null, this.host)
        .then((data: any) => {
          console.log(data);
          this.resetData(data);
        });
    },
    resetData(result: any) {
      this.resetBaseData(result);
      this.resetExtData(result);
    },
    /**
     * 基础数据
     */
    resetBaseData(result: any) {
      var fillOpacity = 0.3;
      var datas = [
        {
          type: "spline",
          name: "上传",
          tooltip: {
            formatter: function(): any {
              let _this = this as any;
              return filters.formatSize(_this.x);
            }
          },
          fillOpacity: fillOpacity,
          data: [] as any
        },
        {
          type: "spline",
          name: "下载",
          tooltip: {
            valueSuffix: " "
          },
          fillOpacity: fillOpacity,
          data: [] as any
        },
        {
          type: "spline",
          name: "积分",
          yAxis: 1,
          tooltip: {
            valueSuffix: " "
          },
          fillOpacity: fillOpacity,
          data: [] as any
        }
      ];
      var types = {};
      var colors = ["#1b5e20", "#b71c1c", "#2f7ed8", "#03A9F4"];
      var categories = [];
      let latest = {
        downloaded: 0,
        uploaded: 0,
        bonus: 0,
        name: ""
      };

      // 数据
      for (const date in result) {
        if (result.hasOwnProperty(date)) {
          const data = result[date];

          if (data.lastUpdateStatus != EDataResultType.success) {
            continue;
          }
          if (date == EUserDataRange.latest) {
            latest = data;
            continue;
          }

          datas[0].data.push(parseFloat(data.uploaded));
          datas[1].data.push(parseFloat(data.downloaded));
          datas[2].data.push(parseFloat(data.bonus));
          categories.push(date);
        }
      }

      var chart = {
        series: datas,
        colors: colors,
        // 版权信息
        credits: {
          enabled: false
        },
        subtitle: {
          text: `上传：${filters.formatSize(
            latest.uploaded
          )}, 下载：${filters.formatSize(
            latest.downloaded
          )}，积分：${filters.formatNumber(latest.bonus)}`
        },
        title: {
          text: `[${latest.name}@${this.selectedSite.name}] 基本数据`
        },
        xAxis: {
          categories: categories,
          gridLineDashStyle: "ShortDash",
          gridLineWidth: 1,
          gridLineColor: "#dddddd"
        },
        yAxis: [
          {
            labels: {
              formatter: function(): any {
                let _this = this as any;
                return filters.formatSize(_this.value);
              },
              style: {
                color: colors[3]
              }
            },
            title: {
              text: "数据",
              style: {
                color: colors[3]
              }
            },
            lineWidth: 1,
            gridLineDashStyle: "ShortDash"
          },
          {
            opposite: true,
            labels: {
              formatter: function(): any {
                let _this = this as any;
                return formatBonus(_this.value);
              },
              style: {
                color: colors[2]
              }
            },
            title: {
              text: "积分",
              style: {
                color: colors[2]
              }
            },
            lineWidth: 1,
            gridLineDashStyle: "ShortDash"
          }
        ],
        tooltip: {
          shared: true
        }
      };

      this.chartBaseData = chart;
    },
    /**
     * 其他数据
     */
    resetExtData(result: any) {
      var fillOpacity = 0.3;
      var datas = [
        {
          type: "spline",
          name: "做种体积",
          fillOpacity: fillOpacity,
          data: [] as any
        },
        {
          type: "spline",
          name: "做种数",
          yAxis: 1,
          fillOpacity: fillOpacity,
          data: [] as any
        }
      ];
      var types = {};
      var colors = ["#FF6F00", "#2E7D32", "#2f7ed8", "#03A9F4"];
      var categories = [];
      let latest = {
        seeding: 0,
        seedingSize: 0,
        name: ""
      };

      // 数据
      for (const date in result) {
        if (result.hasOwnProperty(date)) {
          const data = result[date];

          if (
            data.lastUpdateStatus != EDataResultType.success ||
            data.seeding == null
          ) {
            continue;
          }
          if (date == EUserDataRange.latest) {
            latest = data;
            continue;
          }

          datas[0].data.push(parseFloat(data.seedingSize));
          datas[1].data.push(parseFloat(data.seeding));
          categories.push(date);
        }
      }

      var chart = {
        series: datas,
        colors: colors,
        // 版权信息
        credits: {
          enabled: false
        },
        subtitle: {
          text: `做种体积：${filters.formatSize(latest.seedingSize)}, 数量：${
            latest.seeding
          } 个`
        },
        title: {
          text: `[${latest.name}@${this.selectedSite.name}] 保种情况`
        },
        xAxis: {
          categories: categories,
          gridLineDashStyle: "ShortDash",
          gridLineWidth: 1,
          gridLineColor: "#dddddd"
        },
        yAxis: [
          {
            labels: {
              formatter: function(): any {
                let _this = this as any;
                return filters.formatSize(_this.value);
              },
              style: {
                color: colors[0]
              }
            },
            title: {
              text: "体积",
              style: {
                color: colors[0]
              }
            },
            lineWidth: 1,
            gridLineDashStyle: "ShortDash"
          },
          {
            opposite: true,
            labels: {
              formatter: function(): any {
                let _this = this as any;
                return formatBonus(_this.value);
              },
              style: {
                color: colors[1]
              }
            },
            title: {
              text: "数量",
              style: {
                color: colors[1]
              }
            },
            lineWidth: 1,
            gridLineDashStyle: "ShortDash"
          }
        ],
        tooltip: {
          shared: true
        }
      };

      this.chartExtData = chart;
    },
    joinTags(tags: any): string {
      if (tags && tags.join) {
        return tags.join(", ");
      }
      return "";
    },
    share() {
      let div = this.$refs.charts as HTMLDivElement;
      this.shareing = true;
      this.shareTime = new Date();
      html2canvas(div, {}).then(canvas => {
        canvas.toBlob((blob: any) => {
          if (blob) {
            FileSaver.saveAs(blob, "PT-Plugin-Plus-Statistic.png");
          }
          this.shareing = false;
        });
      });
    }
  }
});
</script>
<style lang="scss"  scoped>
.container {
  width: 900px;
  text-align: center;

  .chart {
    min-width: 320px;
    max-width: 800px;
    height: 240px;
    margin: 0 auto;
  }
}
</style>
