const expect = require('chai').expect;
const sinon = require('sinon');
const _ = require('lodash');
const axios = require('axios');
const PlayerCollector = require('../collectors/playerCollector');

context('player collector test', () => {

    let collector;
    let database;

    beforeEach('initialize player collector', () => {

        database = { dropCollection: function() { } };
        collector = new PlayerCollector(database);
    });

    describe('playersInYear()', () => {

        let axiosGetStub;
        const response = { data: 'some data' };

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

        afterEach('restore axios', () => {

            axiosGetStub.restore();
        });
    });

    describe('fetch()', () => {

        const playerA = { ID: 1, name: 'A' };
        const playerB = { ID: 2, name: 'B' };
        const playerC = { ID: 3, name: 'C' };
        const expectedData = [playerA, playerB, playerC];

        let lodashRangeStub;
        let axiosGetStub;

        beforeEach('stub methods', () => {

            lodashRangeStub = sinon.stub(_, 'range').returns([1, 2, 3]);
            axiosGetStub = sinon.stub(axios, 'get').resolves({ data: expectedData });
        });

        it('should combine players from every year into one collection without duplication', done => {

            collector.fetch().then(result => {

                expect(result).to.deep.equal(expectedData);

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