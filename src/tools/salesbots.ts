import { z } from "zod";
import { KommoClient } from "../kommo-client.js";
import { loadAccounts, getAccount } from "../token-store.js";

export const salsbotTools = {
  get_salesbots: {
    description:
      "Lista todos los Salesbots (bots de ventas) configurados en una cuenta Kommo.",
    schema: z.object({
      account: z.string().describe("Nombre o subdominio de la cuenta"),
    }),
    handler: async ({ account }: { account: string }) => {
      const accounts = loadAccounts();
      const acc = getAccount(accounts, account);
      if (!acc) return { error: `Cuenta "${account}" no encontrada` };

      const client = new KommoClient(acc);
      const data = await client.request("GET", "/salesbots");
      const bots = data?._embedded?.salesbots ?? [];
      return {
        account: acc.name,
        total: bots.length,
        salesbots: bots.map((b: any) => ({
          id: b.id,
          name: b.name,
          type: b.type,
          is_active: b.is_active,
          created_at: b.created_at,
          updated_at: b.updated_at,
        })),
      };
    },
  },

  get_salesbot: {
    description: "Obtiene los detalles de un Salesbot específico por su ID.",
    schema: z.object({
      account: z.string().describe("Nombre o subdominio de la cuenta"),
      bot_id: z.number().describe("ID del Salesbot"),
    }),
    handler: async ({ account, bot_id }: { account: string; bot_id: number }) => {
      const accounts = loadAccounts();
      const acc = getAccount(accounts, account);
      if (!acc) return { error: `Cuenta "${account}" no encontrada` };

      const client = new KommoClient(acc);
      const data = await client.request("GET", `/salesbots/${bot_id}`);
      return { account: acc.name, salesbot: data };
    },
  },

  launch_salesbot: {
    description:
      "Lanza un Salesbot para una entidad específica (lead o contacto). Útil para enviar mensajes automáticos.",
    schema: z.object({
      account: z.string().describe("Nombre o subdominio de la cuenta"),
      bot_id: z.number().describe("ID del Salesbot a lanzar"),
      entity_id: z.number().describe("ID del lead o contacto"),
      entity_type: z
        .number()
        .describe("Tipo de entidad: 2 = lead, 1 = contacto"),
    }),
    handler: async ({
      account,
      bot_id,
      entity_id,
      entity_type,
    }: {
      account: string;
      bot_id: number;
      entity_id: number;
      entity_type: number;
    }) => {
      const accounts = loadAccounts();
      const acc = getAccount(accounts, account);
      if (!acc) return { error: `Cuenta "${account}" no encontrada` };

      const client = new KommoClient(acc);
      const data = await client.request("POST", `/salesbots/${bot_id}/launch`, {
        entity_id,
        entity_type,
      });
      return { account: acc.name, launched: true, bot_id, entity_id, result: data };
    },
  },

  stop_salesbot: {
    description: "Detiene un Salesbot que está corriendo para una entidad.",
    schema: z.object({
      account: z.string().describe("Nombre o subdominio de la cuenta"),
      bot_id: z.number().describe("ID del Salesbot"),
      entity_id: z.number().describe("ID de la entidad (lead o contacto)"),
      entity_type: z.number().describe("Tipo: 2 = lead, 1 = contacto"),
    }),
    handler: async ({
      account,
      bot_id,
      entity_id,
      entity_type,
    }: {
      account: string;
      bot_id: number;
      entity_id: number;
      entity_type: number;
    }) => {
      const accounts = loadAccounts();
      const acc = getAccount(accounts, account);
      if (!acc) return { error: `Cuenta "${account}" no encontrada` };

      const client = new KommoClient(acc);
      const data = await client.request("POST", `/salesbots/${bot_id}/stop`, {
        entity_id,
        entity_type,
      });
      return { account: acc.name, stopped: true, bot_id, entity_id, result: data };
    },
  },
};
