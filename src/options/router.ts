import Vue from "vue";
import Router from "vue-router";
import Home from "./views/Home.vue";

Vue.use(Router);

export default new Router({
  routes: [
    {
      path: "/",
      name: "home",
      component: Home,
      alias: "/home",
      meta: {
        // 需要被缓存
        keepAlive: true
      }
    },
    // {
    //   path: "/about",
    //   name: "about",
    //   // route level code-splitting
    //   // this generates a separate chunk (about.[hash].js) for this route
    //   // which is lazy-loaded when the route is visited.
    //   component: () =>
    //     import(/* webpackChunkName: "about" */ "./views/About.vue")
    // },
    {
      path: "/set-sites",
      name: "set-sites",
      component: () => import("./views/settings/Sites/Index.vue"),
      meta: {
        // 需要被缓存
        keepAlive: true
      }
    },
    {
      path: "/set-support-schema",
      name: "set-support-schema",
      component: () => import("./views/settings/SupportSchema.vue")
    },
    {
      path: "/set-download-clients",
      name: "set-download-clients",
      component: () => import("./views/settings/DownloadClients/Index.vue")
    },
    {
      path: "/set-base",
      name: "set-base",
      component: () => import("./views/settings/Base/Index.vue")
    },
    {
      path: "/set-download-paths",
      name: "set-download-paths",
      component: () => import("./views/settings/DownloadPaths/Index.vue")
    },
    {
      path: "/set-backup",
      name: "set-backup",
      component: () => import("./views/settings/Backup/Index.vue")
    },
    {
      path: "/technology-stack",
      name: "technology-stack",
      component: () => import("./views/TechnologyStack.vue")
    },
    {
      path: "/set-language",
      name: "set-language",
      component: () => import("./views/settings/Language/Index.vue")
    },
    {
      path: "/set-search-solution",
      name: "set-search-solution",
      component: () => import("./views/settings/SearchSolution/Index.vue")
    },
    {
      path: "/donate",
      name: "donate",
      component: () => import("./views/Donate.vue")
    },
    {
      path: "/set-site-plugins/:host",
      name: "set-site-plugins",
      component: () => import("./views/settings/SitePlugins/Index.vue"),
      props: true
    },
    {
      path: "/search-torrent/:key?/:host?",
      name: "search-torrent",
      component: () => import("./views/search/SearchTorrent.vue"),
      props: true,
      meta: {
        // 需要被缓存
        keepAlive: true
      }
    },
    {
      path: "/history",
      name: "history",
      component: () => import("./views/History.vue")
    },
    {
      path: "/system-logs",
      name: "system-logs",
      component: () => import("./views/SystemLogs.vue")
    },
    {
      path: "/set-site-search-entry/:host",
      name: "set-site-search-entry",
      component: () => import("./views/settings/SiteSearchEntry/Index.vue"),
      props: true
    },
    {
      path: "/dev-team",
      name: "dev-team",
      component: () => import("./views/Teams.vue")
    },
    {
      path: "/user-data-timeline",
      name: "user-data-timeline",
      component: () => import("./views/UserDataTimeline.vue")
    },
    {
      path: "/statistic/:host?",
      name: "statistic",
      component: () => import("./views/statisticCharts/SiteBase.vue")
    },
    {
      path: "/set-permissions",
      name: "set-permissions",
      component: () => import("./components/Permissions.vue")
    },
    {
      path: "/collection",
      name: "collection",
      component: () => import("./views/collection/Index.vue"),
      meta: {
        // 需要被缓存
        keepAlive: true
      }
    },
    {
      path: "/search-result-snapshot",
      name: "search-result-snapshot",
      component: () => import("./views/search/SearchResultSnapshot.vue")
    },
    {
      path: "/keep-upload-task",
      name: "keep-upload-task",
      component: () => import("./views/keepUpload/KeepUploadTasks.vue")
    }
  ]
});
