var amqpLib = require('amqplib'),
    fs = require('fs'),
    Mailgun = require('mailgun-js');

//read config.json file and parse json data
var filename = __dirname + "/config.json";
var config = JSON.parse (fs.readFileSync(filename,'utf8'));

var url = config.rabbitmq.amqpurl; // default to localhost

var open = amqpLib.connect(url);

open.then(function(conn) {
  var ok = conn.createChannel();
  ok = ok.then(function(ch) {
    ch.assertQueue(config.rabbitmq.queue+'');
    ch.bindQueue(config.rabbitmq.queue,config.rabbitmq.exchange,'Dummy');
    ch.consume(config.rabbitmq.queue, function(msg) {
      if (msg !== null) {
        console.log(msg.content.toString());
        ch.ack(msg);
        var requestObj = JSON.parse(msg.content.toString());
          //Instantiate Mailgun
    var mailgun = new Mailgun({apiKey: config.mailgun.api_key, domain: config.mailgun.domain});
    var from = config.mailgun.default_from;
    if(requestObj.From !== null && requestObj.From !== "" && requestObj.From !== undefined){
        from = requestObj.From
    }
    //Create Mail Message
    var data = {
      from: from,
      to: requestObj.To,
      subject: requestObj.Subject,
      text: requestObj.Message
    };
     //Send Mail Message
    try{
            mailgun.messages().send(data, function (error, body) {
            if(error !== undefined){
                console.log('Exception while sending mail...'+ error.message);
            }else{
                console.log('Mail Send Successfully...');
                console.log(body);
            }
        });
    }
    catch ( e ){ 
        console.log('Exception while sending mail...');
        console.log( "Exception: "+e.message );
    }
      }
    });
  });
  return ok;
}).then(null, console.warn);

