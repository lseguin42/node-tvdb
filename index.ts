/// <reference path="typings/tsd.d.ts" />

import * as request from 'request'
import * as xml2js from 'xml2js'
import * as Zip from 'jszip'

const parser = xml2js.parseString

// available providers for remote ids
const REMOTE_PROVIDERS = {
    imdbid: /^tt/i,
    zap2it: /^ep/i
};

// options for xml2js parser
const PARSER_OPTS = {
    trim: true,
    normalize: true,
    ignoreAttrs: true,
    explicitArray: false,
    emptyTag: null
};

// available response types
const RESPONSE_TYPE = {
    XML: 0,
    ZIP: 1
};

interface BaseSeriesRecord {
    /**
     * An unsigned integer assigned by our site to the series. It does not change and will always represent the same series. Cannot be null.
     */
    id: string
    /**
     * A pipe delimited string of actors in plain text. Begins and ends with a pipe even if no actors are listed. Cannot be null.
     */
    Actors: string
    /**
     * The full name in English for the day of the week the series airs in plain text. Can be null.
     */
    Airs_DayOfWeek: string
    /**
     * A string indicating the time of day the series airs on its original network. Format "HH:MM AM/PM". Can be null.
     */
    Airs_Time: string
    /**
     * The rating given to the series based on the US rating system. Can be null or a 4-5 character string.
     */
    ContentRating: string
    /**
     * A string containing the date the series first aired in plain text using the format "YYYY-MM-DD". Can be null.
     */
    FirstAired: string
    /**
     * Pipe delimited list of genres in plain text. Begins and ends with a | but may also be null.
     */
    Genre: string
    /**
     * An alphanumeric string containing the IMDB ID for the series. Can be null.
     */
    IMDB_ID: string
    /**
     * A two character string indicating the language in accordance with ISO-639-1. Cannot be null.
     */
    Language: string
    /**
     * A string containing the network name in plain text. Can be null.
     */
    Network: string
    /**
     * Not in use, will be an unsigned integer if ever used. Can be null.
     */
    NetworkID: string
    /**
     * A string containing the overview in the language requested. Will return the English overview if no translation is available in the language requested. Can be null.
     */
    Overview: string
    /**
     * The average rating our users have rated the series out of 10, rounded to 1 decimal place. Can be null.
     */
    Rating: string
    /**
     * An unsigned integer representing the number of users who have rated the series. Can be null.
     */
    RatingCount: string
    /**
     * An unsigned integer representing the runtime of the series in minutes. Can be null.
     */
    Runtime: string
    /**
     * Deprecated. An unsigned integer representing the series ID at tv.com. As TV.com now only uses these ID's internally it's of little use and no longer updated. Can be null.
     * @deprecated
     */
    SeriesID: string
    /**
     * A string containing the series name in the language you requested. Will return the English name if no translation is found in the language requested. Can be null if the name isn't known in the requested language or English.
     */
    SeriesName: string
    /**
     * A string containing either "Ended" or "Continuing". Can be null.
     */
    Status: string
    /**
     * A string containing the date/time the series was added to our site in the format "YYYY-MM-DD HH:MM:SS" based on a 24 hour clock. Is null for older series.
     */
    added: string
    /**
     * An unsigned integer. The ID of the user on our site who added the series to our database. Is null for older series.
     */
    addedBy: string
    /**
     * A string which should be appended to <mirrorpath>/banners/ to determine the actual location of the artwork. Returns the highest voted banner for the requested series. Can be null.
     */
    banner: string
    /**
     * A string which should be appended to <mirrorpath>/banners/ to determine the actual location of the artwork. Returns the highest voted fanart for the requested series. Can be null.
     */
    fanart: string
    /**
     * Unix time stamp indicating the last time any changes were made to the series. Can be null.
     */
    lastupdated: string
    /**
     * A string which should be appended to <mirrorpath>/banners/ to determine the actual location of the artwork. Returns the highest voted poster for the requested series. Can be null.
     */
    posters: string
    /**
     * An alphanumeric string containing the zap2it id. Can be null.
     */
    zap2it_id: string
}

