const fs = require("fs");

const nodeName = 'tplink_toggle';
const current = __dirname;

const helper = require("node-red-node-test-helper");
const tagetNode = require(`../../../dist/${nodeName}.js`);
const debugSettingFiles = `${current}/../../../data/tapoSettings.json`;


helper.init(require.resolve('node-red'), {
  // functionGlobalContext: { fs:require('fs') }
});

describe(`Node: ${nodeName}`, function () {

  let tapoAccountSettings = {};

  before(function (done) {
    // runs once before the first test in this block
    try {
      fs.readFile(debugSettingFiles, "utf-8", (err, data) => {
        if (err) throw err;
        tapoAccountSettings = JSON.parse(data);
        // console.log("tapoAccountSettings: ", tapoAccountSettings);
      });
    } catch (error) {
      console.log(error);
      done(error);
    }
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
      it('should result true of power(toggle)', function (done) {
        const flow = [
          {
            id: "n1",
            type: nodeName,
            name: "test name",
            email: tapoAccountSettings.email,
            password: tapoAccountSettings.password,
            deviceIp: tapoAccountSettings.deviceIp,
            deviceAlias: tapoAccountSettings.deviceAlias,
            deviceIpRange: tapoAccountSettings.deviceIpRange,
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

      it('should result true of power(toggle)', function (done) {
        const flow = [
          {
            id: "n1",
            type: nodeName,
            name: "test name",
            email: tapoAccountSettings.email,
            password: tapoAccountSettings.password,
            deviceIp: tapoAccountSettings.deviceIp,
            deviceAlias: tapoAccountSettings.deviceAlias,
            deviceIpRange: tapoAccountSettings.deviceIpRange,
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
            email: tapoAccountSettings.email,
            password: tapoAccountSettings.password,
            deviceIp: "192.168.0.999",
            deviceAlias: tapoAccountSettings.deviceAlias,
            deviceIpRange: tapoAccountSettings.deviceIpRange,
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
            password: tapoAccountSettings.password,
            deviceIp: tapoAccountSettings.deviceIp,
            deviceAlias: tapoAccountSettings.deviceAlias,
            deviceIpRange: tapoAccountSettings.deviceIpRange,
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
            email: tapoAccountSettings.email,
            password: "foo",
            deviceIp: tapoAccountSettings.deviceIp,
            deviceAlias: tapoAccountSettings.deviceAlias,
            deviceIpRange: tapoAccountSettings.deviceIpRange,
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
      it('should result true of power (toggle)', function (done) {
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
              email: tapoAccountSettings.email,
              password: tapoAccountSettings.password,
              deviceIp: tapoAccountSettings.deviceIp,
              deviceAlias: tapoAccountSettings.deviceAlias,
              deviceIpRange: tapoAccountSettings.deviceIpRange,
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
              email: tapoAccountSettings.email,
              password: tapoAccountSettings.password,
              deviceIp: "192.168.0.999",
              deviceAlias: tapoAccountSettings.deviceAlias,
              deviceIpRange: tapoAccountSettings.deviceIpRange,
              searchMode: "ip"
            }
          });
        });
      });

    });
  });

  describe("TestCase-003 condition => search mode: device alias, config: propert", function () {
    this.timeout(60000);

    describe("TestCase-003-01 standards", function () {
      it('should result true of power (toggle) no.1', function (done) {
        const flow = [
          {
            id: "n1",
            type: nodeName,
            name: "test name",
            email: tapoAccountSettings.email,
            password: tapoAccountSettings.password,
            deviceIp: "",
            deviceAlias: tapoAccountSettings.deviceAlias,
            deviceIpRange: tapoAccountSettings.deviceIpRange,
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

      it('should result true of power (toggle) no.2', function (done) {
        const flow = [
          {
            id: "n1",
            type: nodeName,
            name: "test name",
            email: tapoAccountSettings.email,
            password: tapoAccountSettings.password,
            deviceIp: "",
            deviceAlias: tapoAccountSettings.deviceAlias,
            deviceIpRange: "172.17.198.0/24",
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
              msg.payload.result.should.have.true();
              done();
            } catch (err) {
              done(err);
            }
          });
          n1.receive({ payload: {} });
        });
      });

      it('should result true of power (toggle) no.3', function (done) {
        const flow = [
          {
            id: "n1",
            type: nodeName,
            name: "test name",
            email: tapoAccountSettings.email,
            password: tapoAccountSettings.password,
            deviceIp: "",
            deviceAlias: tapoAccountSettings.deviceAlias,
            deviceIpRange: "foo",
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
      it('should call `error` with "Error: tapo device info not found." (invalid device alias)', function (done) {
        const flow = [
          {
            id: "n1",
            type: nodeName,
            name: "test name",
            email: tapoAccountSettings.email,
            password: tapoAccountSettings.password,
            deviceIp: "",
            deviceAlias: "foo",
            deviceIpRange: tapoAccountSettings.deviceIpRange,
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
              msg.payload.errorInf.message.should.have.equal('tapo device info not found.');
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

  describe("TestCase-004 condition => search mode: device alias, config: msg.payload", function () {
    this.timeout(60000);

    describe("TestCase-004-01 standards", function () {
      it('should result true of power (toggle)', function (done) {
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
              email: tapoAccountSettings.email,
              password: tapoAccountSettings.password,
              deviceIp: tapoAccountSettings.deviceIp,
              deviceAlias: tapoAccountSettings.deviceAlias,
              deviceIpRange: tapoAccountSettings.deviceIpRange,
              searchMode: "ip"
            }
          });
        });
      });

      it('should result true of power (toggle) no.1', function (done) {
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
              email: tapoAccountSettings.email,
              password: tapoAccountSettings.password,
              deviceAlias: tapoAccountSettings.deviceAlias,
              deviceIpRange: tapoAccountSettings.deviceIpRange,
              searchMode: "alias"
            }
          });
        });
      });

      it('should result true of power (toggle) no.2', function (done) {
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
              msg.payload.result.should.have.true();
              done();
            } catch (err) {
              done(err);
            }
          });
          n1.receive({
            payload: {
              email: tapoAccountSettings.email,
              password: tapoAccountSettings.password,
              deviceAlias: tapoAccountSettings.deviceAlias,
              deviceIpRange: "172.17.198.0/24",
              searchMode: "alias"
            }
          });
        });
      });

      it('should result true of power (toggle) no.3', function (done) {
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
              msg.payload.result.should.have.true();
              done();
            } catch (err) {
              done(err);
            }
          });
          n1.receive({
            payload: {
              email: tapoAccountSettings.email,
              password: tapoAccountSettings.password,
              deviceAlias: tapoAccountSettings.deviceAlias,
              deviceIpRange: "bar",
              searchMode: "alias"
            }
          });
        });
      });
    });

    describe("TestCase-004-02 errors", function () {
      it('should call `error` with "Error: tapo device info not found." (invalid device alias)', function (done) {
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
              msg.payload.errorInf.message.should.have.equal('tapo device info not found.');
              done();
            } catch (err) {
              done(err);
            }
          });
          n1.receive({
            payload: {
              email: tapoAccountSettings.email,
              password: tapoAccountSettings.password,
              deviceAlias: "foo",
              deviceIpRange: tapoAccountSettings.deviceIpRange,
              searchMode: "alias"
            }
          });
        });
      });

    });
  });

});