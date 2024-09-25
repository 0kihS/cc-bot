const { MongoClient, ServerApiVersion } = require("mongodb");
const fs = require("fs");
const path = require("path");
const cheerio = require("cheerio");
const axios = require("axios");
const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const { Element } = require("natural");
require("dotenv");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("upload")
    .setDescription("Upload / Update a list of cards to the database")
    .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers)
    .addAttachmentOption((option) =>
      option
        .setName("cards")
        .setDescription("Attach a HTML file containing the card list.")
        .setRequired(true),
    )
    .addStringOption((option) =>
      option
        .setName("set")
        .setDescription("name of the set the cards are in")
        .setRequired(true),
    ),
  async execute(interaction) {
    const attachment = await interaction.options.getAttachment("cards");
    if (interaction.options.getString("set")) {
      setName = interaction.options.getString("set");
    }
    else {
      setName = "Unknown";
    }
    
    console.log("attachment found");
    const acknowledgementMessage = await interaction.reply({
      content: "Processing upload...",
      fetchReply: true, // Enable editing the message later
    });

    try {
      // Download the attached HTML file
      const response = await axios.get(attachment.url);
      htmlContent = response.data;
    } catch (error) {
      console.error("Error downloading HTML:", error);
      return interaction.reply("Error downloading HTML file.");
    }
    // Load HTML into Cheerio
    console.log("successfully uploaded file");
    const $ = cheerio.load(htmlContent);

    // Find all cards with class 'cardfront'
    const cardElements = $(".cardfront:not(:first-child)");

    // Connection URI for MongoDB (replace with your actual MongoDB URI)
    const uri = process.env.MONGODB_URI;

    // Connect to MongoDB
    const client = new MongoClient(uri, {
      serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
        useNewUrlParser: true,
      },
    });
    client.connect(uri);
    console.log("successfully connected");
    const db = client.db("cardsdb");

    // Process each card
    for (const cardElement of cardElements) {
      const card = {};

      // Extract data from different components of the card
      card.name = $(cardElement).find(".name_txt").text().trim();
      const attributeUrl = $(cardElement).find(".attribute").attr("src");
      const attribute = attributeUrl.split("/").pop().split("_")[0];
      // Determine card type based on the attribute
      if (attribute === "spell") {
        card.cardtype = "Spell";
        spellTypeurl = $(cardElement).find(".type_icon").attr("src");
        card.type = spellTypeurl.split("/").pop().split(".")[0];
        if (
          $(cardElement)
            .find(".type_icon")
            .attr("style")
            .includes("display: none;")
        ) {
          card.type = "normal";
        }
      } else if (attribute === "trap") {
        card.cardtype = "Trap";
        trapTypeurl = $(cardElement).find(".type_icon").attr("src");
        card.type = trapTypeurl.split("/").pop().split(".")[0];
        if (
          $(cardElement)
            .find(".type_icon")
            .attr("style")
            .includes("display: none;")
        ) {
          card.type = "normal";
        }
      } else {
        card.cardtype = "Monster";
        card.type = $(cardElement).find(".type_txt").text().trim();
        card.attribute = attribute;
        card.atk = $(cardElement).find(".card_atk_txt").text().trim();
        card.def = $(cardElement).find(".card_def_txt").text().trim();
        if (card.type.includes("LINK")) {
          link = $(cardElement).find(".link_txt").text().trim();
          card.level = parseInt(link);
        }
        else if (card.type.includes("XYZ")) {
          let highestLevel = 0;
          $(cardElement)
            .find(".rank")
            .each((index, element) => {
              const levelClass = $(element).attr("class");
              const match = levelClass.match(/rank(\d+)/);
              if (match && !($(element).attr("style").includes("display: none;"))) {
                  highestLevel++;
                  console.log(card.name + " " + highestLevel);
                }
              });
              card.level = highestLevel;
        }
        else {
        let highestLevel = 0;
        $(cardElement)
          .find(".level")
          .each((index, element) => {
            const levelClass = $(element).attr("class");
            const match = levelClass.match(/level(\d+)/);
            if (match && !($(element).attr("style").includes("display: none;"))) {
              highestLevel++;
              console.log(card.name + " " + highestLevel);
            }
         });
          card.level = highestLevel;
      }
    }

      const imagePath = $(cardElement).find(".pic").attr("src");
      const n2 = parseInt(path.basename(imagePath).split(".")[0]);
      const n = parseInt(String(n2).slice(0, 2));
      card.image = `https://images.duelingbook.com/custom-pics/${n}00000/${n2}.jpg`;

      card.linkArrows = [];
      $(cardElement)
        .find(".red_arrow")
        .each((index, arrowElement) => {
          const style = $(arrowElement).attr("style");
          if (!style.includes("display: none;")) {
            // Determine arrow direction based on class
            const arrowClasses = $(arrowElement).attr("class").split(" ");
            let direction = "";
            if (arrowClasses.includes("red_arrow1")) {
              direction = "top-left";
            } else if (arrowClasses.includes("red_arrow2")) {
              direction = "top";
            } else if (arrowClasses.includes("red_arrow3")) {
              direction = "top-right";
            } else if (arrowClasses.includes("red_arrow4")) {
              direction = "right";
            } else if (arrowClasses.includes("red_arrow5")) {
              direction = "bottom-right";
            } else if (arrowClasses.includes("red_arrow6")) {
              direction = "bottom";
            } else if (arrowClasses.includes("red_arrow7")) {
              direction = "bottom-left";
            } else if (arrowClasses.includes("red_arrow8")) {
              direction = "left";
            } // Add other diagonals as needed

            // Add to the link arrows array
            card.linkArrows.push(direction);
          }
        });

      if (card.type.includes('PENDULUM')) {
        card.pendEffect = $(cardElement).find('.card_pendulum_effect_txt').text().replace(/\n/g, ' ').trim();
        card.scale = $(cardElement).find(".scale_left_txt").text().trim();
      }

      card.effect = $(cardElement)
        .find(".effect_txt")
        .html()
        .replace(/\n/g, "")
        .replace(/&amp;/g, "&")
        .replace(/<br\s*\/?>/g, "\n")
        .replace(/<font[^>]*?>([^<]+)<\/font>/g, "$1")
        .trim();
      card.passcode = $(cardElement).find(".passcode_txt").text().trim();
      card.set = setName;
      card.limit = 3;

      // Check if the card with the same name already exists in the database
      const existingCard = await db
        .collection("cards")
        .findOne({ name: card.name });

      if (existingCard) {
        // Update the existing card in the database
        await db
          .collection("cards")
          .updateOne({ _id: existingCard._id }, { $set: card });
      } else {
        // Add the new card to the database
        await db.collection("cards").insertOne(card);
      }
    }

    await acknowledgementMessage.edit({
      content: "Cards updated in the database.",
    });
    // Close the MongoDB connection
    client.close();
  },
};
