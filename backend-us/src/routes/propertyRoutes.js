const express = require("express");
const PropertyController = require("../controllers/PropertyController");

const router = express.Router();

router.put("/properties/:id", PropertyController.updateProperty);
router.get("/replication-lag", PropertyController.getReplicationLag);

module.exports = router;
