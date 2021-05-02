<template>
  <div>
    <v-alert :value="true" type="info">{{ $t('reference.title') }}</v-alert>
    <v-card>
      <v-data-table
          :headers="headers"
          :items="items"
          :pagination.sync="pagination"
          class="elevation-1"
          hide-actions
          item-key="name"
      >
        <template slot="items" slot-scope="props">
          <td>{{ props.item.name }}</td>
          <td>{{ props.item.ver }}</td>
          <td>
            <a
                :href="props.item.url"
                rel="noopener noreferrer nofollow"
                target="_blank"
            >{{ props.item.url }}</a>
          </td>
        </template>
      </v-data-table>
    </v-card>
    <v-alert :value="true" color="grey">{{ $t("reference.thanks") }}</v-alert>
  </div>
</template>
<script lang="ts">
import Vue from "vue";
import axios from 'axios';

const rawDependencies = require('@/../package.json').dependencies;
const dependencies = Object.entries(rawDependencies).map(value => {
  const [name, version] = value
  return {
    name: name,
    ver: (version as string),
    url: `https://www.npmjs.com/package/${name}`
  }
})

export default Vue.extend({
  data() {
    return {
      pagination: {
        rowsPerPage: -1
      },
      items: [
        ...dependencies,
        // 其他一些不属于NPM依赖的参考项目
        {
          name: "PT-Plugin Rhilip修改版",
          ver: "0.0.9",
          url: "https://github.com/Rhilip/PT-Plugin"
        },
        {
          name: "Jackett",
          ver: "latest",
          url: "https://github.com/Jackett/Jackett"
        }
      ]
    };
  },

  created() {
    const cacheDependMetaData = JSON.parse(localStorage.getItem('depend-metadata') || '{}')

    // 延迟替换依赖的url项
    setTimeout(async () => {
      for (let i = 0; i < this.items.length; i++) {
        let {name, url} = this.items[i]
        if (url.match(/npmjs/)) {
          if (cacheDependMetaData[name]) {
            url = cacheDependMetaData[name]
          } else {
            try {
              const req = await axios.get(`https://registry.npm.taobao.org/${name}`)
              if (req.data?.homepage) {
                url = cacheDependMetaData[name] = req.data?.homepage
              }
            } catch (e) {
              //
            }
          }
          this.items[i].url = url
        }
      }
      localStorage.setItem('depend-metadata', JSON.stringify(cacheDependMetaData))
    }, 1e3);
  },

  computed: {
    headers(): Array<any> {
      return [
        {text: this.$t("reference.headers.name"), align: "left", value: "name"},
        {text: this.$t("reference.headers.ver"), align: "left", value: "ver"},
        {text: this.$t("reference.headers.url"), align: "left", value: "url"}
      ];
    }
  }
});
</script>
