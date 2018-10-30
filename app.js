const database = require('./database');
const PlayerCollector = require('./collectors/playerCollector');

database.on('error', () => console.log(error));

database.once('open', () => {

    let counter = 0;

    console.log('Database connected successfully.');
    console.log('Data collection started...');

    const checkProgress = (result, total) => {

        console.log(result);

        if (++counter === total) {

            console.log('Data collection finished.');
            database.close();
        }
    }

    const collectors = [

        new PlayerCollector(database.db)
    ];

    collectors.forEach(collector => {

        collector.collect()
            .then(result => checkProgress(result, collectors.length))
            .catch(error => checkProgress(error, collectors.length));
    });
});