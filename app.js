process.env.NODE_ENV = process.env.NODE_ENV || 'development';
global.config = require('config');

console.log('updated');

const connection = require('mongoose_model').connection;
const PlayerCollector = require('./collectors/playerCollector');

connection.on('error', error => console.log(error));

connection.once('open', () => {

    let counter = 0;

    console.log('Database connected successfully.');
    console.log('Data collection started...');

    const checkProgress = (result, total) => {

        console.log(result);

        if (++counter === total) {

            console.log('Data collection finished.');
            connection.close();
        }
    }

    const collectors = [

        new PlayerCollector(connection.db)
    ];

    collectors.forEach(collector => {

        collector.collect()
            .then(result => checkProgress(result, collectors.length))
            .catch(error => checkProgress(error, collectors.length));
    });
});