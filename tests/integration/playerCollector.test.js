process.env.NODE_ENV = 'testing';
global.config = require('config');

const expect = require('chai').expect;
const sinon = require('sinon');
const axios = require('axios');
const connection = require('mongoose_model').connection;
const PlayerCollector = require('../../collectors/playerCollector');

context('player collector integration test', () => {

    let collector;
    let axiosGetStub;

    before('establish connection to database', done => {

        connection.on('error', () => console.log(error));

        connection.once('open', () => {

            collector = new PlayerCollector(connection.db);
            axiosGetStub = sinon.stub(axios, 'get');

            done();
        });
    });

    describe('collect()', () => {

        it('should fetch records and save valid records into database', done => {

            const data = [{ ID: '1' }, { ID: '2' }];
            axiosGetStub.resolves({ data });

            collector.collect().then(response => {

                expect(response.saved.length).to.equal(data.length);
                expect(response.failed).to.equal(0);

            }).then(done, done);
        });

        it('should not save invalid records', done => {

            const data = [{ ID: 'invalid id' }, { ID: 'another invalid id' }];
            axiosGetStub.resolves({ data });

            collector.collect().then(response => {

                expect(response.saved.length).to.equal(0);
                expect(response.failed).to.equal(data.length);

            }).then(done, done);
        });
    });

    after('cleanup environment and close database connection', () => {

        axiosGetStub.restore();

        connection.db.dropDatabase(() => {

            connection.close();
        });
    });
});