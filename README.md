# tvdb.ts

Node.js library for accessing [TheTVDB API](http://www.thetvdb.com/wiki/index.php/Programmers_API). Refactored from [edwellbrook/node-tvdb](https://github.com/edwellbrook/node-tvdb) to give TypeScript Completion

Pull requests are always very welcome.

## Features

- Handle errors from API as JavaScript errors
- Only returns relevant data (no need to call response.Data.Series etc.)
- Set language at initialisation or afterwards when needed
- Normalised keys and values
- Empty values parsed as null
- Updates endpoint grouped by type
- Supports both node callback functions and promises
- Utility function to parse TheTVDB API's pipe list (e.g. "|Name|Name|Name|Name|")
- Use zip data instead of straight xml where possible
- [Tests with Mocha and Wercker CI](https://app.wercker.com/#applications/53f155d02094f9781d058f98)

## Installation

Install with [npm](http://npmjs.org/):

``` shell
npm install --save tvdb.ts
```

And run tests with [Mocha](http://visionmedia.github.io/mocha/):

``` shell
npm install --dev
TVDB_KEY=[YOUR API KEY HERE] npm test
```

> _Mocha is installed as a development dependency; you do not need to install it globally to run the tests._

## Example Usage

To start using this library you first need an API key. You can request one [here](http://thetvdb.com/?tab=apiregister). Then just follow this simple example that fetches all the shows containing "The Simpsons" in the name.

``` javascript
// (Javascript) index.js
var TVDB = require("tvdb.ts");
var tvdb = new TVDB("ABC123");

tvdb.getSeriesByName("The Simpsons", function(err, response) {
    // handle error and response
});
```

``` typescript
// (TypeScript) index.ts
import TVDB = require("tvdb.ts");
var tvdb = new TVDB("ABC123")

tvdb.getSeriesByName("The Simpsons", (err, response) => {
    // response is typed ! response.<auto_completion>
})
```

## API

### var client = new Client(API_KEY, [language])

Set up tvdb client with API key and optional language (defaults to "en")

``` typescript
import TVDB = require("tvdb.ts");

var tvdb           = new TVDB("ABC123"); // lang defaults to "en"
var tvdbPortuguese = new TVDB("ABC123", "pt");
```

### getTime

Get the current server time

``` typescript
tvdb.getTime((error, response) => {
    // handle error and response
});
```

OR

``` typescript
tvdb.getTime()
    .then((response) => { /* handle response */ })
    .catch((error) => { /* handle error */ });
```

### getLanguages

Get available languages useable by TheTVDB API

``` typescript
tvdb.getLanguages((error, response) => {
    // handle error and response
});
```

OR

``` typescript
tvdb.getLanguages()
    .then((response) => { /* handle response */ })
    .catch((error) => { /* handle error */ });
```

### getSeriesByName

Get basic series information by name

``` typescript
tvdb.getSeriesByName("Breaking Bad", (error, response) => {
    // handle error and response
});
```

OR

``` typescript
tvdb.getSeriesByName("Breaking Bad")
    .then((response) => { /* handle response */ })
    .catch((error) => { /* handle error */ });
```

### getSeriesById

Get basic series information by id

``` typescript
tvdb.getSeriesById(73255, (error, response) => {
    // handle error and response
});
```

OR

``` typescript
tvdb.getSeriesById(73255)
    .then((response) => { /* handle response */ })
    .catch((error) => { /* handle error */ });
```

### getSeriesByRemoteId

Get basic series information by remote id (zap2it or imdb)

``` typescript
tvdb.getSeriesByRemoteId("tt0903747", (error, response) => {
    // handle error and response
});
```

OR

``` typescript
tvdb.getSeriesByRemoteId("tt0903747")
    .then((response) => { /* handle response */ })
    .catch((error) => { /* handle error */ });
```

> Note: `tvdb.ts` automatically selects between remote providers (IMDb and zap2it)

### getSeriesAllById

Get full/all series information by id

``` typescript
tvdb.getSeriesAllById(73255, (error, response) => {
    // handle error and response
});
```

OR

``` typescript
tvdb.getSeriesAllById(73255)
    .then((response) => { /* handle response */ })
    .catch((error) => { /* handle error */ });
```

### getEpisodesById

Get all episodes by series id

``` typescript
tvdb.getEpisodesById(153021, (error, response) => {
    // handle error and response
});
```

OR

``` typescript
tvdb.getEpisodesById(153021)
    .then((response) => { /* handle response */ })
    .catch((error) => { /* handle error */ });
```

### getEpisodeById

Get episode by episode id

``` typescript
tvdb.getEpisodeById(4768125, (error, response) => {
    // handle error and response
});
```

OR

``` typescript
tvdb.getEpisodeById(4768125)
    .then((response) => { /* handle response */ })
    .catch((error) => { /* handle error */ });
```

### getEpisodeByAirDate

Get series episode by air date

``` typescript
tvdb.getEpisodeByAirDate(153021, "2011-10-03", (error, response) => {
    // handle error and response
});
```

OR

``` typescript
tvdb.getEpisodeByAirDate(153021, "2011-10-03")
    .then((response) => { /* handle response */ })
    .catch((error) => { /* handle error */ });
```

### getActors

Get series actors by series id

``` typescript
tvdb.getActors(73255, (error, response) => {
    // handle error and response
});
```

OR

``` typescript
tvdb.getActors(73255)
    .then((response) => { /* handle response */ })
    .catch((error) => { /* handle error */ });
```

### getBanners

Get series banners by series id

``` typescript
tvdb.getBanners(73255, (error, response) => {
    // handle error and response
});
```

OR

``` typescript
tvdb.getBanners(73255)
    .then((response) => { /* handle response */ })
    .catch((error) => { /* handle error */ });
```

### getUpdates

Get series and episode updates since a given unix timestamp

``` typescript
tvdb.getUpdates(1400611370, (error, response) => {
    // handle error and response
});
```

OR

``` typescript
tvdb.getUpdates(1400611370)
    .then((response) => { /* handle response */ })
    .catch((error) => { /* handle error */ });
```

### getUpdateRecords

All updates within the given interval

``` typescript
tvdb.getUpdateRecords("day", (error, response) => {
    // handle error and response
});
```

OR

``` typescript
tvdb.getUpdateRecords("day")
    .then((response) => { /* handle response */ })
    .catch((error) => { /* handle error */ });
```

### utils.parsePipeList

Parse pipe list string to javascript array

``` typescript
var list = "|Mos Def|Faune A. Chambers|"; // from a previous api call
var guestStars = TVDB.utils.parsePipeList(list);
```

## License

The MIT License (MIT)
