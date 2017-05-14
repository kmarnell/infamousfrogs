var express = require('express');
var bodyParser = require('body-parser');
var request = require('request');
var database = require('./database.js');
var Sequelize = require('sequelize');
var flash = require('connect-flash');
var cookieParser = require('cookie-parser');
var session = require('express-session');
var PORT = process.env.PORT || 3000;

var app = express();
app.use(flash());
app.use(session({secret: 'keyboard cat', cookie: {maxAge: 60000}}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(__dirname + '/../react-client/dist'));
app.use(express.static(__dirname + '/../react-client/src'));

app.get('/', function(req, res, next) {
  var sess = req.session
  sess.views = 1
  res.send(sess);
})

app.get('/summary', function(req, res) {
  var id = req.body.id
  console.log(id)

  var recipeSummaryOptions = {
    url: `https://spoonacular-recipe-food-nutrition-v1.p.mashape.com/recipes/4632/summary`,
    method: 'GET',
    headers: {
      'X-Mashape-Key': 'h88XRdVMrZmshoBOiBWVrmfnfWKTp1SlnIjjsn4adRtjrPpen1',
      'Accept': 'application/json'
    }
  }

  request(recipeSummaryOptions, function(error, response, body) {
    if (error) {
      throw err;
    }
    else {
      body = JSON.parse(body);
      res.send(body.summary)
    }

  });
});


app.post('/register', function(req, res) {

  var req = {
    body: {
      user: req.body.username,
      password: req.body.password
    }
  };
  database.createUser(req, res);
});

app.post('/login', function(req, res) {

  var req = {
    body: {
      user: req.body.username,
      password: req.body.password
    }
  };
  database.checkIfUserExists(req, res);
});

app.post('/entry', function(req, res) {
  var ingreds = req.body.toString();

  //setting up params for request to Spoonacular API
  var recipeRetrievalOptions = {
    url: 'https://spoonacular-recipe-food-nutrition-v1.p.mashape.com/recipes/findByIngredients?',
    method: 'GET',
    headers: {
      'X-Mashape-Key': 'h88XRdVMrZmshoBOiBWVrmfnfWKTp1SlnIjjsn4adRtjrPpen1',
      'Accept': 'application/json'
    },
    qs: {
      ingredients: ingreds,
      number: 10
    }
  };

  //sending request to Spoonacular
  var finalResponseObj = {};
  var summary = {};

  request(recipeRetrievalOptions, function(error, response, body) {
    response = JSON.parse(response.body);

    for (var i = 0; i < response.length; i++) {
      var newResponse = response[i];

      //setting up object that will be stored inside of finalResponse for each recipe
      var responseObj = {};
      responseObj['id'] = newResponse.id;
      responseObj['title'] = newResponse.title;
      responseObj['image'] = newResponse.image;
      responseObj['usedIngredientCount'] = newResponse.usedIngredientCount;
      responseObj['missedIngredientCount'] = newResponse.missedIngredientCount;
      finalResponseObj[i] = responseObj;
    }
    res.send(finalResponseObj);
  });
});

app.post('/favoriteCreate', function(req, res) {
  database.createRecipe(req, res);
});

app.delete('/favoriteDestroy', function(req, res) {
  database.removeRecipe(req, res);
});

app.post('/favoriteGet', function(req, res) {
  database.retrieveFavorites(req, res);
});

app.get('/fetchRecipeById', function(req, res) { 
  let recipeId = req.query.id;
  let url = `https://spoonacular-recipe-food-nutrition-v1.p.mashape.com/recipes/${recipeId}/information`;
  var fetchRecipeById = {
    url: url,
    includeNutrition: false,
    method: 'GET',
    headers: {
      'X-Mashape-Key': 'h88XRdVMrZmshoBOiBWVrmfnfWKTp1SlnIjjsn4adRtjrPpen1',
      'Accept': 'application/json'
    }
  }
  request(fetchRecipeById, function(err, response, body) {
    if (err) {
      throw err;
    }
    else {
      body = JSON.parse(body).analyzedInstructions
      console.log(body)
      res.send(body);
    }
  });
  // res.send('information')
});




app.listen(PORT, function() {
  console.log(`listening on port ${PORT}`);
});
