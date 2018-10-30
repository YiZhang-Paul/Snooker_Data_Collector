const mongoose = require('mongoose');

const playerSchema = new mongoose.Schema({

    player_id: Number,
    type: Number,
    first_name: String,
    middle_name: String,
    last_name: String,
    short_name: String,
    surname_first: Boolean,
    gender: String,
    date_of_birth: String,
    nationality: String,
    bio_page: String,
    website: String,
    twitter: String,
    image: String,
    turned_pro: Number,
    last_season_played: Number
});

module.exports = mongoose.model('Player', playerSchema);