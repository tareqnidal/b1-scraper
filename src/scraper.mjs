// scraper.mjs
import fetch from 'node-fetch'
import jsdom from 'jsdom'
const {
  JSDOM
} = jsdom

const scrape = async (startUrl) => {
  try {
    const response = await fetch(startUrl)
    const html = await response.text()
    const dom = new JSDOM(html)
    const document = dom.window.document

    const links = Array.from(document.querySelectorAll('ol li a')).map(linkElement => {
      const href = linkElement.getAttribute('href')
      return {
        href,
        text: linkElement.textContent.trim().toLowerCase()
      }
    })

    const calendarLink = findCalendarLink(links)
    const cinemaLink = findCinemaLink(links)
    const restaurantLink = findRestaurantLink(links)

    if (!calendarLink || !cinemaLink || !restaurantLink) {
      throw new Error('Required link(s) not found in the extracted links')
    }

    return {
      calendarLink: calendarLink.href,
      cinemaLink: cinemaLink.href,
      restaurantLink: restaurantLink.href
    }
  } catch (error) {
    console.error('Scraping failed:', error)
    throw error
  }
}

const findCalendarLink = (links) => {
  return links[0]
}

const findCinemaLink = (links) => {
  return links[1]
}

const findRestaurantLink = (links) => {
  return links[2]
}

export {
  scrape
}
