<template>
  <div id="container" class="container">
    <highcharts :options="chartOptions"/>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import { EAction, EUserDataRange } from "@/interface/enum";
import { Chart } from "highcharts-vue";
import { Route } from "vue-router";
import Extension from "@/service/extension";
import { filters } from "@/service/filters";

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
      chartOptions: {
        series: [
          {
            data: [1, 2, 3] // sample data
          }
        ]
      },
      host: ""
    };
  },

  mounted() {
    this.initEvents();
    this.init();
  },

  created() {},

  methods: {
    initEvents() {},
    init() {
      this.host = this.$route.params["host"];
      extension
        .sendRequest(EAction.getUserHistoryData, null, this.host)
        .then((data: any) => {
          console.log(data);
          this.resetData(data);
        });
    },
    resetData(result: any) {
      var fillOpacity = 0.3;
      var datas = [
        {
          type: "areaspline",
          name: "下载",
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
          type: "areaspline",
          name: "上传",
          tooltip: {
            valueSuffix: " "
          },
          fillOpacity: fillOpacity,
          data: [] as any
        },
        {
          type: "areaspline",
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
      var colors = ["#b71c1c", "#1b5e20", "#2f7ed8"];
      var categories = [];
      let latest = {
        downloaded: 0,
        uploaded: 0,
        bonus: 0
      };

      // 数据
      for (const date in result) {
        if (result.hasOwnProperty(date)) {
          const data = result[date];

          if (date == EUserDataRange.latest) {
            latest = data;
            continue;
          }

          datas[0].data.push(parseFloat(data.downloaded));
          datas[1].data.push(parseFloat(data.uploaded));
          datas[2].data.push(parseFloat(data.bonus));
          categories.push(date);
        }
      }

      var chart = {
        series: datas,
        colors: colors,
        subtitle: {
          text: `上传：${filters.formatSize(
            latest.downloaded
          )}, 下载：${filters.formatSize(
            latest.uploaded
          )}，积分：${filters.formatNumber(latest.bonus)}`
        },
        title: {
          text: `[${this.host}] 数据统计`
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
              text: "数据",
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

      this.chartOptions = chart;
    }
  }
});
</script>
<style lang="scss"  scoped>
.container {
  width: 900px;

  .chart {
    min-width: 320px;
    max-width: 800px;
    height: 240px;
    margin: 0 auto;
  }
}
</style>
