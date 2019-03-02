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
      alias: "/home"
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
      component: () => import("./views/settings/Sites/Index.vue")
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
    }
  ]
});
