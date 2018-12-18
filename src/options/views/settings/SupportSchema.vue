<template>
  <div class="set-support-schema">
    <v-alert :value="true" type="info">已支持的网站架构</v-alert>
    <v-card>
      <v-card-title>
        <v-btn color="success" @click="update">
          <v-icon class="mr-2">autorenew</v-icon>更新
        </v-btn>
        <v-spacer></v-spacer>
        <v-text-field class="search" append-icon="search" label="Search" single-line hide-details></v-text-field>
      </v-card-title>
      <v-data-table :headers="headers" :items="items" item-key="name" class="elevation-1">
        <template slot="items" slot-scope="props">
          <td>{{ props.item.name }}</td>
          <td>{{ props.item.ver }}</td>
          <td>{{ showPlugins(props.item.plugins) }}</td>
        </template>
      </v-data-table>
    </v-card>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
export default Vue.extend({
  data() {
    return {
      headers: [
        { text: "名称", align: "left", value: "name" },
        { text: "版本", align: "left", value: "ver" },
        { text: "插件", align: "left", value: "plugins" }
      ],
      items: []
    };
  },
  created() {
    this.items = this.$store.state.options.system.schemas;
  },
  methods: {
    showPlugins(plugins: any[]) {
      let items: string[] = [];
      plugins.forEach(item => {
        items.push(item.name);
      });

      return items.join(", ");
    },
    update() {}
  },
  computed: {}
});
</script>

<style lang="scss" scoped>
.set-support-schema {
  .search {
    max-width: 400px;
  }
}
</style>