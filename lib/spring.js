const spring = require("./plutchik");
const config = require("../config.json");

const { Sequelize, QueryTypes, DataTypes } = require("sequelize");
const sequelize = new Sequelize(config.db.library, config.db.user, config.db.password, {
  host: config.db.host,
  dialect: config.db.dialect,
});
const hitokoto = sequelize.define('hitokoto', {
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
  emotion: DataTypes.JSON,
  train: DataTypes.JSON

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
  console.log(rawEmotion);
  let springTend = this.tend(spring.plutchik(pre));
  return new Promise((resolve, reject) => {
    resolve(
      sequelize.query(
        `SELECT *, ${method}(IFNULL(train->'$.emotion',emotion), '${rawEmotion}') AS cos FROM hitokoto ORDER BY cos DESC LIMIT ${limit};`,
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

exports.status = function () {
  return new Promise((resolve, reject) => {
    resolve(hitokoto.count());
    reject(new Error("error"));
  }).then(
    (result) =>
      new Promise((resolve, reject) => {
        resolve({ num: result, });
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
    sadness: "悲伤",
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


//Train Api

exports.trainNew = function () {
  return new Promise((resolve, reject) => {
    resolve(
      sequelize.query(
        `SELECT *,TIMESTAMPDIFF(HOUR,train->'$.creatTime',DATE_FORMAT(NOW(), '%Y-%m-%d %H:%i:%S')) AS timeout FROM hitokoto HAVING (timeout >1 AND train->'$.emotion' is null) OR train is null  ORDER BY timeout DESC,id LIMIT 1;`,
        { type: QueryTypes.SELECT }
      )
    );
    reject(new Error("error"));
  }).then(
    (result) =>
      new Promise((resolve, reject) => {
        let guid = ''
        for (let i = 1; i <= 32; i++) {
          const n = Math.floor(Math.random() * 16.0).toString(16)
          guid += n
        }
        hitokoto.update({
          train: {
            token: guid,
            creatTime: new Date().toISOString().slice(0, 19).replace('T', ' ')
          }
        }, { where: { id: result[0].id } });

        resolve({
          token: guid,
          raw: result[0]
        });
      })
  ).catch(err => { console.log(err) })
}
exports.trainUpdate = function (id, token, emotion) {
  return new Promise((resolve, reject) => {
    resolve(
      sequelize.query(
        `SELECT * FROM hitokoto WHERE id = ${id};`,
        { type: QueryTypes.SELECT }
      )
    );
    reject(new Error("request error"));
  }).then(
    (result) =>
      new Promise((resolve, reject) => {
        if (result[0].train.token == token) {
          resolve(result)
        } else {
          reject(new Error("Token is error"));
        }
      })
  ).then(
    (result) =>
      new Promise((resolve, reject) => {
        resolve(
          hitokoto.update({
            train: {
              token: token,
              emotion: emotion,
              creatTime: result[0].train.creatTime,
              finishTime: new Date().toISOString().slice(0, 19).replace('T', ' ')
            }
          }, { where: { id: id } })
        );
        reject(new Error("Update error"));
      })
  ).catch(err => { console.log(err) })
}

exports.trainCancel = function (id, token) {
  return new Promise((resolve, reject) => {
    resolve(
      sequelize.query(
        `SELECT * FROM hitokoto WHERE id = ${id};`,
        { type: QueryTypes.SELECT }
      )
    );
    reject(new Error("request error"));
  }).then(
    (result) =>
      new Promise((resolve, reject) => {
        if (result[0].train.token == token) {
          resolve(hitokoto.update({
            train: null
          }, { where: { id: id } }))
        } else {
          reject(new Error("Token is error"));
        }
      })
  ).catch(err => { console.log(err) })
}


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
  app.post('/train/new', (req, res) => {
    this.trainNew().then((result) => res.send(result));
  })
  app.post('/train/update', (req, res) => {
    this.trainUpdate(req.body.id, req.body.token, req.body.emotion).then((result) => res.send(result));
  })
  app.post('/train/cancel', (req, res) => {
    this.trainCancel(req.body.id, req.body.token, req.body.emotion).then((result) => res.send(result));
  })


  if (static) app.use(express.static(static));

  app.listen(port, () => {
    console.log(`Spring is listening on port ${port}`)
  })
}
