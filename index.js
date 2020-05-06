const puppeteer = require('puppeteer');
const cheerio = require('cheerio');

async function main() {
	// use headless for debugging and to set up the initial scraper
	const browser = await puppeteer.launch({ headless: true });
	const page = await browser.newPage();
	await page.goto('https://miami.craigslist.org/d/software-qa-dba-etc/search/sof');

	// grab html using puppeteer
	const html = await page.content();

	// cheerios lets us grab elements from the html
	// $ lets us create our own jquery selector in node.js
	const $ = cheerio.load(html);

	// returning an object with the info i scraped
	const results = $('.result-info')
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

	console.log(results);
}

main();
