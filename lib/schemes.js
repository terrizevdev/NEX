let options = {
  bot_: "temp JSON DEFAULT '{}' ",
  sck1: "rank JSON DEFAULT '{}' ",
  sck: "disables TEXT[] DEFAULT ARRAY[]::TEXT[] ",
  tempdb: "creator TEXT DEFAULT 'Astro'"
};
let optJson = {
  bot_: {},
  sck1: {
    rank: {}
  },
  sck: {},
  tempdb: {}
};

const { sck1 } = require(__dirname + "/database/user");
const { sck } = require(__dirname + "/database/group");
const { alive } = require(__dirname + "/database/alive");
const { dbtemp } = require(__dirname + "/database/tempdb");
const { Pool } = require("pg");
const fs = require("fs");

let pg = {};
let pool;
let pgtables = {
  bot_: " \n        CREATE TABLE IF NOT EXISTS bot_ (\n          id VARCHAR(255) UNIQUE NOT NULL DEFAULT 'Asta-MD',\n          alive_text TEXT DEFAULT '*HEY &user*',\n          alive_get TEXT DEFAULT 'you didnt set alive message yet',\n          alive_url VARCHAR(255) DEFAULT '',\n          alive_image BOOLEAN DEFAULT false,\n          alive_video BOOLEAN DEFAULT false,\n          permit BOOLEAN DEFAULT false,\n          permit_values VARCHAR(255) DEFAULT '212',\n          chatbot VARCHAR(255) DEFAULT 'false',\n          bgm BOOLEAN DEFAULT false,\n          bgmarray JSON DEFAULT '{}',\n          plugins JSON DEFAULT '{}',\n          notes JSON DEFAULT '{}',\n          antiviewonce VARCHAR(255) DEFAULT 'true',\n          antidelete VARCHAR(255) DEFAULT 'true',\n          autobio VARCHAR(255) DEFAULT 'false',\n          levelup VARCHAR(255) DEFAULT 'true',\n          autoreaction VARCHAR(255) DEFAULT 'true',\n          anticall VARCHAR(255) DEFAULT 'true',\n          mention JSON DEFAULT '{}',\n          filter JSON DEFAULT '{}',\n          afk JSON DEFAULT '{}',\n          rent JSON DEFAULT '{}'" + (options.bot_ ? ",\n " + options.bot_ : "") + "          \n        );",
  sck1: "\n  CREATE TABLE IF NOT EXISTS sck1 (\n    id VARCHAR(255) UNIQUE NOT NULL DEFAULT 'Asta-MD',\n    name VARCHAR(255) DEFAULT 'Unknown',\n    times INTEGER DEFAULT 0,\n    permit VARCHAR(255) DEFAULT 'false',\n    ban VARCHAR(255) DEFAULT 'false',\n    afk VARCHAR(255) DEFAULT 'false',\n    afktime INTEGER DEFAULT 0,\n    bot BOOLEAN DEFAULT false,\n    msg JSON DEFAULT '{}',\n    warn JSON DEFAULT '{}'" + (options.sck1 ? ",\n " + options.sck1 : "") + " \n  );",
  sck: "CREATE TABLE IF NOT EXISTS Sck (\n    id VARCHAR(255) UNIQUE NOT NULL DEFAULT 'Asta_Md',\n    events VARCHAR(255) DEFAULT 'false',\n    nsfw VARCHAR(255) DEFAULT 'false',\n    pdm VARCHAR(255) DEFAULT 'false',\n    antipromote VARCHAR(255) DEFAULT 'false',\n    antidemote VARCHAR(255) DEFAULT 'false',\n    welcome VARCHAR(255) DEFAULT 'false',\n    goodbye VARCHAR(255) DEFAULT 'false',\n    welcometext TEXT DEFAULT '*@user @pp Welcome to @gname',\n    goodbyetext TEXT DEFAULT '@user @pp left @gname',\n    botenable VARCHAR(255) DEFAULT 'true',\n    antilink VARCHAR(255) DEFAULT 'false',\n    antiword JSON DEFAULT '{}',\n    antifake VARCHAR(255) DEFAULT 'false',\n    antispam VARCHAR(255) DEFAULT 'false',\n    antitag VARCHAR(255) DEFAULT 'false',\n    antibot VARCHAR(255) DEFAULT 'false',\n    onlyadmin VARCHAR(255) DEFAULT 'false',\n    economy VARCHAR(255) DEFAULT 'false',\n    disablecmds VARCHAR(255) DEFAULT 'false',\n    chatbot VARCHAR(255) DEFAULT 'false',\n    mute VARCHAR(255) DEFAULT 'false',\n    unmute VARCHAR(255) DEFAULT 'false'" + (options.sck ? ",\n " + options.sck : "") + " \n  );",
  tempdb: "\n  CREATE TABLE IF NOT EXISTS tempdb (\n    id VARCHAR(255) UNIQUE NOT NULL DEFAULT 'Asta-MD',\n    data JSON DEFAULT '{}'" + (options.tempdb ? ",\n " + options.tempdb : "") + " \n  );"
};

