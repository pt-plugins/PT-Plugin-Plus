<template>
  <div class="doubanMovie" v-if="!!IMDbId">
    <v-card color="blue-grey darken-2" class="white--text">
      <v-card-title class="pb-0">
        <div class="headline">
          <span>{{ info.title}}</span>
          <span class="ml-1 caption">({{ info.attrs.year[0] }})</span>
        </div>
      </v-card-title>
      <v-img :src="info.image" class="ml-3 mb-3" contain max-height="300" position="left center">
        <v-layout style="margin-left: 220px;">
          <v-card-title class="pt-0">
            <v-flex xs12>
              <span>又名：</span>
              <span class="caption">{{ info.alt_title }}</span>
            </v-flex>
            <v-flex xs12>
              <span>导演：</span>
              <span class="caption">{{ info.attrs.director.join(" / ") }}</span>
            </v-flex>
            <v-flex xs12>
              <span>编剧：</span>
              <span class="caption">{{ info.attrs.writer.join(" / ") }}</span>
            </v-flex>
            <v-flex xs12>
              <span>主演：</span>
              <span class="caption">{{ info.attrs.cast.join(" / ") }}</span>
            </v-flex>
            <v-flex xs12>
              <span>类型：</span>
              <span class="caption">{{ info.attrs.movie_type.join(" / ") }}</span>
            </v-flex>
            <v-flex xs12>
              <span>上映：</span>
              <span class="caption">{{ info.attrs.pubdate.join(" / ") }}</span>
            </v-flex>
            <v-flex xs12>
              <span>片长：</span>
              <span class="caption">{{ info.attrs.movie_duration.join(" / ") }}</span>
            </v-flex>
            <v-flex xs12 class="my-2">
              <v-divider light></v-divider>
            </v-flex>
            <div class="caption" v-html="`${info.summary} @豆瓣`"></div>
          </v-card-title>
        </v-layout>
      </v-img>
      <v-divider light></v-divider>
      <v-card-actions class="px-3">
        <v-btn
          color="success"
          :href="info.mobile_link"
          target="_blank"
          rel="noopener noreferrer nofollow"
        >豆瓣</v-btn>
        <v-btn
          color="info"
          :href="`https://www.imdb.com/title/${this.IMDbId}/`"
          target="_blank"
          rel="noopener noreferrer nofollow"
        >IMDb</v-btn>
        <v-spacer></v-spacer>
        <v-layout>
          <v-flex xs6>
            <span class="display-2">{{ info.rating.average }}</span>
          </v-flex>
          <v-flex xs6>
            <v-rating
              v-model="rating"
              background-color="white"
              color="yellow accent-4"
              dense
              readonly
              half-increments
              size="30"
            ></v-rating>
            <span class="ma-2">{{ info.rating.numRaters }}人评价</span>
          </v-flex>
        </v-layout>
      </v-card-actions>
    </v-card>
  </div>
</template>
<script lang="ts">
import Vue from "vue";

import Extension from "@/service/extension";
import { EAction } from "@/interface/enum";

const extension = new Extension();

export default Vue.extend({
  props: {
    IMDbId: String
  },
  data() {
    return {
      info: {
        title: "",
        summary: "",
        image: "",
        rating: {
          average: "",
          numRaters: 0
        }
      } as any
    };
  },
  watch: {
    IMDbId() {
      this.reset();
    }
  },
  created() {
    this.reset();
  },
  methods: {
    reset() {
      if (this.IMDbId) {
        extension
          .sendRequest(EAction.getMovieInfoFromDouban, null, this.IMDbId)
          .then(result => {
            console.log(result);
            this.info = Object.assign(this.info, result);
          })
          .catch(error => {
            console.log(error);
          });
      }
    }
  },
  computed: {
    rating(): number {
      if (this.info && this.info.rating) {
        return parseFloat(this.info.rating.average) / 2;
      }
      return 0;
    }
  }
});
</script>

<style lang="scss" scoped>
.doubanMovie {
  .caption {
    color: #ccc;
  }
}
</style>
