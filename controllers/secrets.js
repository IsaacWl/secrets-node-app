const User = require('../models/User');

exports.getSecrets = async (req, res) => {
  try {
    const users = await User.find({ secret: { $ne: null } });
    res.render('secrets', {
      userSecrets: users,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

exports.getSecretPage = (req, res) => {
  if (req.isAuthenticated()) {
    res.render('submit');
    return;
  }
  res.redirect('/login');
};

exports.createSecret = async (req, res) => {
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
};
