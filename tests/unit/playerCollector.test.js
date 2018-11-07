const expect = require('chai').expect;
const sinon = require('sinon');
const _ = require('lodash');
const axios = require('axios');
const PlayerCollector = require('../../collectors/playerCollector');

context('player collector test', () => {

    let collector;
    let database;

    beforeEach('initialize player collector', () => {

        database = { dropCollection: function() { } };
        collector = new PlayerCollector(database);
    });

    describe('playersInYear()', () => {

        let axiosGetStub;
        const response = { data: [{}] };

        beforeEach('stub axios get method', () => {

            axiosGetStub = sinon.stub(axios, 'get').resolves(response);
        });

        it('should make request to correct url base on year value passed', () => {

            const year = 2017;
            const url = `http://api.snooker.org/?t=10&st=p&s=${year}`;

            collector.playersInYear(year);

            expect(axiosGetStub.calledOnceWith(url)).to.be.true;
        });

        it('should resolve with expected data on successful request', done => {

            collector.playersInYear(2017).then(data => {

                expect(data).to.equal(response.data);

            }).then(done, done);
        });

        it('should include the year the data was originated', done => {

            const year = 2017;
            axiosGetStub.resolves({ data: [{ ID: 1 }, { ID: 2 }, { ID: 3 }] });

            collector.playersInYear(year).then(data => {

                expect(data.every(record => record.year === year)).to.be.true;

            }).then(done, done);
        });

        afterEach('restore axios', () => {

            axiosGetStub.restore();
        });
    });

    describe('mergeDuplicates', () => {

        let allPlayers;

        beforeEach('initialize test input', () => {

            const players2015 = [{ ID: 1, year: 2015 }, { ID: 2, year: 2015 }, { ID: 3, year: 2015 }];
            const players2016 = [{ ID: 1, year: 2016 }, { ID: 2, year: 2016 }];
            const players2017 = [{ ID: 1, year: 2017 }, { ID: 3, year: 2017 }];
            allPlayers = [...players2015, ...players2016, ...players2017];
        });

        it('should merge duplicate players by player IDs', () => {

            const merged = collector.mergeDuplicates(allPlayers);

            expect(merged.length).to.equal(3);
            expect(merged[0].ID).to.equal(1);
            expect(merged[1].ID).to.equal(2);
            expect(merged[2].ID).to.equal(3);
        });

        it('should include duplicate (active) years in player records', () => {

            const merged = collector.mergeDuplicates(allPlayers);

            expect(merged[0].activeYears).to.deep.equal([2015, 2016, 2017]);
            expect(merged[1].activeYears).to.deep.equal([2015, 2016]);
            expect(merged[2].activeYears).to.deep.equal([2015, 2017]);
        });
    });

    describe('fetch()', () => {

        let lodashRangeStub;
        let axiosGetStub;

        beforeEach('stub methods and initialize test input', () => {

            const players2015 = [{ ID: 1 }, { ID: 2 }];
            const players2016 = [{ ID: 1 }, { ID: 3 }];
            const players2017 = [{ ID: 1 }, { ID: 2 }, { ID: 3 }];
            lodashRangeStub = sinon.stub(_, 'range').returns([2015, 2016, 2017]);
            axiosGetStub = sinon.stub(axios, 'get');
            axiosGetStub.onCall(0).resolves({ data: players2015 });
            axiosGetStub.onCall(1).resolves({ data: players2016 });
            axiosGetStub.resolves({ data: players2017 });
        });

        it('should include active years of a player in its record', done => {

            collector.fetch().then(result => {

                expect(result[0].activeYears).to.deep.equal([2015, 2016, 2017]); // player A is active in all three years
                expect(result[1].activeYears).to.deep.equal([2015, 2017]);       // player B is not active in 2016
                expect(result[2].activeYears).to.deep.equal([2016, 2017]);       // player C is not active in 2015

            }).then(done, done);
        });

        it('should combine players from every year into one collection without duplication', done => {

            collector.fetch().then(result => {

                expect(result.length).to.equal(3);
                expect(result[0].ID).to.equal(1);
                expect(result[1].ID).to.equal(2);
                expect(result[2].ID).to.equal(3);

            }).then(done, done);
        });

        afterEach('restore axios and lodash', () => {

            lodashRangeStub.restore();
            axiosGetStub.restore();
        });
    });

    describe('store()', () => {

        let getCollectionStub;
        let toPlayerModelStub;
        let playerModel;
        const collection = { name: 'some name' };

        beforeEach('stub/spy database and collector methods', () => {

            sinon.spy(database, 'dropCollection');
            getCollectionStub = sinon.stub(collector, 'getCollection');
            getCollectionStub.resolves(null);

            playerModel = { save: function() { } };
            toPlayerModelStub = sinon.stub(collector, 'toPlayerModel');
            toPlayerModelStub.returns(playerModel);
        });

        it('should check the existence of collection before saving new data', done => {

            collector.store([]).then(() => {

                expect(getCollectionStub.calledOnce).to.be.true;

            }).then(done, done);
        });

        it('should not drop collection if it does not exist before saving new data', done => {

            getCollectionStub.resolves(null);

            collector.store([]).then(() => {

                expect(database.dropCollection.notCalled).to.be.true;

            }).then(done, done);
        });

        it('should drop collection if it already exists before saving new data', done => {

            getCollectionStub.resolves(collection);

            collector.store([]).then(() => {

                expect(database.dropCollection.calledOnceWith(collection.name)).to.be.true;

            }).then(done, done);
        });

        it('should save every player fetched to database', done => {

            const players = [{}, {}, {}];
            sinon.stub(playerModel, 'save').resolves({});

            collector.store(players).then(() => {

                expect(playerModel.save.calledThrice).to.be.true;

            }).then(done, done);
        });

        it('should record total number of failed database insertion', done => {

            const players = [{}, {}, {}];
            sinon.stub(playerModel, 'save').rejects();

            collector.store(players).then(result => {

                expect(result.failed).to.equal(players.length);

            }).then(done, done);
        });

        afterEach('restore collector', () => {

            getCollectionStub.restore();
            toPlayerModelStub.restore();
        });
    });
});