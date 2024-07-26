const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const natural = require("natural");
const cards = require("../../helpers/database.js");
const {
  attributes,
  magic,
  banlist,
  subtypes,
  level,
  STATS,
  arrows,
  inactive_arrows,
  VOID,
} = require("../../helpers/icons.js");

function capitalizeFirstLetter(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

async function writeTitle(card) {
  let title = "";

  if (card.cardtype !== "Monster") {
    title = capitalizeFirstLetter(card.type) + " " + card.cardtype;
  }
  const regexResult = /\[([^]+?)\]/.exec(card.type);

  if (regexResult && regexResult[1]) {
    // Split the content by '/' and take the first part, then convert to lowercase
    subtype = capitalizeFirstLetter(
      regexResult[1].split("/")[0].trim().toLowerCase(),
    );

    const type = card.type
      .replace(/[\[\]/]/g, "") // Remove brackets and slashes
      .toLowerCase() // Decapitalize everything
      .replace(/\bxyz\b/g, "XYZ") // Capitalize 'XYZ'
      .replace(/\b\w+\b/g, (match) =>
        match === "XYZ" ? match : capitalizeFirstLetter(match),
      );

    title += `${subtypes[subtype]} ${type} ${card.cardtype}\n`;

    if (card.level) {
      if (type.includes("XYZ")) {
        title += `${level["rank"]} Rank `;
      } else if (type.includes("Link")) {
        title += `${level["rating"]} LINK-`;
      } else {
        title += `${level["level"]} Level `;
      }
      title += `${card.level}`;

      if (card.scale) {
        title += `\n${level["scale"]} Scale ${card.scale}`;
      }
    } else if (card.link) {
      title += `${level["rating"]} LINK-${card.link}`;
    }
    title += "\n";

    if (card.atk !== "") {
      title += `${STATS} ${card.atk} ATK`;
    }
    if (card.def !== "") {
      title += ` / ${card.def} DEF`;
    }
  }

  return title.trim();
}

// Function to find the closest match in a subset of data
async function createEmbed(card) {
  cardEffect = ""
  if (card.scale) {
    arrowIcon = arrows['right']
    cardEffect = `${arrowIcon} **Pendulum Effect**\n${card.pendEffect} \n\n${arrowIcon} **Monster Effect** \n${card.effect}`;
  }
  else {
  cardEffect = card.effect;
  }
  cardEffect = `**Card Text**\n>>> ${cardEffect}`;

  if (card.cardtype == "Monster") {
    ctimg = attributes[card.attribute];

    if (card.type.includes("LINK")) {
      let larrows = [];

      // Build arrow icons with correct state
      for (const direction of [
        "top-left",
        "top",
        "top-right",
        "left",
        "right",
        "bottom-left",
        "bottom",
        "bottom-right",
      ]) {
        const icon = card.linkArrows.includes(direction)
          ? arrows[direction]
          : inactive_arrows[direction];
        larrows.push(icon);
      }

      larrows.splice(4, 0, VOID); // Insert void icon at index 4
      larrows.splice(3, 0, "\n"); // Insert newline at index 3
      larrows.splice(7, 0, "\n"); // Insert newline at index 7
      cardEffect = `${larrows.join("")}\n${cardEffect}`; // Prepend arrows to effect
    }
  } else if (card.cardtype == "Spell") {
    ctimg = magic.Spell;
  } else {
    ctimg = magic.Trap;
  }

  title = await writeTitle(card);
  cardEmbed = new EmbedBuilder()
    .setAuthor({ name: card.name, iconURL: ctimg })
    .setTitle(title)
    .setThumbnail(card.image)
    .setDescription(cardEffect)
    .addFields({
      name: "Banlist Status",
      value: card.limit.toString(),
      inline: true,
    })
    .addFields({ name: "Set:", value: card.set, inline: true });
  return cardEmbed;
}

function findClosestMatch(subsetData, searchTerm) {
  let closestMatch = null;
  let minDistance = Infinity;

  subsetData.forEach((doc) => {
    const distance = natural.LevenshteinDistance(searchTerm, doc.name);
    if (distance < minDistance) {
      minDistance = distance;
      closestMatch = doc;
    }
  });

  return closestMatch;
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("search-custom")
    .setDescription("Search the database for a card!")
    .addStringOption((option) =>
      option
        .setName("query")
        .setDescription("Phrase to search for")
        .setAutocomplete(true),
    ),
  async autocomplete(interaction) {
    cardarray = await cards;
    choices = cardarray.map((card) => card.name);
    const focusedValue = interaction.options.getFocused();
    const filtered = choices.filter((choice) =>
      choice.toLowerCase().includes(focusedValue.toLowerCase()),
    );
    await interaction.respond(
      filtered.slice(0, 25).map((choice) => ({ name: choice, value: choice })),
    );
  },
  async execute(interaction) {
    query = await interaction.options.getString("query");
    cardArray = await cards;
    const closestMatch = findClosestMatch(cardArray, query);
    embed = await createEmbed(closestMatch);
    interaction.reply({ embeds: [embed] });
  },
};
