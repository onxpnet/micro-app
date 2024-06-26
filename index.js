const express = require("express");
const cors = require('cors')
const grpcServer = require('./grpc/server');
const kafka = require('kafka-node');
const Queue = require('bull');

require("@opentelemetry/api");

const app = express();

app.use(cors());

app.all("/", (req, res) => {
  res.json({ method: req.method, message: "You are accessing Micro App", ...req.body });
});

app.all("/command", async (req, res) => {
  try {
    res.json({ success: "true", message: "Success execute command" });
  } catch (error) {
      console.error('Error:', error);
  }
});

// run grpc server
grpcServer();

// kafka
const kafkaClient = new kafka.KafkaClient({kafkaHost: process.env.KAFKA_HOST || 'localhost:9092'});
const kafkaTopics = [{ topic: process.env.KAFKA_TOPIC }];
const kafkaConsumer = new kafka.Consumer(kafkaClient, kafkaTopics, { autoCommit: true });

// Set up the event handlers
kafkaConsumer.on('message', function (message) {
  console.log('Received message:', message);
});

kafkaConsumer.on('error', function (error) {
  console.error('Error in consumer:', error);
});

// bull
const bullQueue = new Queue(process.env.REDIS_TOPIC, process.env.REDIS_URL || 'redis://127.0.0.1:6379');
bullQueue.process(async (job, done) => {
  console.log('Received payment:', job.data.payment);
  done();
});

const port = process.env.APP_PORT || "3002";
app.listen(port, function() {
    console.log('server running on port ' + port + '.');
});