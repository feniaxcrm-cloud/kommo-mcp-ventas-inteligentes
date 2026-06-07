import { z } from "zod";
import { KommoClient } from "../kommo-client.js";
import { loadAccounts, getAccount } from "../token-store.js";

export const talkTools = {
  get_talks: {
    description:
      "Obtiene las conversaciones activas de una cuenta Kommo. Muestra el canal (WhatsApp, Instagram, etc.), estado, contacto asociado y última actividad.",
    schema: z.object({
      account: z.string().describe("Nombre o subdominio de la cuenta"),
      page: z.number().optional().describe("Número de página (default 1)"),
      limit: z.number().optional().describe("Conversaciones por página, max 250 (default 50)"),
      status: z
        .string()
        .optional()
        .describe("Filtrar por estado: opened, in_work, closed (default: todas)"),
    }),
    handler: async (params: {
      account: string;
      page?: number;
      limit?: number;
      status?: string;
    }) => {
      const accounts = loadAccounts();
      const acc = getAccount(accounts, params.account);
      if (!acc) return { error: `Cuenta "${params.account}" no encontrada` };

      const client = new KommoClient(acc);
      const query: Record<string, string> = {
        page: String(params.page ?? 1),
        limit: String(params.limit ?? 50),
      };
      if (params.status) query["filter[status]"] = params.status;

      const data = await client.request("GET", "/talks", undefined, query);
      const talks = data?._embedded?.talks ?? [];
      return {
        account: acc.name,
        total: data?._total_items ?? talks.length,
        talks: talks.map((t: any) => ({
          talk_id: t.talk_id,
          chat_id: t.chat_id,
          contact_id: t.contact_id,
          entity_id: t.entity_id,
          entity_type: t.entity_type,
          origin: t.origin,
          status: t.status,
          is_read: t.is_read,
          created_at: t.created_at,
          updated_at: t.updated_at,
          contact: t._embedded?.contacts?.[0] ?? null,
        })),
      };
    },
  },

  get_talk_by_contact: {
    description:
      "Busca la conversación activa de un contacto específico. Muestra canal, estado y última actividad.",
    schema: z.object({
      account: z.string().describe("Nombre o subdominio de la cuenta"),
      contact_id: z.number().describe("ID del contacto"),
    }),
    handler: async ({ account, contact_id }: { account: string; contact_id: number }) => {
      const accounts = loadAccounts();
      const acc = getAccount(accounts, account);
      if (!acc) return { error: `Cuenta "${account}" no encontrada` };

      const client = new KommoClient(acc);
      const data = await client.request("GET", "/talks", undefined, {
        "filter[contact_id]": String(contact_id),
        limit: "10",
      });
      const talks = data?._embedded?.talks ?? [];
      return {
        account: acc.name,
        contact_id,
        total: talks.length,
        talks: talks.map((t: any) => ({
          talk_id: t.talk_id,
          chat_id: t.chat_id,
          origin: t.origin,
          status: t.status,
          is_read: t.is_read,
          created_at: t.created_at,
          updated_at: t.updated_at,
        })),
      };
    },
  },

  get_unread_talks: {
    description:
      "Obtiene todas las conversaciones NO leídas de una cuenta. Ideal para saber qué clientes necesitan atención.",
    schema: z.object({
      account: z.string().describe("Nombre o subdominio de la cuenta"),
      limit: z.number().optional().describe("Máximo de resultados (default 50)"),
    }),
    handler: async ({ account, limit }: { account: string; limit?: number }) => {
      const accounts = loadAccounts();
      const acc = getAccount(accounts, account);
      if (!acc) return { error: `Cuenta "${account}" no encontrada` };

      const client = new KommoClient(acc);
      const data = await client.request("GET", "/talks", undefined, {
        "filter[is_read]": "false",
        limit: String(limit ?? 50),
      });
      const talks = data?._embedded?.talks ?? [];
      return {
        account: acc.name,
        unread_count: data?._total_items ?? talks.length,
        talks: talks.map((t: any) => ({
          talk_id: t.talk_id,
          contact_id: t.contact_id,
          entity_id: t.entity_id,
          origin: t.origin,
          status: t.status,
          created_at: t.created_at,
          updated_at: t.updated_at,
          contact_name: t._embedded?.contacts?.[0]?.name ?? "Desconocido",
        })),
      };
    },
  },
};