global.DATABASE_URL = global.DATABASE_URL || global.DATABASE_URI || process.env.DATABASE_URL;

let cacheTable = {};
global.pool = global.pool || false;

/**
 * PostgreSQL helper - keep original exported function names (note: connnectpg typo preserved)
 */
pg.connnectpg = () => {
  pool = new Pool({
    connectionString: global.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });
  pool.on("connect", () => {
    cacheTable.connnectpg = true;
    sqldb = true;
    return sqldb;
  });
  pool.on("error", (err) => {
    console.log("PostgreSQL database error:");
    setTimeout(pg.connnectpg, 1000);
  });
};

pg.createTable = async (tableName) => {
  if (!sqldb && !cacheTable.connnectpg || !pool && global.sqldb) {
    let connectResult = pg.connnectpg();
    if (!connectResult) {
      return false;
    }
  }
  if (cacheTable[tableName]) {
    return true;
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(pgtables[tableName]);
    await client.query("COMMIT");
    if (!cacheTable[tableName]) {
      console.log("PostgreSQL " + tableName + " Table created in Database.");
    }
    cacheTable[tableName] = true;
    return true;
  } catch (err) {
    console.log("Error creating PostgreSQL " + tableName + " Table:", err);
  } finally {
    client.release();
  }
};

pg.new = async (tableName, document) => {
  if (!(await pg.createTable(tableName))) {
    return false;
  }
  const client = await pool.connect();
  try {
    if (await pg.findOne(tableName, document)) {
      return await pg.updateOne(tableName, { id: document?.id }, document);
    }
    await client.query("BEGIN");
    const insertSql =
      "\n      INSERT INTO " +
      tableName +
      " (" +
      Object.keys(document).join(", ") +
      ")\n      VALUES (" +
      Object.keys(document)
        .map((_, idx) => "$" + (idx + 1))
        .join(", ")
        .trim() +
      ")\n      ON CONFLICT (id) DO NOTHING\n      RETURNING *;\n    ";
    const values = Object.values(document);
    const res = await client.query(insertSql, values);
    await client.query("COMMIT");
    return res.rows[0];
  } catch (err) {
    await client.query("ROLLBACK");
    console.log("Error inserting new row into " + tableName + "\n", err);
  } finally {
    client.release();
  }
};

pg.countDocuments = async (tableName) => {
  if (!(await pg.createTable(tableName))) {
    return 0;
  }
  const client = await pool.connect();
  try {
    const res = await client.query("SELECT COUNT(*) FROM " + tableName);
    return parseInt(res.rows[0].count);
  } catch (err) {
    return 0;
  } finally {
    client.release();
  }
};

