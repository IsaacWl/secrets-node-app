require('dotenv').config();
const express = require('express');
const app = express();
const bcrypt = require('bcrypt');
const passport = require('passport');
const session = require('express-session');
// database
const startDatabase = require('./db/db');
const User = require('./models/User');

const keys = require('./config/keys');

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

app.get('/', (req, res) => {
  res.render('home');
});

app.get(
  '/auth/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

app.get(
  '/auth/google/secrets',
  passport.authenticate('google', { failureRedirect: '/login' }),
  (req, res) => {
    // if successful redirect to /secrets
    res.redirect('/secrets');
  }
);

app.get('/secrets', async (req, res) => {
  try {
    const users = await User.find({ secret: { $ne: null } });
    res.render('secrets', {
      userSecrets: users,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

app
  .route('/register')
  .get((req, res) => {
    if (req.isAuthenticated()) {
      res.redirect('/secrets');
      return;
    }
    res.render('register');
  })

  .post(async (req, res) => {
    const saltRounds = 10;
    const { username, password } = req.body;

    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const user = { email: username, password: hashedPassword };

    try {
      const newUser = await User.create(user);
      await newUser.save();
      passport.authenticate('local')(req, res, () => {
        res.redirect('/secrets');
      });
    } catch (error) {
      console.log(error);
      res.redirect('/register');
    }
  });

app
  .route('/login')

  .get((req, res) => {
    console.log(req.isAuthenticated());
    if (req.isAuthenticated()) {
      res.redirect('/secrets');
      return;
    }
    res.render('login');
  })

  .post(
    passport.authenticate('local', {
      failureRedirect: '/login',
      failureMessage: true,
    }),
    (req, res) => {
      res.redirect('/secrets');
    }
  );

app
  .route('/submit')

  .get((req, res) => {
    if (req.isAuthenticated()) {
      res.render('submit');
      return;
    }
    res.redirect('/login');
  })

  .post(async (req, res) => {
    const userId = req.user?._id;
    const { secret } = req.body;

    try {
      const user = await User.findById(userId);

      if (!user)
        return res
          .status(404)
          .json({ message: `not user with the id: ${userId}` });

      user.secret = secret;

      await user.save();

      return res.redirect('/secrets');
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  });

app.get('/logout', (req, res) => {
  req.logout((error) => {
    if (error) {
      console.log(error);
    }
    res.redirect('/');
  });
});

(async () => {
  await startDatabase();
  app.listen(PORT, console.log(`Listening on port: ${PORT}`));
})();
