const pool = require("../config/database");

class IdempotencyService {
  static async checkDuplicate(requestId) {
    const result = await pool.query(
      "SELECT response_data FROM processed_requests WHERE request_id = $1",
      [requestId],
    );

    if (result.rows.length > 0) {
      return {
        isDuplicate: true,
        data: result.rows[0].response_data,
      };
    }

    return { isDuplicate: false };
  }

  static async storeRequest(requestId, propertyId, responseData) {
    await pool.query(
      "INSERT INTO processed_requests (request_id, property_id, response_data) VALUES ($1, $2, $3)",
      [requestId, propertyId, responseData],
    );
  }
}

module.exports = IdempotencyService;