pg.findOne = async (tableName, queryObj) => {
  if (!(await pg.createTable(tableName))) {
    return false;
  }
  const client = await pool.connect();
  try {
    const res = await client.query("SELECT * FROM " + tableName + " WHERE id = $1", [queryObj?.id]);
    return res.rows[0];
  } catch (err) {
    console.log("Error while finding " + tableName + " document by Id: " + queryObj?.id + "\n", err);
    return false;
  } finally {
    client.release();
  }
};

pg.find = async (tableName, queryObj = {}) => {
  if (!(await pg.createTable(tableName))) {
    return [];
  }
  const client = await pool.connect();
  try {
    let values = Object.values(queryObj);
    if (!values || !values[0]) {
      return (await client.query("SELECT * FROM " + tableName))?.rows || [];
    } else if (queryObj?.id) {
      return [{ ...(await pg.findOne(tableName, queryObj)) }] || [];
    }
  } catch (err) {
    console.log("Error while find " + tableName + " documents", err);
    return [];
  } finally {
    client.release();
  }
};

pg.updateOne = async (tableName, queryObj, updateObj = {}) => {
  if (!(await pg.createTable(tableName))) {
    return false;
  }
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const selectSql = "SELECT * FROM " + tableName + " WHERE id = $1 FOR UPDATE";
    const selectRes = await client.query(selectSql, [queryObj?.id]);
    if (selectRes.rows[0]) {
      const updateSql =
        "UPDATE " +
        tableName +
        " SET " +
        Object.keys(updateObj)
          .map((key, idx) => key + " = $" + (idx + 2))
          .join(", ") +
        " WHERE id = $1 RETURNING *;";
      const params = [queryObj.id, ...Object.values(updateObj)];
      const updateRes = await client.query(updateSql, params);
      await client.query("COMMIT");
      return updateRes.rows[0];
    } else {
      return await pg.new(tableName, { ...queryObj, ...updateObj });
    }
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Error while finding and updating " + tableName + " document by Id: " + queryObj?.id + "\n", err);
    return [];
  } finally {
    client.release();
  }
};

pg.findOneAndDelete = async (tableName, queryObj) => {
  if (!(await pg.createTable(tableName))) {
    return false;
  }
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const selectRes = await client.query("SELECT * FROM " + tableName + " WHERE id = $1 FOR UPDATE", [queryObj?.id]);
    if (selectRes.rows[0]) {
      const delRes = await client.query("DELETE FROM " + tableName + " WHERE id = $1 RETURNING *", [queryObj.id]);
      await client.query("COMMIT");
      return delRes.rows[0];
    } else {
      return true;
    }
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Error while finding and deleting " + tableName + " document by Id: " + queryObj?.id + "\n", err);
    return false;
  } finally {
    client.release();
  }
};

pg.collection = {
  drop: async (tableName) => {
    if (!(await pg.createTable(tableName))) {
      return false;
    }
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      await client.query("DROP TABLE IF EXISTS " + tableName);
      await client.query("COMMIT");
      delete cacheTable[tableName];
      return true;
    } catch (err) {
      await client.query("ROLLBACK");
      console.error("Error while dropping " + tableName + " table\n", err);
      return false;
    } finally {
      client.release();
    }
  }
};

/**
 * JSON file-based DB (dbs) for fallback (filesystem)
 */
