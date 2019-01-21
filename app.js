const puppeteer = require('puppeteer');
const _ = require('lodash')
const express = require('express')
const app = express()
var port = process.env.PORT || 3001

const desired_areas = [
  'dublin-1',
  'dublin-2',
  'dublin-4',
  'dublin-6',
  'dublin-6w',
  'dublin-7',
  'dublin-8',
  'dublin-14',
  'sandyford',
  'rathmines',
  'ballsbridge'] // Desired areas in dublin, matching daft.ie url
const maximum_price_per_bedroom = 800 // The maximum price you wish to pay per room

function remove_nondigits(str) { return Number(str.replace(/\D/g,'')) }

function build_urls(areas) {
  desired_rooms_qty = [3,4]

  urls = areas.map(area => desired_rooms_qty.map(i => ({
    "area": area,
    "url": "http://www.daft.ie/dublin-city/residential-property-for-rent/" + area + "/?s[mxp]=" + maximum_price_per_bedroom * i + "&s[mnb]=" + i + "&s[sort_by]=price&s[sort_type]=a"
  })))
  console.log(_.flatten(urls))

  return _.flatten(urls)
}

async function fetch_ads(area_url) {
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  await page.goto(area_url.url, {timeout: 0});

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

app.use(function(req, res, next) {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

app.get('/api', (req, res) => {
  areas = req.query.areas
  console.log(areas)

  ads = Promise.all(build_urls(desired_areas).map(fetch_ads))
    .then(ads => _.flatten(ads))
    .then(ads => _.uniqBy(ads, (ad => ad.ad_url)))
    .then(ads => _.sortBy(ads, [ad => ad.price_per_room]))
    .then(ads => {
      return res.send(ads)
    })
    .catch(console.log)
})

app.listen(port, (err) => {
  if (err) {
    return console.log('something bad happened', err)
  }

  console.log(`server is listening on ${port}`)
})
