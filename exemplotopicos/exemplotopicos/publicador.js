const { ServiceBusClient } = require("@azure/service-bus");
const { DefaultAzureCredential } = require("@azure/identity");
const WebSocket = require('ws');
// Replace `<SERVICE-BUS-NAMESPACE>` with your namespace
const fullyQualifiedNamespace = "waltercoan.servicebus.windows.net";

// Passwordless credential
const credential = new DefaultAzureCredential();

const topicName = "univille";

const connectionOptions = {
    webSocketOptions: {
        webSocket : WebSocket
    }
};

const messages = [
    { body: "Elon Musk" },
    { body: "Felipe Neto" },
    { body: "Monark" },
    { body: "Alexandre de Moraes" },
 ];

 async function main() {
    // create a Service Bus client using the passwordless authentication to the Service Bus namespace
    const sbClient = new ServiceBusClient(fullyQualifiedNamespace, credential, connectionOptions);

    // createSender() can also be used to create a sender for a queue.
    const sender = sbClient.createSender(topicName);

    try {
        // Tries to send all messages in a single batch.
        // Will fail if the messages cannot fit in a batch.
        // await sender.sendMessages(messages);

        // create a batch object
        let batch = await sender.createMessageBatch();
        for (let i = 0; i < messages.length; i++) {
            // for each message in the array

            // try to add the message to the batch
            if (!batch.tryAddMessage(messages[i])) {
                // if it fails to add the message to the current batch
                // send the current batch as it is full
                await sender.sendMessages(batch);

                // then, create a new batch
                batch = await sender.createMessageBatch();

                // now, add the message failed to be added to the previous batch to this batch
                if (!batch.tryAddMessage(messages[i])) {
                    // if it still can't be added to the batch, the message is probably too big to fit in a batch
                    throw new Error("Message too big to fit in a batch");
                }
            }
        }

        // Send the last created batch of messages to the topic
        await sender.sendMessages(batch);

        console.log(`Sent a batch of messages to the topic: ${topicName}`);

        // Close the sender
        await sender.close();
    } finally {
        await sbClient.close();
    }
}

// call the main function
main().catch((err) => {
    console.log("Error occurred: ", err);
    process.exit(1);
 });