const puppeteer = require('puppeteer');
const cheerio = require('cheerio');
const mongoose = require('mongoose');
// use mongoose to connect with MongoDb

async function scrapeListings(page) {
	await page.goto('https://miami.craigslist.org/d/software-qa-dba-etc/search/sof');

	// grab html using puppeteer
	const html = await page.content();

	// cheerios lets us grab elements from the html
	// $ lets us create our own jquery selector in node.js
	const $ = cheerio.load(html);

	// returning an object with the info i scraped
	const listings = $('.result-info')
		.map((index, element) => {
			//finding the child element of result-info
			const titleElement = $(element).find('.result-title');
			const timeElement = $(element).find('.result-date');
			const hoodElement = $(element).find('.result-hood');

			// grab job title from craigslist
			const title = $(titleElement).text();
			//.attr lets you take specific attributes
			const url = $(titleElement).attr('href');
			// grab date time posted from the attribute
			const datePosted = new Date($(timeElement).attr('datetime'));
			// grab neighborhood located - also using trim to remove spaces from the sides and remove parens with replace
			const hood = $(hoodElement).text().trim().replace(/[()]/g, '');

			return { title, url, datePosted, hood };
		}) //have to use a .get() function when using a map function in cheerio
		.get();

	return listings;
}

async function connectToMongoDb() {
	//craigslist-user:superstrongpassword Mlab MongoDB
	await mongoose.connect(
		'mongodb+srv://craigslist-user:superstrongpassword@cluster0-qa7aw.mongodb.net/test?retryWrites=true&w=majority',
		{ useUnifiedTopology: true, useNewUrlParser: true }
	);
	console.log('connected to mongodb');
}

async function scrapeJobDescriptions(listings, page) {
	for (let i = 0; i < listings.length; i++) {
		// going into each url scraped from the listings
		await page.goto(listings[i].url);
		const html = await page.content();
		const $ = cheerio.load(html);
		const jobDescription = $('#postingbody').text();
		const compensation = $('p.attrgroup > span:nth-child(1) > b').text();

		// this adds the text into the object of listings
		listings[i].jobDescription = jobDescription;

		// this finds the compensation in the listing and adds to the object
		listings[i].compensation = compensation;

		// 1 second sleep to limit how fast it scrapes
		await sleep(1000);
	}
}

// this sleep function lets us limit the amount of request we make so we don't get blocked
async function sleep(miliseconds) {
	return new Promise((resolve) => setTimeout(resolve, miliseconds));
}

async function main() {
	await connectToMongoDb();

	// use headless for debugging and to set up the initial scraper
	const browser = await puppeteer.launch({ headless: false });
	const page = await browser.newPage();
	const listings = await scrapeListings(page);
	const listingsWithJobDescription = await scrapeJobDescriptions(listings, page);

	console.log(listings);
}

main();
