const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");

const command = {};
command.name = "reboot";
command.data = new SlashCommandBuilder()
  .setName(command.name)
  .setDescription("Reboots the database bot")
  .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers);
command.execute = async (interaction, Database) => {
  const member = interaction.user;
  await interaction.reply("Rebooting...");
  setTimeout(() => {
    // https://stackoverflow.com/a/46825815/4119004
    process.on("exit", () => {
      require("child_process").spawn(process.argv.shift(), process.argv, {
        cwd: process.cwd(),
        detached: true,
        stdio: "inherit",
      });
    });
    process.exit();
  }, 1000);
};
module.exports = command;
