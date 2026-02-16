const app = require("./app");
const { producer } = require("./config/kafka");
const KafkaService = require("./services/KafkaService");

const PORT = process.env.PORT || 8000;

async function startServer() {
  try {
    await producer.connect();
    console.log("Kafka producer connected");

    await KafkaService.startConsumer();
    console.log("Kafka consumer started");

    app.listen(PORT, () => {
      console.log(`Backend ${process.env.REGION} running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

startServer();

process.on("SIGTERM", async () => {
  console.log("SIGTERM received, shutting down gracefully");
  await producer.disconnect();
  process.exit(0);
});
