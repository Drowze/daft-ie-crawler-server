const puppeteer = require('puppeteer');
const _ = require('lodash');
const express = require('express');
const { Cluster } = require('puppeteer-cluster');
const app = express();
const path = require('path');
const port = process.env.PORT || 3001;

const desired_areas = [
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
  desired_rooms_qty = [2, 3]

  urls = areas.map(area => desired_rooms_qty.map(i => ({
    "area": area,
    "url": "http://www.daft.ie/dublin-city/residential-property-for-rent/" + area + "/?s[mxp]=" + maximum_price_per_bedroom * i + "&s[mnb]=" + i + "&s[sort_by]=price&s[sort_type]=a"
  })))
  console.log(_.flatten(urls))

  return _.flatten(urls)
}

async function clustered_fetch_ads({ page, data: area_url }) {
  await page.goto(area_url.url, {timeout: 0});
  const ad_urls = await page.$$eval('.sr_counter + a', ads => ads.map(ad => ad.href));
  const addresses = await page.$$eval('.sr_counter + a', ads => ads.map(ad => ad.innerText));
  const prices = await page.$$eval('.price', ads => ads.map(ad => ad.innerText));
  const bedrooms = await page.$$eval('.info li:nth-child(2)', ads => ads.map(ad => ad.innerText));
  const images = await page.$$eval('.box .main_photo', ads => ads.map(ad => ad.src));
  
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

  return ads;
}

app.use(express.static(path.resolve(__dirname, '../react-ui/build')));

app.get('/api', (req, res) => {
  res.set('Content-Type', 'application/json');

  urls = build_urls(desired_areas)

  Cluster.launch({
    concurrency: Cluster.CONCURRENCY_CONTEXT,
    maxConcurrency: 5,
    puppeteerOptions: { args: ['--no-sandbox', '--disable-setuid-sandbox'] },
  }).then(cluster => {
      cluster.task(clustered_fetch_ads)
        .then(() => Promise.all(urls.map(url => cluster.execute(url))))
        .then(ads => {
          cluster.idle().then(() => cluster.close())
          return _.flatten(ads)
        })
        .then(ads => _.uniqBy(ads, (ad => ad.ad_url)))
        .then(ads => _.sortBy(ads, [ad => ad.price_per_room]))
        .then(ads => {
          console.log('OK')
          return res.send(ads);
        })
      .catch(console.log)
    })
})

app.get('*', function(request, response) {
  response.sendFile(path.resolve(__dirname, '../react-ui/build', 'index.html'));
});

app.listen(port, (err) => {
  if (err) {
    return console.log('something bad happened', err)
  }

  console.log(`server is listening on ${port}`)
})
