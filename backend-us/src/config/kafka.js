const { Kafka } = require("kafkajs");

const kafka = new Kafka({
  clientId: `property-service-${process.env.REGION}`,
  brokers: [process.env.KAFKA_BROKER],
  retry: {
    initialRetryTime: 100,
    retries: 8,
  },
});

const producer = kafka.producer();
const consumer = kafka.consumer({
  groupId: `property-consumer-${process.env.REGION}`,
});

module.exports = {
  kafka,
  producer,
  consumer,
};
