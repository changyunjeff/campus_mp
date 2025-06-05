class AMapWX {
    constructor(a) {
      this.key = a.key;
      this.requestConfig = {
        key: a.key,
        s: "rsx",
        platform: "WXJS",
        appname: a.key,
        sdkversion: "2.0.0",
        logversion: "2.0"
      };
      this.MeRequestConfig = {
        key: a.key,
        serviceName: "https://restapi.amap.com/rest/me"
      };
    }
  
    handleError(error, callback) {
      if (typeof error === 'string') {
        callback({ errCode: "0", errMsg: error });
      } else {
        callback({ errCode: "0", errMsg: error.errMsg || error.message || "未知错误" });
      }
    }
  
    async request(url, data, options = {}) {
      try {
        const response = await uni.request({
          url,
          data,
          method: options.method || "GET",
          header: { "content-type": "application/json", ...options.header },
        });
        
        const result = response.data;
        if (result && result.status && "1" === result.status) {
          return result;
        }
        throw new Error(result.info || "请求失败");
      } catch (error) {
        throw error;
      }
    }
  
    getWxLocation(options) {
      uni.getLocation({
        type: "gcj02",
        success: (res) => {
          const locationStr = `${res.longitude},${res.latitude}`;
          uni.setStorage({ key: "userLocation", data: locationStr });
          options.success && options.success(res);
        },
        fail: (error) => {
          uni.getStorage({
            key: "userLocation",
            success: (storage) => {
              if (storage.data && options.success) {
                options.success(storage.data);
              }
            },
            fail: () => {
              this.handleError(error, options.fail);
            }
          });
        }
      });
    }
  
    async getPoiAround(options) {
      try {
        if (!options || !options.location) {
          throw new Error("缺少必要参数");
        }
  
        const params = {
          location: options.location, // 规则： 经度和纬度用","分割，经度在前，纬度在后，经纬度小数点后不得超过6位
          keywords: options.keywords || '',
          types: options.types || '',
          radius: options.radius || 3000,
          offset: options.offset || 20,
          page: options.page || 1,
          extensions: options.extensions || 'base',
          ...this.requestConfig
        };
  
        const result = await this.request(
          'https://restapi.amap.com/v3/place/around',
          params
        );
        
        options.success && options.success(result);
      } catch (error) {
        options.fail && this.handleError(error, options.fail);
      }
    }
  
    async getGeo(options) {
      try {
        if (!options || !options.address) {
          throw new Error("缺少必要参数");
        }
  
        const params = {
          key: this.key,
          address: options.address,
          city: options.city || '',
          batch: options.batch || false,
          sig: options.sig || '',
          ...this.requestConfig
        };
  
        const result = await this.request(
          'https://restapi.amap.com/v3/geocode/geo',
          params
        );
        
        options.success && options.success(result);
      } catch (error) {
        options.fail && this.handleError(error, options.fail);
      }
    }
  
    async getRegeo(options) {
      try {
        const getLocation = () => {
          return new Promise((resolve, reject) => {
            this.getWxLocation({
              success: resolve,
              fail: reject
            });
          });
        };
  
        const location = options.location || await getLocation();
        const locationStr = typeof location === 'object' 
          ? `${location.longitude},${location.latitude}`
          : location;
  
        const params = {
          location: locationStr,
          extensions: options.extensions || 'all',
          ...this.requestConfig
        };

        const result = await this.request(
          'https://restapi.amap.com/v3/geocode/regeo',
          params
        );

        options.success && options.success(result);
      } catch (error) {
        options.fail && this.handleError(error, options.fail);
      }
    }

    async getInputTips(options) {
      try {

        const params = {
          location: options.location, // 格式：“X,Y”（经度,纬度），不可以包含空格建议使用 location 参数，可在此 location 附近优先返回搜索关键词信息在请求参数 city 不为空时生效
          keywords: options.keywords, // 必填
          type: options.type, // 服务可支持传入多个分类，多个类型剑用“|”分隔。可选值：POI分类名称、分类代码。此处强烈建议使用分类代码，否则可能会得到不符合预期的结果
          city: options.city,
          citylimit: options.citylimit,
          ...this.requestConfig
        };

        /** @type SearchResponse */
        const result = await this.request(
            'https://restapi.amap.com/v3/assistant/inputtips',
            params
        );

        options.success && options.success(result);
      } catch (err) {
        options.fail && this.handleError(err, options.fail);
      }
    }
  
    getMEKeywordsSearch(a) {
      if (!a.options)
        return a.fail({
          errCode: "0",
          errMsg: "\u7f3a\u5c11\u5fc5\u8981\u53c2\u6570",
        });
      var b = a.options,
        c = this.MeRequestConfig,
        d = {
          key: c.key,
          s: "rsx",
          platform: "WXJS",
          appname: a.key,
          sdkversion: "1.2.0",
          logversion: "2.0",
        };
      b.layerId && (d.layerId = b.layerId);
      b.keywords && (d.keywords = b.keywords);
      b.city && (d.city = b.city);
      b.filter && (d.filter = b.filter);
      b.sortrule && (d.sortrule = b.sortrule);
      b.pageNum && (d.pageNum = b.pageNum);
      b.pageSize && (d.pageSize = b.pageSize);
      b.sig && (d.sig = b.sig);
      uni.request({
        url: c.serviceName + "/cpoint/datasearch/local",
        data: d,
        method: "GET",
        header: { "content-type": "application/json" },
        success: function (e) {
          (e = e.data) && e.status && "1" === e.status && 0 === e.code
            ? a.success(e.data)
            : a.fail({ errCode: "0", errMsg: e });
        },
        fail: function (e) {
          a.fail({ errCode: "0", errMsg: e.errMsg || "" });
        },
      });
    }
  
    getMEIdSearch(a) {
      if (!a.options)
        return a.fail({
          errCode: "0",
          errMsg: "\u7f3a\u5c11\u5fc5\u8981\u53c2\u6570",
        });
      var b = a.options,
        c = this.MeRequestConfig,
        d = {
          key: c.key,
          s: "rsx",
          platform: "WXJS",
          appname: a.key,
          sdkversion: "1.2.0",
          logversion: "2.0",
        };
      b.layerId && (d.layerId = b.layerId);
      b.id && (d.id = b.id);
      b.sig && (d.sig = b.sig);
      uni.request({
        url: c.serviceName + "/cpoint/datasearch/id",
        data: d,
        method: "GET",
        header: { "content-type": "application/json" },
        success: function (e) {
          (e = e.data) && e.status && "1" === e.status && 0 === e.code
            ? a.success(e.data)
            : a.fail({ errCode: "0", errMsg: e });
        },
        fail: function (e) {
          a.fail({ errCode: "0", errMsg: e.errMsg || "" });
        },
      });
    }
  
    getMEPolygonSearch(a) {
      if (!a.options)
        return a.fail({
          errCode: "0",
          errMsg: "\u7f3a\u5c11\u5fc5\u8981\u53c2\u6570",
        });
      var b = a.options,
        c = this.MeRequestConfig,
        d = {
          key: c.key,
          s: "rsx",
          platform: "WXJS",
          appname: a.key,
          sdkversion: "1.2.0",
          logversion: "2.0",
        };
      b.layerId && (d.layerId = b.layerId);
      b.keywords && (d.keywords = b.keywords);
      b.polygon && (d.polygon = b.polygon);
      b.filter && (d.filter = b.filter);
      b.sortrule && (d.sortrule = b.sortrule);
      b.pageNum && (d.pageNum = b.pageNum);
      b.pageSize && (d.pageSize = b.pageSize);
      b.sig && (d.sig = b.sig);
      uni.request({
        url: c.serviceName + "/cpoint/datasearch/polygon",
        data: d,
        method: "GET",
        header: { "content-type": "application/json" },
        success: function (e) {
          (e = e.data) && e.status && "1" === e.status && 0 === e.code
            ? a.success(e.data)
            : a.fail({ errCode: "0", errMsg: e });
        },
        fail: function (e) {
          a.fail({ errCode: "0", errMsg: e.errMsg || "" });
        },
      });
    }
  
    getMEaroundSearch(a) {
      if (!a.options)
        return a.fail({
          errCode: "0",
          errMsg: "\u7f3a\u5c11\u5fc5\u8981\u53c2\u6570",
        });
      var b = a.options,
        c = this.MeRequestConfig,
        d = {
          key: c.key,
          s: "rsx",
          platform: "WXJS",
          appname: a.key,
          sdkversion: "1.2.0",
          logversion: "2.0",
        };
      b.layerId && (d.layerId = b.layerId);
      b.keywords && (d.keywords = b.keywords);
      b.center && (d.center = b.center);
      b.radius && (d.radius = b.radius);
      b.filter && (d.filter = b.filter);
      b.sortrule && (d.sortrule = b.sortrule);
      b.pageNum && (d.pageNum = b.pageNum);
      b.pageSize && (d.pageSize = b.pageSize);
      b.sig && (d.sig = b.sig);
      uni.request({
        url: c.serviceName + "/cpoint/datasearch/around",
        data: d,
        method: "GET",
        header: { "content-type": "application/json" },
        success: function (e) {
          (e = e.data) && e.status && "1" === e.status && 0 === e.code
            ? a.success(e.data)
            : a.fail({ errCode: "0", errMsg: e });
        },
        fail: function (e) {
          a.fail({ errCode: "0", errMsg: e.errMsg || "" });
        },
      });
    }
  
    getWeather(options) {
      async function b(g) {
        var h = "base";
        options.type && "forecast" == options.type && (h = "all");
        const params = {
          key: this.key,
          city: g,
          extensions: h,
          ...this.requestConfig
        };
        const result = await this.request(
          'https://restapi.amap.com/v3/weather/weatherInfo',
          params
        );
        if (result.data.status && "1" == result.data.status)
          if (result.data.lives) {
            if ((result = result.data.lives) && 0 < result.length) {
              result = result[0];
              var k = {
                city: { text: "\u57ce\u5e02", data: result.city },
                weather: { text: "\u5929\u6c14", data: result.weather },
                temperature: { text: "\u6e29\u5ea6", data: result.temperature },
                winddirection: {
                  text: "\u98ce\u5411",
                  data: result.winddirection + "\u98ce",
                },
                windpower: {
                  text: "\u98ce\u529b",
                  data: result.windpower + "\u7ea7",
                },
                humidity: { text: "\u6e7f\u5ea6", data: result.humidity + "%" },
              };
              k.liveData = result;
              options.success && options.success(k);
            }
          } else
            result.data.forecasts &&
              result.data.forecasts[0] &&
              options.success && options.success({ forecast: result.data.forecasts[0] });
        else options.fail && options.fail({ errCode: result.data.infocode, errMsg: result.data.info });
      }
      function c(g) {
        this.getWxLocation(g, function (h) { b.call(this, h); });
      }
      options.city ? b.call(this, options.city) : c.call(this, options);
    }
  
    getWalkingRoute(options) {
      async function b(c) {
        if (!c || !c.origin || !c.destination) {
          throw new Error("缺少必要参数");
        }
        const params = {
          key: this.key,
          origin: c.origin,
          destination: c.destination,
          ...this.requestConfig
        };
        const result = await this.request(
          'https://restapi.amap.com/v3/direction/walking',
          params
        );
        options.success && options.success(result);
      }
      b.call(this, options);
    }
  
    getDrivingRoute(options) {
      async function b(c) {
        if (!c || !c.origin || !c.destination) {
          throw new Error("缺少必要参数");
        }
        const params = {
          key: this.key,
          origin: c.origin,
          destination: c.destination,
          strategy: c.strategy || 0,
          waypoints: c.waypoints || '',
          avoidpolygons: c.avoidpolygons || '',
          avoidroad: c.avoidroad || '',
          ...this.requestConfig
        };
        const result = await this.request(
          'https://restapi.amap.com/v3/direction/driving',
          params
        );
        options.success && options.success(result);
      }
      b.call(this, options);
    }
  
    getTransitRoute(a) {
      var b = Object.assign({}, this.requestConfig);
      a.origin && (b.origin = a.origin);
      a.destination && (b.destination = a.destination);
      a.strategy && (b.strategy = a.strategy);
      a.city && (b.city = a.city);
      a.cityd && (b.cityd = a.cityd);
      uni.request({
        url: "https://restapi.amap.com/v3/direction/transit/integrated",
        data: b,
        method: "GET",
        header: { "content-type": "application/json" },
        success: function (c) {
          c &&
            c.data &&
            c.data.route &&
            ((c = c.data.route),
            a.success({
              distance: c.distance || "",
              taxi_cost: c.taxi_cost || "",
              transits: c.transits,
            }));
        },
        fail: function (c) {
          a.fail({ errCode: "0", errMsg: c.errMsg || "" });
        },
      });
    }
  
    getRidingRoute(a) {
      var b = Object.assign({}, this.requestConfig);
      a.origin && (b.origin = a.origin);
      a.destination && (b.destination = a.destination);
      uni.request({
        url: "https://restapi.amap.com/v3/direction/riding",
        data: b,
        method: "GET",
        header: { "content-type": "application/json" },
        success: function (c) {
          c && c.data && c.data.route && a.success({ paths: c.data.route.paths });
        },
        fail: function (c) {
          a.fail({ errCode: "0", errMsg: c.errMsg || "" });
        },
      });
    }
  
    getStaticmap(a) {
      function b(e) {
        c.push("location=" + e);
        a.zoom && c.push("zoom=" + a.zoom);
        a.size && c.push("size=" + a.size);
        a.scale && c.push("scale=" + a.scale);
        a.markers && c.push("markers=" + a.markers);
        a.labels && c.push("labels=" + a.labels);
        a.paths && c.push("paths=" + a.paths);
        a.traffic && c.push("traffic=" + a.traffic);
        e = "https://restapi.amap.com/v3/staticmap?" + c.join("&");
        a.success({ url: e });
      }
      var c = [];
      c.push("key=" + this.key);
      var d = this.requestConfig;
      c.push("s=" + d.s);
      c.push("platform=" + d.platform);
      c.push("appname=" + d.appname);
      c.push("sdkversion=" + d.sdkversion);
      c.push("logversion=" + d.logversion);
      a.location
        ? b(a.location)
        : this.getWxLocation(a, function (e) {
            b(e);
          });
    }
  

  }
  
  export { AMapWX };