const path = require('path');
const serverNodeModules = path.join(__dirname, '..', 'server', 'node_modules');
if (!module.paths.includes(serverNodeModules)) {
  module.paths.push(serverNodeModules);
}

const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');

require('dotenv').config({ path: path.join(__dirname, '..', 'server', '.env') });

const PROTO_PATH = path.join(__dirname, 'notification.proto');
const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true
});

const notificationProto = grpc.loadPackageDefinition(packageDefinition).notification;

const address = process.env.GRPC_ADDRESS || 'localhost:50051';
const client = new notificationProto.NotificationService(address, grpc.credentials.createInsecure());

function notifyEventCreated(title, creator) {
  return new Promise((resolve, reject) => {
    client.NotifyEvent({ title, creator }, (err, response) => {
      if (err) {
        console.error('[gRPC client] NotifyEvent failed', err.message || err);
        return reject(err);
      }
      resolve(response);
    });
  });
}

function notifyInvitation(email, eventTitle) {
  return new Promise((resolve, reject) => {
    client.NotifyInvitation({ email, eventTitle }, (err, response) => {
      if (err) {
        console.error('[gRPC client] NotifyInvitation failed', err.message || err);
        return reject(err);
      }
      resolve(response);
    });
  });
}

module.exports = { notifyEventCreated, notifyInvitation };