let dbs = {
  newtables: {
    bot_: {
      id: "Asta_Md",
      alive_text: "*HEY &user*",
      alive_get: "you did'nt set alive message yet\nType [.alive info] to get alive info",
      alive_url: "",
      alive_image: false,
      alive_video: false,
      permit: false,
      permit_values: "all",
      chatbot: "false",
      antiviewonce: "true",
      antidelete: "true",
      autobio: "false",
      levelup: "false",
      anticall: "true",
      autoreaction: "true",
      bgm: false,
      bgmarray: {},
      plugins: {},
      notes: {},
      warn: {},
      afk: {},
      filter: {},
      mention: {},
      rent: {},
      ...(optJson.bot_ || {})
    },
    sck: {
      id: "Asta_Md",
      events: "false",
      nsfw: "false",
      pdm: "false",
      antipromote: "false",
      antidemote: "false",
      welcome: "false",
      goodbye: "false",
      welcometext: "*@user @pp welcome to @gname",
      goodbyetext: "*@user @pp left @gname",
      botenable: "true",
      antilink: "false",
      antiword: {},
      antifake: "false",
      antispam: "false",
      antitag: "false",
      antibot: "false",
      onlyadmin: "false",
      economy: "false",
      disablecmds: "false",
      chatbot: "false",
      mute: "false",
      unmute: "false",
      ...(optJson.sck || {})
    },
    sck1: {
      id: "chatid",
      name: "Unknown",
      times: 0,
      permit: "false",
      ban: "false",
      warn: {},
      ...(optJson.sck1 || {})
    },
    tempdb: {
      id: "chatid",
      data: {},
      ...(optJson.tempdb || {})
    }
  }
};

dbs.loadGroupData = async (fileName) => {
  try {
    const filePath = __dirname + "/" + fileName + ".json";
    if (fs.existsSync(filePath)) {
      return await JSON.parse(fs.readFileSync(filePath, "utf8"));
    } else {
      fs.writeFileSync(filePath, JSON.stringify({}, null, 2), "utf8");
      return {};
    }
  } catch (err) {
    console.error("Error loading user data:", err);
    return {};
  }
};

dbs.saveGroupData = async (fileName, data = {}) => {
  const filePath = __dirname + "/" + fileName + ".json";
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf8");
};

dbs.countDocuments = async (fileName) => {
  try {
    const data = await dbs.loadGroupData(fileName);
    const keys = Object.keys(data);
    return keys.length;
  } catch (err) {
    console.log("Error while countDocuments of " + fileName + " in database,\n", err);
    return 0;
  }
};

dbs.new = async (collectionName, doc) => {
  try {
    const data = await dbs.loadGroupData(collectionName);
    if (!data[doc.id]) {
      data[doc.id] = {
        ...dbs.newtables[collectionName],
        ...doc
      };
      await dbs.saveGroupData(collectionName, data);
      return data[doc.id];
    } else {
      return data[doc.id];
    }
  } catch (err) {
    console.log("Error while Creating new " + collectionName + " in database,\n", err);
    return {};
  }
};

dbs.findOne = async (collectionName, queryObj) => {
  try {
    const data = await dbs.loadGroupData(collectionName);
    if (data[queryObj.id]) {
      return data[queryObj.id];
    } else {
      return;
    }
  } catch (err) {
    console.log("Error while findOne " + collectionName + " in database,\n", err);
    return;
  }
};

dbs.find = async (collectionName, queryObj = {}) => {
  try {
    const hasQueryValues = Object.values(queryObj).length > 0;
    const data = await dbs.loadGroupData(collectionName);
    if (data[queryObj.id]) {
      return [{ ...data[queryObj.id] }];
    } else if (!hasQueryValues) {
      return Object.values(data);
    }
    return [];
  } catch (err) {
    console.log("Error while finding  " + collectionName + "(s) in database,\n", err);
    return [];
  }
};

dbs.updateOne = async (collectionName, queryObj, updateObj = {}) => {
  try {
    const data = await dbs.loadGroupData(collectionName);
    if (data[queryObj.id]) {
      data[queryObj.id] = {
        ...data[queryObj.id],
        ...updateObj
      };
      await dbs.saveGroupData(collectionName, data);
      return data[queryObj.id];
    } else {
      return await dbs.new(collectionName, { ...queryObj, ...updateObj });
    }
  } catch (err) {
    console.log("Error while updateOne " + collectionName + " in database,\n", err);
    return {};
  }
};

