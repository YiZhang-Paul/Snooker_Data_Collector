class Collector {

    constructor(database) {

        this.database = database;
    }

    getCollection(name) {

        return this.database.listCollections({ name }).next();
    }

    fetch() { }

    store(data) { }

    collect() {

        return this.fetch().then(response => {

            return this.store(response.data);
        });
    }
}

module.exports = Collector;