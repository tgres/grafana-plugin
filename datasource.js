System.register(["lodash"], function (_export, _context) {
    var lodash;

    function TgresDatasource(instanceSettings, $q, backendSrv, templateSrv) {

        this.basicAuth = instanceSettings.basicAuth;
        this.url = instanceSettings.url;
        this.name = instanceSettings.name;
        this.cacheTimeout = instanceSettings.cacheTimeout;
        this.withCredentials = instanceSettings.withCredentials;
        this.render_method = instanceSettings.render_method || 'POST';

        this.query = function (options) {
            var graphOptions = {
                from: this._translateTime(options.rangeRaw.from, false),
                until: this._translateTime(options.rangeRaw.to, true),
                targets: options.targets,
                format: options.format,
                cacheTimeout: options.cacheTimeout || this.cacheTimeout,
                maxDataPoints: options.maxDataPoints,
            };
            var params = this._buildTgresParams(graphOptions, options.scopedVars);
            if (params.length === 0) {
                return $q.when({ data: [] });
            }
            var httpOptions = {
                method: 'POST',
                url: '/render',
                data: params.join('&'),
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
            };
            if (options.panelId) {
                httpOptions.requestId = this.name + '.panelId.' + options.panelId;
            }
            return this._doTgresRequest(httpOptions).then(this._convertDataPointsToMs);
        };

        this.testDatasource = function () {
            return this.metricFindQuery('*').then(function () {
                return { status: "success", message: "Data source is working rather well.", title: "Success" };
            });
        };

        this.metricFindQuery = function (query) {
            var interpolated;
            try {
                interpolated = encodeURIComponent(templateSrv.replace(query));
            }
            catch (err) {
                return $q.reject(err);
            }
            return this._doTgresRequest({ method: 'GET', url: '/metrics/find/?query=' + interpolated })
                .then(function (results) {
                    return lodash.default.map(results.data, function (metric) {
                        return {
                            text: metric.text,
                            expandable: metric.expandable ? true : false
                        };
                    });
                });
        };

        this._convertDataPointsToMs = function (result) {
            if (!result || !result.data) {
                return [];
            }
            for (var i = 0; i < result.data.length; i++) {
                var series = result.data[i];
                for (var y = 0; y < series.datapoints.length; y++) {
                    series.datapoints[y][1] *= 1000;
                }
            }
            return result;
        };

        this._translateTime = function (date, roundUp) {
            if (lodash.default.isString(date)) {
                if (date === 'now') {
                    return 'now';
                }
                else if (date.indexOf('now-') >= 0 && date.indexOf('/') === -1) {
                    date = date.substring(3);
                    date = date.replace('m', 'min');
                    date = date.replace('M', 'mon');
                    return date;
                }
                date = dateMath.parse(date, roundUp);
            }
            // tgres' s from filter is exclusive
            // here we step back one minute in order
            // to guarantee that we get all the data that
            // exists for the specified range
            if (roundUp) {
                if (date.get('s')) {
                    date.add(1, 'm');
                }
            }
            else if (roundUp === false) {
                if (date.get('s')) {
                    date.subtract(1, 'm');
                }
            }
            return date.unix();
        };

        this._seriesRefLetters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        this._buildTgresParams = function (options, scopedVars) {
            var tgres_options = ['from', 'until', 'rawData', 'format', 'maxDataPoints', 'cacheTimeout'];
            var clean_options = [], targets = {};
            var target, targetValue, i;
            var regex = /\#([A-Z])/g;
            var intervalFormatFixRegex = /'(\d+)m'/gi;
            var hasTargets = false;
            options['format'] = 'json';
            function fixIntervalFormat(match) {
                return match.replace('m', 'min').replace('M', 'mon');
            }
            for (i = 0; i < options.targets.length; i++) {
                target = options.targets[i];
                if (!target.target) {
                    continue;
                }
                if (!target.refId) {
                    target.refId = this._seriesRefLetters[i];
                }
                targetValue = templateSrv.replace(target.target, scopedVars);
                targetValue = targetValue.replace(intervalFormatFixRegex, fixIntervalFormat);
                targets[target.refId] = targetValue;
            }
            function nestedSeriesRegexReplacer(match, g1) {
                return targets[g1] || match;
            }
            for (i = 0; i < options.targets.length; i++) {
                target = options.targets[i];
                if (!target.target) {
                    continue;
                }
                targetValue = targets[target.refId];
                targetValue = targetValue.replace(regex, nestedSeriesRegexReplacer);
                targets[target.refId] = targetValue;
                if (!target.hide) {
                    hasTargets = true;
                    clean_options.push("target=" + encodeURIComponent(targetValue));
                }
            }
            lodash.default.each(options, function (value, key) {
                if (lodash.default.indexOf(tgres_options, key) === -1) {
                    return;
                }
                if (value) {
                    clean_options.push(key + "=" + encodeURIComponent(value));
                }
            });
            if (!hasTargets) {
                return [];
            }
            return clean_options;
        };

        this._doTgresRequest = function (options) {
            if (this.basicAuth || this.withCredentials) {
                options.withCredentials = true;
            }
            if (this.basicAuth) {
                options.headers = options.headers || {};
                options.headers.Authorization = this.basicAuth;
            }
            options.url = this.url + options.url;
            options.inspect = { type: 'tgres' };
            return backendSrv.datasourceRequest(options);
        };


    }
    _export("TgresDatasource", TgresDatasource);
    return {
        setters: [
            function(f) { lodash = f; }
        ],
        execute: function() {}
    };
});
