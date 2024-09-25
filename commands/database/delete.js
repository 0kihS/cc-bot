const { MongoClient, ServerApiVersion } = require('mongodb');
const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');
const axios = require('axios');
const { SlashCommandBuilder, PermissionFlagsBits} = require('discord.js');
require('dotenv');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('delete')
    .setDescription('Delete a list of cards from the database')
    .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers)
    .addAttachmentOption(option =>
      option.setName('cards')
        .setDescription('Attach a HTML file containing the card list.')
        .setRequired(true)),
  async execute(interaction) {
      console.log('initializing')
    const attachment = await interaction.options.getAttachment('cards');
      console.log('attachment found');
      const acknowledgementMessage = await interaction.reply({
    content: 'Processing Removal...',
    fetchReply: true, // Enable editing the message later
  });

	    try {
        // Download the attached HTML file
        const response = await axios.get(attachment.url);
        htmlContent = response.data;
      } catch (error) {
        console.error('Error downloading HTML:', error);
        return interaction.reply('Error downloading HTML file.');
      }
    // Load HTML into Cheerio
    console.log('successfully uploaded file');
    const $ = cheerio.load(htmlContent);

    // Find all cards with class 'cardfront'
    const cardElements = $('.cardfront:not(:first-child)');

    // Connection URI for MongoDB (replace with your actual MongoDB URI)
    const uri = process.env.MONGODB_URI;
    const dbName = 'cardsdb';

    // Connect to MongoDB
    const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
    useNewUrlParser: true
  }
});
    client.connect(uri)
	console.log('successfully connected');
      const db = client.db('cardsdb');

      // Process each card
      for (const cardElement of cardElements) {
        const card = {};

        // Extract data from different components of the card
        card.name = $(cardElement).find('.name_txt').text().trim();
        const existingCard = await db.collection('cards').findOne({ name: card.name });

        if (existingCard) {
          // Update the existing card in the database
          await db.collection('cards').deleteOneOne({ name: card.name});
        } else {
          // Add the new card to the database
          return;
        }
      }
      
	   await acknowledgementMessage.edit({
      content: 'Cards removed from the database',
       })
      // Close the MongoDB connection
      client.close();
    } }