interface SerieSearch {
    /**
     * Returns an unsigned integer. Both values are exactly the same and always returned. <seriesid> is preferred, <id> is only included to be backwards compatible with the old API and is deprecated.
     */
    seriesid: string
    /**
     * A two digit string indicating the language. Avaliable Languages
     */
    language: string
    /**
     * A string with the series name for the language indicated
     */
    SeriesName: string
    /**
     * A pipe "|" delimited list of alias names if the series has any other names in that language.
     */
    AliasNames: string
    /**
     * The relative path to the highest rated banner for this series. Append <mirrorpath> to the start of it to get the absolute path.
     */
    banner: string
    /**
     * The overview for the series
     */
    Overview: string
    /**
     * The first aired date for the series in the "YYYY-MM-DD" format.
     */
    FirstAired: string
    /**
     * The Network name if known.
     */
    Network: string
    /**
     * The IMDB id for the series if known.
     */
    IMDB_ID: string
    /**
     * The zap2it ID if known.
     */
    zap2it_id: string
    /**
     * id
     * @deprecated
     */
    id: string
}

interface BaseEpisodeRecord {
    /**
     * An unsigned integer assigned by our site to the episode. Cannot be null.
     */
    id: string
    /**
     * An unsigned integer or decimal. Cannot be null. This returns the value of DVD_episodenumber if that field is not null. Otherwise it returns the value from EpisodeNumber. The field can be used as a simple way of prioritizing DVD order over aired order in your program. In general it's best to avoid using this field as you can accomplish the same task locally and have more control if you use the DVD_episodenumber and EpisodeNumber fields separately.
     */
    Combined_episodenumber: number
    /**
     * An unsigned integer or decimal. Cannot be null. This returns the value of DVD_season if that field is not null. Otherwise it returns the value from SeasonNumber. The field can be used as a simple way of prioritizing DVD order over aired order in your program. In general it's best to avoid using this field as you can accomplish the same task locally and have more control if you use the DVD_season and SeasonNumber fields separately.
     */
    Combined_season: number
    /**
     * Deprecated, was meant to be used to aid in scrapping of actual DVD's but has never been populated properly. Any information returned in this field shouldn't be trusted. Will usually be null.
     */
    DVD_chapter: string
    /**
     * Deprecated, was meant to be used to aid in scrapping of actual DVD's but has never been populated properly. Any information returned in this field shouldn't be trusted. Will usually be null.
     */
    DVD_discid: string
    /**
     * A decimal with one decimal and can be used to join episodes together. Can be null, usually used to join episodes that aired as two episodes but were released on DVD as a single episode. If you see an episode 1.1 and 1.2 that means both records should be combined to make episode 1. Cartoons are also known to combine up to 9 episodes together, for example Animaniacs season two.
     */
    DVD_episodenumber: string
    /**
     * An unsigned integer indicating the season the episode was in according to the DVD release. Usually is the same as EpisodeNumber but can be different.
     */
    DVD_season: string
    /**
     * A pipe delimited string of directors in plain text. Can be null.
     */
    Director: string
    /**
     * An unsigned integer from 1-6.
     *  1. 4:3 - Indicates an image is a proper 4:3 (1.31 to 1.35) aspect ratio.
     *  2. 16:9 - Indicates an image is a proper 16:9 (1.739 to 1.818) aspect ratio.
     *  3. Invalid Aspect Ratio - Indicates anything not in a 4:3 or 16:9 ratio. We don't bother listing any other non standard ratios.
     *  4. Image too Small - Just means the image is smaller then 300x170.
     *  5. Black Bars - Indicates there are black bars along one or all four sides of the image.
     *  6. Improper Action Shot - Could mean a number of things, usually used when someone uploads a promotional picture that isn't actually from that episode but does refrence the episode, it could also mean it's a credit shot or that there is writting all over it. It's rarely used since most times an image would just be outright deleted if it falls in this category.
     *  It can also be null. If it's 1 or 2 the site assumes it's a proper image, anything above 2 is considered incorrect and can be replaced by anyone with an account.
     */
    EpImgFlag: string
    /**
     * A string containing the episode name in the language requested. Will return the English name if no translation is available in the language requested.
     */
    EpisodeName: string
    /**
     * An unsigned integer representing the episode number in its season according to the aired order. Cannot be null.
     */
    EpisodeNumber: string
    /**
     * A string containing the date the series first aired in plain text using the format "YYYY-MM-DD". Can be null.
     */
    FirstAired: string
    /**
     * A pipe delimited string of guest stars in plain text. Can be null.
     */
    GuestStars: string
    /**
     * An alphanumeric string containing the IMDB ID for the series. Can be null.
     */
    IMDB_ID: string
    /**
     * A two character string indicating the language in accordance with ISO-639-1. Cannot be null.
     */
    Language: string
    /**
     * A string containing the overview in the language requested. Will return the English overview if no translation is available in the language requested. Can be null.
     */
    Overview: string
    /**
     * An alphanumeric string. Can be null.
     */
    ProductionCode: string
    /**
     * The average rating our users have rated the series out of 10, rounded to 1 decimal place. Can be null.
     */
    Rating: string
    /**
     * An unsigned integer representing the season number for the episode according to the aired order. Cannot be null.
     */
    SeasonNumber: string
    /**
     * A pipe delimited string of writers in plain text. Can be null.
     */
    Writer: string
    /**
     * An unsigned integer. Can be null. Indicates the absolute episode number and completely ignores seasons. In others words a series with 20 episodes per season will have Season 3 episode 10 listed as 50. The field is mostly used with cartoons and anime series as they may have ambiguous seasons making it easier to use this field.
     */
    absolute_number: string
    /**
     * A string which should be appended to <mirrorpath>/banners/ to determine the actual location of the artwork. Returns the location of the episode image. Can be null.
     */
    filename: string
    /**
     * Unix time stamp indicating the last time any changes were made to the episode. Can be null.
     */
    lastupdated: string
    /**
     * An unsigned integer assigned by our site to the season. Cannot be null.
     */
    seasonid: string
    /**
     * An unsigned integer assigned by our site to the series. It does not change and will always represent the same series. Cannot be null.
     */
    seriesid: string
}