dbs.findOneAndDelete = async (collectionName, queryObj) => {
  try {
    const data = await dbs.loadGroupData(collectionName);
    delete data[queryObj.id];
    await dbs.saveGroupData(collectionName, data);
    return true;
  } catch (err) {
    console.log("Error while findOneAndDelete " + collectionName + " in database,\n", err);
    return null;
  }
};

dbs.delete = dbs.findOneAndDelete;

dbs.collection = {
  drop: async (collectionName) => {
    try {
      const data = await dbs.loadGroupData(collectionName);
      Object.keys(data).forEach((key) => delete data[key]);
      await dbs.saveGroupData(collectionName, data);
      return true;
    } catch (err) {
      console.log("Error while collection.drop all user in database,\n", err);
      return null;
    }
  }
};

dbs.deleteAll = dbs.collection.drop;

/**
 * Higher-level DB wrappers which choose storage based on configuration
 */
let groupdb = {};

groupdb.countDocuments = async () => {
  try {
    if (!global.AstroOfficial) return;
    if (isMongodb) {
      return await sck.countDocuments();
    } else if (sqldb && pg) {
      return await pg.countDocuments("sck");
    } else {
      return await dbs.countDocuments("sck");
    }
  } catch (err) {
    console.log("Error while Creating user in database,\n", err);
    return 0;
  }
};

groupdb.new = async (doc) => {
  try {
    if (!global.AstroOfficial) return;
    if (isMongodb) {
      let rec = (await sck.findOne({ id: doc.id })) || (await new sck({ id: doc.id, ...doc }).save());
      return rec;
    } else if (sqldb && pg) {
      let rec = (await pg.findOne("sck", { id: doc.id })) || (await pg.new("sck", doc));
      return rec;
    } else {
      let rec = (await dbs.findOne("sck", { id: doc.id })) || (await dbs.new("sck", doc));
      return rec;
    }
  } catch (err) {
    console.log("Error while Creating user in database,\n", err);
    return {};
  }
};

groupdb.findOne = async (queryObj) => {
  try {
    if (!global.AstroOfficial) return;
    if (isMongodb) {
      return await sck.findOne({ id: queryObj.id });
    } else if (sqldb && pg) {
      return await pg.findOne("sck", queryObj);
    } else {
      let rec = await dbs.findOne("sck", { id: queryObj.id });
      return rec;
    }
  } catch (err) {
    console.log("Error while finding user in database,\n", err);
    return;
  }
};

groupdb.find = async (queryObj) => {
  try {
    if (!global.AstroOfficial) return;
    if (isMongodb) {
      let res = await sck.find(queryObj);
      return res;
    } else if (sqldb && pg) {
      return await pg.find("sck", queryObj);
    } else {
      return await dbs.find("sck", queryObj);
    }
  } catch (err) {
    console.log("Error while finding user in database,\n", err);
    return [];
  }
};

groupdb.updateOne = async (queryObj, updateObj = {}) => {
  try {
    if (!global.AstroOfficial) return;
    if (!queryObj.id) return {};
    if (isMongodb) {
      return await sck.updateOne({ id: queryObj.id }, { ...updateObj });
    } else if (sqldb && pg) {
      return await pg.updateOne("sck", { id: queryObj.id }, updateObj);
    } else {
      return await dbs.updateOne("sck", queryObj, updateObj);
    }
  } catch (err) {
    console.log("Error while updateOne user in database,\n", err);
    return {};
  }
};

groupdb.findOneAndDelete = async (queryObj) => {
  try {
    if (!global.AstroOfficial) return;
    if (!queryObj.id) return [];
    if (isMongodb) {
      return await sck.findOneAndDelete({ id: queryObj.id });
    } else if (sqldb && pg) {
      return await pg.findOneAndDelete("sck", queryObj);
    } else {
      return await dbs.findOneAndDelete("sck", queryObj);
    }
  } catch (err) {
    console.log("Error while findOneAndDelete user in database,\n", err);
    return null;
  }
};

