const mongoose = require('mongoose');

mongoose.Promise = global.Promise;
mongoose.connect('mongodb://localhost/snooker_data', { useNewUrlParser: true });

module.exports = mongoose.connection;