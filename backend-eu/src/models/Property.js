const pool = require("../config/database");

class Property {
  static async findById(id) {
    const result = await pool.query("SELECT * FROM properties WHERE id = $1", [
      id,
    ]);
    return result.rows[0];
  }

  static async update(id, price, version) {
    const result = await pool.query(
      `UPDATE properties 
       SET price = $1, version = version + 1, updated_at = NOW() 
       WHERE id = $2 AND version = $3 
       RETURNING *`,
      [price, id, version],
    );
    return result.rows[0];
  }

  static async updateFromReplication(propertyData) {
    const result = await pool.query(
      `INSERT INTO properties (id, price, bedrooms, bathrooms, region_origin, version, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (id) 
       DO UPDATE SET 
         price = EXCLUDED.price,
         version = EXCLUDED.version,
         updated_at = EXCLUDED.updated_at
       WHERE properties.version < EXCLUDED.version
       RETURNING *`,
      [
        propertyData.id,
        propertyData.price,
        propertyData.bedrooms,
        propertyData.bathrooms,
        propertyData.region_origin,
        propertyData.version,
        propertyData.updated_at,
      ],
    );
    return result.rows[0];
  }

  static async getLastUpdatedTime() {
    const result = await pool.query(
      "SELECT MAX(updated_at) as last_updated FROM properties",
    );
    return result.rows[0].last_updated;
  }
}

module.exports = Property;