interface EpisodeRecord extends BaseEpisodeRecord {
    /**
     * An unsigned integer representing the number of users who have rated the series. Can be null.
     */
    RatingCount: string
    /**
     * An unsigned integer indicating the season number this episode comes after. This field is only available for special episodes. Can be null.
     */
    airsafter_season: string
    /**
     * An unsigned integer indicating the episode number this special episode airs before. Must be used in conjunction with airsbefore_season, do not with airsafter_season. This field is only available for special episodes. Can be null.
     */
    airsbefore_episode: string
    /**
     * An unsigned integer indicating the season number this special episode airs before. Should be used in conjunction with airsbefore_episode for exact placement. This field is only available for special episodes. Can be null.
     */
    airsbefore_season: string
    /**
     * A string containing the time the episode image was added to our site in the format "YYYY-MM-DD HH:MM:SS" based on a 24 hour clock. Can be null.
     */
    thumb_added: string
    /**
     * An unsigned integer that represents the height of the episode image in pixels. Can be null
     */
    thumb_height: string
    /**
     * An unsigned integer that represents the width of the episode image in pixels. Can be null
     */
    thumb_width: string
}

interface Banner {
    id: string
    /**
     * Can be appended to <mirrorpath>/banners/ to determine the actual location of the artwork.
     */
    BannerPath: string
    /**
     * This can be poster, fanart, series or season.
     */
    BannerType: string
    /**
     * For series banners it can be text, graphical, or blank. For season banners it can be season or seasonwide. For fanart it can be 1280x720 or 1920x1080. For poster it will always be 680x1000.
     * Blank banners will leave the title and show logo off the banner. Text banners will show the series name as plain text in an Arial font. Graphical banners will show the series name in the show's official font or will display the actual logo for the show. Season banners are the standard * * DVD cover format while wide season banners will be the same dimensions as the series banners.
     */
    BannerType2: string
    /**
     * Returns either null or three RGB colors in decimal format and pipe delimited. These are colors the artist picked that go well with the image. In order they are Light Accent Color, Dark Accent Color and Neutral Midtone Color. It's meant to be used if you want to write something over the * * image, it gives you a good idea of what colors may work and show up well. Only shows if BannerType is fanart.
     */
    Colors: string
    /**
     * Some banners list the series name in a foreign language. The language abbreviation will be listed here.
     */
    Language: string
    /**
     * If the banner is for a specific season, that season number will be listed here.
     */
    Season: string
    /**
     * Returns either null or a decimal with four decimal places. The rating the banner currently has on the site.
     */
    Rating: string
    /**
     * Always returns an unsigned integer. Number of people who have rated the image.
     */
    RatingCount: string
    /**
     * This can be true or false. Only shows if BannerType is fanart. Indicates if the seriesname is included in the image or not.
     */
    SeriesName: string
    /**
     * Used exactly the same way as BannerPath, only shows if BannerType is fanart.
     */
    ThumbnailPath: string
    /**
     * Used exactly the same way as BannerPath, only shows if BannerType is fanart.
     */
    VignettePath: string
}

interface Actor {
    id: string
    Image: string
    Name: string
    Role: string
    SortOrder: string
}

