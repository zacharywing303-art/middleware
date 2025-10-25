const { Kafka } = require("kafkajs");
const { processOne } = require("./dispatcher");
const db = require("./models");

const kafka = new Kafka({
    clientId: "payment-checkout",
    brokers: [process.env.KAFKA_BOOTSTRAP_SERVERS],
});

const consumer = kafka.consumer({ groupId: process.env.KAFKA_GROUP_ID });

const run = async () => {
    await consumer.connect();
    await consumer.subscribe({ topic: "app.public.outbox", fromBeginning: true });
    await consumer.run({
        eachMessage: async ({ topic, partition, message }) => {
            const key = JSON.parse(message.key.toString());
            const outboxId = key.payload.id;
            
            const claimedRow = await db.Outbox.findByPk(outboxId);

            if (!claimedRow) {
                console.log("Outbox row not found");
                return;
            }

            if (claimedRow.status !== "pending") {
                console.log("Outbox row is not pending " + claimedRow.status);
                return;
            }
            processOne(claimedRow);
        },
    });
};

run().catch(console.error);
