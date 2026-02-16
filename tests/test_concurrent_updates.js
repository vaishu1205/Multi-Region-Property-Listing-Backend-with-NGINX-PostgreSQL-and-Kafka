const axios = require("axios");
const { v4: uuidv4 } = require("uuid");

const BASE_URL_US = "http://localhost:8080/us";
const BASE_URL_EU = "http://localhost:8080/eu";

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function testConcurrentUpdates() {
  console.log("Starting concurrent update test...");

  const propertyId = 1;
  const initialVersion = 1;

  try {
    const property = await axios.get(`${BASE_URL_US}/properties/${propertyId}`);
    console.log("Initial property state:", property.data);
  } catch (error) {
    console.log("Property fetch for verification failed, continuing with test");
  }

  const updateUS = axios.put(
    `${BASE_URL_US}/properties/${propertyId}`,
    { price: 550000.0, version: initialVersion },
    { headers: { "X-Request-ID": uuidv4() } },
  );

  const updateEU = axios.put(
    `${BASE_URL_EU}/properties/${propertyId}`,
    { price: 560000.0, version: initialVersion },
    { headers: { "X-Request-ID": uuidv4() } },
  );

  try {
    const [resultUS, resultEU] = await Promise.allSettled([updateUS, updateEU]);

    console.log("\n--- US Region Result ---");
    if (resultUS.status === "fulfilled") {
      console.log("Status:", resultUS.value.status);
      console.log("Response:", resultUS.value.data);
    } else {
      console.log("Status:", resultUS.reason.response?.status);
      console.log("Error:", resultUS.reason.response?.data);
    }

    console.log("\n--- EU Region Result ---");
    if (resultEU.status === "fulfilled") {
      console.log("Status:", resultEU.value.status);
      console.log("Response:", resultEU.value.data);
    } else {
      console.log("Status:", resultEU.reason.response?.status);
      console.log("Error:", resultEU.reason.response?.data);
    }

    const successCount = [resultUS, resultEU].filter(
      (r) => r.status === "fulfilled",
    ).length;
    const conflictCount = [resultUS, resultEU].filter(
      (r) => r.status === "rejected" && r.reason.response?.status === 409,
    ).length;

    console.log("\n--- Test Summary ---");
    console.log(`Successful updates: ${successCount}`);
    console.log(`Conflict responses (409): ${conflictCount}`);

    if (successCount === 1 && conflictCount === 1) {
      console.log(
        "\nTEST PASSED: Optimistic locking correctly prevented race condition",
      );
      process.exit(0);
    } else {
      console.log(
        "\nTEST FAILED: Expected exactly one success and one conflict",
      );
      process.exit(1);
    }
  } catch (error) {
    console.error("Test execution error:", error.message);
    process.exit(1);
  }
}

testConcurrentUpdates();
