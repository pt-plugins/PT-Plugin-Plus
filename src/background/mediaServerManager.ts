import { EMediaServerType, IMediaServer } from "@/interface/common";
import { Emby } from "./plugins/Emby";

export class MediaServerManager {
  private servers: any = {};


  private getServer(options: IMediaServer) {
    let server = this.servers[options.id];

    if (server) {
      return server;
    }

    switch (options.type) {
      case EMediaServerType.Emby:
        server = new Emby(options);
        break;

      default:
        break;
    }

    if (server) {
      this.servers[options.id] = server;
    }

    return server;
  }

  public reset() {
    for (const item of this.servers) {
      this.servers[item] = undefined;
      delete this.servers[item];
    }
    this.servers = {};
  }

  public async ping(options: IMediaServer) {
    let server = this.getServer(options);

    if (server) {
      return server.ping();
    }

    return false;
  }

  public async getMediaFromMediaServer(options: IMediaServer, imdbId: string) {
    let server = this.getServer(options);

    if (server) {
      return server.getMediaFromMediaServer(imdbId);
    }

    return false;
  }
}