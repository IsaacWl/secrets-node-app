const mongoose = require('mongoose');

const startDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('connected to database successfully.');
  } catch (error) {
    console.log(error.message);
    throw new Error(error.message || 'Not able to connect to database');
  }
};

module.exports = startDatabase;
