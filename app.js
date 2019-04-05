
//--------------------------------------------   IMPORT DEPENDENCIES --------------------------------------------

const express = require('express')
const bodyParser = require('body-parser')
const app = express();
const scrape = require('website-scraper');
const fs = require('fs');
const rimraf = require('rimraf');


//-----------------------------------------------  CONFIG MODULES  -------------------------------------------------


app.use(express.static('public'))
app.set('views','views')
app.set('view engine','pug')
app.use(bodyParser.urlencoded({ extended: true }));

// set up server
app.listen(3000, function(){
	console.log("App listening on port 3000")
});


//---------------------------------------------------  ROUTING  ---------------------------------------------------


// GET PAGE "HOME" ----------------------------------
app.get('/', function(req, res){
		res.render('index');
});

// GET PAGE "TEST" ----------------------------------
// app.get('/test', function(req, res){
// 		const recipes = [ { title: 'Gadogado met rijst',
// 			imageLink: 'https://static.ah.nl/static/recepten/img_069348_445x297_JPG.jpg',
// 			recipeLink: 'https://www.ah.nl/allerhande/recept/R-R1185592/gadogado-met-rijst'
// 		}, {
// 			title: 'Komkommerroerbak met sesam & omelet',
// 			imageLink: 'https://static.ah.nl/static/recepten/img_067458_445x297_JPG.jpg',
// 			recipeLink: 'https://www.ah.nl/allerhande/recept/R-R1185440/komkommerroerbak-met-sesam-en-omelet'
// 		}, {
// 			title: 'Hutspot uit de oven met gekruide hazelnoten',
// 			imageLink: 'https://static.ah.nl/static/recepten/img_086722_445x297_JPG.jpg',
// 			recipeLink: 'https://www.ah.nl/allerhande/recept/R-R1178218/hutspot-uit-de-oven-met-gekruide-hazelnoten'
// 		} ];

// 		res.render('test', {recipes} );
// });

// GET PAGE "RESULTS" ----------------------------------
app.get('/results', function(req, res){
	res.render('results');
})

// POST ACTION "FILTER" ----------------------------------
app.post('/filter', function(req, res){
	console.log(req.body.Q1 + req.body.Q2 + req.body.Q3 + req.body.Q4 + req.body.Q5);
	let url = "";

	if(req.body.Q3 === 'vega' && req.body.Q4 === 'budget' ) {
		url = "https://www.ah.nl/allerhande/recepten-zoeken/menugang:hoofdgerecht/veel-gebruikt:snel,budget/speciale-wensen:vegetarisch";
	} else if(req.body.Q3 === 'normal' && req.body.Q1 === 'me' && req.body.Q5 === 'fat') {
		url = "https://www.ah.nl/allerhande/recepten-zoeken/kooktechniek:roerbakken-wokken/menugang:hoofdgerecht/veel-gebruikt:slank";
	} else if(req.body.Q3 === 'vegan') {
		url = "https://www.ah.nl/allerhande/recepten-zoeken/menugang:hoofdgerecht/speciale-wensen:veganistisch";
	} else {
		url = "https://www.ah.nl/allerhande/recepten-zoeken/kooktechniek:stoven/seizoen:winter/menugang:hoofdgerecht/speciale-wensen:vegetarisch";
	};

	const options = {
	urls: [`${url}`],
	directory: './scraped',
	sources: [{selector: 'span'}],
	};

	scrape(options).then(result => {
		// create a content array with all scraped html receipe blocks
		const content = result[0].text.split('<div id="items-wrapper" class="infinite-container">').pop().split('<section class="item recipe" ');

		// reduce to an array of receipe objects
		const recipeResults = content.reduce((acc, item) => {
			let title = item.substring(item.indexOf('data-title=') + 12, item.length);
			title = title.substring(0, title.indexOf('"'));

			let imageLink = item.substring(item.indexOf('data-src=') + 10, item.length);
			imageLink = imageLink.substring(0, imageLink.indexOf('"'));

			let recipeLink = item.substring(item.indexOf('href=') + 6, item.length);
			recipeLink = recipeLink.substring(0, recipeLink.indexOf('"'));

			if (title.length < 5) {
				return [ ...acc ];
			};

			return [
				...acc,
				{
					title,
					imageLink,
					recipeLink: `https://www.ah.nl${recipeLink}`,
				},
			];
		}, []);

		return recipeResults;
	})
	.then(results => {
		// delete all scraped files
		rimraf('./scraped', () => {console.log('directory deleted!')});

		// never show more than 12 results
		const receipies = results.slice(0, 12);
		res.render('results', {receipies});
	})
	.catch(e => console.error(e.stack));
})
