const helper = require("node-red-node-test-helper");
const tagetNode = require("../../../dist/tplink_tapo_connect_api.js");

const current = __dirname;
const fs = require("fs");

helper.init(require.resolve('node-red'), { 
  // functionGlobalContext: { fs:require('fs') }
});

describe("tplink_tapo_connect_api Node", function () {

  let tapoAccountSettings = {};

  before(function(done) {
    // runs once before the first test in this block
    try {
      fs.readFile(`${current}/../../../data/tapoSettings.json`, "utf-8", (err, data) => {
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

  after(function(done) {
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

  it('should be loaded', function (done) {
    var flow = [{ id: "n1", type: "tplink_tapo_connect_api", name: "test name" }];
    helper.load(tagetNode, flow, function () {
      var n1 = helper.getNode("n1");
      try {
        n1.should.have.property('name', 'test name');
        done();
      } catch(err) {
        done(err);
      }
    });
  });

  describe("Search mode: device IP", function () {

    it('should result true of command 1(power on) case:Search mode: device IP', function (done) {
      this.timeout(5000);
      const flow = [
        {
          id: "n1",
          type: "tplink_tapo_connect_api",
          name: "test name",
          email: tapoAccountSettings.email,
          password: tapoAccountSettings.password,
          deviceIp: tapoAccountSettings.deviceIp,
          deviceAlias: tapoAccountSettings.deviceAlias,
          deviceIpRange: tapoAccountSettings.deviceIpRange,
          mode: tapoAccountSettings.mode,
          wires:[["n2"]] 
        },
        { id: "n2", type: "helper" }
      ];
      helper.load(tagetNode, flow, function () {
        const n1 = helper.getNode("n1");
        const n2 = helper.getNode("n2");
        n2.on("input", function (msg) {
          try {
            msg.payload.result.should.have.true(); /* msg.payload.result === true */
            done();
          } catch(err) {
            done(err);
          }
        });
        n1.receive({ payload: 1 });
      });
    });
  
    it('should result true of command 0(power off) case:Search mode: device IP', function (done) {
      this.timeout(5000);
      const flow = [
        {
          id: "n1",
          type: "tplink_tapo_connect_api",
          name: "test name",
          email: tapoAccountSettings.email,
          password: tapoAccountSettings.password,
          deviceIp: tapoAccountSettings.deviceIp,
          deviceAlias: tapoAccountSettings.deviceAlias,
          deviceIpRange: tapoAccountSettings.deviceIpRange,
          mode: tapoAccountSettings.mode,
          wires:[["n2"]] 
        },
        { id: "n2", type: "helper" }
      ];
      helper.load(tagetNode, flow, function () {
        const n1 = helper.getNode("n1");
        const n2 = helper.getNode("n2");
        n2.on("input", function (msg) {
          try {
            msg.payload.result.should.have.true(); /* msg.payload.result === true */
            done();
          } catch(err) {
            done(err);
          }
        });
        n1.receive({ payload: 0});
      });
    });

    it('should result true of toggle(off=>on) case:Search mode: device IP', function (done) {
      this.timeout(5000);
      const flow = [
        {
          id: "n1",
          type: "tplink_tapo_connect_api",
          name: "test name",
          email: tapoAccountSettings.email,
          password: tapoAccountSettings.password,
          deviceIp: tapoAccountSettings.deviceIp,
          deviceAlias: tapoAccountSettings.deviceAlias,
          deviceIpRange: tapoAccountSettings.deviceIpRange,
          mode: "toggle",
          wires:[["n2"]] 
        },
        { id: "n2", type: "helper" }
      ];
      helper.load(tagetNode, flow, function () {
        const n1 = helper.getNode("n1");
        const n2 = helper.getNode("n2");
        n2.on("input", function (msg) {
          try {
            msg.payload.result.should.have.true(); /* msg.payload.result === true */
            done();
          } catch(err) {
            done(err);
          }
        });
        n1.receive({ payload: 1});
      });
    });

    it('should result true of toggle(on=>off) case:Search mode: device IP', function (done) {
      this.timeout(5000);
      const flow = [
        {
          id: "n1",
          type: "tplink_tapo_connect_api",
          name: "test name",
          email: tapoAccountSettings.email,
          password: tapoAccountSettings.password,
          deviceIp: tapoAccountSettings.deviceIp,
          deviceAlias: tapoAccountSettings.deviceAlias,
          deviceIpRange: tapoAccountSettings.deviceIpRange,
          mode: "toggle",
          wires:[["n2"]] 
        },
        { id: "n2", type: "helper" }
      ];
      helper.load(tagetNode, flow, function () {
        const n1 = helper.getNode("n1");
        const n2 = helper.getNode("n2");
        n2.on("input", function (msg) {
          try {
            msg.payload.result.should.have.true(); /* msg.payload.result === true */
            done();
          } catch(err) {
            done(err);
          }
        });
        n1.receive({ payload: 1});
      });
    });

    it('should result true and device infomatiuon of command 255(status) case:Search mode: device IP', function (done) {
      this.timeout(5000);
      const flow = [
        {
          id: "n1",
          type: "tplink_tapo_connect_api",
          name: "test name",
          email: tapoAccountSettings.email,
          password: tapoAccountSettings.password,
          deviceIp: tapoAccountSettings.deviceIp,
          deviceAlias: tapoAccountSettings.deviceAlias,
          deviceIpRange: tapoAccountSettings.deviceIpRange,
          mode: tapoAccountSettings.mode,
          wires:[["n2"]] 
        },
        { id: "n2", type: "helper" }
      ];
      helper.load(tagetNode, flow, function () {
        const n1 = helper.getNode("n1");
        const n2 = helper.getNode("n2");
        n2.on("input", function (msg) {
          try {
            msg.payload.result.should.have.true(); /* msg.payload.result === true */
            msg.payload.should.have.ownProperty("tapoDeviceInfo");  /* msg.payload.hasOwnProperty('tapoDeviceInfo') */
            done();
          } catch(err) {
            done(err);
          }
        });
        n1.receive({ payload: 255 });
      });
    });

    describe("test case: error", function () {

      it('should call `error` with "Error: command not found." case:Search mode: device IP, node.error, command:2', function (done) {
        this.timeout(5000);
        const command = 2;
        const flow = [
          {
            id: "n1",
            type: "tplink_tapo_connect_api",
            name: "test name",
            email: tapoAccountSettings.email,
            password: tapoAccountSettings.password,
            deviceIp: tapoAccountSettings.deviceIp,
            deviceAlias: tapoAccountSettings.deviceAlias,
            deviceIpRange: tapoAccountSettings.deviceIpRange,
            mode: tapoAccountSettings.mode
          }
        ];
        helper.load(tagetNode, flow, function () {
          const n1 = helper.getNode("n1");
          n1.on("input", (msg) => {
            try {
              msg.payload.result.should.have.not.true();  /* msg.payload.result !== true */
              msg.payload.errorInf.message.should.have.equal('command not found.');            
              n1.error.should.be.calledWithExactly(msg.payload.errorInf);
              done();
            } catch(err) {
              done(err);
            }
          });
          n1.receive({ payload: command });
        });
      });

      it('should call `error` with "Error: getaddrinfo ENOTFOUND 192.168.0.999" case:Search mode: device IP, node.error, command:0(out of ip address)', function (done) {
        this.timeout(5000);
        const command = 0;
        const flow = [
          {
            id: "n1",
            type: "tplink_tapo_connect_api",
            name: "test name",
            email: tapoAccountSettings.email,
            password: tapoAccountSettings.password,
            deviceIp: "192.168.0.999",
            deviceAlias: tapoAccountSettings.deviceAlias,
            deviceIpRange: tapoAccountSettings.deviceIpRange,
            mode: tapoAccountSettings.mode,
            wires:[["n2"]]
          },
          { id: "n2", type: "helper" }
        ];
        helper.load(tagetNode, flow, function () {
          const n1 = helper.getNode("n1");
          const n2 = helper.getNode("n2");
          n2.on("input", (msg) => {
            try {
              msg.payload.result.should.have.not.true(); /* msg.payload.result !== true */
              msg.payload.errorInf.message.should.have.equal('getaddrinfo ENOTFOUND 192.168.0.999');
              done();
            } catch(err) {
              done(err);
            }
          });
          n1.receive({ payload: command });
        });
      });

      it('should call `error` with "Error: Invalid request or credentials" case:Search mode: device IP, node.error, command:0(invalid email)', function (done) {
        this.timeout(5000);
        const command = 0;
        const flow = [
          {
            id: "n1",
            type: "tplink_tapo_connect_api",
            name: "test name",
            email: "foo",
            password: tapoAccountSettings.password,
            deviceIp: tapoAccountSettings.deviceIp,
            deviceAlias: tapoAccountSettings.deviceAlias,
            deviceIpRange: tapoAccountSettings.deviceIpRange,
            mode: tapoAccountSettings.mode,
            wires:[["n2"]]
          },
          { id: "n2", type: "helper" }
        ];
        helper.load(tagetNode, flow, function () {
          const n1 = helper.getNode("n1");
          const n2 = helper.getNode("n2");
          n2.on("input", (msg) => {
            try {
              msg.payload.result.should.have.not.true(); /* msg.payload.result !== true */
              msg.payload.errorInf.message.should.have.equal('Invalid request or credentials');
              done();
            } catch(err) {
              done(err);
            }
          });
          n1.receive({ payload: command });
        });
      });

      it('should call `error` with "Error: Invalid request or credentials" case:Search mode: device IP, node.error, command:0(invalid password)', function (done) {
        this.timeout(5000);
        const command = 0;
        const flow = [
          {
            id: "n1",
            type: "tplink_tapo_connect_api",
            name: "test name",
            email: tapoAccountSettings.email,
            password: "foo",
            deviceIp: tapoAccountSettings.deviceIp,
            deviceAlias: tapoAccountSettings.deviceAlias,
            deviceIpRange: tapoAccountSettings.deviceIpRange,
            mode: tapoAccountSettings.mode,
            wires:[["n2"]]
          },
          { id: "n2", type: "helper" }
        ];
        helper.load(tagetNode, flow, function () {
          const n1 = helper.getNode("n1");
          const n2 = helper.getNode("n2");
          n2.on("input", (msg) => {
            try {
              msg.payload.result.should.have.not.true(); /* msg.payload.result !== true */
              msg.payload.errorInf.message.should.have.equal('Invalid request or credentials');
              done();
            } catch(err) {
              done(err);
            }
          });
          n1.receive({ payload: command });
        });
      });

    });
  });

  describe("Search mode: device alias", function () {

    it('should result true of command 1(power on) *Search mode: device alias*', function (done) {
      this.timeout(10000);
      const flow = [
        {
          id: "n1",
          type: "tplink_tapo_connect_api",
          name: "test name",
          email: tapoAccountSettings.email,
          password: tapoAccountSettings.password,
          deviceIp: "",
          deviceAlias: tapoAccountSettings.deviceAlias,
          deviceIpRange: tapoAccountSettings.deviceIpRange,
          mode: tapoAccountSettings.mode,
          wires:[["n2"]] 
        },
        { id: "n2", type: "helper" }
      ];
      helper.load(tagetNode, flow, function () {
        const n1 = helper.getNode("n1");
        const n2 = helper.getNode("n2");
        n2.on("input", function (msg) {
          try {
            msg.payload.result.should.have.true(); /* msg.payload.result === true */
            done();
          } catch(err) {
            done(err);
          }
        });
        n1.receive({ payload: 1});
      });
    });
  
    it('should result true of command 0(power off) *Search mode: device alias*', function (done) {
      this.timeout(10000);
      const flow = [
        {
          id: "n1",
          type: "tplink_tapo_connect_api",
          name: "test name",
          email: tapoAccountSettings.email,
          password: tapoAccountSettings.password,
          deviceIp: "",
          deviceAlias: tapoAccountSettings.deviceAlias,
          deviceIpRange: tapoAccountSettings.deviceIpRange,
          mode: tapoAccountSettings.mode,
          wires:[["n2"]] 
        },
        { id: "n2", type: "helper" }
      ];
      helper.load(tagetNode, flow, function () {
        const n1 = helper.getNode("n1");
        const n2 = helper.getNode("n2");
        n2.on("input", function (msg) {
          try {
            msg.payload.result.should.have.true(); /* msg.payload.result === true */
            done();
          } catch(err) {
            done(err);
          }
        });
        n1.receive({ payload: 0});
      });
    });

    it('should result true of toggle(off=>on) *Search mode: device alias*', function (done) {
      this.timeout(20000);
      const flow = [
        {
          id: "n1",
          type: "tplink_tapo_connect_api",
          name: "test name",
          email: tapoAccountSettings.email,
          password: tapoAccountSettings.password,
          deviceIp: "",
          deviceAlias: tapoAccountSettings.deviceAlias,
          deviceIpRange: tapoAccountSettings.deviceIpRange,
          mode: "toggle",
          wires:[["n2"]] 
        },
        { id: "n2", type: "helper" }
      ];
      helper.load(tagetNode, flow, function () {
        const n1 = helper.getNode("n1");
        const n2 = helper.getNode("n2");
        n2.on("input", function (msg) {
          try {
            msg.payload.result.should.have.true(); /* msg.payload.result === true */
            done();
          } catch(err) {
            done(err);
          }
        });
        n1.receive({ payload: 1});
      });
    });

    it('should result true of toggle(on=>off) *Search mode: device alias*', function (done) {
      this.timeout(20000);
      const flow = [
        {
          id: "n1",
          type: "tplink_tapo_connect_api",
          name: "test name",
          email: tapoAccountSettings.email,
          password: tapoAccountSettings.password,
          deviceIp: "",
          deviceAlias: tapoAccountSettings.deviceAlias,
          deviceIpRange: tapoAccountSettings.deviceIpRange,
          mode: "toggle",
          wires:[["n2"]] 
        },
        { id: "n2", type: "helper" }
      ];
      helper.load(tagetNode, flow, function () {
        const n1 = helper.getNode("n1");
        const n2 = helper.getNode("n2");
        n2.on("input", function (msg) {
          try {
            msg.payload.result.should.have.true(); /* msg.payload.result === true */
            done();
          } catch(err) {
            done(err);
          }
        });
        n1.receive({ payload: 1});
      });
    });

    it('should result true and device infomatiuon of command 255(status) *Search mode: device alias*', function (done) {
      this.timeout(10000);
      const flow = [
        {
          id: "n1",
          type: "tplink_tapo_connect_api",
          name: "test name",
          email: tapoAccountSettings.email,
          password: tapoAccountSettings.password,
          deviceIp: "",
          deviceAlias: tapoAccountSettings.deviceAlias,
          deviceIpRange: tapoAccountSettings.deviceIpRange,
          mode: tapoAccountSettings.mode,
          wires:[["n2"]] 
        },
        { id: "n2", type: "helper" }
      ];
      helper.load(tagetNode, flow, function () {
        const n1 = helper.getNode("n1");
        const n2 = helper.getNode("n2");
        n2.on("input", function (msg) {
          try {
            msg.payload.result.should.have.true(); /* msg.payload.result === true */
            msg.payload.should.have.ownProperty("tapoDeviceInfo");  /* msg.payload.hasOwnProperty('tapoDeviceInfo') */
            done();
          } catch(err) {
            done(err);
          }
        });
        n1.receive({ payload: 255});
      });
    });

    describe("test case: error", function () {

      it('should call `error` with "Error: command not found." case:Search mode: device alias, node.error, command:2', function (done) {
        this.timeout(5000);
        const command = 2;
        const flow = [
          {
            id: "n1",
            type: "tplink_tapo_connect_api",
            name: "test name",
            email: tapoAccountSettings.email,
            password: tapoAccountSettings.password,
            deviceIp: "",
            deviceAlias: tapoAccountSettings.deviceAlias,
            deviceIpRange: tapoAccountSettings.deviceIpRange,
            mode: tapoAccountSettings.mode
          }
        ];
        helper.load(tagetNode, flow, function () {
          const n1 = helper.getNode("n1");
          n1.on("input", (msg) => {
            try {
              msg.payload.result.should.have.not.true();  /* msg.payload.result !== true */
              msg.payload.errorInf.message.should.have.equal('command not found.');            
              n1.error.should.be.calledWithExactly(msg.payload.errorInf);
              done();
            } catch(err) {
              done(err);
            }
          });
          n1.receive({ payload: command });
        });
      });
  
      it('should call `error` with "Error: command not found." case:Search mode: device alias, node.error, command:256', function (done) {
        this.timeout(5000);
        const command = 256;
        const flow = [
          {
            id: "n1",
            type: "tplink_tapo_connect_api",
            name: "test name",
            email: tapoAccountSettings.email,
            password: tapoAccountSettings.password,
            deviceIp: "",
            deviceAlias: tapoAccountSettings.deviceAlias,
            deviceIpRange: tapoAccountSettings.deviceIpRange,
            mode: tapoAccountSettings.mode
          }
        ];
        helper.load(tagetNode, flow, function () {
          const n1 = helper.getNode("n1");
          n1.on("input", (msg) => {
            try {
              msg.payload.result.should.have.not.true();  /* msg.payload.result !== true */
              msg.payload.errorInf.message.should.have.equal('command not found.');            
              n1.error.should.be.calledWithExactly(msg.payload.errorInf);
              done();
            } catch(err) {
              done(err);
            }
          });
          n1.receive({ payload: command });
        });
      });
  
      it('should call `error` with "Error: Failed to get tapo ip address." case:Search mode: device alias, node.error, command:0(invalid device alias)', function (done) {
        this.timeout(5000);
        const command = 0;
        const flow = [
          {
            id: "n1",
            type: "tplink_tapo_connect_api",
            name: "test name",
            email: tapoAccountSettings.email,
            password: tapoAccountSettings.password,
            deviceIp: "",
            deviceAlias: "foo",
            deviceIpRange: tapoAccountSettings.deviceIpRange,
            mode: tapoAccountSettings.mode,
            wires:[["n2"]]
          },
          { id: "n2", type: "helper" }
        ];
        helper.load(tagetNode, flow, function () {
          const n1 = helper.getNode("n1");
          const n2 = helper.getNode("n2");
          n2.on("input", (msg) => {
            try {
              msg.payload.result.should.have.not.true(); /* msg.payload.result !== true */
              msg.payload.errorInf.message.should.have.equal('Failed to get tapo ip address.');
              done();
            } catch(err) {
              done(err);
            }
          });
          n1.receive({ payload: command });
        });
      });
  
      it('should call `error` with "Error: Failed to get tapo ip address." case:Search mode: device alias, node.error, command:0(out of device ip range)', function (done) {
        this.timeout(5000);
        const command = 0;
        const flow = [
          {
            id: "n1",
            type: "tplink_tapo_connect_api",
            name: "test name",
            email: tapoAccountSettings.email,
            password: tapoAccountSettings.password,
            deviceIp: "",
            deviceAlias: tapoAccountSettings.deviceAlias,
            deviceIpRange: "172.17.198.0/24",
            mode: tapoAccountSettings.mode,
            wires:[["n2"]]
          },
          { id: "n2", type: "helper" }
        ];
        helper.load(tagetNode, flow, function () {
          const n1 = helper.getNode("n1");
          const n2 = helper.getNode("n2");
          n2.on("input", (msg) => {
            try {
              msg.payload.result.should.have.not.true(); /* msg.payload.result !== true */
              msg.payload.errorInf.message.should.have.equal('Failed to get tapo ip address.');
              done();
            } catch(err) {
              done(err);
            }
          });
          n1.receive({ payload: command });
        });
      });
    });

  });

});