groupdb.delete = groupdb.findOneAndDelete;

groupdb.collection = {
  drop: async () => {
    try {
      if (!global.AstroOfficial) return;
      if (isMongodb) {
        return await sck.collection.drop();
      } else if (sqldb && pg) {
        return await pg.collection.drop("sck");
      } else {
        return await dbs.collection.drop("sck");
      }
    } catch (err) {
      console.log("Error while collection.drop all user in database,\n", err);
      return null;
    }
  }
};

/**
 * userdb wrappers
 */
let userdb = {};

userdb.countDocuments = async () => {
  try {
    if (!global.AstroOfficial) return;
    if (isMongodb) {
      return await sck1.countDocuments();
    } else if (sqldb && pg) {
      return await pg.countDocuments("sck1");
    } else {
      return await dbs.countDocuments("sck1");
    }
  } catch (err) {
    console.log("Error from userdb.countDocuments() in user database,\n", err);
    return 0;
  }
};

userdb.new = async (doc) => {
  try {
    if (!global.AstroOfficial) return;
    if (isMongodb) {
      let rec = (await sck1.findOne({ id: doc.id })) || (await new sck1({ id: doc.id, ...doc }).save());
      return rec;
    } else if (sqldb && pg) {
      let rec = (await pg.findOne("sck1", { id: doc.id })) || (await pg.new("sck1", doc));
      return rec;
    } else {
      let rec = (await dbs.findOne("sck1", { id: doc.id })) || (await dbs.new("sck1", doc));
      return rec;
    }
  } catch (err) {
    console.log("Error userdb.new() in user database,\n", err);
    return {};
  }
};

userdb.findOne = async (queryObj) => {
  try {
    if (!global.AstroOfficial) return;
    if (isMongodb) {
      return await sck1.findOne({ id: queryObj.id });
    } else if (sqldb && pg) {
      return await pg.findOne("sck1", queryObj);
    } else {
      let rec = await dbs.findOne("sck1", { id: queryObj.id });
      return rec;
    }
  } catch (err) {
    console.log("Error userdb.findOne() in user database,\n", err);
    return;
  }
};

userdb.find = async (queryObj) => {
  try {
    if (!global.AstroOfficial) return;
    if (isMongodb) {
      let res = await sck1.find(queryObj);
      return res;
    } else if (sqldb && pg) {
      return await pg.find("sck1", queryObj);
    } else {
      return await dbs.find("sck1", queryObj);
    }
  } catch (err) {
    console.log("Error userdb.find() in user database,\n", err);
    return [];
  }
};

userdb.updateOne = async (queryObj, updateObj = {}) => {
  try {
    if (!global.AstroOfficial) return;
    if (!queryObj.id) return {};
    if (isMongodb) {
      return await sck1.updateOne({ id: queryObj.id }, { ...updateObj });
    } else if (sqldb && pg) {
      return await pg.updateOne("sck1", { id: queryObj.id }, updateObj);
    } else {
      return await dbs.updateOne("sck1", queryObj, updateObj);
    }
  } catch (err) {
    console.log("Error userdb.updateOne() in user database,\n", err);
    return {};
  }
};

userdb.findOneAndDelete = async (queryObj) => {
  try {
    if (!global.AstroOfficial) return;
    if (!queryObj.id) return [];
    if (isMongodb) {
      return await sck1.findOneAndDelete({ id: queryObj.id });
    } else if (sqldb && pg) {
      return await pg.findOneAndDelete("sck1", queryObj);
    } else {
      return await dbs.findOneAndDelete("sck1", queryObj);
    }
  } catch (err) {
    console.log("Error userdb.findOneAndDelete() in user database,\n", err);
    return null;
  }
};

userdb.delete = userdb.findOneAndDelete;

