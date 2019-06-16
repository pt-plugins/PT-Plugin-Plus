<template>
  <div>
    <v-alert :value="true" type="info">{{ $t('reference.title') }}</v-alert>
    <v-card>
      <v-data-table
        :headers="headers"
        :items="items"
        :pagination.sync="pagination"
        item-key="name"
        class="elevation-1"
        hide-actions
      >
        <template slot="items" slot-scope="props">
          <td>{{ props.item.name }}</td>
          <td>{{ props.item.ver }}</td>
          <td>
            <a
              :href="props.item.url"
              target="_blank"
              rel="noopener noreferrer nofollow"
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
export default Vue.extend({
  data() {
    return {
      pagination: {
        rowsPerPage: -1
      },
      items: [
        {
          name: "Vue",
          ver: "2.5.17",
          url: "https://github.com/vuejs/vue"
        },
        {
          name: "vue-router",
          ver: "3.0.1",
          url: "https://github.com/vuejs/vue-router"
        },
        {
          name: "vuex",
          ver: "3.0.1",
          url: "https://github.com/vuejs/vuex"
        },
        {
          name: "Vuetify",
          ver: "1.3.0",
          url: "https://github.com/vuetifyjs/vuetify"
        },
        {
          name: "Notice.js",
          ver: "0.4.0",
          url: "https://github.com/alihesari/notice.js"
        },
        {
          name: "FileSaver.js",
          ver: "2.0.0",
          url: "https://github.com/eligrey/FileSaver.js"
        },
        {
          name: "JavaScript MD5",
          ver: "2.10.0",
          url: "https://github.com/blueimp/JavaScript-MD5"
        },
        {
          name: "jQuery",
          ver: "1.9.1",
          url: "https://github.com/jquery/jquery"
        },
        {
          name: "webpack",
          ver: "4.26.1",
          url: "https://github.com/webpack/webpack"
        },
        {
          name: "TypeScript",
          ver: "3.2.2",
          url: "https://github.com/Microsoft/TypeScript"
        },
        {
          name: "Material design icons",
          ver: "3.0.0",
          url: "https://github.com/google/material-design-icons"
        },
        {
          name: "PT-Plugin Rhilip修改版",
          ver: "0.0.9",
          url: "https://github.com/Rhilip/PT-Plugin"
        },
        {
          name: "Jackett",
          ver: "latest",
          url: "https://github.com/Jackett/Jackett"
        },
        {
          name: "html2canvas",
          ver: "latest",
          url: "https://github.com/niklasvh/html2canvas/"
        },
        {
          name: "Highcharts",
          ver: "7.1.1",
          url: "https://www.highcharts.com"
        }
      ]
    };
  },

  computed: {
    headers(): Array<any> {
      return [
        {
          text: this.$t("reference.headers.name"),
          align: "left",
          value: "name"
        },
        { text: this.$t("reference.headers.ver"), align: "left", value: "ver" },
        { text: this.$t("reference.headers.url"), align: "left", value: "url" }
      ];
    }
  }
});
</script>
