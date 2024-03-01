const express = require('express');

const router = express.Router();
const secretsController = require('../controllers/secrets');

router.get('/secrets', secretsController.getSecrets);

router
  .route('/submit')

  .get(secretsController.getSecretPage)

  .post(secretsController.createSecret);

module.exports = router;
