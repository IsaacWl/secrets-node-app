require('dotenv').config();
const express = require('express');
const session = require('express-session');
const passport = require('passport');
const startDatabase = require('./db/db');
const app = express();
// database

const keys = require('./config/keys');
// routes
const authRoutes = require('./routes/auth');
const secretsRoutes = require('./routes/secrets');

const PORT = process.env.PORT || 8000;

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static('public'));
app.set('view engine', 'ejs');

app.use(
  session({
    secret: keys.sessionSecret,
    resave: false,
    saveUninitialized: false,
  })
);

app.use(passport.initialize());
app.use(passport.session());

require('./services/passport');

app.use('/', authRoutes);
app.use('/', secretsRoutes);

app.get('/', (req, res) => {
  res.render('home');
});

(async () => {
  await startDatabase();
  app.listen(PORT, console.log(`Listening on port: ${PORT}`));
})();
