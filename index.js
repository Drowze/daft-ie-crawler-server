const puppeteer = require('puppeteer');
const pry = require('pryjs');

// Min 3 beds, 3000

var desired_areas = [1,2,4,6]

function build_urls(areas) {
  return areas.map(function(area) {
    return "http://www.daft.ie/dublin-city/residential-property-for-rent/dublin-" + area + "/?s[mxp]=5000&s[mnb]=4&s[sort_by]=price&s[sort_type]=a"
  })
}

var urls = build_urls(desired_areas)

urls.forEach((url, index) => {
  (async() => { 
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.setViewport({width: 1920, height: 1080})
    await page.goto(url);
    const ads = await page.$$eval('.sr_counter + a', ads => ads.map(ad => ad.href))
    console.log(ads)

    await page.screenshot({path: 'something' + index + '.jpg'})
    
    browser.close()
  })()
})


// const LINKS_SELECTOR = 'a'
// const the2ndHref = await page.evaluate(selector => {
//   const allLinks = document.querySelectorAll(selector)
//   return allLinks[1].href
// }, LINKS_SELECTOR)

// console.log('the2ndHref', the2ndHref)