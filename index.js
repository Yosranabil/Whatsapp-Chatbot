"use strict";
const token = process.env.WHATSAPP_TOKEN;
const request = require("request"),
  express = require("express"),
  body_parser = require("body-parser"),
  axios = require("axios").default,
  app = express().use(body_parser.json());

app.listen(process.env.PORT || 1337, () => console.log("webhook is listening"));

const template = JSON.stringify({
  messaging_product: "whatsapp",
  recipient_type: "individual",
  to: "201122780876",
  type: "interactive",
  interactive: {
    type: "button",
    header: {
      type: "text",
      text: "Welcome to {company}!",
    },
    body: {
      text: "Hello {username}! How can I assist you today? Please select an option:",
    },
    action: {
      buttons: [
        {
          type: "reply",
          reply: {
            id: "check_order_btn",
            title: "Check Order Status",
          },
        },
        {
          type: "reply",
          reply: {
            id: "get_acc_balance_btn",
            title: "Get Account Balance",
          },
        },
      ],
    },
    footer: {
      text: "Whatsapp Business App",
    },
  },
});

function sendWhatsAppMessage(
  to,
  message,
  phone_id,
  isButtonReply = false,
  buttonId = null
) {
  const url =
    "https://graph.facebook.com/v12.0/" +
    phone_id +
    "/messages?access_token=" +
    token;
  let data;
  let flag = false;

  if (isButtonReply && buttonId) {
    if (buttonId == "check_order_btn") flag = true;

    data = JSON.stringify({
      messaging_product: "whatsapp",
      to: to,
      text: {
        body: flag ? "Checking your order...." : "Getting account balance...",
      },
    });
  } else {
    data = message;
  }

  let config = {
    method: "POST",
    maxContentLength: 1024,
    url: url,
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + token,
    },
    data: data,
  };

  return axios
    .request(config)
    .then((response) => {
      console.log(JSON.stringify(response.data));
    })
    .catch((error) => {
      console.log(error);
    });
}

app.post("/webhook", (req, res) => {
  let body = req.body;

  console.log(JSON.stringify(req.body, null, 2));

  if (
    body.object &&
    body.entry &&
    body.entry[0].changes &&
    body.entry[0].changes[0].value.messages &&
    body.entry[0].changes[0].value.messages[0]
  ) {
    let phone_number_id =
      body.entry[0].changes[0].value.metadata.phone_number_id;
    let from = body.entry[0].changes[0].value.messages[0].from;
    let name = body.entry[0].changes[0].value.contacts[0].profile.name;
    let companyName = "Your Company";
    const message = body.entry[0].changes[0].value.messages[0];
    const personalizedTemplate = template
      .replace("{username}", name)
      .replace("{company}", companyName);

  if(companyName.length <= 48)
    {
      if (message.type === "interactive") {
      if (message.interactive.type === "button_reply") {
        const buttonId = message.interactive.button_reply.id;
        if (buttonId === "check_order_btn") {
          sendWhatsAppMessage(
            from,
            personalizedTemplate,
            phone_number_id,
            true,
            buttonId
          );
        } else if (buttonId === "get_acc_balance_btn") {
          sendWhatsAppMessage(
            from,
            personalizedTemplate,
            phone_number_id,
            true,
            buttonId
          );
        }
      }
    } else {
      sendWhatsAppMessage(from, personalizedTemplate, phone_number_id);
    }
  } else {
    console.log("Company name is too long. Message not sent.");
  }
    
  }
  res.sendStatus(200);
});

app.get("/webhook", (req, res) => {
  const verify_token = process.env.VERIFY_TOKEN;
  //Parsing Query Parameters:
  //These lines extract the values of three query parameters from the incoming request:
  let mode = req.query["hub.mode"];
  let token = req.query["hub.verify_token"];
  let challenge = req.query["hub.challenge"];

  if (mode && token) {
    if (mode === "subscribe" && token === verify_token) {
      console.log("WEBHOOK_VERIFIED");
      res.status(200).send(challenge);
    } else {
      res.sendStatus(403);
    }
  }
});