userdb.collection = {
  drop: async () => {
    try {
      if (!global.AstroOfficial) return;
      if (isMongodb) {
        return await sck1.collection.drop();
      } else if (sqldb && pg) {
        return await pg.collection.drop("sck1");
      } else {
        return await dbs.collection.drop("sck1");
      }
    } catch (err) {
      console.log("Error userdb.collection.drop() in user database,\n", err);
      return null;
    }
  }
};

/**
 * alivedb wrappers
 */
let alivedb = {};

alivedb.countDocuments = async () => {
  try {
    if (!global.AstroOfficial) return;
    if (isMongodb) {
      return await alive.countDocuments();
    } else if (sqldb && pg) {
      return await pg.countDocuments("bot_");
    } else {
      return await dbs.countDocuments("bot_");
    }
  } catch (err) {
    console.log("Error while Creating user in database,\n", err);
    return 0;
  }
};

alivedb.new = async (doc) => {
  try {
    if (!global.AstroOfficial) return;
    if (isMongodb) {
      let rec = (await alive.findOne({ id: doc.id })) || (await new alive({ id: doc.id, ...doc }).save());
      return rec;
    } else if (sqldb && pg) {
      return (await pg.findOne("bot_", { id: doc.id })) || (await pg.new("bot_", doc));
    } else {
      let rec = (await dbs.findOne("bot_", { id: doc.id })) || (await dbs.new("bot_", doc));
      return rec;
    }
  } catch (err) {
    console.log("Error while Creating BOT INFO in database,\n", err);
    return {};
  }
};

alivedb.findOne = async (queryObj) => {
  try {
    if (!global.AstroOfficial) return;
    if (isMongodb) {
      return await alive.findOne({ id: queryObj.id });
    } else if (sqldb && pg) {
      return await pg.findOne("bot_", queryObj);
    } else {
      let rec = await dbs.findOne("bot_", { id: queryObj.id });
      return rec;
    }
  } catch (err) {
    console.log("Error while finding user in database,\n", err);
    return;
  }
};

alivedb.find = async (queryObj) => {
  try {
    if (!global.AstroOfficial) return;
    if (isMongodb) {
      let res = await alive.find(queryObj);
      return res;
    } else if (sqldb && pg) {
      return await pg.find("bot_", queryObj);
    } else {
      return await dbs.find("bot_", queryObj);
    }
  } catch (err) {
    console.log("Error while finding user in database,\n", err);
    return [];
  }
};

alivedb.updateOne = async (queryObj, updateObj = {}) => {
  try {
    if (!global.AstroOfficial) return;
    if (!queryObj.id) return {};
    if (isMongodb) {
      return await alive.updateOne({ id: queryObj.id }, { ...updateObj });
    } else if (sqldb && pg) {
      return await pg.updateOne("bot_", { id: queryObj.id }, updateObj);
    } else {
      return await dbs.updateOne("bot_", queryObj, updateObj);
    }
  } catch (err) {
    console.log("Error while updateOne user in database,\n", err);
    return {};
  }
};

alivedb.findOneAndDelete = async (queryObj) => {
  try {
    if (!global.AstroOfficial) return;
    if (!queryObj.id) return [];
    if (isMongodb) {
      return await alive.findOneAndDelete({ id: queryObj.id });
    } else if (sqldb && pg) {
      return await pg.findOneAndDelete("bot_", queryObj);
    } else {
      return await dbs.findOneAndDelete("bot_", queryObj);
    }
  } catch (err) {
    console.log("Error while findOneAndDelete user in database,\n", err);
    return null;
  }
};

alivedb.delete = alivedb.findOneAndDelete;

alivedb.collection = {
  drop: async () => {
    try {
      if (!global.AstroOfficial) return;
      if (isMongodb) {
        return await alive.collection.drop();
      } else if (sqldb && pg) {
        return await pg.collection.drop("bot_");
      } else {
        return await dbs.collection.drop("bot_");
      }
    } catch (err) {
      console.log("Error while collection.drop all user in database,\n", err);
      return null;
    }
  }
};

/**
 * tempdb wrappers
 */
