<template>
  <v-card class="mb-5" color="grey lighten-4">
    <v-card-text>
      <v-form v-model="data.valid">
        <!-- 站点名称 -->
        <v-text-field
          ref="name"
          v-model="data.name"
          :label="words.name"
          :placeholder="words.name"
          required
          :rules="rules.require"
          :disabled="!data.isCustom"
        ></v-text-field>

        <v-text-field
          v-model="data.entry"
          :label="words.entry"
          :placeholder="words.entry"
          required
          :rules="rules.require"
          :disabled="!data.isCustom"
        ></v-text-field>

        <v-text-field
          v-model="data.parseScriptFile"
          :label="words.parseScriptFile"
          :placeholder="words.parseScriptFile"
          :disabled="!data.isCustom"
        ></v-text-field>

        <!-- export interface SearchEntry {
  name?: string;
  entry?: string;
  resultType?: ESearchResultType;
  parseScriptFile?: string;
  parseScript?: string;
  resultSelector?: string;
  enabled?: boolean;
  tagSelectors?: any[];
  isCustom?: boolean;
        }-->
        <!-- 脚本 -->
        <v-textarea
          v-model="data.parseScript"
          :label="words.parseScript"
          height="200"
          :disabled="!data.isCustom"
        ></v-textarea>

        <!-- 种子列表定位选择器 -->
        <v-textarea
          v-model="data.resultSelector"
          :label="words.resultSelector"
          height="80"
          :disabled="!data.isCustom"
        ></v-textarea>
      </v-form>
    </v-card-text>
  </v-card>
</template>
<script lang="ts">
import Vue from "vue";
import { Site } from "@/interface/common";
export default Vue.extend({
  data() {
    return {
      words: {
        name: "入口名称",
        entry: "入口页面",
        pages: "适用页面",
        pagesTip:
          "页面以'/'开始表示网站根目录，输入完成后按回车添加，可添加多个，可以是正则表达式",
        scripts: "附加脚本文件",
        scriptsTip: "/ 表示从资源目录根加载脚本，可添加多个",
        parseScript: "搜索结果解析脚本",
        parseScriptFile: "搜索结果解析脚本文件",
        resultSelector: "种子列表定位选择器",
        style: "附加样式",
        styles: "附加样式文件",
        stylesTip: "/ 表示从资源目录根加载脚本，可添加多个"
      },
      rules: {
        require: [(v: any) => !!v || "!"]
      }
    };
  },
  props: {
    data: {
      type: Object,
      default: () => ({
        valid: false
      })
    }
  },
  watch: {
    "data.script"() {
      console.log(
        JSON.stringify({
          script: this.data.script
        })
      );
    }
  }
});
</script>

<style lang="scss">
.v-textarea {
  .v-text-field__slot {
    height: 100%;
    textarea {
      height: 100%;
    }
  }
}
</style>
