<template>
  <div class="movieInfoCard" v-if="visible">
    <v-card color="blue-grey darken-2" class="white--text">
      <v-card-title class="pb-2">
        <div :class="$vuetify.breakpoint.mdAndUp?'headline': 'title'">
          <span>{{ info.title}}</span>
          <span
            :class="['ml-1','grey--text',$vuetify.breakpoint.mdAndUp?'title':'caption']"
          >({{ info.attrs.year[0] }})</span>
        </div>
      </v-card-title>
      <v-img
        :src="info.image"
        class="ml-3 mb-3"
        contain
        :max-height="maxHeight"
        position="left center"
      >
        <v-layout style="margin-left: 220px;" v-if="$vuetify.breakpoint.mdAndUp">
          <v-card-title class="pt-0">
            <v-flex xs12>
              <span>{{ $t("movieInfoCard.alias") }}</span>
              <span class="caption">{{ info.alt_title }}</span>
            </v-flex>
            <v-flex xs12>
              <span>{{ $t("movieInfoCard.director") }}</span>
              <span class="caption">{{ formatArray(info.attrs.director) }}</span>
            </v-flex>
            <v-flex xs12>
              <span>{{ $t("movieInfoCard.writer") }}</span>
              <span class="caption">{{ formatArray(info.attrs.writer) }}</span>
            </v-flex>
            <v-flex xs12>
              <span>{{ $t("movieInfoCard.cast") }}</span>
              <span class="caption">{{ formatArray(info.attrs.cast) }}</span>
            </v-flex>
            <v-flex xs12>
              <span>{{ $t("movieInfoCard.type") }}</span>
              <span class="caption">{{ formatArray(info.attrs.movie_type) }}</span>
            </v-flex>
            <v-flex xs12>
              <span>{{ $t("movieInfoCard.pubdate") }}</span>
              <span class="caption">{{ formatArray(info.attrs.pubdate) }}</span>
            </v-flex>
            <v-flex xs12>
              <span>{{ $t("movieInfoCard.duration") }}</span>
              <span class="caption">{{ formatArray(info.attrs.movie_duration) }}</span>
            </v-flex>
            <v-flex xs12 class="my-2">
              <v-divider light></v-divider>
            </v-flex>
            <div class="caption" v-html="`${info.summary} @豆瓣`"></div>
          </v-card-title>
        </v-layout>
        <v-layout v-else style="margin-left: 75px;">
          <v-card-text class="pt-0">
            <v-flex xs12>
              <span class="caption">{{ info.alt_title }}</span>
            </v-flex>
            <v-flex xs12>
              <span class="caption">{{ formatArray(info.attrs.movie_type) }}</span>
            </v-flex>
            <v-flex xs12>
              <span class="caption">{{ formatArray(info.attrs.pubdate) }}</span>
            </v-flex>
            <v-flex xs12>
              <span class="caption">{{ formatArray(info.attrs.movie_duration) }}</span>
            </v-flex>
          </v-card-text>
        </v-layout>
      </v-img>
      <v-divider light></v-divider>
      <v-card-actions class="px-3">
        <!-- 豆瓣评分 -->
        <v-btn
          color="success"
          :href="info.mobile_link"
          target="_blank"
          rel="noopener noreferrer nofollow"
        >豆瓣 {{ info.rating.average }}</v-btn>

        <!-- IMDb评分 -->
        <v-btn
          color="amber"
          :href="`https://www.imdb.com/title/${this.IMDbId}/`"
          target="_blank"
          rel="noopener noreferrer nofollow"
        >IMDb {{ ratings.imdbRating }}</v-btn>

        <!-- 烂番茄新鲜度 -->
        <v-btn
          v-if="tomatoRating>0"
          color="red lighten-3"
          :href="ratings.tomatoURL"
          target="_blank"
          rel="noopener noreferrer nofollow"
        >
          <v-avatar size="20" class="mr-1">
            <img :src="rottenTomatoes.fresh" v-if="tomatoRating>=60" />
            <img :src="rottenTomatoes.rotten" v-else />
          </v-avatar>
          {{ tomatoRating }}%
        </v-btn>

        <!-- Metacritic评分 -->
        <v-btn
          v-if="metascore>0"
          :color="metascore>60?'success':metascore>40?'warning':'error'"
          :href="`https://www.metacritic.com/search/movie/${info.title}/results`"
          target="_blank"
          rel="noopener noreferrer nofollow"
          style="min-width: unset;"
        >
          <v-avatar size="20" class="mr-2">
            <img src="https://upload.wikimedia.org/wikipedia/commons/f/f2/Metacritic_M.png" />
          </v-avatar>
          {{ metascore }}
        </v-btn>

        <v-spacer></v-spacer>
        <v-layout v-if="$vuetify.breakpoint.mdAndUp">
          <v-flex xs6 v-if="rating>0">
            <v-rating
              v-model="rating"
              background-color="white"
              color="yellow accent-4"
              dense
              readonly
              half-increments
              size="30"
            ></v-rating>
            <span
              class="ma-2"
            >{{ $t("movieInfoCard.ratings.douban", {average: info.rating.average, numRaters: info.rating.numRaters}) }}</span>
          </v-flex>
          <v-flex xs6 v-if="imdbRating>0">
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
            >{{ $t("movieInfoCard.ratings.imdb", {average: ratings.imdbRating, numRaters: ratings.imdbVotes.replace(/,/g, "")}) }}</span>
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
      this.ratings = {
        imdbRating: "",
        Ratings: [],
        imdbVotes: ""
      };
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
    formatArray(
      array: any,
      splitChar: string = " / ",
      maxLength: number = 10
    ): string {
      if (array && array.length > 0) {
        if (maxLength > 0 && array.length > maxLength) {
          return array.slice(0, maxLength - 1).join(splitChar) + " ...";
        }
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
    },
    metascore(): number {
      if (this.ratings && this.ratings.Ratings) {
        let ratings = 0;
        this.ratings.Ratings.some((item: any) => {
          if (item.Source == "Metacritic") {
            ratings = parseInt(item.Value.split("/")[0]);
            return true;
          }
        });
        return ratings;
      }
      return 0;
    },
    maxHeight(): number {
      return this.$vuetify.breakpoint.smAndDown ? 120 : 300;
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
