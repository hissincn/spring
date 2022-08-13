const spring = require("./plutchik");
const config = require("../config.json");

const { Sequelize, QueryTypes, DataTypes } = require("sequelize");
const sequelize = new Sequelize(config.db.library, config.db.user, config.db.password, {
  host: config.db.host,
  dialect: config.db.dialect,
});
const table = config.db.table;
const hitokoto = sequelize.define(table, {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    content: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false,
    },
    author: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    source: DataTypes.STRING,
    type: DataTypes.STRING,
    emotion: DataTypes.JSON

  }, {
    timestamps: false,
    freezeTableName: true,
  });

//内部
exports.process = function (pre, method, limit) {
  if (!pre) throw new Error("A sentence is required");
  method = method || "contrary";
  limit = limit || 1;
  let rawEmotion = JSON.stringify(spring.plutchik(pre), null, null);
  let springTend = this.tend(spring.plutchik(pre));
  return new Promise((resolve, reject) => {
    resolve(
      sequelize.query(
        `SELECT *, ${method}(emotion, '${rawEmotion}') AS cos FROM hitokoto ORDER BY cos DESC LIMIT ${limit};`,
        { type: QueryTypes.SELECT }
      )
    );
    reject(new Error("error"));
  }).then(
    (result) =>
      new Promise((resolve, reject) => {
        resolve({
          raw: {
            content: pre,
            emotion: rawEmotion,
            method: method,
            tend: springTend,
            quantity: limit,
          },
          result: result,
        });
        reject(new Error("error"));
      })
  );
};

exports.status = function() {
  return new Promise((resolve, reject) => {
    resolve(hitokoto.count());
    reject(new Error("error"));
  }).then(
    (result) =>
      new Promise((resolve, reject) => {
        resolve({num: result,});
        reject(new Error("error"));
      })
  );
}

exports.UpdateEmotion = function () {

  hitokoto.findAll({
    attributes: ['id', 'content', 'emotion'],
    //where: {id: {[Op.lt]: 10}}
  })
    .then(function (rows) {
      rows.forEach(function (row) {

        hitokoto.update({ emotion: spring.emotion(row.content) }, { where: { id: row.id } });

      });
    })
    .catch(function (err) {
      console.log(err);
    });

}

//公开方法
exports.similar = function (pre, limit) {
  return this.process(pre, "similar", limit);
};

exports.contrary = function (pre, limit) {
  return this.process(pre, "contrary", limit);
};

exports.emotion = function (pre) {
  return spring.plutchik(pre);
};

exports.plutchik = function (pre) {
  return spring.plutchik(pre);
};

exports.tend = function (raw) {
  let maxList = [];
  let value = Object.values(raw)
  let match = {
    joy: "喜悦",
    trust: "信任",
    fear: "恐惧",
    surprise: "惊喜",
    sadness:"悲伤",
    disgust: "厌恶",
    anger: "愤怒",
    anticipation: "期待",
  }

  let sameIs = value.every(item => item === 2.5);
  for (let i in raw) {
    if (raw[i] == Math.max(...value)) { 
      maxList.push(match[i]) 
    }
  }

  return sameIs ? "均衡" : maxList.join("+");
};


//创建webAPI
exports.createApi = function (port, static) {

  const express = require('express');
  const app = express();
  port = port || 3000;

  app.use(express.json());
  app.use(express.urlencoded());
  app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET,HEAD,OPTIONS,POST,PUT");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
    next();
  });
  app.post('/similar', (req, res) => {
    this.similar(req.body.sentence, req.body.need).then((result) => res.send(result));
  })
  app.get('/similar', (req, res) => {
    this.similar(req.query.sentence, req.query.need).then((result) => res.send(result));
  })
  app.post('/contrary', (req, res) => {
    this.contrary(req.body.sentence, req.body.need).then((result) => res.send(result));
  })
  app.get('/contrary', (req, res) => {
    this.contrary(req.query.sentence, req.query.need).then((result) => res.send(result));
  })
  app.post('/emotion', (req, res) => {
    res.send(this.plutchik(req.body.sentence));
  })
  app.get('/emotion', (req, res) => {
    res.send(this.plutchik(req.query.sentence));
  })
  app.post('/status', (req, res) => {
    this.status().then((result) => res.send(result));
  })
  app.get('/status', (req, res) => {
    this.status().then((result) => res.send(result));
  })

  if (static) app.use(express.static(static));

  app.listen(port, () => {
    console.log(`Spring is listening on port ${port}`)
  })
}
