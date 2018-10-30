const expect = require('chai').expect;
const sinon = require('sinon');
const Collector = require('../collectors/collector');

context('collector test', () => {

    let database;
    let collector;

    beforeEach('initialize collector', () => {

        database = {

            listCollections: function() {

                return {

                    next: function() { }
                }
            }
        };

        collector = new Collector(database);
    });

    describe('getCollection()', () => {

        beforeEach('spy on database methods', () => {

            sinon.spy(database, 'listCollections');
        });

        it('should call listCollections method on database with expected input', () => {

            const name = 'some name';

            collector.getCollection(name);

            expect(database.listCollections.calledOnceWith({ name })).to.be.true;
        });
    });

    describe('collect()', () => {

        let fetchStub;
        const response = { data: 'some data' };

        beforeEach('stub/spy on collector methods', () => {

            fetchStub = sinon.stub(collector, 'fetch').resolves(response);
            sinon.spy(collector, 'store');
        });

        it('should call fetch() method once to fetch data from third-party APIs', () => {

            collector.collect();

            expect(collector.fetch.calledOnce).to.be.true;
        });


        it('should call store() method once with fetched data', done => {

            collector.collect().then(() => {

                expect(collector.store.calledOnceWith(response.data)).to.be.true;

            }).then(done, done);
        });

        afterEach('restore collector', () => {

            fetchStub.restore();
        });
    });
});