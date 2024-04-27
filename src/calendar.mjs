import {
  scrape
} from './scraper.mjs'
import {
  JSDOM
} from 'jsdom'
import fetch from 'node-fetch'

// Fetches and returns the HTML content of a URL as JSDOM
const fetchDomFromUrl = async (url) => {
  const response = await fetch(url)
  const htmlContent = await response.text()
  return new JSDOM(htmlContent)
}

// Extracts calendar URLs from a given DOM
const extractCalendarUrls = (dom) => {
  return Array.from(dom.window.document.querySelectorAll('ul li a'))
    .map(link => link.href)
}

// Fetches free days from a specific calendar URL
const fetchFreeDays = async (baseUrl, relativeUrl) => {
  const url = new URL(relativeUrl, baseUrl)
  const dom = await fetchDomFromUrl(url.href)
  return extractFreeDays(dom)
}

// Extracts free days from a table element in a DOM
const extractFreeDays = (dom) => {
  const tableElement = dom.window.document.querySelector('table')
  const daysList = Array.from(tableElement.querySelectorAll('thead th'))
    .map(cell => cell.textContent.trim())
  const okList = Array.from(tableElement.querySelector('tbody tr').querySelectorAll('td'))
    .map(cell => cell.textContent.trim().toLowerCase())

  return daysList.filter((day, index) => okList[index] === 'ok')
}

// Finds common free days among multiple lists of free days
const findCommonFreeDays = (allFreeDays) => {
  return allFreeDays.reduce((commonDays, days) =>
    commonDays.filter(day => days.includes(day))
  )
}

const calendarScraper = async (url) => {
  try {
    const {
      calendarLink
    } = await scrape(url)
    const calendarDom = await fetchDomFromUrl(calendarLink)
    const calendarUrls = extractCalendarUrls(calendarDom)

    const allFreeDays = await Promise.all(calendarUrls.map(relativeUrl =>
      fetchFreeDays(calendarLink, relativeUrl)
    ))

    const commonFreeDays = findCommonFreeDays(allFreeDays)
    return commonFreeDays // Return the list of common free days
  } catch (error) {
    console.error('Error scraping calendar:', error.message)
    throw error // Rethrow the error to be handled by the caller
  }
}

export {
  calendarScraper
}
