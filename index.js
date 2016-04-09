/// <reference path="typings/tsd.d.ts" />
"use strict";
var request = require('request');
var xml2js = require('xml2js');
var Zip = require('jszip');
var parser = xml2js.parseString;
// available providers for remote ids
var REMOTE_PROVIDERS = {
    imdbid: /^tt/i,
    zap2it: /^ep/i
};
// options for xml2js parser
var PARSER_OPTS = {
    trim: true,
    normalize: true,
    ignoreAttrs: true,
    explicitArray: false,
    emptyTag: null
};
// available response types
var RESPONSE_TYPE = {
    XML: 0,
    ZIP: 1
};
var TvDB = (function () {
    /**
     * Set up tvdb client with API key and optional language (defaults to "en")
     *
     * @param {String} token
     * @param {String} [language]
     * @api public
     */
    function TvDB(token, language) {
        if (language === void 0) { language = 'en'; }
        if (!token)
            throw new Error("Access token must be set.");
        this.token = token;
        this.language = language;
        this.baseURL = "http://www.thetvdb.com/api";
    }
    /**
     * Change Language
     *
     * @param {String} language
     * @return {TvDB} this
     */
    TvDB.prototype.setLanguage = function (language) {
        this.language = language;
        return this;
    };
    /**
     * Get available languages useable by TheTVDB API
     *
     * http://www.thetvdb.com/wiki/index.php?title=API:languages.xml
     *
     * @param {Function} [callback]
     * @return {Promise} promise
     * @api public
     */
    TvDB.prototype.getLanguages = function (callback) {
        var url = this.baseURL + "/" + this.token + "/languages.xml";
        return sendRequest({ url: url, lang: this.language }, RESPONSE_TYPE.XML, function (response, done) {
            done((response && response.Languages) ? response.Languages.Language : null);
        }, callback);
    };
    /**
     * Get the current server time
     *
     * @param {Function} [callback]
     * @return {Promise} promise
     * @api public
     */
    TvDB.prototype.getTime = function (callback) {
        var url = this.baseURL + "/Updates.php?type=none";
        return sendRequest({ url: url, lang: this.language }, RESPONSE_TYPE.XML, function (response, done) {
            done((response && response.Items) ? response.Items.Time : null);
        }, callback);
    };
    /**
     * Get basic series information by name
     *
     * http://www.thetvdb.com/wiki/index.php?title=API:GetSeries
     *
     * @param {String} name
     * @param {Function} [callback]
     * @return {Promise} promise
     * @api public
     */
    TvDB.prototype.getSeriesByName = function (name, callback) {
        var url = this.baseURL + "/GetSeries.php?seriesname=" + encodeURIComponent(name) + "&language=" + this.language;
        return sendRequest({ url: url, lang: this.language }, RESPONSE_TYPE.XML, function (response, done) {
            response = (response && response.Data) ? response.Data.Series : null;
            done(!response || Array.isArray(response) ? response : [response]);
        }, callback);
    };
    /**
     * Get basic series information by id
     *
     * http://www.thetvdb.com/wiki/index.php?title=API:Base_Series_Record
     *
     * @param {Number|String} id
     * @param {Function} [callback]
     * @return {Promise} promise
     * @api public
     */
    TvDB.prototype.getSeriesById = function (id, callback) {
        var url = this.baseURL + "/" + this.token + "/series/" + id + "/" + this.language + ".xml";
        return sendRequest({ url: url, lang: this.language }, RESPONSE_TYPE.XML, function (response, done) {
            done((response && response.Data) ? response.Data.Series : null);
        }, callback);
    };
    /**
     * Get basic series information by remote id (zap2it or imdb)
     *
     * http://www.thetvdb.com/wiki/index.php?title=API:GetSeriesByRemoteID
     *
     * @param {String} remoteId
     * @param {Function} [callback]
     * @return {Promise} promise
     * @api public
     */
    TvDB.prototype.getSeriesByRemoteId = function (remoteId, callback) {
        var keys = Object.keys(REMOTE_PROVIDERS);
        var provider = "";
        var len = keys.length;
        while (len-- && provider === "") {
            if (REMOTE_PROVIDERS[keys[len]].exec(remoteId)) {
                provider = keys[len];
            }
        }
        var url = this.baseURL + "/GetSeriesByRemoteID.php?" + provider + "=" + remoteId + "&language=" + this.language;
        return sendRequest({ url: url, lang: this.language }, RESPONSE_TYPE.XML, function (response, done) {
            done((response && response.Data) ? response.Data.Series : null);
        }, callback);
    };
    /**
     * Get full/all series information by id
     *
     * http://www.thetvdb.com/wiki/index.php?title=API:Full_Series_Record
     *
     * @param {Number|String} id
     * @param {Function} [callback]
     * @return {Promise} promise
     * @api public
     */
    TvDB.prototype.getSeriesAllById = function (id, callback) {
        var url = this.baseURL + "/" + this.token + "/series/" + id + "/all/" + this.language + ".zip";
        return sendRequest({ url: url, lang: this.language }, RESPONSE_TYPE.ZIP, function (response, done) {
            if (response && response.Data && response.Data.Series) {
                response.Data.Series.Episodes = response.Data.Episode;
            }
            done(response ? response.Data.Series : null);
        }, callback);
    };
    /**
    * Get all episodes by series id
    *
    * http://www.thetvdb.com/wiki/index.php?title=API:Full_Series_Record
    *
    * @param {Number|String} seriesId
    * @param {Function} [callback]
    * @return {Promise} promise
    * @api public
    */
    TvDB.prototype.getEpisodesById = function (seriesId, callback) {
        var url = this.baseURL + "/api/" + this.token + "/series/" + seriesId + "/all/" + this.language + ".xml";
        return sendRequest({ url: url, lang: this.language }, RESPONSE_TYPE.XML, function (response, done) {
            response = (response && response.Data) ? response.Data.Episode : null;
            done(!response || Array.isArray(response) ? response : [response]);
        }, callback);
    };
    /**
    * Get episode by episode id
    *
    * http://www.thetvdb.com/wiki/index.php?title=API:Base_Episode_Record
    *
    * @param {Number|String} id
    * @param {Function} [callback]
    * @return {Promise} promise
    * @api public
    */
    TvDB.prototype.getEpisodeById = function (id, callback) {
        var url = this.baseURL + "/" + this.token + "/episodes/" + id + "/" + this.language + ".xml";
        return sendRequest({ url: url, lang: this.language }, RESPONSE_TYPE.XML, function (response, done) {
            done((response && response.Data) ? response.Data.Episode : null);
        }, callback);
    };
    /**
    * Get episode by air date
    *
    * http://www.thetvdb.com/wiki/index.php?title=API:GetEpisodeByAirDate
    *
    * @param {Number|String} seriesId
    * @param {String} airDate
    * @param {Function} [callback]
    * @return {Promise} promise
    * @api public
    */
    TvDB.prototype.getEpisodeByAirDate = function (seriesId, airDate, callback) {
        var url = this.baseURL + "/GetEpisodeByAirDate.php?apikey=" + this.token + "&seriesid=" + seriesId + "&airdate=" + airDate + "&language=" + this.language;
        return sendRequest({ url: url, lang: this.language }, RESPONSE_TYPE.XML, function (response, done) {
            done((response && response.Data) ? response.Data.Episode : null);
        }, callback);
    };
    /**
     * Get series actors by series id
     *
     * http://www.thetvdb.com/wiki/index.php?title=API:actors.xml
     *
     * @param {Number|String} seriesId
     * @param {Function} [callback]
     * @return {Promise} promise
     * @api public
     */
    TvDB.prototype.getActors = function (seriesId, callback) {
        var url = this.baseURL + "/" + this.token + "/series/" + seriesId + "/actors.xml";
        return sendRequest({ url: url, lang: this.language }, RESPONSE_TYPE.XML, function (response, done) {
            done((response && response.Actors) ? response.Actors.Actor : null);
        }, callback);
    };
    /**
     * Get series banners by series id
     *
     * http://www.thetvdb.com/wiki/index.php?title=API:banners.xml
     *
     * @param {Number|String} seriesId
     * @param {Function} [callback]
     * @return {Promise} promise
     * @api public
     */
    TvDB.prototype.getBanners = function (seriesId, callback) {
        var url = this.baseURL + "/" + this.token + "/series/" + seriesId + "/banners.xml";
        return sendRequest({ url: url, lang: this.language }, RESPONSE_TYPE.XML, function (response, done) {
            done((response && response.Banners) ? response.Banners.Banner : null);
        }, callback);
    };
    /**
     * Get series and episode updates since a given unix timestamp
     *
     * http://www.thetvdb.com/wiki/index.php?title=API:Updates
     *
     * @param {Number} time
     * @param {Function} [callback]
     * @return {Promise} promise
     * @api public
     */
    TvDB.prototype.getUpdates = function (time, callback) {
        var url = this.baseURL + "/Updates.php?type=all&time=" + time;
        return sendRequest({ url: url, lang: this.language }, RESPONSE_TYPE.XML, function (response, done) {
            done(response ? response.Items : null);
        }, callback);
    };
    /**
     * All updates within the given interval
     *
     * http://www.thetvdb.com/wiki/index.php?title=API:Update_Records
     *
     * @param {String} interval - day|week|month|all
     * @param {Function} [callback]
     * @return {Promise} promise
     * @api public
     */
    TvDB.prototype.getUpdateRecords = function (interval, callback) {
        var url = this.baseURL + "/" + this.token + "/updates/updates_" + interval + ".xml";
        return sendRequest({ url: url, lang: this.language }, RESPONSE_TYPE.XML, function (response, done) {
            done(response ? response.Data : null);
        }, callback);
    };
    /**
     * Parse pipe list string to javascript array
     *
     * @param {String} list
     * @return {Array} parsed list
     * @api public
     */
    TvDB.utils = {
        parsePipeList: function (list) {
            return list.replace(/(^\|)|(\|$)/g, "").split("|");
        }
    };
    return TvDB;
}());
//
// Utilities
//
/**
 * Check if http response is okay to use
 *
 * @param {Error} error
 * @param {Object} resp - request library response object
 * @param {String|Buffer} data - body/data of response
 * @return {Boolean} responseOk
 * @api private
 */
