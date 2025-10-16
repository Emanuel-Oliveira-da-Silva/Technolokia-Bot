// ======== IMPORTACIONES ========
import {
  Client,
  GatewayIntentBits,
  SlashCommandBuilder,
  Routes,
  REST,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
} from "discord.js";
import fs from "fs";
import express from "express";
import cron from "node-cron";

// ======== CONFIGURACIÓN ========
const TOKEN =
  "MTQyNTcxOTgwMDI5Nzk1MTI1Mg.GYdprt.h7gDu5n-2ISU05u3WInL6CUCjctwS3IpvVi8QM";
const CLIENT_ID = "1425719800297951252";
const GUILD_ID = "1409967956808437822";

const FINANZAS_ROLE_ID = "1411022714684182598";
const TICKET_CHANNEL_ID = "1425689943648501832";
const REPORTE_CHANNEL_ID = "1425690652330430475";
const PRE_TICKET_CHANNEL_ID = "1425908006339608706";
const CREAR_TICKET_CHANNEL_ID = "1425921106342182974";
const SERVICIO_TECNICO_ROLE_ID = "1410077754543837205";
const CANAL_BIENVENIDA_ID = "1425971123493011537";
const CONTRATACION_CHANNEL_ID = "1427368777095450775"; // 👈 NUEVO canal de #tickets-contratacion

// ======== SERVIDOR KEEP-ALIVE ========
const app = express();
app.get("/", (req, res) => res.send("✅ Bot Technolókia activo 24/7"));
app.listen(3000, () =>
  console.log("🌐 Servidor web keep-alive corriendo en puerto 3000")
);

// ======== VARIABLES DE ESTADO ========
let ticketCounter = 1;
const COUNTER_FILE = "counter.txt";
if (fs.existsSync(COUNTER_FILE)) {
  ticketCounter = parseInt(fs.readFileSync(COUNTER_FILE, "utf8")) || 1;
}

let visitas = {};
if (fs.existsSync("visitas.json"))
  visitas = JSON.parse(fs.readFileSync("visitas.json", "utf8"));

let ticketsData = {};
if (fs.existsSync("tickets.json"))
  ticketsData = JSON.parse(fs.readFileSync("tickets.json", "utf8"));

let movimientos = [];
const MOVIMIENTOS_FILE = "movimientos.json";
if (fs.existsSync(MOVIMIENTOS_FILE)) {
  movimientos = JSON.parse(fs.readFileSync(MOVIMIENTOS_FILE, "utf8"));
}

// ======== CLIENTE DISCORD ========
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMessages,
  ],
  partials: ["MESSAGE", "CHANNEL", "REACTION"],
});

