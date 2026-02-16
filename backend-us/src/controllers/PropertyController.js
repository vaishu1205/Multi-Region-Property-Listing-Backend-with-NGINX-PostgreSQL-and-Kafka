const Property = require("../models/Property");
const KafkaService = require("../services/KafkaService");
const IdempotencyService = require("../services/IdempotencyService");

class PropertyController {
  static async updateProperty(req, res) {
    try {
      const { id } = req.params;
      const { price, version } = req.body;
      const requestId = req.headers["x-request-id"];

      if (!requestId) {
        return res
          .status(400)
          .json({ error: "X-Request-ID header is required" });
      }

      if (!price || version === undefined) {
        return res
          .status(400)
          .json({ error: "price and version are required" });
      }

      const idempotencyCheck =
        await IdempotencyService.checkDuplicate(requestId);

      if (idempotencyCheck.isDuplicate) {
        return res.status(422).json({
          error: "Duplicate request",
          message: "This request has already been processed",
        });
      }

      const updatedProperty = await Property.update(id, price, version);

      if (!updatedProperty) {
        return res.status(409).json({
          error: "Version conflict",
          message: "The property has been modified by another request",
        });
      }

      const responseData = {
        id: updatedProperty.id,
        price: parseFloat(updatedProperty.price),
        version: updatedProperty.version,
        updated_at: updatedProperty.updated_at,
      };

      await IdempotencyService.storeRequest(requestId, id, responseData);

      await KafkaService.publishUpdate(updatedProperty);

      return res.status(200).json(responseData);
    } catch (error) {
      console.error("Error updating property:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }

  static async getReplicationLag(req, res) {
    try {
      const lagSeconds = KafkaService.getReplicationLag();
      return res.status(200).json({ lag_seconds: lagSeconds });
    } catch (error) {
      console.error("Error getting replication lag:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }
}

module.exports = PropertyController;
