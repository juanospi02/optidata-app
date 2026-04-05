const db = require("../config/db");

exports.testConnection = (req, res) => {
  db.query("SELECT 1 + 1 AS result", (err, results) => {
    if (err) {
      return res.status(500).json({ error: err });
    }
    res.json({ message: "Backend conectado a MySQL", result: results[0] });
  });
};