// ======== COMANDOS ========
const commands = [
  new SlashCommandBuilder()
    .setName("reporte")
    .setDescription("Registrar un reporte técnico de un ticket existente")
    .addStringOption((opt) =>
      opt
        .setName("cod-ticket")
        .setDescription("Código único del ticket")
        .setRequired(true)
    )
    .addStringOption((opt) =>
      opt
        .setName("tecnico")
        .setDescription("Nombre del técnico que realiza la visita")
        .setRequired(true)
    )
    .addStringOption((opt) =>
      opt
        .setName("observaciones-adicionales")
        .setDescription("Observaciones adicionales")
        .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName("ticket")
    .setDescription("Emitir un ticket manualmente (solo servicio técnico)")
    .addStringOption((opt) =>
      opt
        .setName("cliente")
        .setDescription("Nombre de la empresa")
        .setRequired(true)
    )
    .addStringOption((opt) =>
      opt.setName("cod-plan").setDescription("Plan").setRequired(true)
    )
    .addStringOption((opt) =>
      opt
        .setName("grado")
        .setDescription("Grado del problema (1-4)")
        .setRequired(true)
    )
    .addStringOption((opt) =>
      opt
        .setName("contacto")
        .setDescription("Método de contacto")
        .setRequired(true)
    )
    .addStringOption((opt) =>
      opt
        .setName("tecnico")
        .setDescription("Técnico asignado")
        .setRequired(true)
    )
    .addStringOption((opt) =>
      opt
        .setName("problema")
        .setDescription("Descripción del problema")
        .setRequired(true)
    ),

  // --- FINANZAS ---

  // --- SUELDO ---
  new SlashCommandBuilder()
    .setName("sueldo")
    .setDescription("Generar un recibo de sueldo (solo Finanzas)")
    .addStringOption((opt) =>
      opt.setName("periodo").setDescription("Mes y año").setRequired(true)
    )
    .addStringOption((opt) =>
      opt
        .setName("fecha-ingreso")
        .setDescription("Fecha de ingreso")
        .setRequired(true)
    )
    .addNumberOption((opt) =>
      opt
        .setName("sueldo-basico")
        .setDescription("Sueldo básico mensual")
        .setRequired(true)
    )
    .addNumberOption((opt) =>
      opt
        .setName("adicional-empresa")
        .setDescription("Adicional empresa")
        .setRequired(true)
    )
    .addNumberOption((opt) =>
      opt
        .setName("antiguedad-anual")
        .setDescription("% de antigüedad")
        .setRequired(true)
    )
    .addNumberOption((opt) =>
      opt
        .setName("horas-xtra-50")
        .setDescription("Horas extra 50%")
        .setRequired(true)
    )
    .addNumberOption((opt) =>
      opt
        .setName("horas-xtra-100")
        .setDescription("Horas extra 100%")
        .setRequired(true)
    )
    .addNumberOption((opt) =>
      opt
        .setName("premio-productividad")
        .setDescription("% de premio por productividad")
        .setRequired(true)
    )
    .addNumberOption((opt) =>
      opt
        .setName("ausencias")
        .setDescription("Días trabajados (para ausencias)")
        .setRequired(true)
    )
    .addNumberOption((opt) =>
      opt
        .setName("viatico-x-servicio")
        .setDescription("Viático por servicio")
        .setRequired(true)
    )
    .addNumberOption((opt) =>
      opt
        .setName("servicios")
        .setDescription("Cantidad de servicios")
        .setRequired(true)
    )
    .addNumberOption((opt) =>
      opt
        .setName("acta-futuros-aumentos")
        .setDescription("Monto del acta de futuros aumentos")
        .setRequired(true)
    )
    .addNumberOption((opt) =>
      opt
        .setName("adelanto-de-sueldo")
        .setDescription("Monto del adelanto")
        .setRequired(true)
    )
    .addNumberOption((opt) =>
      opt
        .setName("jubilacion-porcentaje")
        .setDescription("% Jubilación")
        .setRequired(true)
    )
    .addNumberOption((opt) =>
      opt.setName("pami-porcentaje").setDescription("% PAMI").setRequired(true)
    )
    .addNumberOption((opt) =>
      opt
        .setName("obra-social-porcentaje")
        .setDescription("% Obra social")
        .setRequired(true)
    )
    .addStringOption((opt) =>
      opt
        .setName("sindicato")
        .setDescription("¿Pertenece a un sindicato?")
        .setRequired(true)
        .addChoices({ name: "Sí", value: "si" }, { name: "No", value: "no" })
    )
    .addNumberOption((opt) =>
      opt
        .setName("sindicato-porcentaje")
        .setDescription("% Sindicato")
        .setRequired(false)
    ),

  new SlashCommandBuilder()
    .setName("ingreso")
    .setDescription("Registrar un ingreso")
    .addNumberOption((opt) =>
      opt.setName("monto").setDescription("Monto del ingreso").setRequired(true)
    )
    .addStringOption((opt) =>
      opt
        .setName("observacion")
        .setDescription("Descripción o motivo")
        .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName("gasto")
    .setDescription("Registrar un gasto")
    .addNumberOption((opt) =>
      opt.setName("monto").setDescription("Monto del gasto").setRequired(true)
    )
    .addStringOption((opt) =>
      opt
        .setName("observacion")
        .setDescription("Descripción o motivo")
        .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName("balance")
    .setDescription("Mostrar el balance semanal"),
].map((c) => c.toJSON());

const rest = new REST({ version: "10" }).setToken(TOKEN);
await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), {
  body: commands,
});

// ======== AL INICIAR EL BOT ========
client.once("ready", async () => {
  console.log(`✅ Bot conectado como ${client.user.tag}`);

  // === Embed de Pre-Ticket ===
  const canalTicket = await client.channels.fetch(CREAR_TICKET_CHANNEL_ID);
  const embedTicket = new EmbedBuilder()
    .setColor(0x2b6de0)
    .setTitle("🧾 Crear un Pre-Ticket de Soporte")
    .setDescription(
      "Completá el formulario para registrar tu problema técnico.\n\nPresioná el botón **Enviar Pre-Ticket** para comenzar."
    )
    .setFooter({ text: "Sistema de Soporte Technolókia SRL" });

  const botonTicket = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("abrir_formulario_ticket")
      .setLabel("🧾 Enviar Pre-Ticket")
      .setStyle(ButtonStyle.Primary)
  );
  await canalTicket.send({ embeds: [embedTicket], components: [botonTicket] });

  // === Embed de Solicitud de Plan ===
  const canalBienvenida = await client.channels.fetch(CANAL_BIENVENIDA_ID);
  const embedPlanes = new EmbedBuilder()
    .setColor(0x00aeff)
    .setTitle("💼 Comprar un Plan de Soporte")
    .setDescription(
      "Elegí uno de nuestros planes para acceder a soporte técnico prioritario.\n\n" +
        "📘 **Plan Exclusivo:** Hasta 25 equipos.\n" +
        "📗 **Plan Premium:** Hasta 40 equipos.\n\n" +
        "Presioná el botón **Solicitar Plan** para comenzar."
    )
    .setFooter({ text: "Technolókia SRL — Sistema de Gestión de Planes" });

  const botonPlan = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("abrir_formulario_plan")
      .setLabel("💼 Solicitar Plan")
      .setStyle(ButtonStyle.Success)
  );

  await canalBienvenida.send({
    embeds: [embedPlanes],
    components: [botonPlan],
  });
});

