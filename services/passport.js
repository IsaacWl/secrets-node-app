const passport = require('passport');
const LocalStrategy = require('passport-local');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const bcrypt = require('bcrypt');
const User = require('../models/User');
const keys = require('../config/keys');

passport.serializeUser((user, done) => {
  return done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    const { password, ...userInfo } = user._doc;
    return done(null, userInfo);
  } catch (error) {
    return done(error);
  }
});

passport.use(
  new LocalStrategy(async (username, password, cb) => {
    if (!username.trim() || !password.trim())
      return cb(null, false, { message: 'username and password are required' });

    try {
      const user = await User.findOne({ email: username });

      if (!user)
        return cb(null, false, { message: 'email or password incorrect.' });

      const samePassword = await bcrypt.compare(password, user.password);

      if (!samePassword)
        return cb(null, false, { message: 'email or password incorrect' });

      return cb(null, user);
    } catch (error) {
      return cb(error);
    }
  })
);

passport.use(
  new GoogleStrategy(
    {
      clientID: keys.googleClientId,
      clientSecret: keys.googleClientSecret,
      callbackURL: 'http://localhost:8000/auth/google/secrets',
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const user = await User.findOne({ googleId: profile.id });

        if (user) {
          return done(null, user);
        }

        const newUser = await new User({
          email: profile._json.email,
          username: profile.displayName,
          googleId: profile.id,
          // picture: profile._json.picture
        }).save();

        return done(null, newUser);
      } catch (error) {
        return done(error, null);
      }
    }
  )
);
