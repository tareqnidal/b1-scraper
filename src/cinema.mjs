// cinema.mjs
import fetch from 'node-fetch'
import {
  JSDOM
} from 'jsdom'
import {
  scrape
} from './scraper.mjs'

// fetch HTML content from a URL
const fetchHtmlContent = async (url) => {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`)
  }
  return await response.text()
}

// extract options (day/movie) from the HTML content
const extractOptions = async (url, selector) => {
  const htmlContent = await fetchHtmlContent(url)
  const dom = new JSDOM(htmlContent)
  const options = Array.from(dom.window.document.querySelectorAll(selector))
  return options
    .filter(option => option.value && option.textContent.trim() !== '--- Pick a Movie ---')
    .map(option => ({
      text: option.textContent.trim(),
      value: option.value
    }))
}

// fetch movie showtimes
const fetchMovieShowtimes = async (baseUrl, days, movies) => {
  const showtimes = []
  for (const movie of movies) {
    const movieShowtimes = {
      movie: movie.text,
      days: []
    }
    for (const day of days) {
      const response = await fetch(`${baseUrl}/check?day=${day.value}&movie=${movie.value}`)
      const data = await response.json()
      const availableTimes = data
        .filter(item => item.status === 1) // Assuming '1' means available
        .map(item => item.time)
      if (availableTimes.length > 0) {
        movieShowtimes.days.push({
          day: day.text,
          times: availableTimes
        })
      }
    }
    if (movieShowtimes.days.length > 0) {
      showtimes.push(movieShowtimes)
    }
  }
  return showtimes
}

// scrape cinema data
const cinemaScraper = async (startUrl, commonFreeDays) => {
  try {
    const {
      cinemaLink
    } = await scrape(startUrl)
    if (!cinemaLink) {
      throw new Error('Cinema link not found in the extracted links')
    }

    // Extract options for days and movies
    const dayOptions = await extractOptions(cinemaLink, '#day option')
    const movieOptions = await extractOptions(cinemaLink, '#movie option')

    // only the common free days are included
    const filteredDayOptions = dayOptions.filter(day =>
      commonFreeDays.includes(day.text))

    const showtimes = await fetchMovieShowtimes(cinemaLink, filteredDayOptions, movieOptions)
    return showtimes
  } catch (error) {
    console.error('Error scraping cinema:', error.message)
  }
}

export {
  cinemaScraper
}