// ======== INTERACCIONES ========
client.on("interactionCreate", async (interaction) => {
  // === FORMULARIO DE PRE-TICKET ===
  if (
    interaction.isButton() &&
    interaction.customId === "abrir_formulario_ticket"
  ) {
    const modal = new ModalBuilder()
      .setCustomId("formulario_ticket")
      .setTitle("Formulario de Pre-Ticket");

    const cliente = new TextInputBuilder()
      .setCustomId("cliente")
      .setLabel("Nombre de la empresa o cliente")
      .setStyle(TextInputStyle.Short)
      .setRequired(true);

    const contacto = new TextInputBuilder()
      .setCustomId("contacto")
      .setLabel("Método de contacto (teléfono, mail, etc.)")
      .setStyle(TextInputStyle.Short)
      .setRequired(true);

    const problema = new TextInputBuilder()
      .setCustomId("problema")
      .setLabel("Descripción del problema técnico")
      .setStyle(TextInputStyle.Paragraph)
      .setRequired(true);

    modal.addComponents(
      new ActionRowBuilder().addComponents(cliente),
      new ActionRowBuilder().addComponents(contacto),
      new ActionRowBuilder().addComponents(problema)
    );

    await interaction.showModal(modal);
    return;
  }

  if (
    interaction.isModalSubmit() &&
    interaction.customId === "formulario_ticket"
  ) {
    const cliente = interaction.fields.getTextInputValue("cliente");
    const contacto = interaction.fields.getTextInputValue("contacto");
    const problema = interaction.fields.getTextInputValue("problema");
    const fechaUnix = Math.floor(Date.now() / 1000);

    const embed = new EmbedBuilder()
      .setColor(0x2b6de0)
      .setTitle("🧾 Nuevo Pre-Ticket de Soporte")
      .addFields(
        { name: "🏢 Cliente", value: cliente },
        { name: "📞 Contacto", value: contacto },
        { name: "⚙️ Problema", value: problema },
        { name: "📅 Fecha", value: `<t:${fechaUnix}:f>` }
      )
      .setFooter({ text: "Technolókia SRL — Sistema de Soporte" });

    const canal = await client.channels.fetch(PRE_TICKET_CHANNEL_ID);
    await canal.send({ embeds: [embed] });

    await interaction.reply({
      content: "✅ Tu pre-ticket fue enviado correctamente.",
      ephemeral: true,
    });
    return;
  }

  // === FORMULARIO DE PLAN ===
  if (
    interaction.isButton() &&
    interaction.customId === "abrir_formulario_plan"
  ) {
    const modal = new ModalBuilder()
      .setCustomId("formulario_plan")
      .setTitle("Solicitud de Plan Technolókia");

    const empresa = new TextInputBuilder()
      .setCustomId("empresa")
      .setLabel("Nombre de la Empresa")
      .setStyle(TextInputStyle.Short)
      .setRequired(true);
    const contacto = new TextInputBuilder()
      .setCustomId("contacto")
      .setLabel("Método de contacto")
      .setStyle(TextInputStyle.Short)
      .setRequired(true);
    const tipoPlan = new TextInputBuilder()
      .setCustomId("tipoPlan")
      .setLabel("Tipo de Plan (Exclusivo o Premium)")
      .setStyle(TextInputStyle.Short)
      .setRequired(true);
    const equipos = new TextInputBuilder()
      .setCustomId("equipos")
      .setLabel("Cantidad de equipos aproximada")
      .setStyle(TextInputStyle.Short)
      .setRequired(true);

    modal.addComponents(
      new ActionRowBuilder().addComponents(empresa),
      new ActionRowBuilder().addComponents(contacto),
      new ActionRowBuilder().addComponents(tipoPlan),
      new ActionRowBuilder().addComponents(equipos)
    );

    await interaction.showModal(modal);
    return;
  }

  if (
    interaction.isModalSubmit() &&
    interaction.customId === "formulario_plan"
  ) {
    const empresa = interaction.fields.getTextInputValue("empresa");
    const contacto = interaction.fields.getTextInputValue("contacto");
    const tipoPlan = interaction.fields.getTextInputValue("tipoPlan");
    const equipos = interaction.fields.getTextInputValue("equipos");
    const fechaUnix = Math.floor(Date.now() / 1000);

    const embed = new EmbedBuilder()
      .setColor(0x00ff99)
      .setTitle("🆕 Nueva Solicitud de Plan")
      .addFields(
        { name: "🏢 Empresa", value: empresa },
        { name: "💼 Tipo de Plan", value: tipoPlan },
        { name: "🖥️ Equipos", value: equipos },
        { name: "📞 Contacto", value: contacto },
        { name: "📅 Fecha", value: `<t:${fechaUnix}:f>` }
      )
      .setFooter({ text: "Technolókia SRL — Tickets de Contratación" });

    const canal = await client.channels.fetch(CONTRATACION_CHANNEL_ID);
    await canal.send({
      content: `<@&${FINANZAS_ROLE_ID}>`, // 🔹 Mención al rol Finanzas
      embeds: [embed],
    });

    await interaction.reply({
      content: "✅ Solicitud enviada correctamente.",
      ephemeral: true,
    });
    return;
  }

  // === FINANZAS ===
  if (interaction.isChatInputCommand()) {
    const fechaUnix = Math.floor(Date.now() / 1000);

    if (interaction.commandName === "ingreso") {
      const monto = interaction.options.getNumber("monto");
      const obs = interaction.options.getString("observacion");
      movimientos.push({ tipo: "Ingreso", monto, obs, fechaUnix });
      fs.writeFileSync(MOVIMIENTOS_FILE, JSON.stringify(movimientos, null, 2));
      await interaction.reply({
        content: `💰 Ingreso registrado: **$${monto}** — ${obs}`,
        ephemeral: true,
      });
    }
    // === SUELDO ===
    if (interaction.commandName === "sueldo") {
      if (!interaction.member.roles.cache.has(FINANZAS_ROLE_ID)) {
        return interaction.reply({
          content: "❌ Solo Finanzas puede usar este comando.",
          ephemeral: true,
        });
      }

      // ✅ Obtener valores con los mismos nombres del slash command
      const sueldobasico = interaction.options.getNumber("sueldo-basico");
      const adicional = interaction.options.getNumber("adicional-empresa");
      const antigAnual = interaction.options.getNumber("antiguedad-anual");
      const hs50 = interaction.options.getNumber("horas-xtra-50");
      const hs100 = interaction.options.getNumber("horas-xtra-100");
      const premio = interaction.options.getNumber("premio-productividad") || 0;
      const ausencias = interaction.options.getNumber("ausencias");
      const viatico = interaction.options.getNumber("viatico-x-servicio");
      const servicios = interaction.options.getNumber("servicios");
      const acta = interaction.options.getNumber("acta-futuros-aumentos");
      const adelanto = interaction.options.getNumber("adelanto-de-sueldo");
      const jub = interaction.options.getNumber("jubilacion-porcentaje");
      const pami = interaction.options.getNumber("pami-porcentaje");
      const obra = interaction.options.getNumber("obra-social-porcentaje");
      const sindicatoSi = interaction.options.getString("sindicato");
      const porcSind =
        interaction.options.getNumber("sindicato-porcentaje") || 0;

      // === Cálculos ===

      //  REMUNERATIVOS
      const basico = (sueldobasico / 30) * (30 - ausencias); // todo el mes
      const adempresa = (adicional / 30) * (30 - ausencias);
      const antiguedad = (basico + adempresa) * (antigAnual / 100);
      const horanormal = (basico + adempresa + antiguedad) / 192;
      const horas50 = hs50 * horanormal * 1.5;
      const horas100 = hs100 * horanormal * 2.0;
      const premioProd =
        (basico + adempresa + antiguedad + horas50 + horas100) * (premio / 100);
      let presentismoPorc = 0;

      if (ausencias === 0) presentismoPorc = 25;
      else if (ausencias === 1) presentismoPorc = 20;
      else if (ausencias === 2) presentismoPorc = 10;
      else if (ausencias === 3) presentismoPorc = 5;
      else presentismoPorc = 0;

      const presentismo =
        (basico + adempresa + antiguedad + horas50 + horas100 + premioProd) *
        (presentismoPorc / 100);

      const remunerativos =
        basico +
        adempresa +
        antiguedad +
        horas50 +
        horas100 +
        premioProd +
        presentismo;

      // NO REMUNERATIVOS
      const viaticos = viatico * servicios;
      const actaFuturos = (acta / 30) * (30 - ausencias);

      const noRemunerativos = viaticos + actaFuturos;

      // DESCUENTOS
      const descJub = remunerativos * (jub / 100);
      const descPami = remunerativos * (pami / 100);
      const descObra = remunerativos * (obra / 100);
      const descSind =
        sindicatoSi === "si" ? remunerativos * (porcSind / 100) : 0;

      const totalDescuentos =
        descJub + descPami + descObra + descSind + adelanto;
      const bruto = remunerativos;
      const neto = bruto + noRemunerativos - totalDescuentos;

      // === Embed ===
      const fields = [
        {
          name: "🗓️ Periodo",
          value: interaction.options.getString("periodo"),
          inline: true,
        },
        {
          name: "📅 Fecha Ingreso",
          value: interaction.options.getString("fecha-ingreso"),
          inline: true,
        },
        { name: "💰 Sueldo Básico", value: `$${basico.toFixed(2)}` },
        { name: "🏢 Adicional Empresa", value: `$${adempresa.toFixed(2)}` },
        { name: "📈 Antigüedad", value: `$${antiguedad.toFixed(2)}` },
        { name: "⏱️ Horas Extra 50%", value: `$${horas50.toFixed(2)}` },
        { name: "⏱️ Horas Extra 100%", value: `$${horas100.toFixed(2)}` },
      ];

      if (premio !== 0) {
        fields.push({
          name: "🏆 Premio Productividad",
          value: `$${premioProd.toFixed(2)} (${premio}%)`,
        });
      }

      fields.push(
        {
          name: "🎖️ Presentismo",
          value: `$${presentismo.toFixed(2)} (${presentismoPorc}%)`,
        },
        { name: "🚗 Viáticos", value: `$${viaticos.toFixed(2)}` },
        {
          name: "📜 Acta Futuros Aumentos",
          value: `$${actaFuturos.toFixed(2)}`,
        },
        { name: "🧾 Adelanto Sueldo", value: `-$${adelanto.toFixed(2)}` },
        {
          name: "💸 Deducciones",
          value:
            `Jubilación (${jub}%): -$${descJub.toFixed(2)}\n` +
            `Ley 19032 (${pami}%): -$${descPami.toFixed(2)}\n` +
            `Obra Social (${obra}%): -$${descObra.toFixed(2)}\n` +
            (sindicatoSi === "si"
              ? `Sindicato (${porcSind}%): -$${descSind.toFixed(2)}\n`
              : ""),
        },
        {
          name: "💵 Subtotales",
          value:
            `Remunerativos: $${remunerativos.toFixed(2)}\n` +
            `No Remunerativos: $${noRemunerativos.toFixed(2)}\n` +
            `Descuentos: -$${totalDescuentos.toFixed(2)}`,
        },
        {
          name: "💼 Sueldo Bruto",
          value: `$${bruto.toFixed(2)}`,
          inline: true,
        },
        { name: "💳 Sueldo Neto", value: `$${neto.toFixed(2)}`, inline: true }
      );

      const embed = new EmbedBuilder()
        .setColor(0x2b6de0)
        .setTitle("📄 Recibo de Sueldo")
        .addFields(fields)
        .setFooter({ text: "Technolókia SRL — Finanzas" });
      return interaction.reply({ embeds: [embed] });
    }

    if (interaction.commandName === "gasto") {
      const monto = interaction.options.getNumber("monto");
      const obs = interaction.options.getString("observacion");
      movimientos.push({ tipo: "Gasto", monto, obs, fechaUnix });
      fs.writeFileSync(MOVIMIENTOS_FILE, JSON.stringify(movimientos, null, 2));
      await interaction.reply({
        content: `💸 Gasto registrado: **$${monto}** — ${obs}`,
        ephemeral: true,
      });
    }

    // === BALANCE DETALLADO ===
    if (interaction.commandName === "balance") {
      const ingresos = movimientos.filter((m) => m.tipo === "Ingreso");
      const gastos = movimientos.filter((m) => m.tipo === "Gasto");
      const totalI = ingresos.reduce((a, b) => a + b.monto, 0);
      const totalG = gastos.reduce((a, b) => a + b.monto, 0);
      const balance = totalI - totalG;

      let tabla = "**Ingresos**\n";
      if (ingresos.length === 0) {
        tabla += "_Sin ingresos registrados._\n";
      } else {
        tabla += "Monto | Observación\n--- | ---\n";
        ingresos.forEach((m) => (tabla += `$${m.monto} | ${m.obs}\n`));
      }

      tabla += "\n**Gastos**\n";
      if (gastos.length === 0) {
        tabla += "_Sin gastos registrados._\n";
      } else {
        tabla += "Monto | Observación\n--- | ---\n";
        gastos.forEach((m) => (tabla += `-$${m.monto} | ${m.obs}\n`));
      }

      const embed = new EmbedBuilder()
        .setColor(balance >= 0 ? 0x2ecc71 : 0xe02b2b)
        .setTitle("📊 Balance Semanal Technolókia")
        .setDescription(`Semana actual — <t:${fechaUnix}:D>`)
        .addFields({ name: "Movimientos", value: tabla })
        .addFields(
          { name: "💰 Ingresos totales", value: `$${totalI}`, inline: true },
          { name: "💸 Gastos totales", value: `$${totalG}`, inline: true },
          { name: "📈 Balance", value: `$${balance}`, inline: false }
        );

      await interaction.reply({ embeds: [embed] });
    }
  }
});