let tempdb = {};

tempdb.countDocuments = async () => {
  try {
    if (!global.AstroOfficial) return;
    if (isMongodb) {
      return await dbtemp.countDocuments();
    } else if (sqldb && pg) {
      return await pg.countDocuments("tempdb");
    } else {
      return await dbs.countDocuments("tempdb");
    }
  } catch (err) {
    console.log("Error while Creating user in database,\n", err);
    return 0;
  }
};

tempdb.new = async (doc) => {
  try {
    if (!global.AstroOfficial) return;
    if (isMongodb) {
      let rec = (await dbtemp.findOne({ id: doc.id })) || (await new dbtemp({ id: doc.id, ...doc }).save());
      return rec;
    } else if (sqldb && pg) {
      let rec = (await pg.findOne("tempdb", { id: doc.id })) || (await pg.new("tempdb", doc));
      return rec;
    } else {
      let rec = (await dbs.findOne("tempdb", { id: doc.id })) || (await dbs.new("tempdb", doc));
      return rec;
    }
  } catch (err) {
    console.log("Error while Creating user in database,\n", err);
    return {};
  }
};

tempdb.findOne = async (queryObj) => {
  try {
    if (!global.AstroOfficial) return;
    if (isMongodb) {
      return await dbtemp.findOne({ id: queryObj.id });
    } else if (sqldb && pg) {
      return await pg.findOne("tempdb", queryObj);
    } else {
      let rec = await dbs.findOne("tempdb", { id: queryObj.id });
      return rec;
    }
  } catch (err) {
    console.log("Error while finding user in database,\n", err);
    return;
  }
};

tempdb.find = async (queryObj) => {
  try {
    if (!global.AstroOfficial) return;
    if (isMongodb) {
      let res = await dbtemp.find(queryObj);
      return res;
    } else if (sqldb && pg) {
      return await pg.find("tempdb", queryObj);
    } else {
      return await dbs.find("tempdb", queryObj);
    }
  } catch (err) {
    console.log("Error while finding user in database,\n", err);
    return [];
  }
};

tempdb.updateOne = async (queryObj, updateObj = {}) => {
  try {
    if (!global.AstroOfficial) return;
    if (!queryObj.id) return {};
    if (isMongodb) {
      return await dbtemp.updateOne({ id: queryObj.id }, { ...updateObj });
    } else if (sqldb && pg) {
      return await pg.updateOne("tempdb", { id: queryObj.id }, updateObj);
    } else {
      return await dbs.updateOne("tempdb", queryObj, updateObj);
    }
  } catch (err) {
    console.log("Error while updateOne user in database,\n", err);
    return {};
  }
};

tempdb.findOneAndDelete = async (queryObj) => {
  try {
    if (!global.AstroOfficial) return;
    if (!queryObj.id) return [];
    if (isMongodb) {
      return await dbtemp.findOneAndDelete({ id: queryObj.id });
    } else if (sqldb && pg) {
      return await pg.findOneAndDelete("tempdb", queryObj);
    } else {
      return await dbs.findOneAndDelete("tempdb", queryObj);
    }
  } catch (err) {
    console.log("Error while findOneAndDelete user in database,\n", err);
    return null;
  }
};

tempdb.delete = tempdb.findOneAndDelete;

tempdb.collection = {
  drop: async () => {
    try {
      if (!global.AstroOfficial) return;
      if (isMongodb) {
        return await dbtemp.collection.drop();
      } else if (sqldb && pg) {
        return await pg.collection.drop("tempdb");
      } else {
        return await dbs.collection.drop("tempdb");
      }
    } catch (err) {
      console.log("Error while collection.drop all user in database,\n", err);
      return null;
    }
  }
};

module.exports = {
  tempdb: tempdb,
  pg: pg,
  dbs: dbs,
  groupdb: groupdb,
  userdb: userdb,
  alivedb: alivedb,
  bot_: alivedb
};