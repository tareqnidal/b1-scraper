import {
  calendarScraper
} from './src/calendar.mjs'
import {
  cinemaScraper
} from './src/cinema.mjs'
import {
  restaurantScraper
} from './src/restaurant.mjs'

const args = process.argv.slice(2)
if (args.length === 0) {
  console.error('ERROR: No URL...Provide URL')
  process.exit(1)
}

const startUrl = args[0]
if (!startUrl.startsWith('https://')) {
  console.error('ERROR: Only URLs startwith "https" are allowed.')
  process.exit(1)
}

const run = async () => {
  try {
    const commonFreeDays = await calendarScraper(startUrl)
    console.log('\x1b[34mScraping\x1b[0m Links... \x1b[35mOK\x1b[0m')
    console.log('\x1b[34mScraping\x1b[0m Available days... \x1b[35mOK\x1b[0m')

    let moviesData, restaurantData
    if (commonFreeDays && commonFreeDays.length > 0) {
      moviesData = await cinemaScraper(startUrl, commonFreeDays)
      console.log('\x1b[34mScraping\x1b[0m Show times... \x1b[35mOK\x1b[0m')
      restaurantData = await restaurantScraper(startUrl, commonFreeDays)
      console.log('\x1b[34mScraping \x1b[0m Possible reservations... \x1b[35m OK\x1b[0m')

      // Generate and log recommendations
      generateRecommendations(moviesData, restaurantData)
    } else {
      console.log('No common free days available for cinema or restaurant.')
    }
  } catch (error) {
    console.error('Error:', error.message)
  }
}

const generateRecommendations = (moviesData, restaurantData) => {
  console.log('\n\x1b[34mRecommendations\n===============\x1b[0m')
  moviesData.forEach(movie => {
    movie.days.forEach(day => {
      day.times.forEach(time => {
        const movieEndTime = addTwoHours(time)

        if (restaurantData.length > 0) {
          for (let i = 0; i < 3; i++) {
            if (movieEndTime === restaurantData[i].time.substring(0, 2)) {
              console.log(`* On \x1b[34m${day.day}\x1b[0m the movie "\x1b[33m${movie.movie}\x1b[0m" starts at \x1b[35m${time}\x1b[0m and there is a free table between ${restaurantData[i].time}.`)
            }
          }
        }
      })
    })
  })
}

const addTwoHours = (movieStartTime) => {
  // Implement logic to add two hours to the time string
  let restaurantTime = parseInt(movieStartTime.substring(0, 2))
  restaurantTime = restaurantTime + 2
  return restaurantTime.toString()
}

run()
