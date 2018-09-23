var chai = require('chai')
  , expect = chai.expect
  , should = chai.should();

var chaiHttp = require('chai-http');
var server = require('../index').server;
var app = require('../index').app;

chai.use(chaiHttp);

describe('matching engine', function() {


  it('should return /book', function(done) {
    chai.request(server)
      .get('/book')
      .end(function(err, res){
        expect(res).to.have.status(200);
        res.body.should.have.property('buys')
        res.body.should.have.property('sells')
        console.log("book")
        console.log(res.body)
        done();
      });
  });

  it('should post a sell order', async function() {
    console.log("sell")
    console.log({"qty":10,"prc":15})
    await chai.request(server)
      .post('/sell')
      .send({"qty":10,"prc":15});
    console.log("sell")
    console.log({"qty":10,"prc":13})
    await chai.request(server)
      .post('/sell')
      .send({"qty":10,"prc":13});


    let res = await chai.request(server)
      .get('/book')
    console.log("book")
    console.log(res.body)

    expect(res).to.have.status(200);
    res.body.sells[0]['qty'].should.equal(10)
    res.body.sells[0]['prc'].should.equal(13)
    res.body.sells[1]['qty'].should.equal(10)
    res.body.sells[1]['prc'].should.equal(15)
  });

  it('should post a buy order', async function() {
    console.log("buy")
    console.log({"qty":10,"prc":7})
    await chai.request(server)
      .post('/buy')
      .send({"qty":10,"prc":7});
    console.log("buy")
    console.log({"qty":10,"prc":9.5})
    await chai.request(server)
      .post('/buy')
      .send({"qty":10,"prc":9.5});

    let res = await chai.request(server)
      .get('/book')
    console.log("book")
    console.log(res.body)

    expect(res).to.have.status(200);
    res.body.buys[0]['qty'].should.equal(10)
    res.body.buys[0]['prc'].should.equal(9.5)
    res.body.buys[1]['qty'].should.equal(10)
    res.body.buys[1]['prc'].should.equal(7)
  });


  it('should match a sell order', async function() {
    console.log("sell")
    console.log({"qty":5,"prc":9.5})
    await chai.request(server)
      .post('/sell')
      .send({"qty":5, "prc":9.5});

    let res = await chai.request(server)
      .get('/book')
    console.log("book")
    console.log(res.body)

    expect(res).to.have.status(200);
    res.body.buys[0]['qty'].should.equal(5)
    res.body.buys[0]['prc'].should.equal(9.5)
    res.body.buys[1]['qty'].should.equal(10)
    res.body.buys[1]['prc'].should.equal(7)
  });

  it('should match a buy order', async function() {
    console.log("buy")
    console.log({"qty":6,"prc":13})
    await chai.request(server)
      .post('/buy')
      .send({"qty":6, "prc":13});

    let res = await chai.request(server)
      .get('/book')
    console.log("book")
    console.log(res.body)

    expect(res).to.have.status(200);
    res.body.sells[0]['qty'].should.equal(4)
    res.body.sells[0]['prc'].should.equal(13)
    res.body.sells[1]['qty'].should.equal(10)
    res.body.sells[1]['prc'].should.equal(15)
  });

  it('should match a sell order with multiple buy orders', async function() {
    console.log("sell")
    console.log({"qty":7,"prc":7})
    await chai.request(server)
      .post('/sell')
      .send({"qty":7, "prc":7});

    let res = await chai.request(server)
      .get('/book')
    console.log("book")
    console.log(res.body)

    expect(res).to.have.status(200);
    res.body.buys[0]['qty'].should.equal(8)
    res.body.buys[0]['prc'].should.equal(7)
  });

  it('should match a sell order with a buy order and add a sell order', async function() {
    console.log("sell")
    console.log({"qty":12,"prc":6})
    await chai.request(server)
      .post('/sell')
      .send({"qty":12, "prc":6});

    let res = await chai.request(server)
      .get('/book')
    console.log("book")
    console.log(res.body)

    expect(res).to.have.status(200);
    res.body.buys.should.have.lengthOf(0)
    res.body.sells[0]['qty'].should.equal(4)
    res.body.sells[0]['prc'].should.equal(6)
    res.body.sells[1]['qty'].should.equal(4)
    res.body.sells[1]['prc'].should.equal(13)
    res.body.sells[2]['qty'].should.equal(10)
    res.body.sells[2]['prc'].should.equal(15)
  });
});
