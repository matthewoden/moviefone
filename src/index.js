import cheerio from 'cheerio';
import request from 'axios';
import querystring from 'qs';


export default class MovieFone {
  constructor(location) {

    this.userAgent = ('new releases');
    this.baseUrl = ('http://google.com/movies');
    this.location = location;
  }

  getNewReleases = (date = 0, page) => {
    if(page){
      return this.fetchPage(page);
    } else {
      return this.fetchPages(1, date);
    }
  }

  fetchPages = (page = 1, date = 0, movies) => {
    movies = movies || [];
    return this.fetchPage(page, date).then((response)=> {
      let allMovies = movies.concat(response.data.movies);

      if(response.data.morepages) {
        return this.fetchPages(page + 1, date, allMovies);
      } else {
        return {
          movies: allMovies,
          meta: response.data.meta
        };
      }
    }).catch(err => err);
  }

  /**
   *    fetchPage - Fetches a page, and returns a promise via Axios.
   *    Could potentially be more functional.
   *
   *    @param  {int} page the page for results.
   *    @param  {int} date 0, 1, 2, 3 where 0 is today, and increments days from there.
   *    @return {[type]}      [description]
   */

   fetchPage = (page = 0, date = 0) => {
    let params = {
      sort: 1, //gets movie releases, rather than theaters.
      start: (page - 1) * 10,
      date,
      near: querystring.stringify(this.location)
    };

    let headers = {
      'User-Agent': this.userAgent,
      'gzip': true
    };

    return request.get(this.baseUrl, {
      params,
      headers,
      transformResponse: [(data) => this.parseMovies(data)],
      encoding: 'binary'
    });
  }

  /**
   *    parseMovies:
   *    Takes a movie page, and scrapes the movie, theater, and showtimes.
   *    It's all one object, so that we only load cheerio once.
   *
   *    @param  {string} body - the page data
   *    @return {object}        an object containing an array of movies, and whether or not to continue
   */
  parseMovies = (body) => {
    let $ = cheerio.load(body);
    if ($('#movie_results').length > 1) {
      return {
        morepages: false,
        movies: [],
        meta: {
          status: 'ERROR',
          message: 'No movie results were found on this page. Please adjust your request and try again.'
        }
      };
    }

    let morepages = $('#navbar td a:contains("Next")').length === 1;
    let movies = [];


    // would love to map/reduce this, but it cheerio/jquery's map
    // returns a hideous object that resembles an array, rather than an
    // actual array
    $('.movie').each((m, movie) => {
      movie = $(movie);
      let name = movie.find('.desc h2[itemprop="name"]').text();
      let info = movie.find('.desc .info').not('.links').text().split(' - ');

      //format metadata
      let cast = info.filter((item) => item.match(/^Cast:\s/) ? item : null)
                     .map(item => item.replace('Cast: ', '').split(', '))[0];

      let rating = info.filter((item) => item.match(/^Rated\s/) ? item : null)
                       .map(item=> item.replace('Rated ', ''))[0];
      let runtime = info.filter((item) => item.match(/(hr |min)/g) ? item : null)
                        .map(item => item.replace(/[^\x00-\x7F]/g, ''))[0];
      let genre = info.filter((item) => item.match(/\//g) ? item : null)
                      .map(item => item.split('Director:')[0].split('/'))[0];
      let director = movie.find('.info span[itemprop="director"]').text().split(', ');
      let description = movie.find('[itemprop="description"]').text();
      let theaters = [];


      movie.find('.theater').each((t, theater) => {
        theater = $(theater);
        theaters.push({
          id: theater.find('.name a').attr('href').split('tid=')[1],
          name: theater.find('.name a').text(),
          address: theater.find('.address').text(),
          showtimes: this.formatShowtimes($(theater).find('.times').text())
        });
      });

      movies.push({ name, cast, director, description, rating, genre, runtime, theaters });

    });

    return {
      movies,
      morepages,
      meta: {
        status: 'OK',
        message: null
      }
    };

  }




  /**
   *    Format Showtimes:
   *
   *    Google displays showtimes like
   *    "10:00  11:20am  1:00  2:20  4:00  5:10  6:50  8:10  9:40  10:55pm".
   *    Since they don't always apply am/pm to times, we need to run through
   *    the showtimes in reverse and then apply the previous (later) meridiem
   *    to the next (earlier) movie showtime so we end up with something like
   *    ["10:00am", "11:20am", "1:00pm", ...].
   *
   *    @param  {string} timeString - a string of showtimes, scraped from google.
   *    @return {Array}             - an array of formatted showtimes.
   */

   formatShowtimes = (timeString) =>{
    let meridiem = false;
    return timeString.replace(/[^\x00-\x7F]/g, '')
    .split(' ')
    .reverse()
    .map((time) => {
      let match = time.match(/(am|pm)/);
      if (match) {
        meridiem = match[0];
      } else if (meridiem) {
        time += meridiem;
      }
      return time;
    })
    .reverse();
  }
}
