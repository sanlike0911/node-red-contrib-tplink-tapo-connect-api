const nodeName = 'tplink_turn_on';
const helper = require("node-red-node-test-helper");
const tagetNode = require(`../../../dist/${nodeName}.js`);

require('dotenv').config();

// tapo settings
const tapoSettings = {
  email: string = process.env.TAPO_USERNAME              || "email@gmail.com",
  password: string = process.env.TAPO_PASSWORD           || "password",
  deviceIp: string = process.env.TAPO_IPADDRESS          || "192.168.0.100",
  deviceAlias: string = process.env.TAPO_TARGET_ALIAS    || "alias",
  deviceRangeOfIp: string = process.env.TAPO_RANGE_OF_IP || "192.168.0.0/24",
  mode: string = process.env.TAPO_MODE                   || "command",
  searchMode: string = process.env.TAPO_SEARCH_MODE      || "ip" 
}

helper.init(require.resolve('node-red'), {
  // functionGlobalContext: { fs:require('fs') }
});

describe(`Node: ${nodeName}`, function () {

  before(function (done) {
    // runs once before the first test in this block
    helper.startServer(done);
  });

  after(function (done) {
    // runs once after the last test in this block
    helper.stopServer(done);
  });

  beforeEach(function () {
    // runs before each test in this block
  });

  afterEach(function () {
    // runs after each test in this block
    helper.unload();
  });

  describe("TestCase-000 property: name", function () {
    this.timeout(1000);

    it('should be loaded', function (done) {
      var flow = [{ id: "n1", type: nodeName, name: "test name" }];
      helper.load(tagetNode, flow, function () {
        var n1 = helper.getNode("n1");
        try {
          n1.should.have.property('name', 'test name');
          done();
        } catch (err) {
          done(err);
        }
      });
    });
  });

  describe("TestCase-001 condition => search mode: device IP, config: property", function () {
    this.timeout(5000);

    describe("TestCase-001-01 standards", function () {
      it('should result true of power(unknow=>on)', function (done) {
        const flow = [
          {
            id: "n1",
            type: nodeName,
            name: "test name",
            email: tapoSettings.email,
            password: tapoSettings.password,
            deviceIp: tapoSettings.deviceIp,
            deviceAlias: tapoSettings.deviceAlias,
            deviceRangeOfIp: tapoSettings.deviceRangeOfIp,
            searchMode: "ip",
            wires: [["n2"]]
          },
          { id: "n2", type: "helper" }
        ];
        helper.load(tagetNode, flow, function () {
          const n1 = helper.getNode("n1");
          const n2 = helper.getNode("n2");
          n2.on("input", function (msg) {
            try {
              msg.payload.result.should.have.true();
              done();
            } catch (err) {
              done(err);
            }
          });
          n1.receive({ payload: {} });
        });
      });
    });

    describe("TestCase-001-02 errors", function () {
      it('should call `error` with "Error: getaddrinfo ENOTFOUND 192.168.0.999"', function (done) {
        const flow = [
          {
            id: "n1",
            type: nodeName,
            name: "test name",
            email: tapoSettings.email,
            password: tapoSettings.password,
            deviceIp: "192.168.0.999",
            deviceAlias: tapoSettings.deviceAlias,
            deviceRangeOfIp: tapoSettings.deviceRangeOfIp,
            searchMode: "ip",
            wires: [["n2"]]
          },
          { id: "n2", type: "helper" }
        ];
        helper.load(tagetNode, flow, function () {
          const n1 = helper.getNode("n1");
          const n2 = helper.getNode("n2");
          n2.on("input", (msg) => {
            try {
              msg.payload.result.should.have.not.true();
              msg.payload.errorInf.message.should.have.equal('getaddrinfo ENOTFOUND 192.168.0.999');
              done();
            } catch (err) {
              done(err);
            }
          });
          n1.receive({ payload: {} });
        });
      });

      it('should call `error` with "Error: Invalid request or credentials" case:config: property, node.error(invalid email)', function (done) {
        const flow = [
          {
            id: "n1",
            type: nodeName,
            name: "test name",
            email: "foo",
            password: tapoSettings.password,
            deviceIp: tapoSettings.deviceIp,
            deviceAlias: tapoSettings.deviceAlias,
            deviceRangeOfIp: tapoSettings.deviceRangeOfIp,
            searchMode: "ip",
            wires: [["n2"]]
          },
          { id: "n2", type: "helper" }
        ];
        helper.load(tagetNode, flow, function () {
          const n1 = helper.getNode("n1");
          const n2 = helper.getNode("n2");
          n2.on("input", (msg) => {
            try {
              msg.payload.result.should.have.not.true();
              msg.payload.errorInf.message.should.have.equal('Invalid request or credentials');
              done();
            } catch (err) {
              done(err);
            }
          });
          n1.receive({ payload: {} });
        });
      });

      it('should call `error` with "Error: Invalid request or credentials" case:config: property, node.error(invalid password)', function (done) {
        const flow = [
          {
            id: "n1",
            type: nodeName,
            name: "test name",
            email: tapoSettings.email,
            password: "foo",
            deviceIp: tapoSettings.deviceIp,
            deviceAlias: tapoSettings.deviceAlias,
            deviceRangeOfIp: tapoSettings.deviceRangeOfIp,
            searchMode: "ip",
            wires: [["n2"]]
          },
          { id: "n2", type: "helper" }
        ];
        helper.load(tagetNode, flow, function () {
          const n1 = helper.getNode("n1");
          const n2 = helper.getNode("n2");
          n2.on("input", (msg) => {
            try {
              msg.payload.result.should.have.not.true();
              msg.payload.errorInf.message.should.have.equal('Invalid request or credentials');
              done();
            } catch (err) {
              done(err);
            }
          });
          n1.receive({ payload: {} });
        });
      });

    });
  });

  describe("TestCase-002 condition => search mode: device IP, config: msg.payload", function () {
    this.timeout(5000);

    describe("TestCase-002-01 standards", function () {
      it('should result true of power (on=>on)', function (done) {
        const flow = [
          {
            id: "n1",
            type: nodeName,
            email: "dummy",
            password: "dummy",
            deviceIp: "dummy",
            deviceAlias: "dummy",
            wires: [["n2"]]
          },
          { id: "n2", type: "helper" }
        ];
        helper.load(tagetNode, flow, function () {
          const n1 = helper.getNode("n1");
          const n2 = helper.getNode("n2");
          n2.on("input", function (msg) {
            try {
              msg.payload.result.should.have.true();
              done();
            } catch (err) {
              done(err);
            }
          });
          n1.receive({
            payload: {
              email: tapoSettings.email,
              password: tapoSettings.password,
              deviceIp: tapoSettings.deviceIp,
              deviceAlias: tapoSettings.deviceAlias,
              deviceRangeOfIp: tapoSettings.deviceRangeOfIp,
              searchMode: "ip"
            }
          });
        });
      });
    });

    describe("TestCase-002-02 errors", function () {
      it('should call `error` with "Error: getaddrinfo ENOTFOUND 192.168.0.999"', function (done) {
        const flow = [
          {
            id: "n1",
            type: nodeName,
            email: "dummy",
            password: "dummy",
            deviceIp: "dummy",
            deviceAlias: "dummy",
            wires: [["n2"]]
          },
          { id: "n2", type: "helper" }
        ];
        helper.load(tagetNode, flow, function () {
          const n1 = helper.getNode("n1");
          const n2 = helper.getNode("n2");
          n2.on("input", (msg) => {
            try {
              msg.payload.result.should.have.not.true();
              msg.payload.errorInf.message.should.have.equal('getaddrinfo ENOTFOUND 192.168.0.999');
              done();
            } catch (err) {
              done(err);
            }
          });
          n1.receive({
            payload: {
              email: tapoSettings.email,
              password: tapoSettings.password,
              deviceIp: "192.168.0.999",
              deviceAlias: tapoSettings.deviceAlias,
              deviceRangeOfIp: tapoSettings.deviceRangeOfIp,
              searchMode: "ip"
            }
          });
        });
      });

    });
  });

  describe("TestCase-003 condition => search mode: device alias, config: propert", function () {
    this.timeout(10000);

    describe("TestCase-003-01 standards", function () {
      it('should result true of power (on=>on)', function (done) {
        const flow = [
          {
            id: "n1",
            type: nodeName,
            name: "test name",
            email: tapoSettings.email,
            password: tapoSettings.password,
            deviceIp: "",
            deviceAlias: tapoSettings.deviceAlias,
            deviceRangeOfIp: tapoSettings.deviceRangeOfIp,
            searchMode: "alias",
            wires: [["n2"]]
          },
          { id: "n2", type: "helper" }
        ];
        helper.load(tagetNode, flow, function () {
          const n1 = helper.getNode("n1");
          const n2 = helper.getNode("n2");
          n2.on("input", function (msg) {
            try {
              msg.payload.result.should.have.true();
              done();
            } catch (err) {
              done(err);
            }
          });
          n1.receive({ payload: {} });
        });
      });
    });

    describe("TestCase-003-02 errors", function () {
      it('should call `error` with "Error: Failed to get tapo ip address." (invalid device alias)', function (done) {
        const flow = [
          {
            id: "n1",
            type: nodeName,
            name: "test name",
            email: "dummy",
            password: "dummy",
            deviceIp: "dummy",
            deviceAlias: "dummy",
            wires: [["n2"]]
          },
          { id: "n2", type: "helper" }
        ];
        helper.load(tagetNode, flow, function () {
          const n1 = helper.getNode("n1");
          const n2 = helper.getNode("n2");
          n2.on("input", (msg) => {
            try {
              msg.payload.result.should.have.not.true();
              msg.payload.errorInf.message.should.have.equal('Failed to get tapo ip address.');
              done();
            } catch (err) {
              done(err);
            }
          });
          n1.receive({
            payload: {
              email: tapoSettings.email,
              password: tapoSettings.password,
              deviceAlias: "foo",
              deviceRangeOfIp: tapoSettings.deviceRangeOfIp,
              searchMode: "alias"
            }
          });
        });
      });

      it('should call `error` with "Error: Failed to get tapo ip address." (out of device ip range)', function (done) {
        const flow = [
          {
            id: "n1",
            type: nodeName,
            name: "test name",
            email: "dummy",
            password: "dummy",
            deviceIp: "dummy",
            deviceAlias: "dummy",
            wires: [["n2"]]
          },
          { id: "n2", type: "helper" }
        ];
        helper.load(tagetNode, flow, function () {
          const n1 = helper.getNode("n1");
          const n2 = helper.getNode("n2");
          n2.on("input", (msg) => {
            try {
              msg.payload.result.should.have.not.true();
              msg.payload.errorInf.message.should.have.equal('Failed to get tapo ip address.');
              done();
            } catch (err) {
              done(err);
            }
          });
          n1.receive({
            payload: {
              email: tapoSettings.email,
              password: tapoSettings.password,
              deviceAlias: tapoSettings.deviceAlias,
              deviceRangeOfIp: "172.17.198.0/24",
              searchMode: "alias"
            }
          });
        });
      });

    });
  });

  describe("TestCase-004 condition => search mode: device alias, config: msg.payload", function () {
    this.timeout(10000);

    describe("TestCase-004-01 standards", function () {
      it('should result true of power (on=>on)', function (done) {
        const flow = [
          {
            id: "n1",
            type: nodeName,
            name: "test name",
            email: "dummy",
            password: "dummy",
            deviceIp: "dummy",
            deviceAlias: "dummy",
            wires: [["n2"]]
          },
          { id: "n2", type: "helper" }
        ];
        helper.load(tagetNode, flow, function () {
          const n1 = helper.getNode("n1");
          const n2 = helper.getNode("n2");
          n2.on("input", function (msg) {
            try {
              msg.payload.result.should.have.true();
              done();
            } catch (err) {
              done(err);
            }
          });
          n1.receive({
            payload: {
              email: tapoSettings.email,
              password: tapoSettings.password,
              deviceAlias: tapoSettings.deviceAlias,
              deviceRangeOfIp: tapoSettings.deviceRangeOfIp,
              searchMode: "alias"
            }
          });
        });
      });
    });

    describe("TestCase-004-02 errors", function () {
      it('should call `error` with "Error: Failed to get tapo ip address." (invalid device alias)', function (done) {
        const flow = [
          {
            id: "n1",
            type: nodeName,
            name: "test name",
            email: tapoSettings.email,
            password: tapoSettings.password,
            deviceIp: "",
            deviceAlias: "foo",
            deviceRangeOfIp: tapoSettings.deviceRangeOfIp,
            searchMode: "alias",
            wires: [["n2"]]
          },
          { id: "n2", type: "helper" }
        ];
        helper.load(tagetNode, flow, function () {
          const n1 = helper.getNode("n1");
          const n2 = helper.getNode("n2");
          n2.on("input", (msg) => {
            try {
              msg.payload.result.should.have.not.true();
              msg.payload.errorInf.message.should.have.equal('Failed to get tapo ip address.');
              done();
            } catch (err) {
              done(err);
            }
          });
          n1.receive({ payload: {} });
        });
      });

      it('should call `error` with "Error: Failed to get tapo ip address." (out of device ip range)', function (done) {
        const flow = [
          {
            id: "n1",
            type: nodeName,
            name: "test name",
            email: tapoSettings.email,
            password: tapoSettings.password,
            deviceIp: "",
            deviceAlias: tapoSettings.deviceAlias,
            deviceRangeOfIp: "172.17.198.0/24",
            searchMode: "alias",
            wires: [["n2"]]
          },
          { id: "n2", type: "helper" }
        ];
        helper.load(tagetNode, flow, function () {
          const n1 = helper.getNode("n1");
          const n2 = helper.getNode("n2");
          n2.on("input", (msg) => {
            try {
              msg.payload.result.should.have.not.true();
              msg.payload.errorInf.message.should.have.equal('Failed to get tapo ip address.');
              done();
            } catch (err) {
              done(err);
            }
          });
          n1.receive({ payload: {} });
        });
      });

    });
  });
});