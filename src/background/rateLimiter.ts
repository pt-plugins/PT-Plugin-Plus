import {
    Dictionary,
} from "@/interface/common";
import PTPlugin from "./service";

type Service = PTPlugin;

export class AjaxRateLimiter {
    private queues: Dictionary<{ pending: any[], processedInWindow: number }> = {};
    private timestamps: Dictionary<number> = {};
    private configs: Dictionary<any> = {};
    private originalAjax: typeof $.ajax;

    constructor(public service: Service, originalAjax: typeof $.ajax) {
        this.queues = {}; // Holds queues of requests per site
        this.timestamps = {}; // Last request timestamps for each site
        this.configs = {}; // Configuration cache for each site
        this.originalAjax = originalAjax; // Store the original $.ajax function
      }
  
    // Initialize rate limiting settings for each site
    async getConfigForSite(site: string): Promise<any> {
      // Check if the configuration is already loaded
      if (!this.configs[site]) {
        // Fetch configuration lazily (simulate async fetch for the example)
        const config = await this.fetchConfigForSite(site);
        this.configs[site] = config;
      }
      return this.configs[site];
    }
  
    // Simulate fetching configuration for a site
    async fetchConfigForSite(site: string): Promise<any> {
      // TODO: consider cdn and api cdn similar to User.getSiteUrl
      const siteConfig = this.service.config.sites.find(config => site.includes(config.host));
      return siteConfig?.rateLimit || { maxRequests: Infinity, interval: 1 };
    }
  
    // Wrapper function to handle rate limiting
    request(options: JQuery.AjaxSettings): JQuery.jqXHR<any> {
      const site = this.getSiteFromUrl(options.url || '');
      console.log(`Request to ${options.url} for site ${site}`);

      return $.Deferred((deferred) => {
        this.getConfigForSite(site).then(config => {
            console.log(`Config for site ${site}:`, config);
          if (!this.queues[site]) {
            this.queues[site] = { pending: [], processedInWindow: 0 };
          }
  
          this.queues[site].pending.push(() => {
            this.sendRequest(options)
              .then(deferred.resolve)
              .catch(deferred.reject);
          });
          this.processQueue(site, config);
        }).catch(deferred.reject);
      }).promise() as JQuery.jqXHR<any>;
    }
  
    // Extract site from URL
    getSiteFromUrl(url: string): string {
      const link = document.createElement('a');
      link.href = url;
      return link.hostname;
    }
  
    // Process the queue for a given site using leaky bucket algorithm
    async processQueue(site: string, config: Dictionary<any>) {
        const now = Date.now();
        const queue = this.queues[site];
        const lastTimestamp = this.timestamps[site] || 0;
    
        // Calculate the time that has passed since the last request was processed
        const elapsedTime = now - lastTimestamp;
    
        // If the interval has passed since the last request, reset the processed count
        if (elapsedTime >= config.interval) {
            this.timestamps[site] = now;  // Reset window start time
            queue.processedInWindow = 0;  // Reset request count
        }
    
        // Process the queue if there are pending requests
        if (queue.pending.length > 0) {
            // Only process the request if there are available slots
            if (queue.processedInWindow < config.maxRequests ) {
                const request = queue.pending.shift(); // Take one request from the queue
                queue.processedInWindow = (queue.processedInWindow || 0) + 1;
                request();  // Send the request
                this.timestamps[site] = now; // Update last request timestamp
            }
            // Update timestamp and process next request after interval
            setTimeout(() => this.processQueue(site, config), config.interval);
        }
    }
  
    // Send the actual AJAX request
    sendRequest(options: JQuery.AjaxSettings): Promise<any> {
      return new Promise((resolve, reject) => {
        this.originalAjax(options)
          .done(result => {
            console.log(`Request to ${options.url} completed`);
            resolve(result);
          })
          .fail(error => {
            console.log(`Request to ${options.url} failed`);
            reject(error);
          });
      });
    }
  }