interface UpdateInterval {
    Series: {
        id: string,
        time: string 
    }[]
    Episode: {
        id: string,
        Series: string,
        time: string
    }[]
    Banner: Banner[]
}

interface Update {
    Time: string
    Series: string[]
    Episode: string[]
}

interface Language {
    name: string
    abbreviation: string
    id: string
}

interface FullSeriesRecord extends BaseSeriesRecord {
    Episodes: EpisodeRecord[]
}

type Callback<T> = (Error, T) => void


class TvDB {
        
    private token: string
    private language: string
    private baseURL: string
    
    
    /**
     * Change Language
     * 
     * @param {String} language
     * @return {TvDB} this
     */
    setLanguage(language: string) {
        this.language = language
        return this
    }
    
    /**
     * Set up tvdb client with API key and optional language (defaults to "en")
     *
     * @param {String} token
     * @param {String} [language]
     * @api public
     */

    constructor(token: string, language: string = 'en') {
        if (!token) throw new Error("Access token must be set.");

        this.token = token;
        this.language = language;
        this.baseURL = "http://www.thetvdb.com/api";
    }
    
    /**
     * Get available languages useable by TheTVDB API
     *
     * http://www.thetvdb.com/wiki/index.php?title=API:languages.xml
     *
     * @param {Function} [callback]
     * @return {Promise} promise
     * @api public
     */

    getLanguages(callback?: Callback<Language[]>): Promise<Language[]> {
        const url = `${this.baseURL}/${this.token}/languages.xml`;

        return sendRequest({url: url, lang: this.language}, RESPONSE_TYPE.XML, function(response, done) {
            done((response && response.Languages) ? response.Languages.Language : null);
        }, callback);
    }

    /**
     * Get the current server time
     *
     * @param {Function} [callback]
     * @return {Promise} promise
     * @api public
     */

    getTime(callback?: Callback<string>): Promise<string> {
        const url = `${this.baseURL}/Updates.php?type=none`;

        return sendRequest({url: url, lang: this.language}, RESPONSE_TYPE.XML, function(response, done) {
            done((response && response.Items) ? response.Items.Time : null);
        }, callback);
    }

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

    getSeriesByName(name: string, callback?: Callback<SerieSearch[]>): Promise<SerieSearch[]> {
        const url = `${this.baseURL}/GetSeries.php?seriesname=${encodeURIComponent(name)}&language=${this.language}`;

        return sendRequest({url: url, lang: this.language}, RESPONSE_TYPE.XML, function(response, done) {
            response = (response && response.Data) ? response.Data.Series : null;
            done(!response || Array.isArray(response) ? response : [response]);
        }, callback);
    }
    
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
    
    getSeriesById(id: number|string, callback?: Callback<BaseSeriesRecord>): Promise<BaseSeriesRecord> {
        const url = `${this.baseURL}/${this.token}/series/${id}/${this.language}.xml`;

        return sendRequest({url: url, lang: this.language}, RESPONSE_TYPE.XML, function(response, done) {
            done((response && response.Data) ? response.Data.Series : null);
        }, callback);
    }

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

    getSeriesByRemoteId(remoteId: string, callback?: Callback<SerieSearch>): Promise<SerieSearch> {
        const keys = Object.keys(REMOTE_PROVIDERS);

        let provider = "";
        let len      = keys.length;

        while (len-- && provider === "") {
            if (REMOTE_PROVIDERS[keys[len]].exec(remoteId)) {
                provider = keys[len];
            }
        }

        const url = `${this.baseURL}/GetSeriesByRemoteID.php?${provider}=${remoteId}&language=${this.language}`;

        return sendRequest({url: url, lang: this.language}, RESPONSE_TYPE.XML, function(response, done) {
            done((response && response.Data) ? response.Data.Series : null);
        }, callback);
    }


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

    getSeriesAllById(id: number|string, callback?: Callback<FullSeriesRecord>): Promise<FullSeriesRecord> {
        const url = `${this.baseURL}/${this.token}/series/${id}/all/${this.language}.zip`;

        return sendRequest({url: url, lang: this.language}, RESPONSE_TYPE.ZIP, function(response, done) {
            if (response && response.Data && response.Data.Series) {
                response.Data.Series.Episodes = response.Data.Episode;
            }

            done(response ? response.Data.Series : null);
        }, callback);
    }

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

    getEpisodesById(seriesId: number|string, callback?: Callback<EpisodeRecord[]>): Promise<EpisodeRecord[]> {
       const url = `${this.baseURL}/api/${this.token}/series/${seriesId}/all/${this.language}.xml`;

       return sendRequest({url: url, lang: this.language}, RESPONSE_TYPE.XML, function(response, done) {
           response = (response && response.Data) ? response.Data.Episode : null;
           done(!response || Array.isArray(response) ? response : [response]);
       }, callback);
   }

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

