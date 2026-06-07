import { z } from "zod";
import { KommoClient } from "../kommo-client.js";
import { loadAccounts, getAccount } from "../token-store.js";

export const customFieldTools = {
  get_custom_fields: {
    description:
      "Lista todos los campos personalizados de una entidad (leads, contacts, companies). Útil para saber qué campos existen antes de crear o actualizar registros.",
    schema: z.object({
      account: z.string().describe("Nombre o subdominio de la cuenta"),
      entity_type: z
        .string()
        .describe("Tipo de entidad: leads, contacts, companies, customers"),
    }),
    handler: async ({ account, entity_type }: { account: string; entity_type: string }) => {
      const accounts = loadAccounts();
      const acc = getAccount(accounts, account);
      if (!acc) return { error: `Cuenta "${account}" no encontrada` };

      const client = new KommoClient(acc);
      const data = await client.request("GET", `/${entity_type}/custom_fields`, undefined, {
        limit: "250",
      });
      const fields = data?._embedded?.custom_fields ?? [];
      return {
        account: acc.name,
        entity_type,
        total: fields.length,
        fields: fields.map((f: any) => ({
          id: f.id,
          name: f.name,
          code: f.code,
          type: f.type,
          sort: f.sort,
          is_required: f.is_required,
          is_deletable: f.is_deletable,
          enums: f.enums,
          group_id: f.group_id,
        })),
      };
    },
  },

  get_sources: {
    description: "Lista las fuentes de leads configuradas en una cuenta (web, WhatsApp, redes, etc.).",
    schema: z.object({
      account: z.string().describe("Nombre o subdominio de la cuenta"),
    }),
    handler: async ({ account }: { account: string }) => {
      const accounts = loadAccounts();
      const acc = getAccount(accounts, account);
      if (!acc) return { error: `Cuenta "${account}" no encontrada` };

      const client = new KommoClient(acc);
      const data = await client.request("GET", "/sources");
      const sources = data?._embedded?.sources ?? [];
      return {
        account: acc.name,
        total: sources.length,
        sources: sources.map((s: any) => ({
          id: s.id,
          name: s.name,
          pipeline_id: s.pipeline_id,
          external_id: s.external_id,
          default: s.default,
        })),
      };
    },
  },

  get_tags: {
    description: "Lista todas las etiquetas (tags) de una entidad en la cuenta.",
    schema: z.object({
      account: z.string().describe("Nombre o subdominio de la cuenta"),
      entity_type: z.string().describe("Tipo de entidad: leads, contacts, companies"),
      page: z.number().optional(),
      limit: z.number().optional(),
    }),
    handler: async (params: {
      account: string;
      entity_type: string;
      page?: number;
      limit?: number;
    }) => {
      const accounts = loadAccounts();
      const acc = getAccount(accounts, params.account);
      if (!acc) return { error: `Cuenta "${params.account}" no encontrada` };

      const client = new KommoClient(acc);
      const data = await client.request("GET", `/${params.entity_type}/tags`, undefined, {
        page: String(params.page ?? 1),
        limit: String(params.limit ?? 250),
      });
      const tags = data?._embedded?.tags ?? [];
      return {
        account: acc.name,
        entity_type: params.entity_type,
        total: tags.length,
        tags: tags.map((t: any) => ({
          id: t.id,
          name: t.name,
          color: t.color,
        })),
      };
    },
  },

  get_loss_reasons: {
    description: "Lista las razones de pérdida de leads configuradas en la cuenta.",
    schema: z.object({
      account: z.string().describe("Nombre o subdominio de la cuenta"),
    }),
    handler: async ({ account }: { account: string }) => {
      const accounts = loadAccounts();
      const acc = getAccount(accounts, account);
      if (!acc) return { error: `Cuenta "${account}" no encontrada` };

      const client = new KommoClient(acc);
      const data = await client.request("GET", "/leads/loss_reasons");
      const reasons = data?._embedded?.loss_reasons ?? [];
      return {
        account: acc.name,
        total: reasons.length,
        reasons: reasons.map((r: any) => ({
          id: r.id,
          name: r.name,
          sort: r.sort,
          created_at: r.created_at,
          updated_at: r.updated_at,
        })),
      };
    },
  },

  get_webhooks: {
    description: "Lista los webhooks configurados en la cuenta.",
    schema: z.object({
      account: z.string().describe("Nombre o subdominio de la cuenta"),
    }),
    handler: async ({ account }: { account: string }) => {
      const accounts = loadAccounts();
      const acc = getAccount(accounts, account);
      if (!acc) return { error: `Cuenta "${account}" no encontrada` };

      const client = new KommoClient(acc);
      const data = await client.request("GET", "/webhooks");
      const hooks = data?._embedded?.webhooks ?? [];
      return {
        account: acc.name,
        total: hooks.length,
        webhooks: hooks.map((w: any) => ({
          id: w.id,
          destination: w.destination,
          created_at: w.created_at,
          updated_at: w.updated_at,
          disabled: w.disabled,
          sort: w.sort,
          settings: w.settings,
        })),
      };
    },
  },
};
