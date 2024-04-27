// restaurant.mjs
import fetch from 'node-fetch'
import {
  JSDOM
} from 'jsdom'
import {
  scrape
} from './scraper.mjs'

// Function to perform login and handle redirects
const performLogin = async (loginUrl, credentials) => {
  const loginResponse = await fetch(loginUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: credentials,
    redirect: 'manual'
  })

  if (loginResponse.status === 302) {
    const redirectUrl = loginResponse.headers.get('location')
    return {
      redirectUrl,
      cookies: loginResponse.headers.get('set-cookie')
    }
  } else if (!loginResponse.ok) {
    throw new Error(`Login failed: ${loginResponse.statusText}`)
  } else {
    return {
      cookies: loginResponse.headers.get('set-cookie')
    }
  }
}

// Extracts booking times from HTML content
const extractAvailableSlots = (htmlContent) => {
  const dom = new JSDOM(htmlContent)
  const weekDayMap = {
    fri: 'Friday',
    sat: 'Saturday',
    sun: 'Sunday'
  }
  const availableSlots = []
  const reservationOptions = dom.window.document.querySelectorAll('input[type="radio"]')

  reservationOptions.forEach(option => {
    const slotValue = option.value
    const dayCode = slotValue.substring(0, 3) // Extracts the day abbreviation
    const timeSlot = slotValue.substring(3) // Extracts the time slot

    if (option.value !== '' && option.parentNode.textContent.trim().toLowerCase().includes('free')) {
      const fullDayName = weekDayMap[dayCode]
      const formattedTimeSlot = `${timeSlot.substring(0, 2)}-${timeSlot.substring(2)}`
      availableSlots.push({
        day: fullDayName,
        time: formattedTimeSlot
      })
    }
  })

  return availableSlots
}

// Scrape restaurant data
const restaurantScraper = async (url, commonFreeDays) => {
  try {
    const {
      restaurantLink
    } = await scrape(url)
    if (!restaurantLink) {
      throw new Error('Restaurant link not found in the extracted links')
    }

    const loginUrl = `${restaurantLink}login`
    const loginCredentials = new URLSearchParams({
      username: 'zeke',
      password: 'coys'
    })

    // Perform login and handle redirects
    const {
      redirectUrl,
      cookies
    } = await performLogin(loginUrl, loginCredentials)

    // Handle possible redirect after login
    if (redirectUrl) {
      await fetch(redirectUrl, {
        headers: {
          Cookie: cookies
        },
        redirect: 'manual'
      })
    }

    // Navigate to booking page with cookies
    const bookingResponse = await fetch(`${restaurantLink}login/booking`, {
      headers: {
        Cookie: cookies
      }
    })
    if (!bookingResponse.ok) {
      throw new Error(`Failed to navigate to booking page: ${bookingResponse.statusText}`)
    }

    const bookingHtml = await bookingResponse.text()
    const availableSlots = extractAvailableSlots(bookingHtml)

    // Filter available slots based on common free days
    const filteredSlots = availableSlots.filter(slot =>
      commonFreeDays.includes(slot.day))
    return filteredSlots
  } catch (error) {
    console.error('Error scraping restaurant data:', error.message)
  }
}

export {
  restaurantScraper
}
