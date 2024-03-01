const express = require('express');
const passport = require('passport');
const router = express.Router();
const authController = require('../controllers/auth');

router.get(
  '/auth/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

router.get(
  '/auth/google/secrets',
  passport.authenticate('google', { failureRedirect: '/login' }),
  (req, res) => {
    // if successful redirect to /secrets
    res.redirect('/secrets');
  }
);

router
  .route('/register')
  .get(authController.getRegister)

  .post(authController.register);

router
  .route('/login')

  .get(authController.getLogin)

  .post(
    passport.authenticate('local', {
      failureRedirect: '/login',
      failureMessage: true,
    }),
    authController.login
  );

router.get('/logout', authController.logout);

module.exports = router;
