const { producer, consumer } = require("../config/kafka");
const Property = require("../models/Property");

class KafkaService {
  static lastConsumedTimestamp = null;

  static async publishUpdate(property) {
    await producer.send({
      topic: "property-updates",
      messages: [
        {
          key: property.id.toString(),
          value: JSON.stringify({
            id: property.id,
            price: parseFloat(property.price),
            bedrooms: property.bedrooms,
            bathrooms: property.bathrooms,
            region_origin: property.region_origin,
            version: property.version,
            updated_at: property.updated_at,
          }),
        },
      ],
    });
  }

  static async startConsumer() {
    const currentRegion = process.env.REGION;

    await consumer.connect();
    await consumer.subscribe({
      topic: "property-updates",
      fromBeginning: false,
    });

    await consumer.run({
      eachMessage: async ({ message }) => {
        try {
          const propertyData = JSON.parse(message.value.toString());

          if (propertyData.region_origin !== currentRegion) {
            await Property.updateFromReplication(propertyData);
            this.lastConsumedTimestamp = new Date(propertyData.updated_at);
            console.log(
              `Replicated property ${propertyData.id} from ${propertyData.region_origin} region`,
            );
          }
        } catch (error) {
          console.error("Error processing message:", error);
        }
      },
    });
  }

  static getReplicationLag() {
    if (!this.lastConsumedTimestamp) {
      return 0;
    }
    const now = new Date();
    const lagMs = now - this.lastConsumedTimestamp;
    return lagMs / 1000;
  }
}

module.exports = KafkaService;