    getEpisodeById(id: number|string, callback?: Callback<EpisodeRecord>): Promise<EpisodeRecord> {
        const url = `${this.baseURL}/${this.token}/episodes/${id}/${this.language}.xml`;

        return sendRequest({url: url, lang: this.language}, RESPONSE_TYPE.XML, function(response, done) {
            done((response && response.Data) ? response.Data.Episode : null);
        }, callback);
    }

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

    getEpisodeByAirDate(seriesId: number|string, airDate: string, callback?: Callback<BaseEpisodeRecord>): Promise<BaseEpisodeRecord> {
        const url = `${this.baseURL}/GetEpisodeByAirDate.php?apikey=${this.token}&seriesid=${seriesId}&airdate=${airDate}&language=${this.language}`;

        return sendRequest({url: url, lang: this.language}, RESPONSE_TYPE.XML, function(response, done) {
            done((response && response.Data) ? response.Data.Episode : null);
        }, callback);
    }

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

    getActors(seriesId: number|string, callback?: Callback<Actor>): Promise<Actor> {
        const url = `${this.baseURL}/${this.token}/series/${seriesId}/actors.xml`;

        return sendRequest({url: url, lang: this.language}, RESPONSE_TYPE.XML, function(response, done) {
            done((response && response.Actors) ? response.Actors.Actor : null);
        }, callback);
    }

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

    getBanners(seriesId: number|string, callback?: Callback<Banner[]>): Promise<Banner[]> {
        const url = `${this.baseURL}/${this.token}/series/${seriesId}/banners.xml`;

        return sendRequest({url: url, lang: this.language}, RESPONSE_TYPE.XML, function(response, done) {
            done((response && response.Banners) ? response.Banners.Banner : null);
        }, callback);
    }
    
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

    getUpdates(time: number, callback?: Callback<Update>): Promise<Update> {
        const url = `${this.baseURL}/Updates.php?type=all&time=${time}`;

        return sendRequest({url: url, lang: this.language}, RESPONSE_TYPE.XML, function(response, done) {
            done(response ? response.Items : null);
        }, callback);
    }

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

    getUpdateRecords(interval: string, callback?: Callback<UpdateInterval>): Promise<UpdateInterval> {
        const url = `${this.baseURL}/${this.token}/updates/updates_${interval}.xml`;

        return sendRequest({url: url, lang: this.language}, RESPONSE_TYPE.XML, function(response, done) {
            done(response ? response.Data : null);
        }, callback);
    }
    
    /**
     * Parse pipe list string to javascript array
     *
     * @param {String} list
     * @return {Array} parsed list
     * @api public
     */

    static utils: {
        parsePipeList: (string) => string[]
    } = {
        parsePipeList: (list: string) => {
            return list.replace(/(^\|)|(\|$)/g, "").split("|");
        }
    }
    
}

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
    if (error) return false;
    if (!resp) return false;
    if (resp.statusCode !== 200) return false;
    if (!data) return false;

    // if dealing with zip data buffer is okay
    if (data instanceof Buffer) return true;

    if (data === "") return false;
    if (data.indexOf("404 Not Found") !== -1) return false;

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
    return new Promise(function(resolve, reject) {
        let reqOpts: any = {url: urlOpts.url};
        if (responseType === RESPONSE_TYPE.ZIP) {
            reqOpts.encoding = null;
        }

        request(reqOpts, function(error, resp, data) {
            if (!responseOk(error, resp, data)) {
                if (!error) {
                    error = new Error("Could not complete the request");
                }
                error.statusCode = resp ? resp.statusCode : undefined;

                return (callback ? callback : reject)(error);
            } else if (error) {
                return (callback ? callback : reject)(error);
            }

            if (responseType === RESPONSE_TYPE.ZIP) {
                try {
                    const zip = new Zip(data);
                    data = zip.file(`${urlOpts.lang}.xml`).asText();
                } catch (err) {
                    return (callback ? callback : reject)(error);
                }
            }

            parseXML(data, normalise, function(error, results) {
                if (callback) {
                    callback(error, results);
                } else {
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
    parser(data, PARSER_OPTS, function(error, results) {
        if (results && results.Error) {
            return callback(new Error(results.Error));
        }

        normalise(results, function(results) {
            callback(error, results);
        });
    });
}

export = TvDB