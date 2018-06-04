const puppeteer = require('puppeteer');
const _ = require('lodash')

const desired_areas = [1,2,4,6] // Desired areas in dublin
const maximum_price_per_bedroom = 1000 // The maximum price you wish to pay

function remove_nondigits(str) { return Number(str.replace(/\D/g,'')) }

function build_urls(areas) {
  urls = areas.map(area => [1,2,3,4,5,6].map(i => ({
    "area": area,
    "url": "http://www.daft.ie/dublin-city/residential-property-for-rent/dublin-" + area + "/?s[mxp]=" + maximum_price_per_bedroom * i + "&s[mnb]=" + i + "&s[sort_by]=price&s[sort_type]=a"
  })))

  return _.flatten(urls)
}

async function fetch_ads(area_url) {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  console.log(area_url.url)
  await page.goto(area_url.url);

  const ad_urls = await page.$$eval('.sr_counter + a', ads => ads.map(ad => ad.href));
  const addresses = await page.$$eval('.sr_counter + a', ads => ads.map(ad => ad.innerText));
  const prices = await page.$$eval('.price', ads => ads.map(ad => ad.innerText));
  const bedrooms = await page.$$eval('.info li:nth-child(2)', ads => ads.map(ad => ad.innerText));
  const images = await page.$$eval('.box .main_photo', ads => ads.map(ad => ad.src));
  browser.close();

  ads = ad_urls.map((ad_url, index) => {
    bedrooms_qty = remove_nondigits(bedrooms[index])
    return {
      "area": area_url.area,
      "address": addresses[index],
      "ad_url": ad_url,
      "image": images[index],
      "bedrooms_qty": remove_nondigits(bedrooms[index]),
      "price_per_room": remove_nondigits(prices[index]) / bedrooms_qty,
      "total_price": prices[index]
    }
  })
  return ads
}

ads = Promise.all(build_urls(desired_areas).map(fetch_ads))
  .then(ads => _.flatten(ads))
  .then(ads => _.sortBy(ads, [ad => ad.price_per_room]))
  .then(console.log)