// ======== CRON JOB SEMANAL (Miércoles 10:00 AM) ========
cron.schedule("0 10 * * 3", async () => {
  const channel = await client.channels.fetch(REPORTE_CHANNEL_ID);
  const ingresos = movimientos.filter((m) => m.tipo === "Ingreso");
  const gastos = movimientos.filter((m) => m.tipo === "Gasto");
  const totalI = ingresos.reduce((a, b) => a + b.monto, 0);
  const totalG = gastos.reduce((a, b) => a + b.monto, 0);
  const balance = totalI - totalG;
  const fechaUnix = Math.floor(Date.now() / 1000);

  const embed = new EmbedBuilder()
    .setColor(balance >= 0 ? 0x2ecc71 : 0xe02b2b)
    .setTitle("📅 Balance Semanal Automático")
    .setDescription(`Reporte automático — <t:${fechaUnix}:D>`)
    .addFields(
      { name: "💰 Ingresos", value: `$${totalI}`, inline: true },
      { name: "💸 Gastos", value: `$${totalG}`, inline: true },
      { name: "📈 Balance", value: `$${balance}`, inline: false }
    );

  await channel.send({ embeds: [embed] });

  movimientos = [];
  fs.writeFileSync(MOVIMIENTOS_FILE, JSON.stringify(movimientos));
});

// ======== LOGIN ========
client.login(TOKEN);
