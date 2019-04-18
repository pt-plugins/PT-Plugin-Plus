<template>
  <div class="movieInfoCard" v-if="visible">
    <v-card color="blue-grey darken-2" class="white--text">
      <v-card-title class="pb-0">
        <div class="headline">
          <span>{{ info.title}}</span>
          <span class="ml-1 title grey--text">({{ info.attrs.year[0] }})</span>
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
              <span class="caption">{{ formatArray(info.attrs.director) }}</span>
            </v-flex>
            <v-flex xs12>
              <span>编剧：</span>
              <span class="caption">{{ formatArray(info.attrs.writer) }}</span>
            </v-flex>
            <v-flex xs12>
              <span>主演：</span>
              <span class="caption">{{ formatArray(info.attrs.cast) }}</span>
            </v-flex>
            <v-flex xs12>
              <span>类型：</span>
              <span class="caption">{{ formatArray(info.attrs.movie_type) }}</span>
            </v-flex>
            <v-flex xs12>
              <span>上映：</span>
              <span class="caption">{{ formatArray(info.attrs.pubdate) }}</span>
            </v-flex>
            <v-flex xs12>
              <span>片长：</span>
              <span class="caption">{{ formatArray(info.attrs.movie_duration) }}</span>
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
        >豆瓣 {{ info.rating.average }}</v-btn>
        <v-btn
          color="amber"
          :href="`https://www.imdb.com/title/${this.IMDbId}/`"
          target="_blank"
          rel="noopener noreferrer nofollow"
        >IMDb {{ ratings.imdbRating }}</v-btn>

        <v-btn
          v-if="tomatoRating>0"
          color="red lighten-3"
          :href="ratings.tomatoURL"
          target="_blank"
          rel="noopener noreferrer nofollow"
        >
          <v-avatar size="20" class="mr-1">
            <img :src="rottenTomatoes.fresh" v-if="tomatoRating>=60">
            <img :src="rottenTomatoes.rotten" v-else>
          </v-avatar>
          {{ tomatoRating }}%
        </v-btn>
        <v-spacer></v-spacer>
        <v-layout>
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
            <span class="ma-2">豆瓣 {{ info.rating.average }} 共 {{ info.rating.numRaters }} 人参与评价</span>
          </v-flex>
          <v-flex xs6>
            <v-rating
              v-model="imdbRating"
              background-color="white"
              color="yellow accent-4"
              dense
              readonly
              half-increments
              size="30"
            ></v-rating>
            <span
              class="ma-2"
            >IMDb {{ ratings.imdbRating }} 共 {{ ratings.imdbVotes.replace(/,/g, "") }} 人参与评价</span>
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
        },
        attrs: {
          year: [],
          director: [],
          writer: [],
          cast: [],
          movie_type: [],
          pubdate: [],
          movie_duration: []
        }
      } as any,
      ratings: {
        imdbRating: "",
        Ratings: [],
        imdbVotes: ""
      } as any,

      rottenTomatoes: {
        fresh:
          "https://www.rottentomatoes.com/assets/pizza-pie/images/icons/global/new-fresh.587bf3a5e47.png",
        rotten:
          "https://www.rottentomatoes.com/assets/pizza-pie/images/icons/global/new-rotten.efc30acb29c.png"
      },
      visible: false
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
      this.visible = false;
      if (this.IMDbId) {
        extension
          .sendRequest(EAction.getMovieInfos, null, this.IMDbId)
          .then(result => {
            console.log(result);
            this.visible = true;
            this.info = result;
          })
          .catch(error => {
            console.log(error);
          });

        extension
          .sendRequest(EAction.getMovieRatings, null, this.IMDbId)
          .then(result => {
            console.log(result);
            this.ratings = result;
          })
          .catch(error => {
            console.log(error);
          });
      }
    },
    formatArray(array: any, splitChar: string = " / "): string {
      if (array && array.length > 0) {
        return array.join(splitChar);
      }
      return "";
    }
  },
  computed: {
    rating(): number {
      if (this.info && this.info.rating) {
        return parseFloat(this.info.rating.average) / 2;
      }
      return 0;
    },
    imdbRating(): number {
      if (this.ratings && this.ratings.imdbRating) {
        return parseFloat(this.ratings.imdbRating) / 2;
      }
      return 0;
    },
    tomatoRating(): number {
      if (this.ratings && this.ratings.Ratings) {
        let ratings = 0;
        this.ratings.Ratings.some((item: any) => {
          if (item.Source == "Rotten Tomatoes") {
            ratings = parseInt(item.Value);
            return true;
          }
        });
        return ratings;
      }
      return 0;
    }
  }
});
</script>

<style lang="scss" scoped>
.movieInfoCard {
  .caption {
    color: #ccc;
  }
}
</style>
