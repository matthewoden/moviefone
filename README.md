# MovieFone (npm)

This module provides a Google Movies API for new releases around a location, returning a list of movies complete with theaters and showtimes. It's not using an official API, so it may be subject to break at any time.

## About
This is heavily inspired by the npm module[showtimes](https://github.com/jonursenbach/showtimes). I really liked what Jon put together, just not the format of the response. I'm not loyal to any particular theater, so I rearranged the response to be movie-first, instead of theater-first.

## Installation
```
npm install moviefone
```

## API
There's not a lot to MovieFone:

### MovieFone(location)
Our constructor. Sets the location for this instance.
- `location` Sets the the default location for all requests. It can be a zipcode, coordinates, or a full address.


### getNewReleases(date, page)
Recursively fetches new releases, and returns a promise. All arguments are optional.
- `page` Fetches a single page of information. A location's result contains up to 10 pages. Defaults to fetching all pages.
- `date` The number of days from now that you want showtimes for. So, 0 would be today, 1, would be tomorrow, 2 would be the day after tomorrow, etc. Defaults to 0.

## Usage

#### ES6
``` javascript

import MovieFone from 'moviefone';

let moviefone = new MovieFone('63109', null);

moviefone.getNewReleases().then(response =>{ console.log(response); })
.catch(err => { console.log(err); });

```

#### ES5

``` javascript
var Releases = require('new-releases');

ver movies = new Releases('63109')
.then(response =>{ console.log(response); })
.catch(err => {console.log(err); });
```

## Response
On success, it returns an array of movies names, with dates, times, descriptions, etc.

If the request succeeded, but failed to find any movies, it returns an additional error property.

```
{
meta: {
  type:'OK',
  message:null
},
movies: [ { name: 'Mission: Impossible - Rogue Nation',
  cast: [
    'Tom Cruise',
    'Jeremy Renner',
    'Simon Pegg',
    'Rebecca Ferguson',
    'Alec Baldwin'
    ],
  director: ['Christopher McQuarrie' ],
  description: 'Ethan and team take on their most impossible mission yet, eradicating the Syndicate - an International rogue organization as highly skilled as they are, committed to destroying the IMF.',
  rating: 'PG-13',
  runtime: '2hr 11min',
    theaters: [
  { id: '5e13ee8eb9646bb2',
    name: 'MX Movies',
    address: '618 Washington Avenue, St. Louis, MO',
    showtimes: [ '12:00pm', '3:05pm', '6:10pm', '9:15pm' ] },
  { id: 'de803b70bcd6d450',
    name: 'Moolah Theatre & Lounge',
    address: '3821 Lindell Blvd., St. Louis, MO',
    showtimes: [ '1:30pm', '4:15pm', '7:00pm', '9:45pm' ] },
  { id: 'e72f310265ce335f',
    name: 'Granite City Cinema',
    address: '1243 Niedringhaus Avenue, Granite City, IL',
    showtimes: [ '1:45pm', '4:30pm', '7:15pm' ] },
  { id: '509f1dc2b6bc1b1',
    name: 'AMC Esquire 7',
    address: '6706 Clayton Rd., Saint Louis, MO',
    showtimes: [ '9:45am', '1:00pm', '4:30pm', '7:40pm', '10:40pm' ] },
  { id: 'e8a90c7d333b5c98',
    name: 'Galleria 6 Cinemas',
    address: '30 Saint Louis Galleria, St. Louis, MO',
    showtimes: [ '10:45am', '1:30pm', '4:15pm', '7:00pm', '9:50pm' ] },
  { id: '44c134f8668f586d',
    name: 'Skyview Drive-In - Belleville',
    address: '5700 North Belt West, Belleville, IL',
    showtimes: [ '8:45pm' ] }
    ]
  }]


```