function responseOk(error, resp, data) {
    if (error)
        return false;
    if (!resp)
        return false;
    if (resp.statusCode !== 200)
        return false;
    if (!data)
        return false;
    // if dealing with zip data buffer is okay
    if (data instanceof Buffer)
        return true;
    if (data === "")
        return false;
    if (data.indexOf("404 Not Found") !== -1)
        return false;
    return true;
}
/**
 * Send and handle http request
 *
 * @param {String} url
 * @param {Number} responseType - response type from RESPONSE_TYPE
 * @param {Function} normalise - a function to tidy the response object
 * @param {Function} [callback]
 * @return {Promise} promise
 * @api private
 */
function sendRequest(urlOpts, responseType, normalise, callback) {
    return new Promise(function (resolve, reject) {
        var reqOpts = { url: urlOpts.url };
        if (responseType === RESPONSE_TYPE.ZIP) {
            reqOpts.encoding = null;
        }
        request(reqOpts, function (error, resp, data) {
            if (!responseOk(error, resp, data)) {
                if (!error) {
                    error = new Error("Could not complete the request");
                }
                error.statusCode = resp ? resp.statusCode : undefined;
                return (callback ? callback : reject)(error);
            }
            else if (error) {
                return (callback ? callback : reject)(error);
            }
            if (responseType === RESPONSE_TYPE.ZIP) {
                try {
                    var zip = new Zip(data);
                    data = zip.file(urlOpts.lang + ".xml").asText();
                }
                catch (err) {
                    return (callback ? callback : reject)(error);
                }
            }
            parseXML(data, normalise, function (error, results) {
                if (callback) {
                    callback(error, results);
                }
                else {
                    error ? reject(error) : resolve(results);
                }
            });
        });
    });
}
/**
 * Parse XML response
 *
 * @param {String} xml data
 * @param {Function} normalise - a function to tidy the response object
 * @param {Function} callback
 * @api private
 */
function parseXML(data, normalise, callback) {
    parser(data, PARSER_OPTS, function (error, results) {
        if (results && results.Error) {
            return callback(new Error(results.Error));
        }
        normalise(results, function (results) {
            callback(error, results);
        });
    });
}
module.exports = TvDB;
