const passport = require('passport');

const User = require('../models/User');

exports.getRegister = (req, res) => {
  if (req.isAuthenticated()) {
    res.redirect('/secrets');
    return;
  }
  res.render('register');
};

exports.register = async (req, res) => {
  const { username, password } = req.body;

  const user = { email: username, password: password };

  try {
    await User.create(user);
    // await newUser.save();
    passport.authenticate('local')(req, res, () => {
      res.redirect('/secrets');
    });
  } catch (error) {
    console.log(error);
    res.redirect('/register');
  }
};

exports.getLogin = async (req, res) => {
  if (req.isAuthenticated()) {
    res.redirect('/secrets');
    return;
  }
  res.render('login');
};

exports.login = async (req, res) => {
  res.redirect('/secrets');
};

exports.logout = async (req, res) => {
  req.logout((error) => {
    if (error) {
      console.log(error);
    }
    res.redirect('/');
  });
};
