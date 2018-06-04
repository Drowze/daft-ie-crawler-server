const puppeteer = require('puppeteer');
const pry = require('pryjs');
const _ = require('lodash')

// Min 3 beds, 3000

var desired_areas = [1,2,4,6]

function build_urls(areas) {
  return areas.map(area => {
    url = "http://www.daft.ie/dublin-city/residential-property-for-rent/dublin-" + area + "/?s[mxp]=5000&s[mnb]=4&s[sort_by]=price&s[sort_type]=a"
    return({ "area": area, "url": url })
  })
}

function remove_nondigits(str) { return Number(str.replace(/\D/g,'')) }

var area_urls = build_urls(desired_areas)

async function fetch_ads(area_url) {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setViewport({width: 1920, height: 1080})
  await page.goto(area_url.url);

  const ad_urls = await page.$$eval('.sr_counter + a', ads => ads.map(ad => ad.href))
  const addresses = await page.$$eval('.sr_counter + a', ads => ads.map(ad => ad.innerText))
  const prices = await page.$$eval('.price', ads => ads.map(ad => ad.innerText))
  const bedrooms = await page.$$eval('.info li:nth-child(2)', ads => ads.map(ad => ad.innerText))

  ads = ad_urls.map((ad_url, index) => {
    bedrooms_qty = remove_nondigits(bedrooms[index])
    return {
      "area": area_url.area,
      "address": addresses[index],
      "ad_url": ad_url,
      "bedrooms_qty": remove_nondigits(bedrooms[index]),
      "price_per_room": remove_nondigits(prices[index]) / bedrooms_qty
    }
  })
  
  browser.close()
  return ads
}

ads = Promise.all(area_urls.map(fetch_ads))
  .then(ads => _.flatten(ads))
  .then(ads => _.sortBy(ads, [(ad) => ad.price_per_room]))
  .then(console.log)
