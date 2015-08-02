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
      if(response.data.error){
        return response.data.error;
      }
      if(response.data.morepages) {
        return this.fetchPages(page + 1, date, allMovies);
      } else {
        return allMovies;
      }
    }).catch(err => err);
  }

  /**
   *    [fetch description]
   *    @param  int page the page for results.
   *    @param  int date 0, 1, 2, 3 where 0 is today, and increments days from there.
   *    @param  string near city, state, zip.
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
   *    Takes a movie page, and scrapes the movie name,
   *    theater information, and showtimes out.
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
        error: 'No movie results were found on this page. Please adjust your request and try again.'
      };
    }

    let morepages = $('#navbar td a:contains("Next")').length === 1;
    let movies = [];

    $('.movie').each(function(m, movie) {
      movie = $(movie);
      let name = movie.find('.desc h2[itemprop="name"]').text();
      let info = movie.find('.desc .info').not('.links').text().split(' - ');

      //format metadata
      let cast = info.filter((item) => item.match(/^Cast:\s/) ? item : null).map(item => item.replace('Cast: ', '').split(', '))[0];
      let rating = info.filter((item) => item.match(/^Rated\s/) ? item : null).map(item=> item.replace('Rated ', ''))[0];
      let runtime = info.filter((item) => item.match(/(hr |min)/g) ? item : null).map(item => item.replace(/[^\x00-\x7F]/g, ''))[0];
      let genre = info.filter((item) => item.match(/\//g) ? item : null).map(item => item.split('Director:')[0].split('/'))[0];
      let director = movie.find('.info span[itemprop="director"]').text().split(', ');
      let description = movie.find('[itemprop="description"]').text();
      let theaters = [];

      // would love to map/reduce this, but it cheerio/jquery's map
      // returns a hideous object that resembles an array, rather than an
      // actual array
      movie.find('.theater').each(function(t, theater) {
        theater = $(theater);
        let id = theater.find('.name a').attr('href').split('tid=')[1];
        let theaterName = theater.find('.name a').text();
        let address = theater.find('.address').text();

        // Google displays showtimes like "10:00  11:20am  1:00  2:20  4:00  5:10  6:50  8:10  9:40  10:55pm". Since
        // they don't always apply am/pm to times, we need to run through the showtimes in reverse and then apply the
        // previous (later) meridiem to the next (earlier) movie showtime so we end up with something like
        // ["10:00am", "11:20am", "1:00pm", ...].

        let meridiem = false;
        let showtimes = theater.find('.times')
                               .text()
                               .replace(/[^\x00-\x7F]/g, '')
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

        theaters.push({
          id,
          name: theaterName,
          address,
          showtimes
        });
      });

      movies.push({
        name,
        cast,
        director,
        description,
        rating,
        genre,
        runtime,
        theaters
      });

    });

    return {
      movies: movies,
      morepages
    };
  }
}
