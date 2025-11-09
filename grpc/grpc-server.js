const path = require('path');
const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');

const PROTO_PATH = path.join(__dirname, 'notification.proto');
const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true
});

const notificationProto = grpc.loadPackageDefinition(packageDefinition).notification;

function notifyEvent(call, callback) {
  const { title, creator } = call.request;
  console.log(`[gRPC] NotifyEvent: ${title} by ${creator}`);
  callback(null, { status: 'EVENT_NOTIFIED' });
}

function notifyInvitation(call, callback) {
  const { email, eventTitle } = call.request;
  console.log(`[gRPC] NotifyInvitation: ${email} invited to ${eventTitle}`);
  callback(null, { status: 'INVITATION_NOTIFIED' });
}

function main() {
  const server = new grpc.Server();
  server.addService(notificationProto.NotificationService.service, {
    NotifyEvent: notifyEvent,
    NotifyInvitation: notifyInvitation
  });
  const address = process.env.GRPC_ADDRESS || '0.0.0.0:50051';
  server.bindAsync(address, grpc.ServerCredentials.createInsecure(), (err) => {
    if (err) {
      console.error('[gRPC] Failed to bind server', err);
      process.exit(1);
    }
    console.log(`[gRPC] NotificationService running on ${address}`);
    server.start();
  });
}

main();
