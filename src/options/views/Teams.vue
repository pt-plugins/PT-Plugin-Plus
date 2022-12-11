<template>
  <div>
    <v-alert :value="true" type="info">{{ $t("team.title") }}</v-alert>
    <v-card>
      <div v-for="(item, index) in peoples" :key="index">
        <v-avatar>
          <v-icon>account_circle</v-icon>
        </v-avatar>
        {{ item }}
        <v-divider :key="index"></v-divider>
      </div>
    </v-card>
    <v-alert :value="true" color="grey">
      在项目的开发和测试中，他们给予了很多帮助和支持（或开发，或测试，或发💊，或建议，或鼓励，或鞭策），在此表示感谢。
      <br />列表中未能一一列出所有给予帮助的同学，也对他们表示感谢，如有遗漏敬请谅解。
      <br />同时一并感谢这些
      <br />
      {{ $t("team.contributors") }}
      <a
        target="_blank"
        rel="noopener noreferrer nofollow"
        href="https://github.com/pt-plugins/PT-Plugin-Plus/graphs/contributors"
        >https://github.com/pt-plugins/PT-Plugin-Plus/graphs/contributors</a
      >
      <br />
      {{ $t("team.issues") }}
      <a
        target="_blank"
        rel="noopener noreferrer nofollow"
        href="https://github.com/pt-plugins/PT-Plugin-Plus/issues"
        >https://github.com/pt-plugins/PT-Plugin-Plus/issues</a
      >
    </v-alert>
  </div>
</template>
<script lang="ts">
import Vue from "vue";
export default Vue.extend({
  data() {
    return {
      items: [
        "Rhilip (R酱)",
        "bimzcy (白鸽男孩)",
        "DXV5 (贝壳)",
        "An",
        "Abel袁",
        "Мало",
        "tongyifan (杯杯杯杯具)",
        "the chosen one (三哥)",
        "橙子",
        "frank777777777 (杀死那个异教徒)"
      ]
    };
  },
  computed: {
    peoples(): string[] {
      return this.items.sort();
    }
  }
});
</script>
