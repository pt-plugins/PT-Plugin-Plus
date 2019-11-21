import { BuildPlugin } from "./BuildPlugin";

let buildPlugin = new BuildPlugin();
buildPlugin.buildResource();
buildPlugin.getSupportedSites();
console.log("编译完成于：%s \n", new Date().toLocaleString());
