const config = require('config');
const _ = require('lodash');
const axios = require('axios');
const Collector = require('./collector');
const PlayerModel = require('mongoose_model').Player;

class PlayerCollector extends Collector {

    constructor(database) {

        super(database);
    }

    playersInYear(year) {

        const url = `http://api.snooker.org/?t=10&st=p&s=${year}`;

        return axios.get(url).then(response => {

            response.data.forEach(record => {

                record.year = year;
            });

            return response.data;
        });
    }

    toPlayerModel(record) {

        return new PlayerModel({

            player_id: record.ID,
            type: record.Type,
            first_name: record.FirstName,
            middle_name: record.MiddleName,
            last_name: record.LastName,
            short_name: record.ShortName,
            surname_first: record.SurnameFirst,
            gender: record.Sex,
            date_of_birth: record.Born,
            nationality: record.Nationality,
            bio_page: record.BioPage,
            website: record.URL,
            twitter: record.Twitter,
            image: record.Photo,
            turned_pro: record.FirstSeasonAsPro,
            last_season_played: record.LastSeasonAsPro,
            active_years: record.activeYears
        });
    }

    mergeDuplicates(players) {

        const merged = new Map();

        players.forEach(player => {

            const id = player.ID;

            if (!merged.has(id)) {

                player.activeYears = [];
                merged.set(id, player);
            }

            merged.get(id).activeYears.push(player.year);
        });

        return Array.from(merged.values());
    }

    fetch() {

        const startYear = config.collection_start_year;
        const endYear = new Date().getFullYear();
        const years = _.range(startYear, endYear + 1);
        const playerGroups = years.map(this.playersInYear);

        return Promise.all(playerGroups).then(groups => {

            return this.mergeDuplicates(_.flatten(groups));
        })
    }

    store(data) {

        let saved = [];
        let failed = 0;

        return this.getCollection('players').then(collection => {

            if (collection) {

                this.database.dropCollection(collection.name);
            }

            const results = data.map(record => {

                return this.toPlayerModel(record).save()
                    .then(player => saved.push(player))
                    .catch(() => failed++);
            });

            return Promise.all(results).then(() => ({ saved, failed }));
        });
    }
}

module.exports = PlayerCollector;