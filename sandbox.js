import MovieFone from './index';

new MovieFone('saint louis, MO').getNewReleases()
.then(response =>{console.log(response[0]); })
.catch(err => {console.log(err); });
